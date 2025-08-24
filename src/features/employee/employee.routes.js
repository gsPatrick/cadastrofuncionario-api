// features/employee/employee.routes.js
const express = require('express');
const EmployeeController = require('./employee.controller');
const { authMiddleware, authorizeAdmin } = require('../../utils/auth');
const { validateEmployeeCreation, validateEmployeeUpdate } = require('./employee.validator');
const handleValidationErrors = require('../../utils/validationHandler');
const documentRouter = require('../document/document.routes');
const annotationRouter = require('../annotation/annotation.routes');

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeAdmin);

// Rotas de Exportação (devem vir antes das rotas com parâmetros)
router.get('/export/csv', EmployeeController.exportToCsv);
router.get('/export/pdf', EmployeeController.exportToPdf);
router.get('/export/excel', EmployeeController.exportToExcel);

// Rotas de CRUD
router.route('/')
  .post(validateEmployeeCreation, handleValidationErrors, EmployeeController.createEmployee)
  .get(EmployeeController.getAllEmployees);

router.route('/:id')
  .get(EmployeeController.getEmployeeById)
  .put(validateEmployeeUpdate, handleValidationErrors, EmployeeController.updateEmployee)
  .delete(EmployeeController.deleteEmployee);

// Aninhamento de Rotas (movido para depois das rotas estáticas)
router.use('/:employeeId/documents', documentRouter);
router.use('/:employeeId/annotations', annotationRouter);

module.exports = router;