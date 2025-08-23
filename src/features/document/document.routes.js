const express = require('express');
const DocumentController = require('./document.controller');
const uploadMiddleware = require('../../utils/fileUpload');

// { mergeParams: true } permite que este router acesse parâmetros da rota pai (ex: :employeeId)
const router = express.Router({ mergeParams: true });

// Rota para upload de documentos para um funcionário específico
router.post('/', uploadMiddleware, DocumentController.uploadDocuments);

// Rota para listar/pesquisar documentos de um funcionário específico
router.get('/', DocumentController.getDocuments);

// Rota para deletar um documento específico
router.delete('/:documentId', DocumentController.deleteDocument);

module.exports = router;