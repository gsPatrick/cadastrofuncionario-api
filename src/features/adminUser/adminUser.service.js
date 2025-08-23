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
    const { login, password, name, email } = adminUserData;

    // Aplica a regra de não aceitar textos completamente em maiúsculas
    const formattedLogin = enforceCase(login);
    const formattedName = enforceCase(name);
    const formattedEmail = email.toLowerCase(); // Emails geralmente são padronizados para minúsculas

    // Verifica se o login ou email já existem
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
      isActive: true, // Novos usuários são ativos por padrão
    });

    // Retorna o usuário sem a senha hashed
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

    const userResponse = user.toJSON();
    delete userResponse.password;

    return { token, user: userResponse };
  }

  /**
   * Obtém todos os usuários administradores (sem a senha).
   * @returns {Promise<AdminUser[]>} Lista de usuários administradores.
   */
  static async getAll() {
    return AdminUser.findAll({
      attributes: { exclude: ['password'] }, // Exclui o campo de senha
    });
  }

  /**
   * Obtém um usuário administrador por ID (sem a senha).
   * @param {number} id - O ID do usuário.
   * @returns {Promise<AdminUser>} O usuário administrador.
   */
  static async getById(id) {
    const user = await AdminUser.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      throw new AppError('Usuário administrador não encontrado.', 404);
    }
    return user;
  }

  /**
   * Atualiza os dados de um usuário administrador.
   * @param {number} id - O ID do usuário a ser atualizado.
   * @param {object} updateData - Os dados a serem atualizados.
   * @returns {Promise<AdminUser>} O usuário administrador atualizado.
   */
  static async update(id, updateData) {
    const user = await AdminUser.findByPk(id);
    if (!user) {
      throw new AppError('Usuário administrador não encontrado.', 404);
    }

    // Aplica a regra de não aceitar textos completamente em maiúsculas para campos aplicáveis
    if (updateData.login) {
      updateData.login = enforceCase(updateData.login);
    }
    if (updateData.name) {
      updateData.name = enforceCase(updateData.name);
    }
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    // Se a senha for fornecida, hash-a
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    // Verificar unicidade de login/email se estiverem sendo atualizados
    if (updateData.login && updateData.login !== user.login) {
      const existingLogin = await AdminUser.findOne({ where: { login: updateData.login } });
      if (existingLogin) {
        throw new AppError('Novo login já está em uso.', 409);
      }
    }
    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await AdminUser.findOne({ where: { email: updateData.email } });
      if (existingEmail) {
        throw new AppError('Novo email já está em uso.', 409);
      }
    }

    await user.update(updateData);

    const userResponse = user.toJSON();
    delete userResponse.password;
    return userResponse;
  }

  /**
   * Deleta um usuário administrador.
   * @param {number} id - O ID do usuário a ser deletado.
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const user = await AdminUser.findByPk(id);
    if (!user) {
      throw new AppError('Usuário administrador não encontrado.', 404);
    }
    await user.destroy();
  }

  /**
   * Inicia o processo de recuperação de senha, gerando um token e enviando um e-mail.
   * @param {string} email - O email do usuário.
   */
  static async forgotPassword(email) {
    const user = await AdminUser.findOne({ where: { email } });
    if (!user) {
      // Para evitar vazamento de informações, sempre retorne sucesso mesmo se o email não for encontrado.
      // Ou, uma mensagem genérica como "Se o email estiver cadastrado, um link será enviado."
      return; // Apenas para mock, em produção envia "email enviado" ao invés de 404
    }

    // Gerar um token de redefinição de senha
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = Date.now() + 3600000; // 1 hora de validade

    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    await user.save({ fields: ['passwordResetToken', 'passwordResetExpires'] });

    // Link para redefinir a senha (ajustar para a URL do seu frontend)
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password/${resetToken}`;

    const message = `Você solicitou a redefinição de senha. Por favor, acesse o link: ${resetURL}\n\nEste link é válido por 1 hora. Se você não solicitou isso, ignore este e-mail.`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Redefinição de Senha do Sistema de Gestão de Funcionários',
        text: message,
        html: `<p>Você solicitou a redefinição de senha.</p><p>Por favor, clique no link abaixo para redefinir sua senha:</p><p><a href="${resetURL}">Redefinir Senha</a></p><p>Este link é válido por 1 hora. Se você não solicitou isso, ignore este e-mail.</p>`,
      });
    } catch (err) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save({ fields: ['passwordResetToken', 'passwordResetExpires'] });
      throw new AppError('Houve um erro ao enviar o e-mail de recuperação de senha. Tente novamente.', 500);
    }
  }

  /**
   * Redefine a senha do usuário usando um token.
   * @param {string} token - O token de redefinição de senha.
   * @param {string} newPassword - A nova senha.
   * @returns {Promise<void>}
   */
  static async resetPassword(token, newPassword) {
    // Hash o token recebido para comparar com o armazenado
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await AdminUser.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [AdminUser.sequelize.Op.gt]: Date.now() }, // Token deve ser válido (não expirado)
      },
    });

    if (!user) {
      throw new AppError('Token inválido ou expirado.', 400);
    }

    user.password = await hashPassword(newPassword);
    user.passwordResetToken = null; // Limpa o token após o uso
    user.passwordResetExpires = null;
    user.isActive = true; // Garante que a conta esteja ativa
    await user.save();
  }

  /**
   * Atualiza as permissões de acesso de um usuário administrador.
   * NOTE: O modelo AdminUser atualmente não tem um campo 'permissions' detalhado.
   * Se esse recurso for adicionado, esta função seria expandida.
   * Por enquanto, serve como placeholder para futura expansão, ou para ativar/desativar o user.
   * @param {number} id - O ID do usuário a ser atualizado.
   * @param {object} permissionsData - Os dados das permissões (ex: { isActive: boolean }).
   * @returns {Promise<AdminUser>} O usuário administrador atualizado.
   */
  static async updatePermissions(id, permissionsData) {
    const user = await AdminUser.findByPk(id);
    if (!user) {
      throw new AppError('Usuário administrador não encontrado.', 404);
    }

    if (permissionsData.isActive !== undefined) {
      user.isActive = permissionsData.isActive;
    }
    // Adicione lógica para atualizar outras permissões se o modelo AdminUser for expandido
    // if (permissionsData.allowedAreas) {
    //   user.permissions.allowedAreas = permissionsData.allowedAreas;
    // }

    await user.save();
    const userResponse = user.toJSON();
    delete userResponse.password;
    return userResponse;
  }
}

module.exports = AdminUserService;