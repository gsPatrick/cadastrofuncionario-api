// features/document/document.routes.js
const express = require('express');
const DocumentController = require('./document.controller');
// Verifique se este caminho está correto
const uploadMiddleware = require('../../utils/fileUpload'); 

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(DocumentController.getDocuments)
    .post(uploadMiddleware, DocumentController.uploadDocuments); // Middleware aqui!

router.route('/:documentId')
    .delete(DocumentController.deleteDocument);

module.exports = router;