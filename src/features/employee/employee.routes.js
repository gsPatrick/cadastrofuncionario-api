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

router.get('/export/csv', EmployeeController.exportToCsv);
router.get('/export/pdf', EmployeeController.exportToPdf);
router.get('/export/excel', EmployeeController.exportToExcel);

router.route('/')
  .post(validateEmployeeCreation, handleValidationErrors, EmployeeController.createEmployee)
  .get(EmployeeController.getAllEmployees);

router.route('/:id')
  .get(EmployeeController.getEmployeeById)
  .put(validateEmployeeUpdate, handleValidationErrors, EmployeeController.updateEmployee)
  .delete(EmployeeController.deleteEmployee);

// --- NOVA ROTA PARA HISTÓRICO ---
router.get('/:id/history', EmployeeController.getEmployeeHistory);

router.use('/:employeeId/documents', documentRouter);
router.use('/:employeeId/annotations', annotationRouter);

module.exports = router;