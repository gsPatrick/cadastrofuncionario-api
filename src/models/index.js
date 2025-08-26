// models/index.js

const Sequelize = require('sequelize');
const config = require('../config/config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
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

db.AdminUser = require('./AdminUser')(sequelize, Sequelize.DataTypes);
db.Employee = require('./Employee')(sequelize, Sequelize.DataTypes);
db.Document = require('./Document')(sequelize, Sequelize.DataTypes);
db.Annotation = require('./Annotation')(sequelize, Sequelize.DataTypes);
db.AnnotationHistory = require('./AnnotationHistory')(sequelize, Sequelize.DataTypes);
// ADICIONA O NOVO MODELO
db.EmployeeHistory = require('./EmployeeHistory')(sequelize, Sequelize.DataTypes);
// ADICIONA O MODELO DE CONFIGURAÇÕES QUE FALTAVA (JÁ EXISTIA NO PROJETO)
db.Settings = require('./Settings')(sequelize, Sequelize.DataTypes);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;