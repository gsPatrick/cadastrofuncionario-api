const DocumentService = require('./document.service');
const { AppError } = require('../../utils/errorHandler');

class DocumentController {
  static async uploadDocuments(req, res, next) {
    try {
      console.log('=== DEBUG UPLOAD ===');
      console.log('Files received:', req.files?.length || 0);
      console.log('Body received:', req.body);
      console.log('Params:', req.params);
      console.log('User:', req.user);
      
      const { employeeId } = req.params;
      
      // Verificação de autenticação
      if (!req.user || !req.user.id) {
        throw new AppError('Usuário não autenticado.', 401);
      }
      
      const uploadedById = req.user.id;
      
      // Verificação de arquivos
      if (!req.files || req.files.length === 0) {
        throw new AppError('Nenhum arquivo foi enviado.', 400);
      }
      
      console.log('Iniciando upload para employeeId:', employeeId, 'por user:', uploadedById);
      
      const newDocuments = await DocumentService.uploadDocuments(employeeId, uploadedById, req.files, req.body);
      
      console.log('Upload concluído com sucesso. Documentos criados:', newDocuments.length);
      
      res.status(201).json({ 
        status: 'success', 
        message: `${newDocuments.length} documento(s) enviado(s) com sucesso.`,
        data: { documents: newDocuments } 
      });
    } catch (error) {
      console.error('Erro no upload de documentos:', error);
      next(error);
    }
  }

  static async getDocuments(req, res, next) {
    try {
      console.log('=== DEBUG GET DOCUMENTS ===');
      console.log('Query params:', req.query);
      console.log('Route params:', req.params);
      
      // Combina params e query para permitir busca global ou por funcionário
      const query = { ...req.query, ...req.params };
      const documents = await DocumentService.getDocuments(query);
      
      console.log('Documentos encontrados:', documents.length);
      
      res.status(200).json({ 
        status: 'success', 
        results: documents.length, 
        data: { documents } 
      });
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      next(error);
    }
  }

  /**
   * Atualiza os metadados de um documento.
   */
  static async updateDocument(req, res, next) {
    try {
      console.log('=== DEBUG UPDATE DOCUMENT ===');
      console.log('Document ID:', req.params.documentId);
      console.log('Body received:', req.body);
      
      const { documentId } = req.params;
      const editedById = req.user.id; // Usuário que está realizando a edição

      // Extrai os campos permitidos para atualização
      const { documentType, description } = req.body;
      const updateData = {};
      if (documentType !== undefined) updateData.documentType = documentType;
      if (description !== undefined) updateData.description = description;

      if (Object.keys(updateData).length === 0) {
        throw new AppError('Nenhum dado válido fornecido para atualização.', 400);
      }

      const updatedDocument = await DocumentService.updateDocument(documentId, editedById, updateData);
      
      console.log('Documento atualizado com sucesso:', updatedDocument.id);
      
      res.status(200).json({ 
        status: 'success', 
        message: 'Metadados do documento atualizados com sucesso.',
        data: { document: updatedDocument } 
      });
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      next(error);
    }
  }

  static async deleteDocument(req, res, next) {
    try {
      console.log('=== DEBUG DELETE DOCUMENT ===');
      console.log('Document ID:', req.params.documentId);
      
      const { documentId } = req.params;
      
      if (!documentId) {
        throw new AppError('ID do documento é obrigatório.', 400);
      }
      
      await DocumentService.deleteDocument(documentId);
      
      console.log('Documento deletado com sucesso:', documentId);
      
      res.status(204).json({ 
        status: 'success', 
        message: 'Documento deletado com sucesso.',
        data: null 
      });
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      next(error);
    }
  }

  static async downloadDocument(req, res, next) {
    try {
      console.log('=== DEBUG DOWNLOAD DOCUMENT ===');
      console.log('Document ID:', req.params.documentId);
      
      const { documentId } = req.params;
      const documentPath = await DocumentService.getDocumentPath(documentId);
      
      res.download(documentPath, (err) => {
        if (err) {
          console.error('Erro no download:', err);
          next(new AppError('Erro ao fazer download do documento.', 500));
        }
      });
    } catch (error) {
      console.error('Erro ao preparar download:', error);
      next(error);
    }
  }
}

module.exports = DocumentController;