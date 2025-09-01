// src/app.js

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const allRoutes = require('./routes');
const { sequelize } = require('./models');
const { AppError, globalErrorHandler } = require('./utils/errorHandler');
const { AdminUser } = require('./models');
const { hashPassword } = require('./utils/auth');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

// Middlewares
const app = express();

app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use((req, res, next) => {
  const contentType = req.get('Content-Type') || '';
  if (contentType.startsWith('multipart/form-data')) {
    return next();
  }
  if (contentType.startsWith('application/json')) {
    return express.json({ limit: '1gb' })(req, res, next);
  }
  if (contentType.startsWith('application/x-www-form-urlencoded')) {
    return express.urlencoded({ limit: '1gb', extended: true })(req, res, next);
  }
  next();
});

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
app.use('/api', allRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Não foi possível encontrar ${req.originalUrl} neste servidor!`, 404));
});

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
        // ==========================================================
        // CORREÇÃO APLICADA AQUI
        // O perfil de super administrador agora é 'admin'. O perfil 'rh'
        // é para usuários com permissões granulares.
        // ==========================================================
        role: 'admin',
        permissions: null // Admins não possuem permissões granulares, o acesso é total.
      });
      console.log('Usuário administrador padrão criado com sucesso:', newAdmin.toJSON());
    } else {
      console.log('Usuário administrador padrão já existe.');
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

    await sequelize.sync({ force: true }); 
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