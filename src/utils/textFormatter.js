/**
 * Converte a primeira letra de uma string para maiúscula e o restante para minúscula.
 * Ex: "nome" -> "Nome", "NOME" -> "Nome"
 * @param {string} str
 * @returns {string}
 */
const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Converte uma string para o formato de "sentença" (primeira letra da primeira palavra maiúscula,
 * restante em minúscula, a menos que seja um nome próprio que o sistema não possa inferir).
 * Principalmente para evitar "TODO MAIÚSCULO".
 * Ex: "JOHN DOE" -> "John doe", "algum texto qualquer" -> "Algum texto qualquer"
 *
 * NOTA: Para nomes próprios, o ideal seria ter uma lista de exceções ou regras mais complexas.
 * Por simplicidade, esta função tentará padronizar para minúsculas após a primeira letra,
 * o que pode ser ajustado para "Title Case" se necessário (ex: "John Doe").
 * Para este requisito "Não aceitar textos COMPLETAMENTE em maiúscula",
 * a conversão para Sentence Case ou Title Case é a abordagem mais segura.
 * Vamos usar uma abordagem que tenta ser mais inteligente para múltiplos nomes.
 *
 * @param {string} str
 * @returns {string}
 */
const toStandardCase = (str) => {
  if (!str) return '';
  // Se a string já estiver em minúsculas ou misto, retorne como está (ignorando pontuações)
  if (/[a-z]/.test(str) && /[A-Z]/.test(str) === false) {
    return str;
  }
  // Se a string estiver toda em maiúsculas (ou majoritariamente), converta.
  // Tentativa de converter para Title Case para nomes e Sentence Case para outros textos.
  // Para simplificar e atender ao "não maiúsculas", vamos para title case
  return str.split(' ').map(word => {
    if (word.length === 0) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

/**
 * Valida e converte textos para garantir que não estejam completamente em maiúsculas.
 * Se a string for detectada como completamente em maiúsculas, será convertida.
 * Caso contrário, será retornada como está.
 * @param {string} text
 * @returns {string} Texto formatado.
 */
const enforceCase = (text) => {
  if (typeof text !== 'string') return text;

  // Verifica se a string é composta apenas por letras maiúsculas (ignorando espaços e caracteres especiais)
  const isAllUpperCase = text.length > 0 && text.toUpperCase() === text && text.toLowerCase() !== text;

  if (isAllUpperCase) {
    // Se for toda em maiúsculas, aplica a conversão para Title Case para nomes
    // e para Sentence Case para frases (se fosse um campo de observação, por exemplo).
    // Para campos como "nome", "cargo", "setor", "login", Title Case é mais adequado.
    return toStandardCase(text);
  }
  return text; // Retorna como está se não for toda maiúscula
};

module.exports = {
  capitalizeFirstLetter,
  toStandardCase,
  enforceCase,
};