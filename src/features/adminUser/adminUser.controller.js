const AdminUserService = require('./adminUser.service');
const { AppError } = require('../../utils/errorHandler');

class AdminUserController {
  /**
   * Lida com o registro de um novo usuário administrador.
   */
  static async register(req, res, next) {
    try {
      // O 'req.user.id' vem do 'authMiddleware' e identifica quem está criando.
      const newAdminUser = await AdminUserService.register(req.body);
      res.status(201).json({
        status: 'success',
        data: {
          adminUser: newAdminUser,
        },
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError' || error.statusCode === 409) {
        return next(new AppError(error.message, 409));
      }
      next(error);
    }
  }

  /**
   * Lida com a autenticação (login) de um usuário administrador.
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
   */
  static async update(req, res, next) {
    try {
      const updatedAdminUser = await AdminUserService.update(req.user.id, req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        data: {
          adminUser: updatedAdminUser,
        },
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError' || error.statusCode === 409) {
        return next(new AppError(error.message, 409));
      }
      next(error);
    }
  }

  /**
   * Deleta um usuário administrador.
   */
  static async delete(req, res, next) {
    try {
      await AdminUserService.delete(req.user.id, req.params.id);
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
}

module.exports = AdminUserController;