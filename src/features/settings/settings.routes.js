// features/settings/settings.routes.js

const express = require('express');
const SettingsController = require('./settings.controller');
const { authMiddleware, authorize } = require('../../utils/auth');

const router = express.Router();

// Aplica middlewares de autenticação e autorização para todas as rotas de configurações
router.use(authMiddleware);
router.use(authorize);

// Rota para obter todas as configurações e para criar/atualizar uma nova
router.route('/')
  .get(SettingsController.getAllSettings)
  .post(SettingsController.createOrUpdateSetting);

// Rota para obter e deletar uma configuração específica por sua chave
// O erro era causado por uma sintaxe como '/:', aqui corrigido para '/:key'
router.route('/:key')
  .get(SettingsController.getSettingByKey)
  .delete(SettingsController.deleteSetting);

module.exports = router;