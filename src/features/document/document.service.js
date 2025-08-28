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
    console.log('=== DocumentService.uploadDocuments ===');
    console.log('employeeId:', employeeId, 'type:', typeof employeeId);
    console.log('uploadedById:', uploadedById, 'type:', typeof uploadedById);
    console.log('files count:', files?.length);
    console.log('data:', data);

    // Validações básicas
    if (!employeeId) {
      throw new AppError('ID do funcionário é obrigatório.', 400);
    }

    if (!uploadedById) {
      throw new AppError('ID do usuário responsável pelo upload é obrigatório.', 400);
    }

    // Verifica se o funcionário existe
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new AppError('Funcionário não encontrado.', 404);
    }
    console.log('Funcionário encontrado:', employee.fullName);

    // Verifica se o admin existe
    const admin = await AdminUser.findByPk(uploadedById);
    if (!admin) {
      throw new AppError('Usuário administrador não encontrado.', 404);
    }
    console.log('Admin encontrado:', admin.name);

    // Verifica arquivos
    if (!files || files.length === 0) {
      throw new AppError('Nenhum arquivo foi enviado.', 400);
    }
    console.log('Arquivos recebidos:', files.map(f => ({ 
      originalname: f.originalname, 
      path: f.path, 
      size: f.size 
    })));

    // Prepara os registros dos documentos
    const documentRecords = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Determina o tipo do documento
      let documentType = 'Documento';
      if (data.documentType) {
        if (Array.isArray(data.documentType)) {
          documentType = data.documentType[i] || 'Documento';
        } else {
          documentType = data.documentType;
        }
      }
      
      // Determina a descrição
      let description = '';
      if (data.description) {
        if (Array.isArray(data.description)) {
          description = data.description[i] || '';
        } else {
          description = data.description;
        }
      }
      
      const record = {
        employeeId: parseInt(employeeId),
        uploadedById: parseInt(uploadedById),
        documentType: documentType.trim(),
        description: description.trim(),
        filePath: file.path,
        // `createdAt` será definido automaticamente pelo Sequelize
      };
      
      documentRecords.push(record);
      console.log(`Documento ${i + 1}:`, record);
    }

    try {
      const createdDocuments = await Document.bulkCreate(documentRecords);
      console.log('Documentos criados no banco:', createdDocuments.length);
      
      // Retorna os documentos com as associações
      const documentsWithAssociations = await Document.findAll({
        where: {
          id: createdDocuments.map(doc => doc.id)
        },
        include: [
          { 
            model: Employee, 
            as: 'employee', 
            attributes: ['id', 'fullName'] 
          },
          { 
            model: AdminUser, 
            as: 'uploadedBy', 
            attributes: ['id', 'name'] 
          }
        ]
      });
      
      return documentsWithAssociations;
    } catch (error) {
      console.error('Erro ao criar documentos no banco:', error);
      
      // Em caso de erro, tenta limpar os arquivos que foram salvos
      for (const file of files) {
        try {
          await fs.unlink(file.path);
          console.log('Arquivo limpo após erro:', file.path);
        } catch (unlinkError) {
          console.error('Erro ao limpar arquivo:', file.path, unlinkError.message);
        }
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
    console.log('=== DocumentService.getDocuments ===');
    console.log('Query recebida:', query);

    const whereClause = {};

    // Filtra por funcionário se o ID for fornecido
    if (query.employeeId) {
      whereClause.employeeId = parseInt(query.employeeId);
      console.log('Filtro por employeeId:', whereClause.employeeId);
    }

    // Barra de pesquisa para localizar por tipo ou descrição
    if (query.search && query.search.trim()) {
      const searchTerm = `%${query.search.trim().toLowerCase()}%`;
      whereClause[Op.or] = [
        { documentType: { [Op.iLike]: searchTerm } },
        { description: { [Op.iLike]: searchTerm } },
      ];
      console.log('Filtro de pesquisa:', searchTerm);
    }

    try {
      const documents = await Document.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']], // <-- MUDANÇA: usar createdAt
        include: [
          { 
            model: Employee, 
            as: 'employee', 
            attributes: ['id', 'fullName'] 
          },
          { 
            model: AdminUser, 
            as: 'uploadedBy', 
            attributes: ['id', 'name'] 
          }
        ]
      });

      console.log('Documentos encontrados:', documents.length);
      return documents;
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      throw new AppError('Erro ao buscar documentos.', 500);
    }
  }

  /**
   * Atualiza os metadados de um documento existente.
   * @param {number} documentId - ID do documento a ser atualizado.
   * @param {number} editedById - ID do admin que está editando. (Pode ser útil para logs ou futuras auditorias)
   * @param {object} updateData - Dados a serem atualizados (documentType, description).
   * @returns {Promise<Document>} O documento atualizado.
   */
  static async updateDocument(documentId, editedById, updateData) {
    console.log('=== DocumentService.updateDocument ===');
    console.log('Document ID:', documentId);
    console.log('Update Data:', updateData);
    console.log('Edited By ID:', editedById);

    if (!documentId) {
      throw new AppError('ID do documento é obrigatório para atualização.', 400);
    }

    const document = await Document.findByPk(documentId);
    if (!document) {
      throw new AppError('Documento não encontrado para atualização.', 404);
    }

    // Aplica as atualizações. Sequelize irá atualizar 'updatedAt' automaticamente.
    await document.update(updateData); 
    
    // Opcional: Recarregar com associações se necessário para o retorno
    const updatedDocument = await Document.findByPk(documentId, {
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'fullName'] },
        { model: AdminUser, as: 'uploadedBy', attributes: ['id', 'name'] }
      ]
    });

    console.log('Documento atualizado com sucesso:', updatedDocument.id);
    return updatedDocument;
  }

  /**
   * Deleta um documento (registro do DB e arquivo do disco).
   * @param {number} documentId - ID do documento a ser deletado.
   * @returns {Promise<void>}
   */
  static async deleteDocument(documentId) {
    console.log('=== DocumentService.deleteDocument ===');
    console.log('Document ID:', documentId);

    if (!documentId) {
      throw new AppError('ID do documento é obrigatório.', 400);
    }

    const document = await Document.findByPk(documentId, {
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'fullName'] }
      ]
    });

    if (!document) {
      throw new AppError('Documento não encontrado.', 404);
    }

    console.log('Documento encontrado:', {
      id: document.id,
      type: document.documentType,
      employee: document.employee?.fullName,
      filePath: document.filePath
    });

    // Deleta o arquivo do sistema de arquivos
    if (document.filePath) {
      try {
        const fullPath = path.resolve(document.filePath);
        await fs.access(fullPath); // Verifica se o arquivo existe
        await fs.unlink(fullPath);
        console.log('Arquivo físico deletado:', fullPath);
      } catch (err) {
        // Loga o erro, mas continua para deletar o registro do DB
        console.error(`Erro ao deletar o arquivo físico ${document.filePath}:`, err.message);
      }
    }

    // Deleta o registro do banco de dados
    try {
      await document.destroy();
      console.log('Registro do documento deletado do banco de dados');
    } catch (error) {
      console.error('Erro ao deletar registro do banco:', error);
      throw new AppError('Erro ao deletar documento do banco de dados.', 500);
    }
  }

  /**
   * Obtém o caminho de um documento para download.
   * @param {number} documentId - ID do documento.
   * @returns {Promise<string>} Caminho do arquivo.
   */
  static async getDocumentPath(documentId) {
    console.log('=== DocumentService.getDocumentPath ===');
    console.log('Document ID:', documentId);

    if (!documentId) {
      throw new AppError('ID do documento é obrigatório.', 400);
    }

    const document = await Document.findByPk(documentId);
    if (!document) {
      throw new AppError('Documento não encontrado.', 404);
    }

    const fullPath = path.resolve(document.filePath);
    
    try {
      await fs.access(fullPath);
      console.log('Arquivo encontrado:', fullPath);
      return fullPath;
    } catch (error) {
      console.error('Arquivo não encontrado:', fullPath);
      throw new AppError('Arquivo do documento não encontrado no sistema.', 404);
    }
  }
}

module.exports = DocumentService;