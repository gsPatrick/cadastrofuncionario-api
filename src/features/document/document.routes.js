// features/document/document.routes.js
const express = require('express');
const DocumentController = require('./document.controller');
const uploadMiddleware = require('../../utils/fileUpload');

// IMPORTANTE: Importe seu middleware de autenticação real aqui
// const authMiddleware = require('../../middleware/auth'); // <-- Descomente e ajuste o caminho

const router = express.Router({ mergeParams: true });

// Middleware de log para debug (remova em produção se desejar)
router.use((req, res, next) => {
  console.log(`=== DOCUMENT ROUTES DEBUG ===`);
  console.log(`${req.method} ${req.originalUrl}`);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('Headers:', {
    'content-type': req.get('Content-Type'),
    'authorization': req.get('Authorization') ? 'Presente' : 'Ausente'
  });
  next();
});

// Rotas para documentos
router.route('/')
  .get(/* authMiddleware, */ DocumentController.getDocuments) // <-- Descomente authMiddleware
  .post(/* authMiddleware, */ uploadMiddleware, DocumentController.uploadDocuments); // <-- Descomente authMiddleware

router.route('/:documentId')
  .delete(/* authMiddleware, */ DocumentController.deleteDocument) // <-- Descomente authMiddleware
  .get(/* authMiddleware, */ DocumentController.downloadDocument); // <-- Descomente authMiddleware

module.exports = router;