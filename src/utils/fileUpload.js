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
  console.log('Criando diretório:', dirPath);
  fs.mkdirSync(dirPath, { recursive: true });
  return true;
};

// Configuração do armazenamento com Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('=== MULTER DESTINATION ===');
    console.log('Employee ID from params:', req.params.employeeId);
    console.log('File info:', { 
      fieldname: file.fieldname, 
      originalname: file.originalname,
      mimetype: file.mimetype 
    });
    
    // Define o destino dos uploads com base no ID do funcionário
    const employeeId = req.params.employeeId;
    if (!employeeId) {
      console.error('Employee ID não encontrado nos parâmetros da rota');
      return cb(new AppError('ID do funcionário é obrigatório para upload.', 400));
    }
    
    const dir = path.join(__dirname, `../../uploads/documents/employee_${employeeId}`);
    console.log('Diretório de destino:', dir);
    
    try {
      ensureDirectoryExistence(dir);
      console.log('Diretório verificado/criado com sucesso');
      cb(null, dir);
    } catch (error) {
      console.error('Erro ao criar diretório:', error);
      cb(new AppError('Erro ao criar diretório de upload.', 500));
    }
  },
  filename: (req, file, cb) => {
    console.log('=== MULTER FILENAME ===');
    console.log('Gerando nome para arquivo:', file.originalname);
    
    // Cria um nome de arquivo único para evitar conflitos
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    
    // Remove caracteres especiais do nome original
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const fileName = `${cleanBaseName}_${uniqueSuffix}${extension}`;
    
    console.log('Nome do arquivo gerado:', fileName);
    cb(null, fileName);
  }
});

// Filtro de arquivos para aceitar apenas tipos comuns de documentos
const fileFilter = (req, file, cb) => {
  console.log('=== MULTER FILE FILTER ===');
  console.log('Verificando arquivo:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // Tipos de arquivo permitidos (extensões)
  const allowedExtensions = /\.(jpeg|jpg|png|pdf|doc|docx|xls|xlsx)$/i;
  
  // Tipos MIME permitidos
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const hasValidExtension = allowedExtensions.test(file.originalname);
  const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
  
  console.log('Validação:', {
    hasValidExtension,
    hasValidMimeType,
    extension: path.extname(file.originalname).toLowerCase()
  });
  
  if (hasValidExtension && hasValidMimeType) {
    console.log('Arquivo aprovado pelo filtro');
    return cb(null, true);
  }
  
  console.log('Arquivo rejeitado pelo filtro');
  cb(new AppError(`Tipo de arquivo não suportado: ${file.originalname}. Apenas imagens (JPEG, PNG), PDFs e documentos do Office são permitidos.`, 400));
};

// Configuração do multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB por arquivo
    files: 10 // Máximo 10 arquivos por vez
  },
  fileFilter: fileFilter
});

// Middleware personalizado para melhor tratamento de erros
const uploadMiddleware = (req, res, next) => {
  console.log('=== UPLOAD MIDDLEWARE START ===');
  console.log('Request info:', {
    method: req.method,
    url: req.url,
    params: req.params,
    contentType: req.get('Content-Type')
  });
  
  const uploadHandler = upload.array('files', 10);
  
  uploadHandler(req, res, (err) => {
    console.log('=== MULTER PROCESSING COMPLETE ===');
    
    if (err) {
      console.error('Erro no multer:', err);
      
      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            return next(new AppError('Arquivo muito grande! Tamanho máximo: 10MB por arquivo.', 400));
          case 'LIMIT_FILE_COUNT':
            return next(new AppError('Muitos arquivos! Máximo: 10 arquivos por vez.', 400));
          case 'LIMIT_FIELD_COUNT':
            return next(new AppError('Muitos campos no formulário.', 400));
          case 'LIMIT_FIELD_KEY':
            return next(new AppError('Nome do campo muito longo.', 400));
          case 'LIMIT_FIELD_VALUE':
            return next(new AppError('Valor do campo muito longo.', 400));
          case 'LIMIT_PART_COUNT':
            return next(new AppError('Muitas partes no formulário.', 400));
          case 'LIMIT_UNEXPECTED_FILE':
            return next(new AppError('Campo de arquivo inesperado. Use o campo "files".', 400));
          default:
            return next(new AppError(`Erro no upload: ${err.message}`, 400));
        }
      }
      
      // Erro customizado (do fileFilter, por exemplo)
      return next(err);
    }
    
    // Log dos arquivos processados
    if (req.files && req.files.length > 0) {
      console.log('Arquivos processados com sucesso:');
      req.files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.originalname} -> ${file.filename} (${file.size} bytes)`);
      });
    } else {
      console.log('Nenhum arquivo foi processado');
    }
    
    console.log('Body recebido:', req.body);
    console.log('=== UPLOAD MIDDLEWARE END ===');
    next();
  });
};

// Exporta o middleware customizado
module.exports = uploadMiddleware;