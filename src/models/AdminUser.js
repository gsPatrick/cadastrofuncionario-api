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
        // OBS: A validação para não aceitar texto completamente em maiúsculas
        // será implementada no service/controller ao manipular a entrada.
      }
    },
    password: { // Renomeado de 'senha' para 'password' por convenção
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    name: { // Renomeado de 'nome' para 'name'
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        // Validação para maiúsculas aqui também, se necessário.
      }
    },
    email: { // Renomeado de 'e-mail' para 'email'
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      }
    },
    isActive: { // Para controlar o acesso e permissões
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // Futuramente, poderíamos ter um campo 'permissions' (JSONB)
    // para detalhar as áreas que o perfil pode acessar.
    // permissions: {
    //   type: DataTypes.JSONB,
    //   allowNull: false,
    //   defaultValue: {},
    // }
  }, {
    tableName: 'admin_users', // Nome da tabela no banco de dados
    timestamps: true, // Adiciona createdAt e updatedAt
  });

  // Associações futuras serão definidas em index.js ou aqui se preferir.
  AdminUser.associate = (models) => {
    // Um AdminUser pode criar/modificar Employees (indiretamente), Documents e Annotations.
    // As associações diretas serão com Document e Annotation.
    AdminUser.hasMany(models.Document, { foreignKey: 'uploadedById', as: 'uploadedDocuments' });
    AdminUser.hasMany(models.Annotation, { foreignKey: 'responsibleId', as: 'createdAnnotations' });
    AdminUser.hasMany(models.AnnotationHistory, { foreignKey: 'editedById', as: 'editedAnnotationHistories' });
  };

  return AdminUser;
};