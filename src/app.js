// src/app.js

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const allRoutes = require('./routes'); // Esta linha carrega o index.js das rotas
const { sequelize } = require('./models');
const { AppError, globalErrorHandler } = require('./utils/errorHandler');
const { AdminUser } = require('./models');
const { hashPassword } = require('./utils/auth');

const PORT = process.env.PORT || 3000;

// Middlewares
const app = express();

app.use(cors({
  origin: '*', // permite qualquer origem
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rotas
app.use('/api', allRoutes);

// Handler para rotas não encontradas (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Não foi possível encontrar ${req.originalUrl} neste servidor!`, 404));
});

// Middleware de tratamento de erros global
app.use(globalErrorHandler);

// Função para criar o admin padrão
async function createDefaultAdmin() {
  try {
    const adminExists = await AdminUser.findOne({ where: { email: 'admin@admin.com' } });
    if (!adminExists) {
      console.log('Usuário administrador padrão não encontrado. Criando...');
      const hashedPassword = await hashPassword('admin123');
      const newAdmin = await AdminUser.create({
        login: 'admin',
        password: hashedPassword,
        name: 'Administrador Padrão',
        email: 'admin@admin.com',
        isActive: true,
      });
      console.log('Usuário administrador padrão criado com sucesso:', newAdmin.toJSON());
    } else {
      console.log('Usuário administrador padrão já existe:', adminExists.toJSON());
    }
  } catch (error) {
    console.error('Falha ao tentar criar o usuário administrador padrão:', error);
  }
}


// Conectar ao banco de dados e iniciar o servidor
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');

    await sequelize.sync({ force: false });
    console.log('Modelos sincronizados com o banco de dados.');

    await createDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao conectar ou sincronizar com o banco de dados:', error);
    process.exit(1);
  }
}

startServer();