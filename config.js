// ============================================================
// CLAREIA - Configuração de API
// ------------------------------------------------------------
// Chaves lidas de variáveis de ambiente em tempo de build.
// Configure no Cloudflare Pages: Settings > Environment variables.
// ============================================================

window.CLAREIA_CONFIG = {
    GROQ_API_KEY: process.env.CLAREIA_GROQ_KEY || '',
    GEMINI_API_KEY: process.env.CLAREIA_GEMINI_KEY || '',
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    GEMINI_MODEL: 'gemini-2.0-flash',
    ACTIVE_API: process.env.CLAREIA_ACTIVE_API || 'groq'
};
