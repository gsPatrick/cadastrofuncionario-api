const { Settings } = require('../../models');
const { AppError } = require('../../utils/errorHandler');

class SettingsService {
  static async getAllSettings() {
    return Settings.findAll();
  }

  static async getSetting(key) {
    const setting = await Settings.findByPk(key);
    if (!setting) {
      throw new AppError(`Configuração com a chave '${key}' não encontrada.`, 404);
    }
    return setting;
  }

  static async createOrUpdateSetting(key, value, description) {
    const [setting, created] = await Settings.upsert({ key, value, description });
    return setting;
  }
}
module.exports = SettingsService;