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

      const columns = Object.keys(data[0]);
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

      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 30, bottom: 30, left: 30, right: 30 } });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=funcionarios-${Date.now()}.pdf`);
      doc.pipe(res);

      doc.fontSize(16).text('Relatório de Funcionários', { align: 'center' });
      doc.moveDown(2);

      const table = {
        headers: Object.keys(data[0]),
        // Larguras de coluna definidas manualmente para melhor layout. A soma deve se aproximar da largura da página (A4 landscape ~780pt).
        columnWidths: [ 25, 90, 50, 70, 50, 50, 60, 60, 50, 60, 60, 50, 40, 50, 30, 45, 70, 45, 45, 90, 30, 60, 50, 50, 25, 40, 60, 60, 60, 90, 90, 60, 90, 60, 60, 60 ],
        rows: data.map(Object.values),
      };

      const drawTable = (doc, table) => {
        let y = doc.y;
        const startX = doc.page.margins.left;
        const rowSpacing = 5;

        const drawHeader = () => {
          doc.fontSize(6).font('Helvetica-Bold');
          let x = startX;
          table.headers.forEach((header, i) => {
            doc.text(header, x, y, { width: table.columnWidths[i], align: 'left' });
            x += table.columnWidths[i];
          });
          y += 15; // Altura do cabeçalho
          doc.moveTo(startX, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
          y += rowSpacing;
        };

        const drawRow = (row) => {
          doc.fontSize(6).font('Helvetica');
          
          // Calcula a altura da linha com base no conteúdo que mais precisa de espaço
          let maxHeight = 0;
          let xForHeightCalc = startX;
          row.forEach((cell, i) => {
              const cellHeight = doc.heightOfString(String(cell || '-'), { width: table.columnWidths[i] });
              if (cellHeight > maxHeight) {
                  maxHeight = cellHeight;
              }
          });

          // Verifica se a linha cabe na página atual, se não, adiciona nova página
          if (y + maxHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            y = doc.page.margins.top;
            drawHeader();
          }

          let x = startX;
          row.forEach((cell, i) => {
            doc.text(String(cell || '-'), x, y, { width: table.columnWidths[i], align: 'left' });
            x += table.columnWidths[i];
          });
          y += maxHeight + rowSpacing;
          doc.moveTo(startX, y - rowSpacing + 2).lineTo(doc.page.width - doc.page.margins.right, y - rowSpacing + 2).strokeColor('#cccccc').stroke();
        };

        drawHeader();
        table.rows.forEach(drawRow);
      };

      drawTable(doc, table);
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

      worksheet.columns = Object.keys(data[0]).map(key => ({
        header: key,
        key: key,
        width: Math.max(key.length, 25)
      }));

      worksheet.addRows(data);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=funcionarios-${Date.now()}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) { next(error); }
  }
}

module.exports = EmployeeController;