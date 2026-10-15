// ============================================================
// CLAREIA — Configuração de API
// ------------------------------------------------------------
// INSTRUÇÕES:
// 1. Cria um ficheiro chamado "config.local.js" na mesma pasta
// 2. Cola as tuas chaves nesse ficheiro (ver exemplo abaixo)
// 3. O config.local.js está no .gitignore, nunca é publicado
//
// Exemplo de config.local.js:
// ------------------------------------------------------------
// window.CLAREIA_CONFIG_LOCAL = {
//     GROQ_API_KEY: 'gsk_...',
//     GEMINI_API_KEY: 'AIza...',
//     ACTIVE_API: 'groq'
// };
// ------------------------------------------------------------
// ============================================================

window.CLAREIA_CONFIG = {
    GROQ_API_KEY: '',
    GEMINI_API_KEY: '',
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    GEMINI_MODEL: 'gemini-2.0-flash',
    ACTIVE_API: 'groq'
};

// Se existir config.local.js, sobrescreve com as configurações locais
if (window.CLAREIA_CONFIG_LOCAL) {
    Object.assign(window.CLAREIA_CONFIG, window.CLAREIA_CONFIG_LOCAL);
}
