require('dotenv').config(); // Garante que as variáveis de ambiente sejam carregadas no início

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const allRoutes = require('./routes');
const { sequelize } = require('./models');
const { AppError, globalErrorHandler } = require('./utils/errorHandler'); // Importa o handler de erros

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logger de requisições HTTP

// Rotas
app.use('/api', allRoutes);

// Handler para rotas não encontradas (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Não foi possível encontrar ${req.originalUrl} neste servidor!`, 404));
});

// Middleware de tratamento de erros global (DEVE SER O ÚLTIMO MIDDLEWARE ADICIONADO)
app.use(globalErrorHandler);

// Conectar ao banco de dados e iniciar o servidor
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');

    // Sincroniza os modelos com o banco de dados.
    // **IMPORTANTE:** Para a primeira execução, ou se você fez alterações no modelo AdminUser,
    // pode ser necessário rodar com { force: true } uma vez para criar as tabelas.
    // Depois, volte para { force: false } ou use migrations em produção.
    await sequelize.sync({ force: false });
    console.log('Modelos sincronizados com o banco de dados.');

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Acesse a API base: http://localhost:${PORT}/api`);
      console.log(`Acesse rotas AdminUser: http://localhost:${PORT}/api/admin-users`);
    });
  } catch (error) {
    console.error('Erro ao conectar ou sincronizar com o banco de dados:', error);
    process.exit(1);
  }
}

startServer();