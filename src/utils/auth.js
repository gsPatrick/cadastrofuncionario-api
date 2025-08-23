const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Chave secreta para JWT. Em produção, isso deve vir de variáveis de ambiente.
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_please_change_this_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // Token expira em 1 hora

/**
 * Hashes uma senha usando bcrypt.
 * @param {string} password - A senha em texto puro.
 * @returns {Promise<string>} A senha hashed.
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compara uma senha em texto puro com uma senha hashed.
 * @param {string} plainPassword - A senha em texto puro.
 * @param {string} hashedPassword - A senha hashed.
 * @returns {Promise<boolean>} True se as senhas coincidirem, caso contrário False.
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Gera um token JWT para um usuário.
 * @param {object} user - O objeto do usuário (deve conter 'id' e 'login').
 * @returns {string} O token JWT.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, login: user.login },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Middleware para verificar tokens JWT em requisições.
 * Anexa o usuário decodificado ao objeto de requisição (req.user).
 * @param {object} req - Objeto de requisição.
 * @param {object} res - Objeto de resposta.
 * @param {function} next - Próxima função middleware.
 */
const authMiddleware = (req, res, next) => {
  let token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  // Remove "Bearer " prefix if present
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Adiciona as informações do usuário logado na requisição
    next();
  } catch (err) {
    console.error('Erro na verificação do token:', err);
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

/**
 * Middleware para verificar se o usuário logado tem permissão de administrador.
 * Assume que authMiddleware já foi executado e req.user está disponível.
 * Em um sistema real, você verificaria um campo de 'role' ou 'permissions' no usuário.
 * Por enquanto, para AdminUser, assumiremos que qualquer AdminUser autenticado tem acesso total.
 * Futuramente, podemos adicionar um campo `role` ou `permissions` no modelo AdminUser.
 */
const authorizeAdmin = (req, res, next) => {
  // Para o AdminUser, se ele está autenticado, assumimos que ele tem permissão de administrador
  // porque apenas funcionários do RH terão acesso a esse sistema e farão as operações.
  // Se tivéssemos diferentes níveis de admin, verificaríamos `req.user.role === 'admin'` ou similar.
  if (!req.user || !req.user.id) {
    return res.status(403).json({ message: 'Acesso proibido. Usuário não autenticado ou sem permissão.' });
  }
  // Se o usuário está autenticado via JWT, ele é um AdminUser.
  // Futuramente, aqui seria a lógica de verificação de permissão específica (ex: req.user.isAdmin)
  next();
};


module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  authMiddleware,
  authorizeAdmin,
  JWT_SECRET, // Exporta para Nodemailer usar para token de recuperação, se necessário
};