// utils/auth.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AdminUser } = require('../models');
const { AppError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_please_change_this_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

const generateToken = (user) => {
  return jwt.sign(
    // ==========================================================
    // CORREÇÃO APLICADA AQUI: Adiciona role ao token
    // ==========================================================
    { id: user.id, login: user.login, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const authMiddleware = (req, res, next) => {
  let token = req.header('Authorization');

  if (!token) {
    return next(new AppError('Acesso negado. Token não fornecido.', 401));
  }

  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError('Token inválido ou expirado.', 401));
  }
};

/**
 * Middleware de autorização baseado em roles.
 * @param {Array<string>} allowedRoles - Array de roles permitidas (ex: ['superadmin']).
 */
const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return next(new AppError('Acesso proibido. Autenticação necessária.', 403));
    }
    
    try {
      // Busca o usuário no banco para garantir que a role está atualizada
      const user = await AdminUser.findByPk(req.user.id);
      
      if (!user) {
        return next(new AppError('Usuário não encontrado.', 403));
      }
      
      if (allowedRoles.includes(user.role)) {
        return next(); // Usuário tem a permissão necessária
      }
      
      return next(new AppError('Acesso proibido. Você não tem permissão para realizar esta ação.', 403));
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  authMiddleware,
  authorize, // Exporta o novo middleware
  JWT_SECRET,
};