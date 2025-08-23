const express = require('express');
const EmployeeController = require('./employee.controller');
const { authMiddleware, authorizeAdmin } = require('../../utils/auth');
const { validateEmployeeCreation, validateEmployeeUpdate } = require('./employee.validator');
const handleValidationErrors = require('../../utils/validationHandler');
const documentRouter = require('../document/document.routes');
const annotationRouter = require('../annotation/annotation.routes');

const router = express.Router();

// 1. APLICA MIDDLEWARES GLOBAIS PARA ESTE MÓDULO
// Todas as rotas de funcionários exigem que o usuário esteja logado e seja um administrador.
router.use(authMiddleware);
router.use(authorizeAdmin);

// 2. ANINHAMENTO DE ROTAS (Nested Routes)
// Para um funcionário específico, permite acessar seus documentos e anotações.
// Ex: GET /api/employees/123/documents
router.use('/:employeeId/documents', documentRouter);
router.use('/:employeeId/annotations', annotationRouter);

// 3. ROTAS DE EXPORTAÇÃO DE DADOS
// Permite exportar a lista de funcionários (filtrada ou não) para diferentes formatos.
router.get('/export/csv', EmployeeController.exportToCsv);
router.get('/export/pdf', EmployeeController.exportToPdf);
router.get('/export/excel', EmployeeController.exportToExcel);

// 4. ROTAS PRINCIPAIS DE CRUD (Criação, Leitura, Atualização, Deleção)
router.route('/')
  .post(
    validateEmployeeCreation, // Aplica as regras de validação para criação
    handleValidationErrors,   // Middleware que verifica se houve erros de validação
    EmployeeController.createEmployee // Se a validação passar, executa o controller
  )
  .get(EmployeeController.getAllEmployees); // Lista todos os funcionários com filtros e paginação

router.route('/:id')
  .get(EmployeeController.getEmployeeById) // Obtém um funcionário específico (ficha detalhada)
  .put(
    validateEmployeeUpdate,   // Aplica as regras de validação para atualização
    handleValidationErrors,     // Verifica os erros de validação
    EmployeeController.updateEmployee // Se a validação passar, executa o controller
  )
  .delete(EmployeeController.deleteEmployee); // Deleta um funcionário

module.exports = router;