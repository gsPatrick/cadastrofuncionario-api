// models/AdminUser.js

module.exports = (sequelize, DataTypes) => {
  const AdminUser = sequelize.define('AdminUser', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    login: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // ==========================================================
    // NOVO CAMPO ADICIONADO AQUI
    // ==========================================================
    role: {
      type: DataTypes.ENUM('superadmin', 'admin'),
      allowNull: false,
      defaultValue: 'admin',
      comment: 'Define o nível de permissão do usuário. "superadmin" pode gerenciar outros admins.'
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'admin_users',
    timestamps: true,
  });

  AdminUser.associate = (models) => {
    AdminUser.hasMany(models.Document, { foreignKey: 'uploadedById', as: 'uploadedDocuments' });
    AdminUser.hasMany(models.Annotation, { foreignKey: 'responsibleId', as: 'createdAnnotations' });
    AdminUser.hasMany(models.AnnotationHistory, { foreignKey: 'editedById', as: 'editedAnnotationHistories' });
    AdminUser.hasMany(models.EmployeeHistory, { foreignKey: 'changedById', as: 'employeeChanges' });
  };

  return AdminUser;
};