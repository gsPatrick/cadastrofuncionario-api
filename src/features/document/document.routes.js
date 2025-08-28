const express = require('express');
const DocumentController = require('./document.controller');
const uploadMiddleware = require('../../utils/fileUpload');

// IMPORTANTE: Importe seu middleware de autenticação real aqui
const { authMiddleware, authorizeAdmin } = require('../../utils/auth'); // <-- Descomente e ajuste o caminho

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
  // Log req.user para debug de autenticação
  if (req.user) {
    console.log('Req.user:', req.user);
  } else {
    console.log('Req.user: Ausente (Auth Middleware pode não ter sido aplicado ou falhou)');
  }
  next();
});

// Rotas para documentos
router.route('/')
  .get(authMiddleware, authorizeAdmin, DocumentController.getDocuments) // <-- Descomentado
  .post(authMiddleware, authorizeAdmin, uploadMiddleware, DocumentController.uploadDocuments); // <-- Descomentado

router.route('/:documentId')
  .put(authMiddleware, authorizeAdmin, DocumentController.updateDocument) // <-- NOVA ROTA PARA EDIÇÃO DE METADADOS
  .delete(authMiddleware, authorizeAdmin, DocumentController.deleteDocument) // <-- Descomentado
  .get(authMiddleware, authorizeAdmin, DocumentController.downloadDocument); // <-- Descomentado

module.exports = router;