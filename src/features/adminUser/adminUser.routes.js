// features/adminUser/adminUser.routes.js
const express = require('express');
const AdminUserController = require('./adminUser.controller');
// ==========================================================
// MUDANÇA APLICADA AQUI
// ==========================================================
const { authMiddleware, authorize } = require('../../utils/auth');

const router = express.Router();

// Rotas públicas
router.post('/login', AdminUserController.login);
router.post('/forgot-password', AdminUserController.forgotPassword);
router.post('/reset-password/:token', AdminUserController.resetPassword);

// A partir daqui, todas as rotas exigem autenticação
router.use(authMiddleware);

// ==========================================================
// NOVAS ROTAS E MIDDLEWARES DE AUTORIZAÇÃO
// ==========================================================

// Rota para o usuário logado trocar a própria senha
router.put('/change-password', AdminUserController.changePassword);

// As rotas abaixo exigem permissão de 'superadmin'
router.post('/register', authorize(['superadmin']), AdminUserController.register);

router.route('/')
  .get(authorize(['superadmin']), AdminUserController.getAll);

router.route('/:id')
  .get(authorize(['superadmin']), AdminUserController.getById)
  .put(authorize(['superadmin']), AdminUserController.update)
  .delete(authorize(['superadmin']), AdminUserController.delete);

// Rota para atualizar permissões, também para superadmin
router.put('/:id/permissions', authorize(['superadmin']), AdminUserController.updatePermissions);

module.exports = router;