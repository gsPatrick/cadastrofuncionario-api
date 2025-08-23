module.exports = (sequelize, DataTypes) => {
  const AnnotationHistory = sequelize.define('AnnotationHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    annotationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'annotations',
        key: 'id',
      },
      onDelete: 'CASCADE', // Se a anotação for deletada, o histórico também é.
    },
    oldTitle: { // Título anterior
      type: DataTypes.STRING,
      allowNull: true, // Pode ser nulo se não mudou
    },
    oldContent: { // Conteúdo anterior
      type: DataTypes.TEXT,
      allowNull: true,
    },
    oldCategory: { // Categoria anterior
      type: DataTypes.ENUM(
        'Informativo',
        'Advertência',
        'Comunicação',
        'Elogio',
        'Outros'
      ),
      allowNull: true,
    },
    editedById: { // Quem editou (ID do AdminUser)
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'admin_users',
        key: 'id',
      },
    },
    editedAt: { // Quando foi editado
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'annotation_histories',
    timestamps: false, // editedAt já é o timestamp
  });

  AnnotationHistory.associate = (models) => {
    AnnotationHistory.belongsTo(models.Annotation, { foreignKey: 'annotationId', as: 'annotation' });
    AnnotationHistory.belongsTo(models.AdminUser, { foreignKey: 'editedById', as: 'editedBy' });
  };

  return AnnotationHistory;
};