// features/adminUser/adminUser.routes.js
const express = require('express');
const AdminUserController = require('./adminUser.controller');
const { authMiddleware, authorize } = require('../../utils/auth');

const router = express.Router();

// Rotas públicas que não precisam de autenticação
router.post('/login', AdminUserController.login);
router.post('/forgot-password', AdminUserController.forgotPassword);
router.post('/reset-password/:token', AdminUserController.resetPassword);

// ==========================================================
// A partir daqui, todas as rotas exigem que o usuário esteja logado.
router.use(authMiddleware);
// ==========================================================

// As rotas abaixo exigem permissão de 'superadmin'
router.post('/register', authorize(['superadmin']), AdminUserController.register);

// Rota para listar todos os usuários
router.get('/', authorize(['superadmin']), AdminUserController.getAll);

// Rotas para um usuário específico por ID
router.route('/:id')
  .get(authorize(['superadmin']), AdminUserController.getById)
  .put(authorize(['superadmin']), AdminUserController.update) // Agora aponta para o método 'update' correto
  .delete(authorize(['superadmin']), AdminUserController.delete); // Agora aponta para o método 'delete' correto

module.exports = router;