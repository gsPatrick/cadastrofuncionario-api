const { Document, Employee } = require('../../models');
const { AppError } = require('../../utils/errorHandler');
const { Op } = require('sequelize');
const fs = require('fs').promises; // Usaremos a versão de promessas do 'fs'
const path = require('path');

class DocumentService {
  /**
   * Faz o upload de múltiplos documentos para um funcionário.
   * @param {number} employeeId - ID do funcionário.
   * @param {number} uploadedById - ID do admin que está fazendo o upload.
   * @param {Array<object>} files - Array de arquivos do multer.
   * @param {object} data - Dados adicionais como tipo e descrição.
   * @returns {Promise<Document[]>} Os registros dos documentos criados.
   */
  static async uploadDocuments(employeeId, uploadedById, files, data) {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new AppError('Funcionário não encontrado.', 404);
    }
    if (!files || files.length === 0) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }

    const documentRecords = files.map((file, index) => ({
      employeeId,
      uploadedById,
      documentType: Array.isArray(data.documentType) ? data.documentType[index] : data.documentType,
      description: Array.isArray(data.description) ? data.description[index] : data.description,
      filePath: file.path,
      uploadedAt: new Date(),
    }));

    return Document.bulkCreate(documentRecords);
  }

  /**
   * Obtém documentos com base em filtros e pesquisa.
   * @param {object} query - Parâmetros de busca e filtro.
   * @returns {Promise<Document[]>} Lista de documentos encontrados.
   */
  static async getDocuments(query) {
    const whereClause = {};

    // Filtra por funcionário se o ID for fornecido
    if (query.employeeId) {
      whereClause.employeeId = query.employeeId;
    }

    // Barra de pesquisa para localizar por tipo ou descrição
    if (query.search) {
      const searchTerm = `%${query.search.toLowerCase()}%`;
      whereClause[Op.or] = [
        { documentType: { [Op.iLike]: searchTerm } },
        { description: { [Op.iLike]: searchTerm } },
      ];
    }

    return Document.findAll({
      where: whereClause,
      order: [['uploadedAt', 'DESC']], // Organiza por data de envio, mais recente primeiro
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'fullName'] } // Inclui o nome do funcionário
      ]
    });
  }

  /**
   * Deleta um documento (registro do DB e arquivo do disco).
   * @param {number} documentId - ID do documento a ser deletado.
   * @returns {Promise<void>}
   */
  static async deleteDocument(documentId) {
    const document = await Document.findByPk(documentId);
    if (!document) {
      throw new AppError('Documento não encontrado.', 404);
    }

    // Deleta o arquivo do sistema de arquivos
    try {
      await fs.unlink(path.resolve(document.filePath));
    } catch (err) {
      // Loga o erro, mas continua para deletar o registro do DB
      console.error(`Erro ao deletar o arquivo físico ${document.filePath}:`, err);
    }

    // Deleta o registro do banco de dados
    await document.destroy();
  }
}

module.exports = DocumentService;