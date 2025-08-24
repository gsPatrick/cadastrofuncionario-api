// features/document/document.routes.js
const express = require('express');
const DocumentController = require('./document.controller');
const uploadMiddleware = require('../../utils/fileUpload');

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(DocumentController.getDocuments)
    .post(uploadMiddleware, DocumentController.uploadDocuments);

router.route('/:documentId')
    .delete(DocumentController.deleteDocument);

module.exports = router;