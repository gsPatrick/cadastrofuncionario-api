module.exports = (sequelize, DataTypes) => {
  const Annotation = sequelize.define('Annotation', {
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
    },
    title: { // Título da anotação
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    content: { // Conteúdo/Descrição
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true }
    },
    annotationDate: { // Data/Hora (automático)
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    responsibleId: { // Responsável (ID do AdminUser)
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'admin_users',
        key: 'id',
      },
    },
    category: { // Tipo/categoria da anotação
      type: DataTypes.ENUM(
        'Informativo',
        'Advertência',
        'Comunicação',
        'Elogio',
        'Outros'
      ),
      allowNull: false,
      defaultValue: 'Informativo',
    },
  }, {
    tableName: 'annotations',
    timestamps: true, // Para createdAt (data de criação) e updatedAt (última edição)
  });

  Annotation.associate = (models) => {
    Annotation.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    Annotation.belongsTo(models.AdminUser, { foreignKey: 'responsibleId', as: 'responsible' });
    Annotation.hasMany(models.AnnotationHistory, { foreignKey: 'annotationId', as: 'history' });
  };

  return Annotation;
};