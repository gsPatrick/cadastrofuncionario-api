// features/settings/settings.controller.js

const SettingsService = require('./settings.service');
const { AppError } = require('../../utils/errorHandler');

class SettingsController {
  /**
   * Lida com a requisição para obter todas as configurações.
   */
  static async getAllSettings(req, res, next) {
    try {
      const settings = await SettingsService.getAllSettings();
      res.status(200).json({
        status: 'success',
        results: settings.length,
        data: { settings },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lida com a requisição para obter uma configuração por chave.
   */
  static async getSettingByKey(req, res, next) {
    try {
      const { key } = req.params;
      const setting = await SettingsService.getSettingByKey(key);
      res.status(200).json({
        status: 'success',
        data: { setting },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lida com a requisição para criar ou atualizar uma configuração.
   */
  static async createOrUpdateSetting(req, res, next) {
    try {
      const { key, value, description } = req.body;
      if (!key || value === undefined) {
        return next(new AppError('Os campos "key" e "value" são obrigatórios.', 400));
      }

      const { setting, created } = await SettingsService.createOrUpdateSetting(key, value, description);
      
      // Retorna 201 (Created) se foi um novo registro, ou 200 (OK) se foi uma atualização.
      const statusCode = created ? 201 : 200;

      res.status(statusCode).json({
        status: 'success',
        data: { setting },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lida com a requisição para deletar uma configuração.
   */
  static async deleteSetting(req, res, next) {
    try {
      const { key } = req.params;
      await SettingsService.deleteSetting(key);
      res.status(204).json({ // 204 No Content
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SettingsController;