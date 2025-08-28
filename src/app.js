// src/app.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');

const allRoutes = require('./routes');
const db = require('./models');

const app = express();
const PORT = process.env.APP_PORT || 3000;

const corsOptions = {
  origin: '*', 
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 

// ======================================================================
// CORREÇÃO: Aumentando o limite do corpo da requisição
// Adicione as opções { limit: '50mb' } aqui.
// ======================================================================
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ limit: '1gb', extended: true }));

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Suas rotas
app.use('/api', allRoutes);

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Conexão com o banco de dados PostgreSQL estabelecida com sucesso.');
    
    // ATENÇÃO: Em produção, considere usar `sync({ force: false, alter: true })` ou migrações.
    await db.sequelize.sync({force: true}); 
    console.log('Todos os modelos foram sincronizados com sucesso.');

    // SEEDING DO USUÁRIO ADMIN
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@empresa.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const adminExists = await db.User.findOne({ where: { email: adminEmail } });
    
    if (!adminExists) {
        await db.User.create({
            nome: 'Administrador Padrão',
            email: adminEmail,
            password: adminPassword,
            role: 'admin'
        });
        console.log(`>>> Usuário admin padrão criado:`);
        console.log(`>>> Nome: Administrador Padrão`);
        console.log(`>>> E-mail: ${adminEmail}`);
        console.log(`>>> Senha: ${adminPassword}`);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🔗 Acesso local: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Não foi possível conectar ao banco de dados ou iniciar o servidor:', error);
    process.exit(1);
  }
};

startServer();