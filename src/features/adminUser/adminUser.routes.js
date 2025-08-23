const express = require('express');
const AdminUserController = require('./adminUser.controller');
const { authMiddleware, authorizeAdmin } = require('../../utils/auth');

const router = express.Router();

// Rotas de autenticação (não precisam de token para acessar)
router.post('/login', AdminUserController.login);
router.post('/forgot-password', AdminUserController.forgotPassword);
router.post('/reset-password/:token', AdminUserController.resetPassword);

// Todas as rotas abaixo requerem autenticação (authMiddleware)
// e que o usuário seja um administrador (authorizeAdmin) para gerenciamento.
// Isso significa que o primeiro AdminUser deve ser criado diretamente no DB ou via um script inicial.
// OU criaremos uma rota inicial para o primeiro Admin, que será removida/protegida posteriormente.
// Para fins de um sistema "completo", vamos assumir que o primeiro AdminUser
// será criado por um script inicial para setup.
// No entanto, para fins de teste e demonstração, você pode descomentar a linha abaixo para registrar o primeiro.
// **Importante:** Em produção, esta rota `register` deve ser extremamente protegida ou desativada após o setup inicial.
// router.post('/register', AdminUserController.register); // Pode ser usada para o primeiro admin, mas remova depois!

// Rotas protegidas por autenticação e autorização de administrador
router.use(authMiddleware); // Aplica o middleware de autenticação a todas as rotas abaixo
router.use(authorizeAdmin); // Aplica o middleware de autorização de admin a todas as rotas abaixo

// Rota para registrar um novo admin (após o primeiro admin já existir e estar logado)
router.post('/register', AdminUserController.register);

router.route('/')
  .get(AdminUserController.getAll); // Obter todos os admin users

router.route('/:id')
  .get(AdminUserController.getById) // Obter um admin user por ID
  .put(AdminUserController.update)   // Atualizar um admin user
  .delete(AdminUserController.delete); // Deletar um admin user

// Rota específica para atualizar permissões (pode ser o isActive ou outros campos de permissão)
router.put('/:id/permissions', AdminUserController.updatePermissions);


module.exports = router;