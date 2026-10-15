// ============================================================
// CLAREIA — Tutor IA Universitário
// Versão 2.0 — Integração com APIs reais (Groq + Gemini)
// ============================================================

const ClareiaTutor = {
    state: {
        level: 'intermedio',
        mode: 'normal',
        files: [],
        context: '',
        conversationHistory: [],
        lastTopic: null
    },

    // ============================================================
    // INTEGRAÇÃO COM API
    // ============================================================

    async callAPI(userMessage, systemPrompt) {
        const config = window.CLAREIA_CONFIG;

        if (config.ACTIVE_API === 'groq') {
            return this.callGroq(userMessage, systemPrompt, config);
        } else if (config.ACTIVE_API === 'gemini') {
            return this.callGemini(userMessage, systemPrompt, config);
        }

        return null;
    },

    async callGroq(userMessage, systemPrompt, config) {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: config.GROQ_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...this.state.conversationHistory.slice(-8),
                        { role: 'user', content: userMessage }
                    ],
                    temperature: 0.7,
                    max_tokens: 1500
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Groq API Error:', error);
            return this.getFallbackResponse(userMessage);
        }
    },

    async callGemini(userMessage, systemPrompt, config) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${config.GEMINI_MODEL}:generateContent?key=${config.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: 'user', content: systemPrompt + '\n\n' + userMessage }
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1500
                        }
                    })
                }
            );

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            return this.getFallbackResponse(userMessage);
        }
    },

    // ============================================================
    // PROMPT ENGINEERING
    // ============================================================

    buildSystemPrompt() {
        const levelDescriptions = {
            iniciante: 'explicações muito simples, linguagem acessível, passo a passo, sem pressupor conhecimento prévio',
            intermedio: 'explicações equilibradas, com algum rigor técnico mas acessíveis, usando analogias quando útil',
            avançado: 'explicações rigorosas, com formalismo matemático/teórico adequado, demonstrações e referências'
        };

        const modeDescriptions = {
            normal: 'explicação direta e estruturada',
            analogia: 'explicação com muitas analogias, metáforas e exemplos do dia-a-dia',
            simples: 'explicação com linguagem muito simples, como se explicasses a um amigo',
            exemplo: 'explicação com muitos exemplos concretos e aplicações práticas'
        };

        return `Você é o CLAREIA, um tutor universitário de inteligência artificial, gratuito e acessível.

MISSÃO: Ajudar estudantes universitários a compreender matérias difíceis, promovendo autonomia, confiança e inclusão educativa.

ESTILO DE RESPOSTA:
- Nível: ${levelDescriptions[this.state.level]}
- Modo: ${modeDescriptions[this.state.mode]}
- Responde SEMPRE em português de Portugal
- Usa formatação markdown (negrito, listas, etc.)
- Estrutura as respostas com parágrafos curtos e claros
- No final, sugere uma pergunta follow-up ou exercício
- Sê encorajador e motivador

${this.state.context ? '\n--- CONTEXTO DOS APONTAMENTOS DO ESTUDANTE ---\n' + this.state.context.substring(0, 2000) + '\n--- FIM DO CONTEXTO ---' : ''}`;
    },

    // ============================================================
    // GERAÇÃO DE RESPOSTAS
    // ============================================================

    async generateResponse(question) {
        // Detecta tópico para exercícios
        const topic = this.detectTopic(question);
        if (topic) this.state.lastTopic = topic;

        const systemPrompt = this.buildSystemPrompt();

        // Tenta API real
        const apiResponse = await this.callAPI(question, systemPrompt);

        if (apiResponse) {
            // Atualiza histórico
            this.state.conversationHistory.push(
                { role: 'user', content: question },
                { role: 'assistant', content: apiResponse }
            );
            return apiResponse;
        }

        // Fallback para resposta local
        return this.getLocalResponse(question);
    },

    getLocalResponse(question) {
        const topic = this.detectTopic(question);
        const level = this.state.level;
        const mode = this.state.mode;

        if (topic && this.knowledgeBase[topic]) {
            const knowledge = this.knowledgeBase[topic];
            let response = '';

            if (level === 'iniciante') {
                response = knowledge.simple;
            } else if (level === 'avançado') {
                response = knowledge.advanced;
            } else {
                response = knowledge.simple;
                if (mode === 'analogia' || mode === 'simples') {
                    response += '\n\n🎭 **Analogia:** ' + knowledge.analogy;
                }
            }

            if (mode === 'exemplo' || level !== 'iniciante') {
                if (knowledge.examples && knowledge.examples.length > 0) {
                    response += '\n\n📊 **Exemplos:**';
                    knowledge.examples.forEach(ex => {
                        response += `\n- ${ex}`;
                    });
                }
            }

            return response;
        }

        return `Boa pergunta! Para te ajudar melhor, podes:\n- **Especificar** a disciplina\n- **Dar mais contexto** sobre o que já sabes\n- **Carregar apontamentos** na barra lateral\n\nQuanto mais detalhes deres, mais personalizada será a explicação! 😊`;
    },

    getFallbackResponse(question) {
        return this.getLocalResponse(question);
    },

    generateExercise() {
        const topic = this.state.lastTopic || Object.keys(this.exerciseBank)[Math.floor(Math.random() * Object.keys(this.exerciseBank).length)];
        const exercises = this.exerciseBank[topic];
        const exercise = exercises[Math.floor(Math.random() * exercises.length)];

        return `✏️ **Exercício — ${this.capitalize(topic)}**\n\n**Questão:** ${exercise.q}\n\n💭 Tenta resolver sozinho primeiro! Quando quiseres ver a resposta, diz "mostrar resposta".\n\n💡 **Dica:** ${this.getHint(topic)}`;
    },

    // ============================================================
    // BASE DE CONHECIMENTO
    // ============================================================

    detectTopic(question) {
        const q = question.toLowerCase();
        const topicMap = {
            'derivada': ['derivada', 'derivar', 'diferencial', 'taxa de variação'],
            'fotossintese': ['fotossintese', 'fotossíntese', 'clorofila', 'planta'],
            'lei de ohm': ['ohm', 'corrente', 'resistencia', 'circuito', 'tensão', 'volt'],
            'oferta e demanda': ['oferta', 'demanda', 'mercado', 'preco', 'equilibrio'],
            'limite': ['limite', 'lim', 'converg'],
            'matriz': ['matriz', 'matrizes', 'determinante', 'inversa'],
            'integrais': ['integral', 'integrar', 'área', 'antiderivada'],
            'logistica': ['logística', 'logística', 'transporte', 'armazenamento', 'supply chain'],
            'estatistica': ['estatística', 'estatistica', 'média', 'desvio padrão', 'probabilidade', 'distribuição'],
            'programacao': ['programação', 'programacao', 'código', 'codigo', 'python', 'javascript', 'algoritmo'],
            'economia': ['economia', 'pib', 'inflação', 'inflacao', 'juros', 'moeda', 'crescimento'],
            'quimica': ['química', 'quimica', 'molécula', 'molecula', 'reação', 'reacao', 'átomo', 'atomo'],
            'fisica': ['física', 'fisica', 'newton', 'gravidade', 'energia', 'movimento', 'força', 'forca'],
            'biologia': ['biologia', 'biologia', 'célula', 'celula', 'dna', 'gene', 'evolução', 'evolucao'],
            'filosofia': ['filosofia', 'filosófico', 'filosofico', 'ética', 'etica', 'existência', 'existencia']
        };

        for (const [topic, keywords] of Object.entries(topicMap)) {
            if (keywords.some(kw => q.includes(kw))) return topic;
        }
        return null;
    },

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    getHint(topic) {
        const hints = {
            'derivada': 'Lembra-te das regras: potência, produto, quociente e cadeia.',
            'fotossintese': 'Pensa nos reagentes e produtos. A luz é necessária apenas numa das fases.',
            'lei de ohm': 'Identifica o que te dão e o que te pedem. V = R × I.',
            'oferta e demanda': 'Faz um gráfico com as duas curvas. O ponto onde se cruzam é o equilíbrio.',
            'limite': 'Tenta substituir primeiro. Se der 0/0, simplifica ou usa L\'Hôpital.',
            'matriz': 'Verifica as dimensões antes de multiplicar. O determinante só existe para matrizes quadradas.',
            'integrais': 'Pensa qual é a função cuja derivada te dá o integrando. Não esqueças C!',
            'logistica': 'Pensa no fluxo: como as coisas se movem do ponto A ao ponto B de forma eficiente.',
            'estatistica': 'Identifica primeiro o tipo de dados e depois escolhe a medida apropriada.',
            'programacao': 'Decompõe o problema em passos pequenos e testa cada parte.',
            'economia': 'Pensa nos incentivos: como as pessoas reagem a custos e benefícios?',
            'quimica': 'Conta os átomos de cada lado. A equação tem de estar equilibrada.',
            'fisica': 'Identifica as forças envolvidas e aplica as leis de Newton.',
            'biologia': 'Pensa na função: para que serve essa estrutura ou processo?',
            'filosofia': 'Questiona os pressupostos. O que está a ser dado como garantido?'
        };
        return hints[topic] || 'Lê o enunciado com atenção e identifica os dados fornecidos.';
    },

    // Fallback knowledge base (usado se API falhar)
    knowledgeBase: {
        'derivada': {
            simple: 'Uma derivada mede a **taxa de variação** de algo. Pensa num carro: o velocímetro mostra a velocidade instantânea — isso é a derivada da posição em relação ao tempo.',
            analogy: 'A derivada é como o velocímetro do teu carro. O velocímetro não diz onde estás (isso é a função), mas sim a que velocidade estás a mudar de posição (isso é a derivada).',
            advanced: 'A derivada de uma função f(x) em um ponto x=a é definida como o limite: f\'(a) = lim(h→0) [f(a+h) - f(a)] / h. Geometricamente, representa a inclinação da reta tangente ao gráfico nesse ponto.',
            examples: ['Se f(x) = x², então f\'(x) = 2x. Em x=3, a taxa de variação é 6.', 'Se s(t) = 4t² + 2t (posição), então v(t) = s\'(t) = 8t + 2 (velocidade)']
        },
        'fotossintese': {
            simple: 'A fotossíntese é como uma **fábrica de comida** das plantas. Elas pegam luz solar, água e ar (CO₂) e transformam em açúcar (alimento) e oxigénio.',
            analogy: 'Imagina a folha como uma cozinha. A luz solar é o fogão, a água é um ingrediente, o CO₂ do ar é outro ingrediente. O resultado é açúcar (a comida da planta) e oxigénio (que nós respiramos!).',
            advanced: 'A fotossíntese ocorre em duas fases: (1) Fase clara (tilacoides): fotólise da água, produção de ATP e NADPH. (2) Ciclo de Calvin (estroma): fixação do CO₂ via RuBisCO, produção de G3P. Equação: 6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂.',
            examples: ['Uma árvore de porte médio pode produzir cerca de 100kg de oxigénio por ano.']
        },
        'lei de ohm': {
            simple: 'A Lei de Ohm diz que a **tensão** é igual à **corrente** multiplicada pela **resistência**: V = R × I.',
            analogy: 'Pensa num tubo de água: a tensão é a pressão da água, a corrente é a quantidade de água que passa, e a resistência é o estreitamento do tubo.',
            advanced: 'A Lei de Ohm V = R × I é válida para resistores ômicos. Em circuitos CA, generaliza-se como V = Z × I, onde Z é a impedância complexa. A potência dissipada é P = V × I = I² × R = V²/R.',
            examples: ['Se tens uma bateria de 9V e um resistor de 3Ω, a corrente é I = V/R = 9/3 = 3A.']
        },
        'oferta e demanda': {
            simple: 'Oferta é o que os vendedores querem vender. Demanda é o que os compradores querem comprar. O **preço** encontra-se quando os dois se equilibram.',
            analogy: 'Imagina um leilão de bicicletas. Se há muitas bicicletas (muita oferta) e poucos compradores (pouca demanda), o preço desce.',
            advanced: 'A curva de oferta é crescente (preço maior → maior quantidade ofertada). A curva de demanda é decrescente (preço maior → menor quantidade demandada). O equilíbrio de mercado ocorre na interseção.',
            examples: ['Quando a Apple lança um novo iPhone, a demanda pelo modelo anterior cai → preço diminui.']
        },
        'limite': {
            simple: 'Um limite é o valor para o qual uma função **se aproxima** quando a variável se aproxima de um certo ponto.',
            analogy: 'Pensa num gato a aproximar-se de um rato. O gato nunca chega exatamente ao rato, mas aproxima-se infinitamente. O limite é a distância mínima a que o gato chega.',
            advanced: 'Formalmente: lim(x→a) f(x) = L significa que para todo ε > 0, existe δ > 0 tal que 0 < |x - a| < δ implica |f(x) - L| < ε.',
            examples: ['lim(x→0) sin(x)/x = 1', 'lim(x→∞) (1 + 1/x)^x = e']
        },
        'matriz': {
            simple: 'Uma **matriz** é uma tabela de números organizada em linhas e colunas.',
            analogy: 'Pensa numa matriz como um tabuleiro de xadrez onde cada casa tem um número.',
            advanced: 'Uma matriz A ∈ M(m×n) é um arranjo retangular a_ij. Operações: soma, multiplicação, transposição, inversão.',
            examples: ['A matriz identidade I tem 1s na diagonal principal e 0s no resto.']
        },
        'integrais': {
            simple: 'Uma integral é como somar infinitas peças pequenas para encontrar o **total**.',
            analogy: 'Pensa que queres saber a área de um lago irregular. Divides em faixas muito estreitas, calculas a área de cada uma e somas.',
            advanced: 'A integral definida ∫[a,b] f(x)dx é o limite de somas de Riemann. O Teorema Fundamental do Cálculo: se F\' = f, então ∫[a,b] f(x)dx = F(b) - F(a).',
            examples: ['∫ x^n dx = x^(n+1)/(n+1) + C (para n ≠ -1)']
        }
    },

    // Exercise bank
    exerciseBank: {
        'derivada': [
            { q: 'Calcula a derivada de f(x) = 3x² + 2x - 5', a: 'f\'(x) = 6x + 2' },
            { q: 'Qual é a derivada de f(x) = sin(x)?', a: 'f\'(x) = cos(x)' },
            { q: 'Se f(x) = e^x, qual é f\'(x)?', a: 'f\'(x) = e^x' }
        ],
        'fotossintese': [
            { q: 'Escreve a equação geral da fotossíntese.', a: '6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂' },
            { q: 'Em que organelo celular ocorre a fotossíntese?', a: 'Nos cloroplastos.' }
        ],
        'lei de ohm': [
            { q: 'Um circuito tem uma bateria de 12V e uma resistência de 4Ω. Qual a corrente?', a: 'I = V/R = 12/4 = 3A' },
            { q: 'Se um aparelho tem resistência de 50Ω e está ligado a 220V, qual a potência dissipada?', a: 'P = V²/R = 220²/50 = 968W' }
        ],
        'oferta e demanda': [
            { q: 'O que acontece com o preço de equilíbrio se a demanda aumentar?', a: 'O preço de equilíbrio sobe e a quantidade transacionada aumenta.' }
        ],
        'limite': [
            { q: 'Calcula lim(x→2) (x² - 4)/(x - 2)', a: 'Simplificando: (x²-4)/(x-2) = x+2, logo lim = 4' }
        ],
        'matriz': [
            { q: 'Calcula o determinante de A = [[2, 3], [1, 4]]', a: 'det(A) = 2×4 - 3×1 = 8 - 3 = 5' }
        ],
        'integrais': [
            { q: 'Calcula ∫(2x + 3) dx', a: 'x² + 3x + C' }
        ]
    }
};

