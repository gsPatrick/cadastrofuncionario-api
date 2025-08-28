const { Employee, Document, Annotation, AdminUser, EmployeeHistory } = require('../../models');
const { AppError } = require('../../utils/errorHandler');
const { Op } = require('sequelize');
const { enforceCase } = require('../../utils/textFormatter'); // Certifique-se de que está importado se for usado

class EmployeeService {
  /**
   * Cria um novo funcionário.
   * @param {object} employeeData - Dados do novo funcionário.
   * @param {number} createdById - ID do AdminUser que criou o funcionário.
   * @returns {Promise<Employee>} O funcionário criado.
   */
  static async createEmployee(employeeData, createdById) {
    // Aplica o `enforceCase` nos campos de texto relevantes
    const formattedData = { ...employeeData };
    formattedData.fullName = enforceCase(formattedData.fullName);
    formattedData.position = enforceCase(formattedData.position);
    formattedData.role = formattedData.role ? enforceCase(formattedData.role) : formattedData.role;
    formattedData.department = enforceCase(formattedData.department);
    formattedData.currentAssignment = formattedData.currentAssignment ? enforceCase(formattedData.currentAssignment) : formattedData.currentAssignment;
    formattedData.educationLevel = formattedData.educationLevel ? enforceCase(formattedData.educationLevel) : formattedData.educationLevel;
    formattedData.educationArea = formattedData.educationArea ? enforceCase(formattedData.educationArea) : formattedData.educationArea;
    formattedData.addressStreet = enforceCase(formattedData.addressStreet);
    formattedData.addressNeighborhood = enforceCase(formattedData.addressNeighborhood);
    formattedData.addressCity = enforceCase(formattedData.addressCity);
    formattedData.generalObservations = formattedData.generalObservations ? enforceCase(formattedData.generalObservations) : formattedData.generalObservations;
    formattedData.comorbidity = formattedData.comorbidity ? enforceCase(formattedData.comorbidity) : formattedData.comorbidity;
    formattedData.disability = formattedData.disability ? enforceCase(formattedData.disability) : formattedData.disability;

    const newEmployee = await Employee.create({ ...formattedData, createdById }); // Assume createdById será tratado no hook, ou adicionado aqui
    return newEmployee;
  }

  /**
   * Obtém todos os funcionários, com opções de filtro e paginação.
   * @param {object} options - Opções de busca, incluindo page, limit, search.
   * @returns {Promise<{employees: Employee[], totalPages: number, currentPage: number, totalItems: number}>} Lista de funcionários e metadados de paginação.
   */
  static async getEmployees(options) {
    const { page = 1, limit = 10, search } = options;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: searchTerm } },
        { registrationNumber: { [Op.iLike]: searchTerm } },
        { position: { [Op.iLike]: searchTerm } },
        { department: { [Op.iLike]: searchTerm } },
        { cpf: { [Op.iLike]: searchTerm } },
      ];
    }

    const { count, rows } = await Employee.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [['fullName', 'ASC']],
      include: [
        { model: AdminUser, as: 'createdBy', attributes: ['id', 'name'] },
        { model: AdminUser, as: 'lastChangedBy', attributes: ['id', 'name'] }, // Novo include para 'lastChangedBy'
      ],
    });

    const totalPages = Math.ceil(count / limit);

    return {
      employees: rows,
      totalPages,
      currentPage: page,
      totalItems: count,
    };
  }

  /**
   * Obtém um funcionário pelo ID, incluindo seus documentos e anotações.
   * @param {number} id - ID do funcionário.
   * @returns {Promise<Employee>} O funcionário encontrado.
   */
  static async getEmployeeById(id) {
    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'documentType', 'description', 'filePath', 'createdAt', 'updatedAt'], // <-- ATUALIZADO: Usar 'createdAt', 'updatedAt'
          order: [['createdAt', 'DESC']] // <-- ATUALIZADO: Ordenar por 'createdAt'
        },
        {
          model: Annotation,
          as: 'annotations',
          attributes: ['id', 'title', 'content', 'annotationDate', 'responsibleId', 'category', 'createdAt', 'updatedAt'], // <-- ATUALIZADO: Usar 'createdAt', 'updatedAt'
          include: [
            { model: AdminUser, as: 'responsible', attributes: ['id', 'name'] }
          ],
          order: [['annotationDate', 'DESC']]
        },
        {
          model: EmployeeHistory,
          as: 'history',
          include: [{ model: AdminUser, as: 'changedBy', attributes: ['id', 'name'] }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    if (!employee) {
      throw new AppError('Funcionário não encontrado.', 404);
    }
    return employee;
  }

  /**
   * Atualiza um funcionário.
   * @param {number} id - ID do funcionário a ser atualizado.
   * @param {object} updateData - Dados para atualização.
   * @param {number} adminUserId - ID do AdminUser que realizou a alteração.
   * @returns {Promise<Employee>} O funcionário atualizado.
   */
  static async updateEmployee(id, updateData, adminUserId) {
    const employee = await Employee.findByPk(id);
    if (!employee) {
      throw new AppError('Funcionário não encontrado.', 404);
    }

    // Aplica o `enforceCase` nos campos de texto relevantes antes da atualização
    const formattedUpdateData = { ...updateData };
    if (formattedUpdateData.fullName) formattedUpdateData.fullName = enforceCase(formattedUpdateData.fullName);
    if (formattedUpdateData.position) formattedUpdateData.position = enforceCase(formattedUpdateData.position);
    if (formattedUpdateData.role) formattedUpdateData.role = enforceCase(formattedUpdateData.role);
    if (formattedUpdateData.department) formattedUpdateData.department = enforceCase(formattedUpdateData.department);
    if (formattedUpdateData.currentAssignment) formattedUpdateData.currentAssignment = enforceCase(formattedUpdateData.currentAssignment);
    if (formattedUpdateData.educationLevel) formattedUpdateData.educationLevel = enforceCase(formattedUpdateData.educationLevel);
    if (formattedUpdateData.educationArea) formattedUpdateData.educationArea = enforceCase(formattedUpdateData.educationArea);
    if (formattedUpdateData.addressStreet) formattedUpdateData.addressStreet = enforceCase(formattedUpdateData.addressStreet);
    if (formattedUpdateData.addressNeighborhood) formattedUpdateData.addressNeighborhood = enforceCase(formattedUpdateData.addressNeighborhood);
    if (formattedUpdateData.addressCity) formattedUpdateData.addressCity = enforceCase(formattedUpdateData.addressCity);
    if (formattedUpdateData.generalObservations) formattedUpdateData.generalObservations = enforceCase(formattedUpdateData.generalObservations);
    if (formattedUpdateData.comorbidity) formattedUpdateData.comorbidity = enforceCase(formattedUpdateData.comorbidity);
    if (formattedUpdateData.disability) formattedUpdateData.disability = enforceCase(formattedUpdateData.disability);

    // O hook `afterUpdate` do modelo `Employee` usará `adminUserId` das opções
    await employee.update(formattedUpdateData, { adminUserId });
    return employee;
  }

  /**
   * Deleta um funcionário.
   * @param {number} id - ID do funcionário a ser deletado.
   * @returns {Promise<void>}
   */
  static async deleteEmployee(id) {
    const employee = await Employee.findByPk(id);
    if (!employee) {
      throw new AppError('Funcionário não encontrado.', 404);
    }
    await employee.destroy();
  }
}

module.exports = EmployeeService;