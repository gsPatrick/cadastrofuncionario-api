module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
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
        model: 'employees', // Nome da tabela referenciada
        key: 'id',
      },
    },
    documentType: { // Campo livre para escreverem o tipo de documento
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    filePath: { // Caminho do arquivo no sistema de armazenamento
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    uploadedAt: { // Data/Hora de envio (automático)
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    uploadedById: { // Responsável pelo envio (ID do AdminUser)
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'admin_users',
        key: 'id',
      },
    },
  }, {
    tableName: 'documents',
    timestamps: false, // uploadedAt já está explícito, então não precisamos de createdAt/updatedAt padrão
  });

  Document.associate = (models) => {
    Document.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    Document.belongsTo(models.AdminUser, { foreignKey: 'uploadedById', as: 'uploadedBy' });
  };

  return Document;
};