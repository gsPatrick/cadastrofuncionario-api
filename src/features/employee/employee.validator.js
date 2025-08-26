// features/employee/employee.validator.js - VERSÃO CORRIGIDA E SEM VALIDAÇÃO DE E-MAIL

const { body } = require('express-validator');

// Regras de validação para a criação de um novo funcionário.
exports.validateEmployeeCreation = [
  body('fullName')
    .notEmpty().withMessage('Nome completo é obrigatório.')
    .isString().withMessage('Nome completo deve ser um texto.')
    .trim(),
  body('registrationNumber')
    .notEmpty().withMessage('Matrícula é obrigatória.')
    .isString().withMessage('Matrícula deve ser um texto.')
    .trim(),
  
  // --- CORREÇÃO APLICADA AQUI ---
  // A lista agora inclui "Comissionado" para corresponder ao formulário.
  body('institutionalLink')
    .notEmpty().withMessage('Vínculo institucional é obrigatório.')
    .isIn(['Efetivo', 'Comissionado Exclusivo', 'Comissionado', 'Estagiário', 'Terceirizado', 'Servidor Temporário', 'Consultor'])
    .withMessage('Vínculo institucional inválido.'),

  body('position')
    .notEmpty().withMessage('Cargo é obrigatório.')
    .isString().trim(),
  body('department')
    .notEmpty().withMessage('Departamento é obrigatório.')
    .isString().trim(),
  body('admissionDate')
    .notEmpty().withMessage('Data de admissão é obrigatória.')
    .isISO8601().withMessage('Data de admissão deve estar no formato AAAA-MM-DD.'),
  body('dateOfBirth')
    .notEmpty().withMessage('Data de nascimento é obrigatória.')
    .isISO8601().withMessage('Data de nascimento deve estar no formato AAAA-MM-DD.'),
  body('gender')
    .notEmpty().withMessage('Gênero é obrigatório.')
    .isIn(['Masculino', 'Feminino', 'Outro', 'Não Informado']).withMessage('Gênero inválido.'),
  body('maritalStatus')
    .notEmpty().withMessage('Estado civil é obrigatório.')
    .isIn(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável']).withMessage('Estado civil inválido.'),
  body('hasChildren')
    .isBoolean().withMessage('O campo "possui filhos" deve ser um valor booleano (true ou false).'),
  body('numberOfChildren')
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage('Número de filhos deve ser um número inteiro igual ou maior que zero.'),
  body('cpf')
    .notEmpty().withMessage('CPF é obrigatório.')
    .isLength({ min: 11, max: 11 }).withMessage('CPF deve ter exatamente 11 dígitos.')
    .isNumeric().withMessage('CPF deve conter apenas números.'),
  body('rg')
    .notEmpty().withMessage('RG é obrigatório.')
    .isString().trim(),
  body('addressStreet').notEmpty().withMessage('Logradouro é obrigatório.'),
  body('addressNumber').notEmpty().withMessage('Número do endereço é obrigatório.'),
  body('addressNeighborhood').notEmpty().withMessage('Bairro é obrigatório.'),
  body('addressCity').notEmpty().withMessage('Cidade é obrigatória.'),
  body('addressState').notEmpty().withMessage('Estado (UF) é obrigatório.').isLength({ min: 2, max: 2 }),
  body('addressZipCode')
    .notEmpty().withMessage('CEP é obrigatório.')
    .isLength({ min: 8, max: 8 }).withMessage('CEP deve ter 8 dígitos.')
    .isNumeric().withMessage('CEP deve conter apenas números.'),
  body('emergencyContactPhone').notEmpty().withMessage('Telefone de emergência é obrigatório.'),
  body('mobilePhone1').notEmpty().withMessage('Telefone celular é obrigatório.'),

  // --- VALIDAÇÃO DE E-MAIL REMOVIDA CONFORME SOLICITADO ---
  body('institutionalEmail')
    .notEmpty().withMessage('Email institucional é obrigatório.'),
    // .isEmail().withMessage('Email institucional inválido.') // Removido
    // .normalizeEmail(), // Removido

  body('personalEmail')
    .optional({ checkFalsy: true }),
    // .isEmail().withMessage('Email pessoal inválido.') // Removido
    // .normalizeEmail(), // Removido

  body('functionalStatus')
    .notEmpty().withMessage('Status funcional é obrigatório.')
    .isIn(['Ativo', 'Afastado', 'Licença', 'Desligado', 'Férias']).withMessage('Status funcional inválido.'),
];

// Regras de validação para a atualização de um funcionário.
exports.validateEmployeeUpdate = [
  body('fullName').optional().isString().trim(),
  body('registrationNumber').optional().isString().trim(),
  body('institutionalLink').optional().isIn(['Efetivo', 'Comissionado Exclusivo', 'Comissionado', 'Estagiário', 'Terceirizado', 'Servidor Temporário', 'Consultor']),
  body('position').optional().isString().trim(),
  body('department').optional().isString().trim(),
  body('admissionDate').optional().isISO8601(),
  body('institutionalEmail').optional(), // Validação de .isEmail() removida
  body('functionalStatus').optional().isIn(['Ativo', 'Afastado', 'Licença', 'Desligado', 'Férias']),
];