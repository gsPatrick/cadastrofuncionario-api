const DocumentService = require('./document.service');
const { AppError } = require('../../utils/errorHandler');

class DocumentController {
  static async uploadDocuments(req, res, next) {
    try {
      const { employeeId } = req.params;
      const uploadedById = req.user.id;
      
      if (!req.files || req.files.length === 0) {
        throw new AppError('Nenhum arquivo foi enviado.', 400);
      }
      
      const newDocuments = await DocumentService.uploadDocuments(employeeId, uploadedById, req.files, req.body);
      
      res.status(201).json({ 
        status: 'success', 
        message: `${newDocuments.length} documento(s) enviado(s) com sucesso.`,
        data: { documents: newDocuments } 
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDocuments(req, res, next) {
    try {
      const query = { ...req.query, ...req.params };
      const documents = await DocumentService.getDocuments(query);
      
      res.status(200).json({ 
        status: 'success', 
        results: documents.length, 
        data: { documents } 
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================================
  // CORREÇÃO APLICADA AQUI: Nova função para atualizar documentos
  // ==========================================================
  static async updateDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const updateData = req.body;
      const updatedDocument = await DocumentService.updateDocument(documentId, updateData);
      
      res.status(200).json({
        status: 'success',
        message: 'Documento atualizado com sucesso.',
        data: { document: updatedDocument }
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      await DocumentService.deleteDocument(documentId);
      
      res.status(204).json({ 
        status: 'success', 
        data: null 
      });
    } catch (error) {
      next(error);
    }
  }

  static async downloadDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const documentPath = await DocumentService.getDocumentPath(documentId);
      
      res.download(documentPath, (err) => {
        if (err) {
          next(new AppError('Erro ao fazer download do documento.', 500));
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DocumentController;