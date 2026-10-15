// ============================================================
// CLAREIA - Configuração de API
// ------------------------------------------------------------
// Variáveis de ambiente (configurar no Vercel):
// - GROQ_API_KEY
// - GEMINI_API_KEY
// - MISTRAL_API_KEY
// - ACTIVE_API (groq, gemini ou mistral)
// ============================================================

function __clareiaEnv(name) {
    try {
        if (typeof process !== 'undefined' && process.env && process.env[name]) {
            return process.env[name];
        }
    } catch (e) { /* browser: process não existe, ignora */ }
    return '';
}

window.CLAREIA_CONFIG = {
    GROQ_API_KEY: __clareiaEnv('GROQ_API_KEY'),
    GEMINI_API_KEY: __clareiaEnv('GEMINI_API_KEY'),
    MISTRAL_API_KEY: __clareiaEnv('MISTRAL_API_KEY'),
    GROQ_MODEL: 'openai/gpt-oss-120b',
    GEMINI_MODEL: 'gemini-2.0-flash',
    MISTRAL_MODEL: 'mistral-large-latest',
    ACTIVE_API: __clareiaEnv('ACTIVE_API') || 'groq'
};
