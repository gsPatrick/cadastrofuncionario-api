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
    { id: user.id, login: user.login, role: user.role }, // A role no token ainda é útil
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const authMiddleware = async (req, res, next) => {
  let token = req.header('Authorization');

  if (!token || !token.startsWith('Bearer ')) {
    return next(new AppError('Acesso negado. Token não fornecido.', 401));
  }

  try {
    token = token.slice(7, token.length);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Anexa o usuário completo do banco à requisição para ter as permissões sempre atualizadas
    const currentUser = await AdminUser.findByPk(decoded.id);
    if (!currentUser) {
        return next(new AppError('Usuário associado a este token não existe mais.', 401));
    }
    
    req.user = currentUser; // Anexa o objeto completo do Sequelize
    next();
  } catch (err) {
    return next(new AppError('Token inválido ou expirado.', 401));
  }
};

// ==========================================================
// NOVO E PODEROSO MIDDLEWARE DE AUTORIZAÇÃO
// ==========================================================
/**
 * Middleware de autorização granular.
 * @param {string} requiredPermission - A permissão no formato 'entidade:acao' (ex: 'employee:create').
 */
const authorize = (requiredPermission) => {
  return (req, res, next) => {
    const user = req.user; // Obtém o usuário completo anexado pelo authMiddleware

    if (!user) {
      return next(new AppError('Acesso proibido. Autenticação necessária.', 403));
    }

    // Perfil 'admin' tem acesso irrestrito a tudo.
    if (user.role === 'admin') {
      return next();
    }

    // Para o perfil 'rh', verificamos as permissões granulares.
    if (user.role === 'rh') {
      const [entity, action] = requiredPermission.split(':');
      
      // Verifica se o objeto de permissões existe e se a permissão específica é true
      if (user.permissions && user.permissions[entity] && user.permissions[entity][action] === true) {
        return next(); // Permissão concedida
      }
    }
    
    // Se chegou até aqui, o acesso é negado.
    return next(new AppError('Acesso proibido. Você não tem permissão para realizar esta ação.', 403));
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  authMiddleware,
  authorize,
  JWT_SECRET,
};