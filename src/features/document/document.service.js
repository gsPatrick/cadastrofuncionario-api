const { Document, Employee, AdminUser } = require('../../models');
const { AppError } = require('../../utils/errorHandler');
const { Op } = require('sequelize');
const fs = require('fs').promises;
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
    const documentRecords = files.map(file => ({
      employeeId,
      uploadedById,
      documentType: data.documentType || 'Documento',
      description: data.description || '',
      filePath: file.path,
      uploadedAt: new Date(),
    }));
    try {
      return Document.bulkCreate(documentRecords);
    } catch (error) {
      // Limpa os arquivos salvos em caso de erro no DB
      for (const file of files) {
        await fs.unlink(file.path).catch(err => console.error(`Falha ao limpar arquivo: ${file.path}`, err));
      }
      throw new AppError('Erro ao salvar documentos no banco de dados.', 500);
    }
  }

  /**
   * Obtém documentos com base em filtros e pesquisa.
   * @param {object} query - Parâmetros de busca e filtro.
   * @returns {Promise<Document[]>} Lista de documentos encontrados.
   */
  static async getDocuments(query) {
    const whereClause = {};
    if (query.employeeId) whereClause.employeeId = query.employeeId;
    if (query.search) {
      const searchTerm = `%${query.search.toLowerCase()}%`;
      whereClause[Op.or] = [
        { documentType: { [Op.iLike]: searchTerm } },
        { description: { [Op.iLike]: searchTerm } },
      ];
    }
    return Document.findAll({
      where: whereClause,
      order: [['uploadedAt', 'DESC']],
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'fullName'] },
        { model: AdminUser, as: 'uploadedBy', attributes: ['id', 'name'] }
      ]
    });
  }

  // ==========================================================
  // CORREÇÃO APLICADA AQUI: Nova função para atualizar metadados do documento
  // ==========================================================
  /**
   * Atualiza os metadados (tipo, descrição) de um documento.
   * @param {number} documentId - ID do documento a ser atualizado.
   * @param {object} updateData - Dados a serem atualizados (documentType, description).
   * @returns {Promise<Document>} O documento atualizado.
   */
  static async updateDocument(documentId, updateData) {
    const document = await Document.findByPk(documentId);
    if (!document) {
      throw new AppError('Documento não encontrado.', 404);
    }

    // Apenas permite a atualização de campos específicos
    const allowedUpdates = {};
    if (updateData.documentType) {
      allowedUpdates.documentType = updateData.documentType;
    }
    if (updateData.description !== undefined) { // Permite salvar descrição vazia
      allowedUpdates.description = updateData.description;
    }

    await document.update(allowedUpdates);
    return document;
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
    const filePath = document.filePath;
    await document.destroy();
    if (filePath) {
      await fs.unlink(path.resolve(filePath)).catch(err => console.error(`Erro ao deletar arquivo físico ${filePath}:`, err));
    }
  }

  /**
   * Obtém o caminho de um documento para download.
   * @param {number} documentId - ID do documento.
   * @returns {Promise<string>} Caminho do arquivo.
   */
  static async getDocumentPath(documentId) {
    const document = await Document.findByPk(documentId);
    if (!document || !document.filePath) {
      throw new AppError('Arquivo do documento não encontrado.', 404);
    }
    const fullPath = path.resolve(document.filePath);
    await fs.access(fullPath).catch(() => { throw new AppError('Arquivo não encontrado no sistema.', 404); });
    return fullPath;
  }
}

module.exports = DocumentService;