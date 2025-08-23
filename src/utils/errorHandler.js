/**
 * Classe de erro genérica para erros de aplicação.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Indica que o erro é operacional (ex: erro de validação, não bug de programação)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de tratamento de erros global.
 * @param {Error} err - O objeto de erro.
 * @param {object} req - Objeto de requisição.
 * @param {object} res - Objeto de resposta.
 * @param {function} next - Próxima função middleware.
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // Em desenvolvimento, envie todos os detalhes do erro
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } else {
    // Em produção, envie apenas mensagens de erro operacionais para o cliente
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // Para erros de programação ou erros desconhecidos, envie uma mensagem genérica
      console.error('ERRO 💥', err); // Log o erro completo para investigação
      res.status(500).json({
        status: 'error',
        message: 'Algo deu muito errado!',
      });
    }
  }
};

module.exports = { AppError, globalErrorHandler };