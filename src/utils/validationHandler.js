const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => `${err.msg} (no campo '${err.param}')`).join(', ');
    return next(new AppError(`Erro de validação: ${formattedErrors}`, 400));
  }
  next();
};

module.exports = handleValidationErrors;