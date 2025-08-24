// features/adminUser/adminUser.routes.js
const express = require('express');
const AdminUserController = require('./adminUser.controller');
const { authMiddleware, authorizeAdmin } = require('../../utils/auth');

const router = express.Router();

router.post('/login', AdminUserController.login);
router.post('/forgot-password', AdminUserController.forgotPassword);
router.post('/reset-password/:token', AdminUserController.resetPassword);

router.use(authMiddleware);
router.use(authorizeAdmin);

router.post('/register', AdminUserController.register);

router.route('/')
  .get(AdminUserController.getAll);

router.route('/:id')
  .get(AdminUserController.getById)
  .put(AdminUserController.update)
  .delete(AdminUserController.delete);

router.put('/:id/permissions', AdminUserController.updatePermissions);

module.exports = router;