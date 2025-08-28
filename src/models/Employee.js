// Mapeamento de nomes de campos para nomes amigáveis para o histórico
const fieldDisplayNames = {
  fullName: 'Nome Completo',
  registrationNumber: 'Matrícula',
  institutionalLink: 'Vínculo Institucional',
  position: 'Cargo',
  role: 'Função',
  department: 'Departamento',
  currentAssignment: 'Lotação Atual',
  admissionDate: 'Data de Admissão',
  educationLevel: 'Nível de Formação',
  educationArea: 'Área de Formação',
  dateOfBirth: 'Data de Nascimento',
  gender: 'Gênero',
  maritalStatus: 'Estado Civil',
  hasChildren: 'Possui Filhos',
  numberOfChildren: 'Número de Filhos',
  cpf: 'CPF',
  rg: 'RG',
  rgIssuer: 'Órgão Emissor (RG)',
  addressStreet: 'Logradouro',
  addressNumber: 'Número (Endereço)',
  addressComplement: 'Complemento',
  addressNeighborhood: 'Bairro',
  addressCity: 'Cidade',
  addressState: 'Estado (UF)',
  addressZipCode: 'CEP',
  emergencyContactPhone: 'Telefone de Emergência',
  mobilePhone1: 'Celular 1',
  mobilePhone2: 'Celular 2',
  institutionalEmail: 'E-mail Institucional',
  personalEmail: 'E-mail Pessoal',
  functionalStatus: 'Situação Funcional',
  generalObservations: 'Observações Gerais',
  comorbidity: 'Comorbidade',
  disability: 'Deficiência',
  bloodType: 'Tipo Sanguíneo',
};


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
    position: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    currentAssignment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    admissionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    educationLevel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    educationArea: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('Masculino', 'Feminino', 'Outro', 'Não Informado'),
      allowNull: false,
    },
    maritalStatus: {
      type: DataTypes.ENUM('Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'),
      allowNull: false,
    },
    hasChildren: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    numberOfChildren: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0 }
    },
    cpf: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true }
    },
    rg: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { notEmpty: true }
    },
    rgIssuer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addressStreet: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressComplement: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addressNeighborhood: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressCity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressState: {
      type: DataTypes.STRING(2),
      allowNull: false,
    },
    addressZipCode: {
      type: DataTypes.STRING(8),
      allowNull: false,
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobilePhone1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobilePhone2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    institutionalEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      // O bloco "validate" foi removido daqui
    },
    personalEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      // O bloco "validate" foi removido daqui
    },
    functionalStatus: {
      type: DataTypes.ENUM('Ativo', 'Afastado', 'Licença', 'Desligado', 'Férias'),
      allowNull: false,
      defaultValue: 'Ativo',
    },
    generalObservations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    comorbidity: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Comorbidades do funcionário.',
    },
    disability: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tipo de deficiência, se houver.',
    },
    bloodType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tipo sanguíneo do funcionário (ex: A+, O-).',
    },
  }, {
    tableName: 'employees',
    timestamps: true,
    hooks: {
      afterUpdate: async (instance, options) => {
        const { EmployeeHistory } = instance.sequelize.models;
        const changedById = options.adminUserId;

        if (!changedById) {
          console.warn(`Tentativa de atualizar o funcionário ${instance.id} sem um adminUserId.`);
          return;
        }

        const changes = instance.changed();
        if (changes) {
          const historyRecords = [];
          for (const field of changes) {
            if (field === 'updatedAt') continue;

            const oldValue = instance.previous(field);
            const newValue = instance.get(field);
            
            if (oldValue !== newValue) {
              historyRecords.push({
                employeeId: instance.id,
                fieldName: fieldDisplayNames[field] || field,
                oldValue: String(oldValue),
                newValue: String(newValue),
                changedById: changedById,
              });
            }
          }

          if (historyRecords.length > 0) {
            await EmployeeHistory.bulkCreate(historyRecords, { transaction: options.transaction });
          }
        }
      }
    }
  });

  Employee.associate = (models) => {
    Employee.hasMany(models.Document, { foreignKey: 'employeeId', as: 'documents' });
    Employee.hasMany(models.Annotation, { foreignKey: 'employeeId', as: 'annotations' });
    Employee.hasMany(models.EmployeeHistory, { foreignKey: 'employeeId', as: 'history' });
  };

  return Employee;
};