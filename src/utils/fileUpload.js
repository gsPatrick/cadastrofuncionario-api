const multer = require('multer');
const { AppError } = require('./errorHandler');
const { Settings } = require('../models');

// Valores padrão caso as configurações não estejam no DB
const defaultSettings = {
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

// Função que cria e retorna o middleware de upload configurado
const createUploadMiddleware = () => {
  return async (req, res, next) => {
    try {
      // Busca as configurações do banco de dados
      const mimeTypesSetting = await Settings.findByPk('allowedMimeTypes');
      const fileSizeSetting = await Settings.findByPk('maxFileSizeMB');

      const allowedMimeTypes = mimeTypesSetting ? mimeTypesSetting.value : defaultSettings.allowedMimeTypes;
      const maxFileSize = fileSizeSetting ? fileSizeSetting.value * 1024 * 1024 : defaultSettings.maxFileSize;

      const storage = multer.diskStorage({
        destination: 'uploads/documents/',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `employee-${req.params.employeeId}-doc-${uniqueSuffix}-${file.originalname}`);
        }
      });

      const fileFilter = (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new AppError(`Tipo de arquivo não permitido. Permitidos: ${allowedMimeTypes.join(', ')}`, 400), false);
        }
      };

      const uploader = multer({
        storage,
        fileFilter,
        limits: { fileSize: maxFileSize },
      }).array('files', 10);

      // Executa o middleware do multer
      uploader(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError(`Arquivo muito grande. O tamanho máximo é de ${maxFileSize / 1024 / 1024}MB.`, 400));
          }
        } else if (err) {
          return next(err);
        }
        next();
      });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = createUploadMiddleware();