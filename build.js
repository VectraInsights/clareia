// Build script - injeta variáveis de ambiente no config.js
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copia todos os ficheiros estáticos
const staticFiles = ['index.html', 'styles.css', 'app.js'];
staticFiles.forEach(file => {
    fs.copyFileSync(
        path.join(__dirname, file),
        path.join(distDir, file)
    );
});

// Gera config.js com as variáveis de ambiente
const configContent = `window.CLAREIA_CONFIG = {
    GROQ_API_KEY: '${process.env.CLAREIA_GROQ_KEY || ''}',
    GEMINI_API_KEY: '${process.env.CLAREIA_GEMINI_KEY || ''}',
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    GEMINI_MODEL: 'gemini-2.0-flash',
    ACTIVE_API: '${process.env.CLAREIA_ACTIVE_API || 'groq'}'
};
`;

fs.writeFileSync(path.join(distDir, 'config.js'), configContent);

console.log('Build completo! config.js gerado com variáveis de ambiente.');
