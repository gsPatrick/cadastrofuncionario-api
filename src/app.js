// src/app.js

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser'); // Importar bodyParser (pode ser necessário para outros usos, mesmo que express.json seja usado)
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

// ======================================================================
// CORREÇÃO: Middleware condicional para parsing do corpo da requisição
// Garante que apenas o parser correto seja aplicado com base no Content-Type.
// É CRÍTICO que este middleware venha ANTES de qualquer outro `app.use(express.json())` global.
// ======================================================================
app.use((req, res, next) => {
  const contentType = req.get('Content-Type') || '';
  console.log(`[DEBUG] app.js - Content-Type recebido: "${contentType}"`); // Log para depuração

  // Se for uma requisição de upload de arquivo (multipart/form-data),
  // o Multer (em uploadMiddleware) irá lidar com o parsing do corpo.
  // Ignoramos os parsers de JSON e URL-encoded para esta requisição.
  if (contentType.startsWith('multipart/form-data')) {
    console.log('[DEBUG] app.js - Tipo de conteúdo "multipart/form-data" detectado. Pulando parsers de JSON/URL-encoded.');
    return next(); // Passa o controle para o próximo middleware (Multer/uploadMiddleware)
  }

  // Para requisições application/json, usa o parser de JSON.
  if (contentType.startsWith('application/json')) {
    console.log('[DEBUG] app.js - Tipo de conteúdo "application/json" detectado. Aplicando parser JSON.');
    return express.json({ limit: '1gb' })(req, res, next);
  }

  // Para requisições application/x-www-form-urlencoded, usa o parser de URL-encoded.
  if (contentType.startsWith('application/x-www-form-urlencoded')) {
    console.log('[DEBUG] app.js - Tipo de conteúdo "application/x-www-form-urlencoded" detectado. Aplicando parser URL-encoded.');
    return express.urlencoded({ limit: '1gb', extended: true })(req, res, next);
  }

  // Para outros tipos de conteúdo ou sem Content-Type, prossegue sem aplicar um parser específico.
  console.log('[DEBUG] app.js - Nenhum parser de corpo específico aplicado para este Content-Type. Prosseguindo.');
  next();
});

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
app.use(morgan('dev'));

// Torna a pasta 'uploads' publicamente acessível através da rota '/uploads'
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

    // Para produção, use { alter: true } ou migrations.
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