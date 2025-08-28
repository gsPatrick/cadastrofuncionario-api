// src/utils/fileUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');

// Função para garantir que o diretório de destino exista
const ensureDirectoryExistence = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    return true;
  }
  fs.mkdirSync(dirPath, { recursive: true });
};

// Configuração do armazenamento com Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define o destino dos uploads com base no ID do funcionário
    const dir = path.join(__dirname, `../../uploads/documents/employee_${req.params.employeeId}`);
    ensureDirectoryExistence(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Cria um nome de arquivo único para evitar conflitos
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filtro de arquivos para aceitar apenas tipos comuns de documentos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new AppError('Tipo de arquivo não suportado! Apenas imagens, PDFs e documentos do Office são permitidos.', 400));
};

const upload = multer({
  storage: storage,
  limits: {
    // Aumenta o limite para 10MB por arquivo (ajuste conforme necessário)
    fileSize: 1024 * 1024 * 10 
  },
  fileFilter: fileFilter
});

// Exporta o middleware pronto para ser usado nas rotas
// .array('files') espera que o campo no frontend se chame 'files' e permite múltiplos arquivos
module.exports = upload.array('files', 10); // Permite até 10 arquivos por vez