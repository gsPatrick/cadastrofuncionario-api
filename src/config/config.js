require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false, // Defina como true para ver as queries SQL no console
  },
  test: {
    // Configurações para ambiente de teste, se necessário
  },
  production: {
    // Configurações para ambiente de produção
  }
};