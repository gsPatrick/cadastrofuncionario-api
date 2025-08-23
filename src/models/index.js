const Sequelize = require('sequelize');
const config = require('../config/config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Cria a instância do Sequelize
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging, // Define se as queries SQL serão logadas
  // Adiciona opções adicionais se necessário, como pool de conexões
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Carrega todos os modelos
db.AdminUser = require('./AdminUser')(sequelize, Sequelize.DataTypes);
db.Employee = require('./Employee')(sequelize, Sequelize.DataTypes);
db.Document = require('./Document')(sequelize, Sequelize.DataTypes);
db.Annotation = require('./Annotation')(sequelize, Sequelize.DataTypes);
db.AnnotationHistory = require('./AnnotationHistory')(sequelize, Sequelize.DataTypes);

// Configura as associações entre os modelos
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;