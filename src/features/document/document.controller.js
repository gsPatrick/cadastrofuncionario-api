const DocumentService = require('./document.service');

class DocumentController {
  static async uploadDocuments(req, res, next) {
    try {
      const { employeeId } = req.params;
      const uploadedById = req.user.id; // ID do admin logado
      const newDocuments = await DocumentService.uploadDocuments(employeeId, uploadedById, req.files, req.body);
      res.status(201).json({ status: 'success', data: { documents: newDocuments } });
    } catch (error) {
      next(error);
    }
  }

  static async getDocuments(req, res, next) {
    try {
      // Combina params e query para permitir busca global ou por funcionário
      const query = { ...req.query, ...req.params };
      const documents = await DocumentService.getDocuments(query);
      res.status(200).json({ status: 'success', results: documents.length, data: { documents } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDocument(req, res, next) {
    try {
      await DocumentService.deleteDocument(req.params.documentId);
      res.status(204).json({ status: 'success', data: null });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DocumentController;