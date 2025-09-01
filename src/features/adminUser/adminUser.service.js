const { AdminUser } = require('../../models');
const { hashPassword, comparePassword, generateToken } = require('../../utils/auth');
const { AppError } = require('../../utils/errorHandler');
const { enforceCase } = require('../../utils/textFormatter');
const { sendEmail } = require('../../utils/emailService');
const crypto = require('crypto');

class AdminUserService {
  /**
   * Registra um novo usuário (Admin ou RH).
   */
  static async register(adminUserData) {
    const { login, password, name, email, role, isActive, permissions } = adminUserData;

    const formattedLogin = enforceCase(login);
    const formattedName = enforceCase(name);
    const formattedEmail = email.toLowerCase();

    const existingUser = await AdminUser.findOne({
      where: {
        [AdminUser.sequelize.Op.or]: [{ login: formattedLogin }, { email: formattedEmail }],
      },
    });

    if (existingUser) {
      if (existingUser.login === formattedLogin) {
        throw new AppError('Nome de usuário (login) já existe.', 409);
      }
      if (existingUser.email === formattedEmail) {
        throw new AppError('Email já cadastrado.', 409);
      }
    }

    if (!password) {
        throw new AppError('Senha é obrigatória para criar um novo usuário.', 400);
    }
    const hashedPassword = await hashPassword(password);

    const newAdminUser = await AdminUser.create({
      login: formattedLogin,
      password: hashedPassword,
      name: formattedName,
      email: formattedEmail,
      role: role || 'rh', // Padrão é RH
      isActive: isActive === undefined ? true : isActive,
      permissions: role === 'rh' ? permissions : null, // Salva permissões apenas se for RH
    });

    const userResponse = newAdminUser.toJSON();
    delete userResponse.password;
    return userResponse;
  }

  /**
   * Autentica um usuário e retorna seus dados, incluindo a role e permissões.
   */
  static async login(login, password) {
    const user = await AdminUser.findOne({ where: { login } });

    if (!user || !(await comparePassword(password, user.password))) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Sua conta está inativa. Entre em contato com o suporte.', 403);
    }

    const token = generateToken(user);

    // Retorna a role e as permissões granulares para o frontend
    const userResponse = {
      id: user.id,
      name: user.name,
      login: user.login,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      permissions: user.permissions, // ESSENCIAL PARA O FRONTEND
    };

    return { token, user: userResponse };
  }
  
  /**
   * Atualiza os dados e permissões de um usuário.
   */
  static async update(currentUserId, targetUserId, updateData) {
    const userToUpdate = await AdminUser.findByPk(targetUserId);
    if (!userToUpdate) {
      throw new AppError('Usuário administrador não encontrado.', 404);
    }

    // Um usuário não pode alterar suas próprias permissões ou status.
    if (Number(currentUserId) === Number(targetUserId)) {
      throw new AppError('Você não pode alterar suas próprias permissões ou status.', 403);
    }

    const { name, login, email, password, role, isActive, permissions } = updateData;

    if (name) userToUpdate.name = enforceCase(name);
    if (login) userToUpdate.login = enforceCase(login);
    if (email) userToUpdate.email = email.toLowerCase();
    
    if (password) {
      userToUpdate.password = await hashPassword(password);
    }

    if (role) userToUpdate.role = role;
    if (isActive !== undefined) userToUpdate.isActive = isActive;
    
    // Se o perfil for 'admin', as permissões granulares são limpas.
    // Se for 'rh', elas são salvas.
    userToUpdate.permissions = role === 'rh' ? permissions : null;
    
    await userToUpdate.save();
    
    const userResponse = userToUpdate.toJSON();
    delete userResponse.password;
    return userResponse;
  }

  /**
   * Deleta um usuário administrador.
   */
  static async delete(currentUserId, targetUserId) {
    if (Number(currentUserId) === Number(targetUserId)) {
        throw new AppError('Você não pode excluir sua própria conta.', 403);
    }

    const user = await AdminUser.findByPk(targetUserId);
    if (!user) {
      throw new AppError('Usuário administrador não encontrado.', 404);
    }

    // Impede que o último admin seja deletado
    if (user.role === 'admin') {
      const adminCount = await AdminUser.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        throw new AppError('Não é possível excluir o último administrador do sistema.', 403);
      }
    }

    await user.destroy();
  }

  static async getAll() {
    return AdminUser.findAll({
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
    });
  }

  static async getById(id) {
    const user = await AdminUser.findByPk(id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
    });
    if (!user) {
      throw new AppError('Usuário administrador não encontrado.', 404);
    }
    return user;
  }
  
  static async forgotPassword(email) {
    const user = await AdminUser.findOne({ where: { email } });
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = Date.now() + 3600000;

    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    await user.save();

    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    const message = `Link para redefinição de senha: ${resetURL}`;
    await sendEmail({ to: user.email, subject: 'Redefinição de Senha', text: message });
  }

  static async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await AdminUser.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [AdminUser.sequelize.Op.gt]: Date.now() },
      },
    });

    if (!user) {
      throw new AppError('Token inválido ou expirado.', 400);
    }

    user.password = await hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
  }
}

module.exports = AdminUserService;