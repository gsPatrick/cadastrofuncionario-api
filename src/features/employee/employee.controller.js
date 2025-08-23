const EmployeeService = require('./employee.service');
const { AppError } = require('../../utils/errorHandler');
const { stringify } = require('csv-stringify');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

class EmployeeController {
  // Métodos create, getAll, getById, update, delete (sem alterações da resposta anterior)
  static async createEmployee(req, res, next) {
    try {
      const newEmployee = await EmployeeService.createEmployee(req.body);
      res.status(201).json({ status: 'success', data: { employee: newEmployee } });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError' || error.statusCode === 409) return next(new AppError(error.message, 409));
      if (error.name === 'SequelizeValidationError') return next(new AppError(`Erro de validação: ${error.errors.map(e => e.message).join(', ')}`, 400));
      next(error);
    }
  }

  static async getAllEmployees(req, res, next) {
    try {
      const { search, page, limit, ...filters } = req.query;
      const result = await EmployeeService.getAllEmployees({ search, filters, page, limit });
      res.status(200).json({ status: 'success', results: result.employees.length, pagination: { totalItems: result.totalItems, totalPages: result.totalPages, currentPage: result.currentPage }, data: { employees: result.employees } });
    } catch (error) { next(error); }
  }

  static async getEmployeeById(req, res, next) {
    try {
      const employee = await EmployeeService.getEmployeeById(req.params.id);
      res.status(200).json({ status: 'success', data: { employee } });
    } catch (error) { next(error); }
  }

  static async updateEmployee(req, res, next) {
    try {
      const updatedEmployee = await EmployeeService.updateEmployee(req.params.id, req.body);
      res.status(200).json({ status: 'success', data: { employee: updatedEmployee } });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError' || error.statusCode === 409) return next(new AppError(error.message, 409));
      if (error.name === 'SequelizeValidationError') return next(new AppError(`Erro de validação: ${error.errors.map(e => e.message).join(', ')}`, 400));
      next(error);
    }
  }

  static async deleteEmployee(req, res, next) {
    try {
      await EmployeeService.deleteEmployee(req.params.id);
      res.status(204).json({ status: 'success', data: null });
    } catch (error) { next(error); }
  }

  /**
   * Exporta os dados dos funcionários para CSV.
   */
  static async exportToCsv(req, res, next) {
    try {
      const { search, ...filters } = req.query;
      const data = await EmployeeService.getEmployeesForExport({ search, filters });
      if (data.length === 0) return next(new AppError('Nenhum funcionário encontrado para exportar.', 404));

      const columns = Object.keys(data[0]);
      stringify([columns, ...data.map(Object.values)], (err, output) => {
        if (err) return next(new AppError('Erro ao gerar o arquivo CSV.', 500));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=funcionarios-${Date.now()}.csv`);
        res.status(200).send(output);
      });
    } catch (error) { next(error); }
  }

  /**
   * Exporta os dados dos funcionários para PDF.
   */
  static async exportToPdf(req, res, next) {
    try {
      const { search, ...filters } = req.query;
      const data = await EmployeeService.getEmployeesForExport({ search, filters });
      if (data.length === 0) return next(new AppError('Nenhum funcionário encontrado para exportar.', 404));

      const doc = new PDFDocument({ margin: 30, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=funcionarios-${Date.now()}.pdf`);
      doc.pipe(res);

      // Cabeçalho do documento
      doc.fontSize(18).text('Relatório de Funcionários', { align: 'center' });
      doc.moveDown();

      // Conteúdo
      data.forEach(employee => {
        doc.fontSize(12).text(`ID: ${employee.ID}`, { continued: true }).text(` - Matrícula: ${employee.Matrícula}`);
        doc.fontSize(14).text(employee['Nome Completo'], { underline: true });
        doc.fontSize(10).text(`Cargo: ${employee.Cargo} - Departamento: ${employee.Departamento}`);
        doc.text(`Email: ${employee['Email Institucional']} - CPF: ${employee.CPF}`);
        doc.text(`Status: ${employee['Status Funcional']}`);
        doc.moveDown(1.5); // Espaço entre os registros
      });

      doc.end();
    } catch (error) { next(error); }
  }

  /**
   * Exporta os dados dos funcionários para Excel (XLSX).
   */
  static async exportToExcel(req, res, next) {
    try {
      const { search, ...filters } = req.query;
      const data = await EmployeeService.getEmployeesForExport({ search, filters });
      if (data.length === 0) return next(new AppError('Nenhum funcionário encontrado para exportar.', 404));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Funcionários');

      // Define as colunas
      worksheet.columns = Object.keys(data[0]).map(key => ({
        header: key,
        key: key,
        width: Math.max(key.length, 20) // Largura mínima
      }));

      // Adiciona as linhas de dados
      worksheet.addRows(data);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=funcionarios-${Date.now()}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) { next(error); }
  }
}

module.exports = EmployeeController;