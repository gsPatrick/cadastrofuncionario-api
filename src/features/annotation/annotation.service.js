const { Annotation, AnnotationHistory, Employee, sequelize } = require('../../models');
const { AppError } = require('../../utils/errorHandler');
const { Op } = require('sequelize');

class AnnotationService {
  /**
   * Cria uma nova anotação para um funcionário.
   * @param {number} employeeId - ID do funcionário.
   * @param {number} responsibleId - ID do admin que está criando.
   * @param {object} data - Dados da anotação (título, conteúdo, categoria).
   * @returns {Promise<Annotation>} A anotação criada.
   */
  static async createAnnotation(employeeId, responsibleId, data) {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new AppError('Funcionário não encontrado.', 404);
    }
    return Annotation.create({ ...data, employeeId, responsibleId });
  }

  /**
   * Obtém anotações com base em filtros e pesquisa por termos.
   * @param {object} query - Parâmetros de busca e filtro.
   * @returns {Promise<Annotation[]>} Lista de anotações encontradas.
   */
  static async getAnnotations(query) {
    const whereClause = {};
    if (query.employeeId) {
      whereClause.employeeId = query.employeeId;
    }
    // Pesquisa por termos dentro do título ou conteúdo
    if (query.search) {
      const searchTerm = `%${query.search.toLowerCase()}%`;
      whereClause[Op.or] = [
        { title: { [Op.iLike]: searchTerm } },
        { content: { [Op.iLike]: searchTerm } },
      ];
    }
    return Annotation.findAll({
      where: whereClause,
      order: [['annotationDate', 'DESC']],
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'fullName'] },
        { model: AnnotationHistory, as: 'history', order: [['editedAt', 'DESC']] } // Inclui o histórico
      ]
    });
  }

  /**
   * Atualiza uma anotação e registra a alteração no histórico.
   * @param {number} annotationId - ID da anotação a ser atualizada.
   * @param {number} editedById - ID do admin que está editando.
   * @param {object} updateData - Novos dados da anotação.
   * @returns {Promise<Annotation>} A anotação atualizada.
   */
  static async updateAnnotation(annotationId, editedById, updateData) {
    const result = await sequelize.transaction(async (t) => {
      const annotation = await Annotation.findByPk(annotationId, { transaction: t });
      if (!annotation) {
        throw new AppError('Anotação não encontrada.', 404);
      }

      // Cria o registro de histórico com os dados *antes* da atualização
      await AnnotationHistory.create({
        annotationId: annotation.id,
        oldTitle: annotation.title,
        oldContent: annotation.content,
        oldCategory: annotation.category,
        editedById: editedById,
      }, { transaction: t });

      // Atualiza a anotação com os novos dados
      await annotation.update(updateData, { transaction: t });
      return annotation;
    });
    return result;
  }

  /**
   * Deleta uma anotação. O histórico associado será deletado em cascata.
   * @param {number} annotationId - ID da anotação a ser deletada.
   * @returns {Promise<void>}
   */
  static async deleteAnnotation(annotationId) {
    const annotation = await Annotation.findByPk(annotationId);
    if (!annotation) {
      throw new AppError('Anotação não encontrada.', 404);
    }
    await annotation.destroy();
  }
}

module.exports = AnnotationService;