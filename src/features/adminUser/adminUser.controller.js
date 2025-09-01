const AdminUserService = require('./adminUser.service');
const { AppError } = require('../../utils/errorHandler');

class AdminUserController {
  /**
   * Lida com o registro de um novo usuário administrador.
   * @param {object} req - Objeto de requisição.
   * @param {object} res - Objeto de resposta.
   * @param {function} next - Próxima função middleware.
   */
  static async register(req, res, next) {
    try {
      const newAdminUser = await AdminUserService.register(req.body);
      res.status(201).json({
        status: 'success',
        data: {
          adminUser: newAdminUser,
        },
      });
    } catch (error) {
      // Erro 409 para conflito (já existe)
      if (error.name === 'SequelizeUniqueConstraintError' || error.statusCode === 409) {
        return next(new AppError(error.message, 409));
      }
      next(error); // Passa para o middleware de tratamento de erros global
    }
  }

  /**
   * Lida com a autenticação (login) de um usuário administrador.
   * @param {object} req - Objeto de requisição.
   * @param {object} res - Objeto de resposta.
   * @param {function} next - Próxima função middleware.
   */
  static async login(req, res, next) {
    try {
      const { login, password } = req.body;
      if (!login || !password) {
        return next(new AppError('Login e senha são obrigatórios.', 400));
      }

      const { token, user } = await AdminUserService.login(login, password);

      res.status(200).json({
        status: 'success',
        token,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém todos os usuários administradores.
   * @param {object} req - Objeto de requisição.
   * @param {object} res - Objeto de resposta.
   * @param {function} next - Próxima função middleware.
   */
  static async getAll(req, res, next) {
    try {
      const adminUsers = await AdminUserService.getAll();
      res.status(200).json({
        status: 'success',
        results: adminUsers.length,
        data: {
          adminUsers,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém um usuário administrador por ID.
   * @param {object} req - Objeto de requisição.
   * @param {object} res - Objeto de resposta.
   * @param {function} next - Próxima função middleware.
   */
  static async getById(req, res, next) {
    try {
      const adminUser = await AdminUserService.getById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: {
          adminUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um usuário administrador.
   * @param {object} req - Objeto de requisição.
   * @param {object} res - Objeto de resposta.
   * @param {function} next - Próxima função middleware.
   */
  static async update(currentUserId, targetUserId, updateData) {
    const userToUpdate = await AdminUser.findByPk(targetUserId);
    if (!userToUpdate) {
      throw new AppError('Usuário administrador não encontrado.', 404);
    }

    // Regra de negócio: Um usuário não pode alterar o próprio role ou status.
    if (Number(currentUserId) === Number(targetUserId) && (updateData.role !== undefined || updateData.isActive !== undefined)) {
        throw new AppError('Você não pode alterar seu próprio perfil ou status.', 403);
    }

    // Regra de negócio: Impedir que o último superadmin seja desativado ou rebaixado
    if (updateData.role === 'admin' || updateData.isActive === false) {
      if (userToUpdate.role === 'superadmin') {
        const superadminCount = await AdminUser.count({ where: { role: 'superadmin', isActive: true } });
        if (superadminCount <= 1) {
          throw new AppError('Não é possível rebaixar ou desativar o último superadministrador.', 403);
        }
      }
    }
    
    // Atualiza campos de dados
    if (updateData.name) userToUpdate.name = enforceCase(updateData.name);
    if (updateData.login) userToUpdate.login = enforceCase(updateData.login);
    if (updateData.email) userToUpdate.email = updateData.email.toLowerCase();
    
    // Atualiza permissões
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
  
  static async delete(currentUserId, targetUserId) {
    if (Number(currentUserId) === Number(targetUserId)) {
        throw new AppError('Você não pode excluir sua própria conta.', 403);
    }

    const user = await AdminUser.findByPk(targetUserId);
    if (!user) {
      throw new AppError('Usuário administrador não encontrado.', 404);
    }

    // Regra de negócio: Impedir que um superadmin seja deletado se for o último
    if (user.role === 'superadmin') {
      const superadminCount = await AdminUser.count({ where: { role: 'superadmin' } });
      if (superadminCount <= 1) {
        throw new AppError('Não é possível excluir o último superadministrador.', 403);
      }
    }

    await user.destroy();
  }


  /**
   * Deleta um usuário administrador.
   * @param {object} req - Objeto de requisição.
   * @param {object} res - Objeto de resposta.
   * @param {function} next - Próxima função middleware.
   */
  static async delete(req, res, next) {
    try {
      // Implementar lógica para evitar deletar o último admin ou a si mesmo
      // Esta lógica deve ser no serviço ou no controller com consulta ao serviço
      await AdminUserService.delete(req.params.id);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lida com a solicitação de recuperação de senha.
   * @param {object} req - Objeto de requisição.
   * @param {object} res - Objeto de resposta.
   * @param {function} next - Próxima função middleware.
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return next(new AppError('Email é obrigatório para recuperação de senha.', 400));
      }
      await AdminUserService.forgotPassword(email);
      res.status(200).json({
        status: 'success',
        message: 'Se um usuário com este email existir, um link de redefinição de senha foi enviado.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lida com a redefinição de senha usando um token.
   * @param {object} req - Objeto de requisição.
   * @param {object} res - Objeto de resposta.
   * @param {function} next - Próxima função middleware.
   */
  static async resetPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return next(new AppError('Nova senha é obrigatória.', 400));
      }

      await AdminUserService.resetPassword(token, newPassword);
      res.status(200).json({
        status: 'success',
        message: 'Senha redefinida com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza as permissões de um usuário administrador.
   * @param {object} req - Objeto de requisição.
   * @param {object} res - Objeto de resposta.
   * @param {function} next - Próxima função middleware.
   */
  static async updatePermissions(req, res, next) {
    try {
      const updatedAdminUser = await AdminUserService.updatePermissions(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        data: {
          adminUser: updatedAdminUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }
static async changePassword(req, res, next) {
    try {
      const userId = req.user.id; // ID do usuário logado a partir do token
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return next(new AppError('Senha atual e nova senha são obrigatórias.', 400));
      }

      await AdminUserService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        status: 'success',
        message: 'Senha alterada com sucesso!',
      });
    } catch (error) {
      next(error);
    }
  }

static async changePassword(userId, currentPassword, newPassword) {
    const user = await AdminUser.findByPk(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      throw new AppError('Senha atual incorreta.', 401);
    }

    user.password = await hashPassword(newPassword);
    await user.save();
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
}

module.exports = AdminUserController;