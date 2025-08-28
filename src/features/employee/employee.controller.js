// features/employee/employee.controller.js

const EmployeeService = require('./employee.service');
const { AppError } = require('../../utils/errorHandler');
const { stringify } = require('csv-stringify');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

class EmployeeController {
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
      const adminUserId = req.user.id; 
      const updatedEmployee = await EmployeeService.updateEmployee(req.params.id, req.body, adminUserId);
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
  
  static async getEmployeeHistory(req, res, next) {
    try {
      const history = await EmployeeService.getEmployeeHistoryById(req.params.id);
      res.status(200).json({
        status: 'success',
        results: history.length,
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportToCsv(req, res, next) {
    try {
      const { search, ...filters } = req.query;
      const data = await EmployeeService.getEmployeesForExport({ search, filters });
      if (data.length === 0) return next(new AppError('Nenhum funcionário encontrado para exportar.', 404));

      // As chaves do primeiro objeto são os cabeçalhos
      const columns = Object.keys(data[0]);
      // Os valores de cada objeto são as linhas
      const rows = data.map(Object.values);

      stringify([columns, ...rows], (err, output) => {
        if (err) return next(new AppError('Erro ao gerar o arquivo CSV.', 500));
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=funcionarios-${Date.now()}.csv`);
        res.status(200).send(output);
      });
    } catch (error) { next(error); }
  }

  static async exportToPdf(req, res, next) {
    try {
        const { search, ...filters } = req.query;
        const data = await EmployeeService.getEmployeesForExport({ search, filters });
        if (data.length === 0) return next(new AppError('Nenhum funcionário encontrado para exportar.', 404));

        // Usa modo paisagem para caber mais colunas
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=funcionarios-${Date.now()}.pdf`);
        doc.pipe(res);

        doc.fontSize(16).text('Relatório de Funcionários', { align: 'center' });
        doc.moveDown();

        const tableTop = doc.y;
        const tableHeaders = Object.keys(data[0]);

        // Função para desenhar o cabeçalho da tabela
        const generateHeader = (doc, y) => {
            doc.fontSize(8).fillColor('black');
            let x = 30;
            const columnSpacing = (doc.page.width - 60) / tableHeaders.length;
            tableHeaders.forEach(header => {
                doc.text(header, x, y, { width: columnSpacing, align: 'left' });
                x += columnSpacing;
            });
            doc.moveTo(30, y + 15).lineTo(doc.page.width - 30, y + 15).stroke();
        };

        // Função para desenhar uma linha da tabela
        const generateRow = (doc, y, row) => {
            doc.fontSize(7).fillColor('black');
            let x = 30;
            const columnSpacing = (doc.page.width - 60) / tableHeaders.length;
            Object.values(row).forEach(cell => {
                doc.text(String(cell || '-'), x, y, { width: columnSpacing, align: 'left' });
                x += columnSpacing;
            });
            doc.moveTo(30, y + 20).lineTo(doc.page.width - 30, y + 20).stroke();
        };

        generateHeader(doc, tableTop);
        let y = tableTop + 25;

        for (const row of data) {
            // Se a próxima linha for ultrapassar a página, cria uma nova página
            if (y > doc.page.height - 50) {
                doc.addPage();
                y = 30; // Posição inicial na nova página
                generateHeader(doc, y);
                y += 25;
            }
            generateRow(doc, y, row);
            y += 25;
        }

        doc.end();
    } catch (error) {
        next(error);
    }
  }


  static async exportToExcel(req, res, next) {
    try {
      const { search, ...filters } = req.query;
      const data = await EmployeeService.getEmployeesForExport({ search, filters });
      if (data.length === 0) return next(new AppError('Nenhum funcionário encontrado para exportar.', 404));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Funcionários');

      // Define as colunas com base nas chaves do primeiro objeto de dados
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