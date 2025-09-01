// features/document/document.routes.js
const express = require('express');
const DocumentController = require('./document.controller');
const uploadMiddleware = require('../../utils/fileUpload');
const { authMiddleware, authorize } = require('../../utils/auth');

const router = express.Router({ mergeParams: true });

// Aplica autenticação a todas as rotas de documentos
router.use(authMiddleware, authorize);

// Rotas para documentos
router.route('/')
  .get(DocumentController.getDocuments)
  .post(uploadMiddleware, DocumentController.uploadDocuments); 

router.route('/:documentId')
  .get(DocumentController.downloadDocument)
  // ==========================================================
  // CORREÇÃO APLICADA AQUI: Adicionada a rota PUT para edição
  // ==========================================================
  .put(DocumentController.updateDocument) 
  .delete(DocumentController.deleteDocument);

module.exports = router;