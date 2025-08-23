const { Employee, Document, Annotation } = require('../../models');
const { AppError } = require('../../utils/errorHandler');
const { enforceCase } = require('../../utils/textFormatter');
const { Op } = require('sequelize');

class EmployeeService {
  /**
   * Cria um novo funcionário no sistema.
   * @param {object} employeeData - Dados do novo funcionário.
   * @returns {Promise<Employee>} O funcionário criado.
   */
  static async createEmployee(employeeData) {
    const formattedData = {};
    for (const key in employeeData) {
      if (typeof employeeData[key] === 'string') {
        if (key === 'institutionalEmail' || key === 'personalEmail') {
          formattedData[key] = employeeData[key].toLowerCase();
        } else {
          formattedData[key] = enforceCase(employeeData[key]);
        }
      } else {
        formattedData[key] = employeeData[key];
      }
    }

    const existingEmployee = await Employee.findOne({
      where: {
        [Op.or]: [
          { registrationNumber: formattedData.registrationNumber },
          { cpf: formattedData.cpf },
          { institutionalEmail: formattedData.institutionalEmail }
        ]
      }
    });

    if (existingEmployee) {
      if (existingEmployee.registrationNumber === formattedData.registrationNumber) throw new AppError('Matrícula já cadastrada.', 409);
      if (existingEmployee.cpf === formattedData.cpf) throw new AppError('CPF já cadastrado.', 409);
      if (existingEmployee.institutionalEmail === formattedData.institutionalEmail) throw new AppError('Email institucional já cadastrado.', 409);
    }

    return Employee.create(formattedData);
  }

  /**
   * Obtém uma lista de funcionários com suporte a busca, filtros e paginação.
   * @param {object} options - Opções de busca e paginação.
   * @returns {Promise<{employees: Employee[], totalItems: number, totalPages: number, currentPage: number}>}
   */
  static async getAllEmployees({ search, filters, page = 1, limit = 10 }) {
    const whereClause = {};

    if (filters) {
      for (const key in filters) {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          whereClause[key] = filters[key];
        }
      }
    }

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: searchTerm } },
        { department: { [Op.iLike]: searchTerm } },
        { registrationNumber: { [Op.iLike]: searchTerm } },
        { cpf: { [Op.iLike]: searchTerm } },
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Employee.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fullName', 'ASC']],
    });

    return {
      employees: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    };
  }

  /**
   * Obtém um funcionário pelo ID, incluindo seus documentos e anotações associados.
   * @param {number} id - O ID do funcionário.
   * @returns {Promise<Employee>} O funcionário encontrado com seus dados associados.
   */
  static async getEmployeeById(id) {
    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: Document,
          as: 'documents', // 'as' deve corresponder ao definido na associação em Employee.js
          attributes: ['id', 'documentType', 'description', 'filePath', 'uploadedAt']
        },
        {
          model: Annotation,
          as: 'annotations', // 'as' deve corresponder ao definido na associação em Employee.js
          attributes: ['id', 'title', 'content', 'category', 'annotationDate', 'updatedAt']
        }
      ],
      order: [
        [{ model: Document, as: 'documents' }, 'uploadedAt', 'DESC'],
        [{ model: Annotation, as: 'annotations' }, 'annotationDate', 'DESC'],
      ]
    });

    if (!employee) {
      throw new AppError('Funcionário não encontrado.', 404);
    }
    return employee;
  }

  /**
   * Atualiza os dados de um funcionário.
   * @param {number} id - O ID do funcionário a ser atualizado.
   * @param {object} updateData - Os dados a serem atualizados.
   * @returns {Promise<Employee>} O funcionário atualizado.
   */
  static async updateEmployee(id, updateData) {
    const employee = await Employee.findByPk(id);
    if (!employee) {
      throw new AppError('Funcionário não encontrado.', 404);
    }

    const formattedUpdateData = {};
    for (const key in updateData) {
      if (typeof updateData[key] === 'string') {
        if (key === 'institutionalEmail' || key === 'personalEmail') {
          formattedUpdateData[key] = updateData[key].toLowerCase();
        } else {
          formattedUpdateData[key] = enforceCase(updateData[key]);
        }
      } else {
        formattedUpdateData[key] = updateData[key];
      }
    }

    const uniqueFields = ['registrationNumber', 'cpf', 'institutionalEmail'];
    for (const field of uniqueFields) {
      if (formattedUpdateData[field] && formattedUpdateData[field] !== employee[field]) {
        const existing = await Employee.findOne({ where: { [field]: formattedUpdateData[field] } });
        if (existing && existing.id !== employee.id) {
          throw new AppError(`${field} já está em uso.`, 409);
        }
      }
    }

    await employee.update(formattedUpdateData);
    return employee;
  }

  /**
   * Deleta um funcionário.
   * @param {number} id - O ID do funcionário a ser deletado.
   * @returns {Promise<void>}
   */
  static async deleteEmployee(id) {
    const employee = await Employee.findByPk(id);
    if (!employee) {
      throw new AppError('Funcionário não encontrado.', 404);
    }
    await employee.destroy();
  }

  /**
   * Prepara os dados de funcionários para exportação.
   * @param {object} options - Opções de busca e filtros.
   * @returns {Promise<object[]>} Array de dados dos funcionários.
   */
  static async getEmployeesForExport({ search, filters }) {
    const { employees } = await this.getAllEmployees({ search, filters, page: 1, limit: 10000 }); // Limite alto para pegar todos

    return employees.map(emp => ({
      ID: emp.id,
      'Nome Completo': emp.fullName,
      Matrícula: emp.registrationNumber,
      'Vínculo Institucional': emp.institutionalLink,
      Cargo: emp.position,
      Departamento: emp.department,
      'Data de Admissão': emp.admissionDate,
      'Data de Nascimento': emp.dateOfBirth,
      CPF: emp.cpf,
      RG: emp.rg,
      'Email Institucional': emp.institutionalEmail,
      'Status Funcional': emp.functionalStatus,
    }));
  }
}

module.exports = EmployeeService;