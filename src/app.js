require('dotenv').config(); // Garante que as variáveis de ambiente sejam carregadas no início

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const allRoutes = require('./routes');
const { sequelize } = require('./models');
const { AppError, globalErrorHandler } = require('./utils/errorHandler');

// 1. IMPORTS ADICIONAIS
// Precisamos do modelo AdminUser para criar o usuário e da função para criptografar a senha.
const { AdminUser } = require('./models');
const { hashPassword } = require('./utils/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api', allRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Não foi possível encontrar ${req.originalUrl} neste servidor!`, 404));
});

app.use(globalErrorHandler);

// 2. NOVA FUNÇÃO PARA CRIAR O USUÁRIO ADMIN PADRÃO
/**
 * Verifica se um usuário administrador padrão existe e, se não, cria um.
 * Isso garante que o sistema sempre tenha pelo menos uma conta de administrador para o primeiro acesso.
 */
async function createDefaultAdmin() {
  try {
    // Procura por um usuário com o email padrão
    const adminExists = await AdminUser.findOne({ where: { email: 'admin@admin.com' } });

    // Se o usuário não for encontrado, cria um novo
    if (!adminExists) {
      console.log('Usuário administrador padrão não encontrado. Criando...');
      
      // Criptografa a senha antes de salvar
      const hashedPassword = await hashPassword('admin123');
      
      await AdminUser.create({
        login: 'admin',
        password: hashedPassword,
        name: 'Administrador Padrão',
        email: 'admin@admin.com',
        isActive: true,
      });

      console.log('Usuário administrador padrão criado com sucesso!');
      console.log('Login: admin ou admin@admin.com');
      console.log('Senha: admin123');
    } else {
      console.log('Usuário administrador padrão já existe. Nenhuma ação necessária.');
    }
  } catch (error) {
    console.error('Falha ao tentar criar o usuário administrador padrão:', error);
  }
}


async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');

    await sequelize.sync({ force: false });
    console.log('Modelos sincronizados com o banco de dados.');

    // 3. CHAMADA DA FUNÇÃO
    // Chamamos a função para criar o admin DEPOIS que as tabelas foram sincronizadas
    // e ANTES do servidor começar a ouvir requisições.
    await createDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Acesse a API base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Erro ao conectar ou sincronizar com o banco de dados:', error);
    process.exit(1);
  }
}

startServer();