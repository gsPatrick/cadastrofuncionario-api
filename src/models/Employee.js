module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { notEmpty: true }
    },
    institutionalLink: {
      type: DataTypes.ENUM(
        'Efetivo',
        'Comissionado Exclusivo',
        'Estagiário',
        'Terceirizado',
        'Servidor Temporário',
        'Consultor'
      ),
      allowNull: false,
      validate: { notEmpty: true }
    },
    position: { // Cargo
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    role: { // Função
      type: DataTypes.STRING,
      allowNull: true, // Pode ser nulo se não houver distinção entre Cargo e Função
    },
    department: { // Setor/Departamento
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    currentAssignment: { // Lotação atual
      type: DataTypes.STRING,
      allowNull: true,
    },
    admissionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    educationLevel: { // Nível de formação
      type: DataTypes.STRING,
      allowNull: true,
    },
    educationArea: { // Área de formação e titulação
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    gender: { // Sexo
      type: DataTypes.ENUM('Masculino', 'Feminino', 'Outro', 'Não Informado'),
      allowNull: false,
    },
    maritalStatus: { // Estado civil
      type: DataTypes.ENUM('Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'),
      allowNull: false,
    },
    hasChildren: { // Possui filhos?
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    numberOfChildren: { // Quantos filhos?
      type: DataTypes.INTEGER,
      allowNull: true, // Nullable se hasChildren for false
      validate: { min: 0 }
    },
    cpf: {
      type: DataTypes.STRING(11), // CPF tem 11 dígitos
      allowNull: false,
      unique: true,
      validate: { notEmpty: true, len: [11, 11] }
    },
    rg: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { notEmpty: true }
    },
    rgIssuer: { // Órgão expedidor (RG)
      type: DataTypes.STRING,
      allowNull: true,
    },
    addressStreet: { // Logradouro
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressNumber: { // Número
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressComplement: { // Complemento
      type: DataTypes.STRING,
      allowNull: true,
    },
    addressNeighborhood: { // Bairro
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressCity: { // Cidade
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressState: { // Estado (UF)
      type: DataTypes.STRING(2),
      allowNull: false,
    },
    addressZipCode: { // CEP
      type: DataTypes.STRING(8),
      allowNull: false,
      validate: { len: [8, 8] }
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobilePhone1: { // Telefone celular 1
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobilePhone2: { // Telefone celular 2
      type: DataTypes.STRING,
      allowNull: true,
    },
    institutionalEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    personalEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true }
    },
    functionalStatus: { // Situação funcional
      type: DataTypes.ENUM('Ativo', 'Afastado', 'Licença', 'Desligado', 'Férias'), // Adicione outros conforme necessário
      allowNull: false,
      defaultValue: 'Ativo',
    },
    generalObservations: { // Observações gerais
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'employees',
    timestamps: true,
  });

  Employee.associate = (models) => {
    Employee.hasMany(models.Document, { foreignKey: 'employeeId', as: 'documents' });
    Employee.hasMany(models.Annotation, { foreignKey: 'employeeId', as: 'annotations' });
  };

  return Employee;
};