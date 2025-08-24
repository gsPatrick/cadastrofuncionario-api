// features/settings/settings.service.js

const { Settings } = require('../../models');
const { AppError } = require('../../utils/errorHandler');

class SettingsService {
  /**
   * Obtém todas as configurações do sistema.
   * @returns {Promise<Settings[]>} Uma lista de todas as configurações.
   */
  static async getAllSettings() {
    return Settings.findAll({ order: [['key', 'ASC']] });
  }

  /**
   * Obtém uma configuração específica pela sua chave.
   * @param {string} key - A chave da configuração (ex: 'allowedMimeTypes').
   * @returns {Promise<Settings>} A configuração encontrada.
   */
  static async getSettingByKey(key) {
    const setting = await Settings.findByPk(key);
    if (!setting) {
      throw new AppError(`A configuração com a chave '${key}' não foi encontrada.`, 404);
    }
    return setting;
  }

  /**
   * Cria uma nova configuração ou atualiza uma existente (upsert).
   * @param {string} key - A chave da configuração.
   * @param {any} value - O valor da configuração (pode ser string, número, array, etc.).
   * @param {string} [description] - Uma descrição opcional da configuração.
   * @returns {Promise<{setting: Settings, created: boolean}>} O objeto da configuração e um booleano indicando se foi criado.
   */
  static async createOrUpdateSetting(key, value, description) {
    // O método upsert é perfeito para isso: ele insere se a chave não existir, ou atualiza se existir.
    const [setting, created] = await Settings.upsert({
      key,
      value,
      description,
    });
    return { setting, created };
  }

  /**
   * Deleta uma configuração pela sua chave.
   * @param {string} key - A chave da configuração a ser deletada.
   * @returns {Promise<void>}
   */
  static async deleteSetting(key) {
    const setting = await Settings.findByPk(key);
    if (!setting) {
      throw new AppError(`A configuração com a chave '${key}' não foi encontrada.`, 404);
    }
    await setting.destroy();
  }
}

module.exports = SettingsService;