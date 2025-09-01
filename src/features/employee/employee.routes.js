const express = require('express');
const EmployeeController = require('./employee.controller');
const { authMiddleware, authorize } = require('../../utils/auth'); // authorize importado
const { validateEmployeeCreation, validateEmployeeUpdate } = require('./employee.validator');
const handleValidationErrors = require('../../utils/validationHandler');
// ... outros imports

const router = express.Router();
router.use(authMiddleware); // Aplica autenticação a todas as rotas

// GET /employees - Requer permissão de leitura, mas vamos simplificar para 'edit' por enquanto
router.get('/', authorize('employee:edit'), EmployeeController.getAllEmployees);

// POST /employees - Requer permissão de criação
router.post('/', authorize('employee:create'), validateEmployeeCreation, handleValidationErrors, EmployeeController.createEmployee);

// GET /employees/:id
router.get('/:id', authorize('employee:edit'), EmployeeController.getEmployeeById);

// PUT /employees/:id - Requer permissão de edição
router.put('/:id', authorize('employee:edit'), validateEmployeeUpdate, handleValidationErrors, EmployeeController.updateEmployee);

// DELETE /employees/:id - Requer permissão de exclusão
router.delete('/:id', authorize('employee:delete'), EmployeeController.deleteEmployee);

// ... (outras rotas como histórico e exportação podem usar 'employee:edit' como base)
router.get('/:id/history', authorize('employee:edit'), EmployeeController.getEmployeeHistory);
router.get('/export/csv', authorize('employee:edit'), EmployeeController.exportToCsv);
// ...

// Rotas aninhadas
router.use('/:employeeId/documents', documentRouter);
router.use('/:employeeId/annotations', annotationRouter);

module.exports = router;