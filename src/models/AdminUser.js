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
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // ==========================================================
    // MUDANÇA ESTRUTURAL APLICADA AQUI
    // ==========================================================
    role: {
      type: DataTypes.ENUM('superadmin', 'rh'),
      allowNull: false,
      defaultValue: 'rh',
      comment: 'Define o perfil base. "admin" tem acesso total, "rh" tem permissões granulares.'
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: true, // Nulo para admins, preenchido para RH
      comment: 'Armazena permissões granulares para usuários do perfil RH (ex: { employee: { create: true } })'
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