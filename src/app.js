// src/app.js

require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const allRoutes = require('./routes'); // Seu arquivo principal de rotas
const { sequelize } = require('./models');
const { AppError, globalErrorHandler } = require('./utils/errorHandler');
const { AdminUser } = require('./models');
const { hashPassword } = require('./utils/auth');

const PORT = process.env.PORT || 3000;

// Middlewares
const app = express();

app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Middleware para logs de requisição no console (modo 'dev')
app.use(morgan('dev'));

// Middleware para servir arquivos estáticos da pasta 'uploads'
// Isso permite que o frontend acesse os arquivos enviados através de uma URL
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ======================================================================
// CORREÇÃO CRÍTICA:
// Os middlewares express.json() e express.urlencoded() foram REMOVIDOS daqui.
// Eles devem ser aplicados no seu arquivo de rotas principal (ex: src/routes/index.js)
// APÓS a definição das rotas que usam multer para upload de arquivos, ou no início
// do arquivo de rotas, permitindo que o multer processe a requisição primeiro.
// Esta mudança impede que o express.json() tente interpretar um upload de arquivo
// como JSON, o que causa o erro "SyntaxError: Unexpected token '-'".
// ======================================================================

// Garante que o diretório de uploads exista
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Rotas da API
// O 'allRoutes' agora é responsável por aplicar o express.json() se necessário
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

    // Para desenvolvimento, { force: true } pode ser útil.
    // Para produção, use { alter: true } ou, idealmente, migrations.
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