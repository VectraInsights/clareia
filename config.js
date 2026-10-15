// ============================================================
// CLAREIA - Configuração de API
// ------------------------------------------------------------
// Variáveis de ambiente (configurar no Vercel):
// - GROQ_API_KEY
// - GEMINI_API_KEY
// - MISTRAL_API_KEY
// - ACTIVE_API (groq, gemini ou mistral)
// ============================================================

window.CLAREIA_CONFIG = {
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || '',
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    GEMINI_MODEL: 'gemini-2.0-flash',
    MISTRAL_MODEL: 'mistral-large-latest',
    ACTIVE_API: process.env.ACTIVE_API || 'groq'
};
