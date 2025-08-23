const nodemailer = require('nodemailer');
const { AppError } = require('./errorHandler');

// Configurações do transporter Nodemailer
// Em um ambiente real, você usaria credenciais de um serviço de e-mail (SendGrid, Mailgun, SMTP, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io', // Ex: 'smtp.sendgrid.net'
  port: process.env.EMAIL_PORT || 2525, // Ex: 587 (TLS) ou 465 (SSL)
  secure: process.env.EMAIL_SECURE === 'true', // Use true para 465, false para outros portas como 587
  auth: {
    user: process.env.EMAIL_USER || 'your_mailtrap_username', // Ex: 'apikey' para SendGrid
    pass: process.env.EMAIL_PASS || 'your_mailtrap_password', // Ex: sua chave API
  },
});

/**
 * Função para enviar e-mails.
 * @param {object} options - Opções do e-mail.
 * @param {string} options.to - Destinatário(s).
 * @param {string} options.subject - Assunto do e-mail.
 * @param {string} options.text - Corpo do e-mail em texto puro.
 * @param {string} [options.html] - Corpo do e-mail em HTML (opcional).
 */
const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'admin@example.com', // Remetente
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    // Descomente a linha abaixo para enviar e-mails reais
    // await transporter.sendMail(mailOptions);
    console.log(`Email mock enviado para ${options.to}:`);
    console.log(`Assunto: ${options.subject}`);
    console.log(`Conteúdo (texto): ${options.text}`);
    if (options.html) console.log(`Conteúdo (HTML): ${options.html}`);
    console.log('--- Fim do Email Mock ---');
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    // Em um ambiente real, você pode querer relançar o erro ou tratá-lo de forma diferente.
    throw new AppError('Houve um erro ao tentar enviar o e-mail. Tente novamente mais tarde.', 500);
  }
};

module.exports = { sendEmail };