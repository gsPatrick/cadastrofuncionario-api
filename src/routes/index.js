const express = require('express');
const router = express.Router();

// Controladores para pesquisa global
const DocumentController = require('../features/document/document.controller');
const AnnotationController = require('../features/annotation/annotation.controller');
const { authMiddleware, authorize } = require('../utils/auth');

// Importa as rotas dos módulos principais
const adminUserRoutes = require('../features/adminUser/adminUser.routes');
const employeeRoutes = require('../features/employee/employee.routes');

// Define as rotas para os módulos
router.use('/admin-users', adminUserRoutes);
router.use('/employees', employeeRoutes);

// Rotas de pesquisa global para documentos e anotações
router.get('/documents/search', authMiddleware, authorize, DocumentController.getDocuments);
router.get('/annotations/search', authMiddleware, authorize, AnnotationController.getAnnotations);

router.get('/', (req, res) => {
  res.send('API de Gestão de Funcionários rodando!');
});

module.exports = router;