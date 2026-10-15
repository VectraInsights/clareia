// Build script - injeta variáveis de ambiente no config.js
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copia todos os arquivos estáticos
const staticFiles = ['index.html', 'styles.css', 'app.js', 'api-test.html'];
staticFiles.forEach(file => {
    fs.copyFileSync(
        path.join(__dirname, file),
        path.join(distDir, file)
    );
});

// Gera config.js com as variáveis de ambiente
const configContent = `window.CLAREIA_CONFIG = {
    GROQ_API_KEY: '${process.env.GROQ_API_KEY || ''}',
    GEMINI_API_KEY: '${process.env.GEMINI_API_KEY || ''}',
    MISTRAL_API_KEY: '${process.env.MISTRAL_API_KEY || ''}',
    GROQ_MODEL: 'openai/gpt-oss-120b',
    GEMINI_MODEL: 'gemini-2.0-flash',
    MISTRAL_MODEL: 'mistral-large-latest',
    ACTIVE_API: '${process.env.ACTIVE_API || 'groq'}'
};
`;

fs.writeFileSync(path.join(distDir, 'config.js'), configContent);

console.log('Build completo! config.js gerado com variáveis de ambiente. Versão PT-BR 3.1');
