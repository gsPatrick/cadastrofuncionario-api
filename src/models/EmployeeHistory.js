// models/EmployeeHistory.js

module.exports = (sequelize, DataTypes) => {
  const EmployeeHistory = sequelize.define('EmployeeHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    fieldName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'O nome do campo que foi alterado (ex: functionalStatus).',
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'O valor do campo antes da alteração.',
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'O valor do campo depois da alteração.',
    },
    changedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'admin_users',
        key: 'id',
      },
      comment: 'ID do AdminUser que realizou a alteração.',
    },
  }, {
    tableName: 'employee_histories',
    timestamps: true, // Adiciona createdAt e updatedAt. `createdAt` será a data da alteração.
    updatedAt: false, // Não precisamos de um `updatedAt` para o histórico.
  });

  EmployeeHistory.associate = (models) => {
    EmployeeHistory.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    EmployeeHistory.belongsTo(models.AdminUser, { foreignKey: 'changedById', as: 'changedBy' });
  };

  return EmployeeHistory;
};