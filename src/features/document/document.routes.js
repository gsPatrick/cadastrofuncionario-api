// features/document/document.routes.js
const express = require('express');
const DocumentController = require('./document.controller');
const uploadMiddleware = require('../../utils/fileUpload');
const { authMiddleware, authorize } = require('../../utils/auth');

const router = express.Router({ mergeParams: true });

// Aplica autenticação a todas as rotas de documentos
router.use(authMiddleware);

// ==========================================================
// APLICAÇÃO DAS PERMISSÕES GRANULARES
// ==========================================================

// Rotas para documentos
router.route('/')
  // Para ver os documentos, precisa da permissão de 'edição' (leitura está implícita)
  .get(authorize('document:edit'), DocumentController.getDocuments)
  // Para enviar novos documentos, precisa da permissão de 'criação'
  .post(authorize('document:create'), uploadMiddleware, DocumentController.uploadDocuments); 

router.route('/:documentId')
  // Para baixar, precisa da permissão de 'edição'
  .get(authorize('document:edit'), DocumentController.downloadDocument)
  // Para atualizar metadados, precisa da permissão de 'edição'
  .put(authorize('document:edit'), DocumentController.updateDocument) 
  // Para deletar, precisa da permissão de 'exclusão'
  .delete(authorize('document:delete'), DocumentController.deleteDocument);

module.exports = router;