// ============================================================
// UI CONTROLLER
// ============================================================

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const uploadZone = document.getElementById('uploadZone');
const levelSelector = document.getElementById('levelSelector');
const exerciseBtn = document.getElementById('exerciseBtn');

function addMessage(text, type = 'ai') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg msg-${type}`;
    
    // Simple markdown rendering
    let html = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/```(.+?)```/gs, '<pre>$1</pre>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        .replace(/\n/g, '<br>');
    
    msgDiv.innerHTML = html;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg msg-ai';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

async function handleSend() {
    const question = chatInput.value.trim();
    if (!question) return;

    addMessage(question, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';
    showTyping();
    sendBtn.disabled = true;

    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    removeTyping();

    if (question.toLowerCase().includes('mostrar resposta') || question.toLowerCase().includes('ver solução')) {
        const topic = ClareiaTutor.state.lastTopic || 'derivada';
        const exercises = ClareiaTutor.exerciseBank[topic];
        if (exercises) {
            const lastExercise = exercises[Math.floor(Math.random() * exercises.length)];
            addMessage(`✅ **Solução:**\n\n${lastExercise.a}\n\n🎯 Compreendeste? Se tiveres dúvidas, pergunta!`, 'ai');
        }
    } else {
        const response = await ClareiaTutor.generateResponse(question);
        addMessage(response, 'ai');

        const topic = ClareiaTutor.detectTopic(question);
        if (topic) ClareiaTutor.state.lastTopic = topic;
    }

    sendBtn.disabled = false;
}

// Event listeners
document.querySelectorAll('.quick-action').forEach(btn => {
    btn.addEventListener('click', () => {
        chatInput.value = btn.dataset.question;
        handleSend();
    });
});

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});

sendBtn.addEventListener('click', handleSend);

exerciseBtn.addEventListener('click', async () => {
    addMessage('Vou gerar um exercício para praticares!', 'user');
    showTyping();
    sendBtn.disabled = true;
    await new Promise(resolve => setTimeout(resolve, 800));
    removeTyping();
    const exercise = ClareiaTutor.generateExercise();
    addMessage(exercise, 'exercise');
    sendBtn.disabled = false;
});

// File upload
uploadZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--accent-primary)';
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = 'var(--border)';
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--border)';
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
    ClareiaTutor.state.files.push(file.name);
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <span class="file-icon">📄</span>
        <span class="file-name">${file.name}</span>
        <button class="file-remove" title="Remover">×</button>
    `;
    fileItem.querySelector('.file-remove').addEventListener('click', () => {
        fileItem.remove();
        ClareiaTutor.state.files = ClareiaTutor.state.files.filter(f => f !== file.name);
    });
    fileList.appendChild(fileItem);

    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            ClareiaTutor.state.context += '\n\n--- Apontamentos: ' + file.name + ' ---\n' + e.target.result.substring(0, 3000);
            addMessage(`📄 **Ficheiro "${file.name}" carregado!** Já posso usar o conteúdo como contexto.`, 'ai');
        };
        reader.readAsText(file);
    } else {
        addMessage(`📄 **Ficheiro "${file.name}" carregado!** Para agora, só consigo ler ficheiros de texto (.txt, .md).`, 'ai');
    }
}

// Level selector
levelSelector.addEventListener('click', (e) => {
    if (e.target.classList.contains('level-btn')) {
        document.querySelectorAll('.level-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        ClareiaTutor.state.level = e.target.dataset.level;
        const levelNames = { iniciante: 'Iniciante', intermedio: 'Intermédio', avançado: 'Avançado' };
        addMessage(`🎯 **Nível alterado para: ${levelNames[e.target.dataset.level]}**`, 'ai');
    }
});

// Mode buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ClareiaTutor.state.mode = btn.dataset.mode;
    });
});

// Mobile menu
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        const navLinks = document.querySelector('.nav-links');
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

console.log('💡 Clareia Tutor v2.0 ready!');
console.log('   API ativa:', window.CLAREIA_CONFIG?.ACTIVE_API || 'não configurada');