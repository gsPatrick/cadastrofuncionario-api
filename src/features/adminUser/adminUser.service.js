const { AdminUser } = require('../../models');
const { hashPassword, comparePassword, generateToken, JWT_SECRET } = require('../../utils/auth');
const { AppError } = require('../../utils/errorHandler');
const { enforceCase } = require('../../utils/textFormatter');
const { sendEmail } = require('../../utils/emailService');
const crypto = require('crypto'); // Módulo nativo do Node.js para gerar tokens aleatórios

class AdminUserService {
  /**
   * Registra um novo usuário administrador.
   * Apenas um admin existente pode registrar um novo admin.
   * @param {object} adminUserData - Dados do novo admin.
   * @returns {Promise<AdminUser>} O novo usuário administrador criado.
   */
  static async register(adminUserData) {
    const { login, password, name, email, role, isActive } = adminUserData;

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

    const hashedPassword = await hashPassword(password);

    const newAdminUser = await AdminUser.create({
      login: formattedLogin,
      password: hashedPassword,
      name: formattedName,
      email: formattedEmail,
      role: role || 'admin',
      isActive: isActive === undefined ? true : isActive,
    });

    const userResponse = newAdminUser.toJSON();
    delete userResponse.password;
    return userResponse;
  }

  /**
   * Autentica um usuário administrador.
   * @param {string} login - O login do usuário.
   * @param {string} password - A senha em texto puro.
   * @returns {Promise<{ token: string, user: object }>} Token JWT e dados do usuário.
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

    // ==========================================================
    // CORREÇÃO APLICADA AQUI
    // ==========================================================
    // Montamos o objeto de resposta manualmente para garantir que a 'role' seja incluída.
    const userResponse = {
      id: user.id,
      name: user.name,
      login: user.login,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };

    return { token, user: userResponse };
  }

  /**
   * Obtém todos os usuários administradores (sem a senha).
   * @returns {Promise<AdminUser[]>} Lista de usuários administradores.
   */
  static async getAll() {
    return AdminUser.findAll({
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
    });
  }

  /**
   * Obtém um usuário administrador por ID (sem a senha).
   * @param {number} id - O ID do usuário.
   * @returns {Promise<AdminUser>} O usuário administrador.
   */
  static async getById(id) {
    const user = await AdminUser.findByPk(id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
    });
    if (!user) {
      throw new AppError('Usuário administrador não encontrado.', 404);
    }
    return user;
  }
  
  /**
   * Atualiza os dados de um usuário administrador.
   * @param {number} currentUserId - O ID do usuário que está fazendo a alteração.
   * @param {number} targetUserId - O ID do usuário a ser atualizado.
   * @param {object} updateData - Os dados a serem atualizados.
   * @returns {Promise<AdminUser>} O usuário administrador atualizado.
   */
  static async update(currentUserId, targetUserId, updateData) {
    const userToUpdate = await AdminUser.findByPk(targetUserId);
    if (!userToUpdate) {
      throw new AppError('Usuário administrador não encontrado.', 404);
    }

    if (Number(currentUserId) === Number(targetUserId) && (updateData.role !== undefined || updateData.isActive !== undefined)) {
        throw new AppError('Você não pode alterar seu próprio perfil ou status.', 403);
    }

    if ((updateData.role === 'admin' || updateData.isActive === false) && userToUpdate.role === 'superadmin') {
      const superadminCount = await AdminUser.count({ where: { role: 'superadmin', isActive: true } });
      if (superadminCount <= 1) {
        throw new AppError('Não é possível rebaixar ou desativar o último superadministrador.', 403);
      }
    }
    
    if (updateData.name) userToUpdate.name = enforceCase(updateData.name);
    if (updateData.login) userToUpdate.login = enforceCase(updateData.login);
    if (updateData.email) userToUpdate.email = updateData.email.toLowerCase();
    
    if (updateData.role) userToUpdate.role = updateData.role;
    if (updateData.isActive !== undefined) userToUpdate.isActive = updateData.isActive;

    if (updateData.password) {
      userToUpdate.password = await hashPassword(updateData.password);
    }
    
    await userToUpdate.save();
    
    const userResponse = userToUpdate.toJSON();
    delete userResponse.password;
    return userResponse;
  }

  /**
   * Deleta um usuário administrador.
   * @param {number} currentUserId - O ID do usuário que está fazendo a alteração.
   * @param {number} targetUserId - O ID do usuário a ser deletado.
   * @returns {Promise<void>}
   */
  static async delete(currentUserId, targetUserId) {
      if (Number(currentUserId) === Number(targetUserId)) {
          throw new AppError('Você não pode excluir sua própria conta.', 403);
      }

      const user = await AdminUser.findByPk(targetUserId);
      if (!user) {
        throw new AppError('Usuário administrador não encontrado.', 404);
      }

      if (user.role === 'superadmin') {
        const superadminCount = await AdminUser.count({ where: { role: 'superadmin' } });
        if (superadminCount <= 1) {
          throw new AppError('Não é possível excluir o último superadministrador.', 403);
        }
      }

      await user.destroy();
  }

  static async forgotPassword(email) {
    const user = await AdminUser.findOne({ where: { email } });
    if (!user) {
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = Date.now() + 3600000;

    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    await user.save({ fields: ['passwordResetToken', 'passwordResetExpires'] });

    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    const message = `Você solicitou a redefinição de senha. Por favor, acesse o link: ${resetURL}\n\nEste link é válido por 1 hora.`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Redefinição de Senha',
        text: message,
      });
    } catch (err) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save({ fields: ['passwordResetToken', 'passwordResetExpires'] });
      throw new AppError('Houve um erro ao enviar o e-mail. Tente novamente.', 500);
    }
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