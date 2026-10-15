// ============================================================
// CLAREIA — Tutor IA Universitário
// Versão 3.0 — Integração com Groq, Gemini e Mistral
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
    // INTEGRAÇÃO COM APIs
    // ============================================================

    async callAPI(userMessage, systemPrompt) {
        const config = window.CLAREIA_CONFIG;
        const activeAPI = config.ACTIVE_API || 'groq';

        if (activeAPI === 'groq') {
            return this.callGroq(userMessage, systemPrompt, config);
        } else if (activeAPI === 'gemini') {
            return this.callGemini(userMessage, systemPrompt, config);
        } else if (activeAPI === 'mistral') {
            return this.callMistral(userMessage, systemPrompt, config);
        }

        return null;
    },

    async callGroq(userMessage, systemPrompt, config) {
        try {
            if (!config.GROQ_API_KEY) {
                throw new Error('GROQ_API_KEY não configurada');
            }
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
            if (!response.ok) {
                throw new Error(`Groq HTTP ${response.status}: ${data.error?.message || JSON.stringify(data).substring(0, 200)}`);
            }
            if (!data.choices || !data.choices[0]?.message?.content) {
                throw new Error('Groq retornou resposta vazia: ' + JSON.stringify(data).substring(0, 200));
            }
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Groq API Error:', error);
            this.state.lastApiError = error.message;
            return null;
        }
    },

    async callGemini(userMessage, systemPrompt, config) {
        try {
            if (!config.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY não configurada');
            }
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
            if (!response.ok) {
                throw new Error(`Gemini HTTP ${response.status}: ${data.error?.message || JSON.stringify(data).substring(0, 200)}`);
            }
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                throw new Error('Gemini retornou resposta vazia: ' + JSON.stringify(data).substring(0, 200));
            }
            return text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            this.state.lastApiError = error.message;
            return null;
        }
    },

    async callMistral(userMessage, systemPrompt, config) {
        try {
            if (!config.MISTRAL_API_KEY) {
                throw new Error('MISTRAL_API_KEY não configurada');
            }
            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.MISTRAL_API_KEY}`
                },
                body: JSON.stringify({
                    model: config.MISTRAL_MODEL,
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
            if (!response.ok) {
                throw new Error(`Mistral HTTP ${response.status}: ${data.message || JSON.stringify(data).substring(0, 200)}`);
            }
            if (!data.choices || !data.choices[0]?.message?.content) {
                throw new Error('Mistral retornou resposta vazia: ' + JSON.stringify(data).substring(0, 200));
            }
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Mistral API Error:', error);
            this.state.lastApiError = error.message;
            return null;
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
            simples: 'explicação com linguagem muito simples, como se explicasse para um amigo',
            exemplo: 'explicação com muitos exemplos concretos e aplicações práticas'
        };

        return `IDIOMA OBRIGATÓRIO: PORTUGUÊS DO BRASIL (PT-BR). REGRA #1 - A MAIS IMPORTANTE.
PROIBIDO: português de Portugal (PT-PT). Se você usar PT-PT, a resposta está ERRADA.
Palavras PROIBIDAS: teu, tua, teus, tuas, tens, gostarias, és, estás, podes, queres, fazes, dás, ficheiro, ficheiros, equipa, apontamentos, Compreendeste, praticares, deres.
Palavras OBRIGATÓRIAS: seu, sua, seus, suas, tem, gostaria, é, está, pode, quer, faz, dá, arquivo, arquivos, equipe, anotações, Compreendeu, praticar, você der.
EXEMPLOS CORRETOS: "Você pode fazer perguntas", "Seu ritmo", "Escreva sua pergunta", "Tente resolver", "Compreendeu?".

Você é o CLAREIA, um tutor universitário de inteligência artificial, gratuito e acessível.

MISSÃO: Ajudar estudantes universitários a compreender matérias difíceis, promovendo autonomia, confiança e inclusão educativa.

ESTILO DE RESPOSTA:
- Nível: ${levelDescriptions[this.state.level]}
- Modo: ${modeDescriptions[this.state.mode]}
- Usa formatação markdown (negrito, listas, etc.)
- Estrutura as respostas com parágrafos curtos e claros
- No final, sugere uma pergunta follow-up ou exercício
- Seja encorajador e motivador

REGRAS SOBRE MATERIAIS (OBRIGATÓRIAS):
- PROIBIDO inventar arquivos, PDFs, links, playlists, planilhas ou pastas para download. Você NÃO consegue enviar arquivos.
- PROIBIDO inventar nomes de arquivos (ex: apostila_conjuntos.pdf, exercicios.zip) ou links do YouTube.
- Se o estudante pedir material ou plano de estudo, ENTREGUE o conteúdo completo direto no chat: resumo da teoria, plano organizado e exercícios de fixação com gabarito comentado no final.
- Se citar um recurso externo, cite apenas recursos reais e conhecidos (ex: nome do livro e autor), sem inventar URL.

${this.state.context ? '\n--- CONTEXTO DAS ANOTAÇÕES DO ESTUDANTE ---\n' + this.state.context.substring(0, 2000) + '\n--- FIM DO CONTEXTO ---' : ''}`;
    },

    // ============================================================
    // GERAÇÃO DE RESPOSTAS
    // ============================================================

    // Correção automática de PT-PT para PT-BR
    correctToPTBR(text) {
        let corrected = text;

        // Substituições ordenadas por tamanho (maiores primeiro) para evitar corromper palavras
        const phraseCorrections = [
            // Frases completas (mais específicas primeiro)
            ['Para te ajudar melhor, podes:', 'Para ajudar melhor, você pode:'],
            ['Quanto mais detalhes deres', 'Quanto mais detalhes você der'],
            ['deres, mais personalizada', 'você der, mais personalizada'],
            ['Para te ajudar', 'Para ajudar'],
            ['para te ajudar', 'para ajudar'],
            ['Compreendeste?', 'Compreendeu?'],
            ['compreendeste', 'compreendeu'],
            ['praticares', 'praticar'],
            ['Nunca partilhes', 'Nunca compartilhe'],
            ['ajudar-te', 'ajudar você'],
            ['não és', 'não é'],
            ['não estás', 'não está'],
            ['já sabes', 'já sabe'],
            ['já tens', 'já tem'],
            ['se quiseres', 'se quiser'],
            ['se podes', 'se pode'],
            ['se fazes', 'se faz'],
            ['se dás', 'se dá'],
            ['gostarias', 'gostaria'],
            ['queres', 'quer'],
            ['fazes', 'faz'],
            ['dás', 'dá'],
            ['podes', 'pode'],
            ['Tenta', 'Tente'],
            ['tenta', 'tente'],
            ['sabes', 'sabe'],
            ['conheces', 'conhece'],
            ['tens', 'tem'],
            ['estás', 'está'],
            ['és', 'é'],
            ['teu', 'seu'],
            ['tua', 'sua'],
            ['teus', 'seus'],
            ['tuas', 'suas'],
            ['ficheiro', 'arquivo'],
            ['ficheiros', 'arquivos'],
            ['equipa', 'equipe'],
            ['apontamentos', 'anotações'],
            ['telemóvel', 'celular'],
            ['autocarro', 'ônibus'],
            ['contigo', 'com você'],
        ];

        // Ordena por tamanho (maiores primeiro) para evitar substituições parciais
        phraseCorrections.sort((a, b) => b[0].length - a[0].length);

        // Usa regex com lookahead/lookbehind para garantir que a palavra está isolada
        for (const [ptpt, ptbr] of phraseCorrections) {
            // Escapa caracteres especiais para regex
            const escaped = ptpt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Substitui apenas se a palavra estiver isolada (não seguida de letra ou número)
            const regex = new RegExp(`(?<![a-zA-Zà-ÿÀ-ÿ])${escaped}(?![a-zA-Zà-ÿÀ-ÿ])`, 'gi');
            corrected = corrected.replace(regex, ptbr);
        }

        return corrected;
    },

    async generateResponse(question) {
        const topic = this.detectTopic(question);
        if (topic) this.state.lastTopic = topic;

        const systemPrompt = this.buildSystemPrompt();
        this.state.lastApiError = null;
        let apiResponse = await this.callAPI(question, systemPrompt);

        if (apiResponse) {
            // Correção automática de PT-PT para PT-BR
            apiResponse = this.correctToPTBR(apiResponse);

            this.state.conversationHistory.push(
                { role: 'user', content: question },
                { role: 'assistant', content: apiResponse }
            );
            return apiResponse;
        }

        // A API falhou: mostra o erro real em vez de resposta genérica silenciosa.
        // Se o tópico existe na base local, usa a base local como apoio.
        const localTopic = topic && this.knowledgeBase[topic] ? this.getLocalResponse(question) : null;
        const apiName = (window.CLAREIA_CONFIG?.ACTIVE_API || 'groq').toUpperCase();
        const detail = this.state.lastApiError || 'sem detalhes';
        const localPart = localTopic ? `\n\n---\n📚 **Resposta da base local (modo offline):**\n\n${localTopic}` : '';
        return `⚠️ **Não consegui gerar uma resposta pela ${apiName} agora.**\n\n**Motivo:** ${detail}\n\n**Como resolver:**\n- Abra a página \`api-test.html\` no site e clique em "Testar" para ver o erro exato\n- Confira no Vercel se as variáveis \`GROQ_API_KEY\`, \`GEMINI_API_KEY\`, \`MISTRAL_API_KEY\` e \`ACTIVE_API\` estão configuradas\n- Confira se o modelo configurado ainda existe (a Groq desativa modelos antigos)${localPart}`;
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

        return `Boa pergunta! Para ajudar melhor, você pode:\n- **Especificar** a disciplina\n- **Dar mais contexto** sobre o que você já sabe\n- **Carregar anotações** na barra lateral\n\nQuanto mais detalhes você der, mais personalizada será a explicação! 😊`;
    },

    getFallbackResponse(question) {
        return this.getLocalResponse(question);
    },

    generateExercise() {
        const topic = this.state.lastTopic || Object.keys(this.exerciseBank)[Math.floor(Math.random() * Object.keys(this.exerciseBank).length)];
        const exercises = this.exerciseBank[topic];
        const exercise = exercises[Math.floor(Math.random() * exercises.length)];

        return `✏️ **Exercício — ${this.capitalize(topic)}**\n\n**Questão:** ${exercise.q}\n\n💭 Tente resolver sozinho primeiro! Quando quiser ver a resposta, diga "mostrar resposta".\n\n💡 **Dica:** ${this.getHint(topic)}`;
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
            'derivada': 'Lembre-se das regras: potência, produto, quociente e cadeia.',
            'fotossintese': 'Pense nos reagentes e produtos. A luz é necessária apenas em uma das fases.',
            'lei de ohm': 'Identifique o que a questão dá e o que ela pede. Use V = R × I.',
            'oferta e demanda': 'Faça um gráfico com as duas curvas. O ponto onde elas se cruzam é o equilíbrio.',
            'limite': 'Tente substituir primeiro. Se der 0/0, simplifique ou use L\'Hôpital.',
            'matriz': 'Verifique as dimensões antes de multiplicar. O determinante só existe para matrizes quadradas.',
            'integrais': 'Pense em qual função tem como derivada o integrando. Não esqueça o C!',
            'logistica': 'Pense no fluxo: como as coisas se movem do ponto A ao ponto B de forma eficiente.',
            'estatistica': 'Identifique primeiro o tipo de dados e depois escolha a medida apropriada.',
            'programacao': 'Divida o problema em passos pequenos e teste cada parte.',
            'economia': 'Pense nos incentivos: como as pessoas reagem a custos e benefícios?',
            'quimica': 'Conte os átomos de cada lado. A equação precisa estar balanceada.',
            'fisica': 'Identifique as forças envolvidas e aplique as leis de Newton.',
            'biologia': 'Pense na função: para que serve essa estrutura ou processo?',
            'filosofia': 'Questione os pressupostos. O que está sendo dado como garantido?'
        };
        return hints[topic] || 'Leia o enunciado com atenção e identifique os dados fornecidos.';
    },

    knowledgeBase: {
        'derivada': {
            simple: 'Uma derivada mede a **taxa de variação** de algo. Pense em um carro: o velocímetro mostra a velocidade instantânea — isso é a derivada da posição em relação ao tempo.',
            analogy: 'A derivada é como o velocímetro do seu carro. O velocímetro não diz onde está (isso é a função), mas sim a que velocidade está mudando de posição (isso é a derivada).',
            advanced: 'A derivada de uma função f(x) em um ponto x=a é definida como o limite: f\'(a) = lim(h→0) [f(a+h) - f(a)] / h. Geometricamente, representa a inclinação da reta tangente ao gráfico nesse ponto.',
            examples: ['Se f(x) = x², então f\'(x) = 2x. Em x=3, a taxa de variação é 6.', 'Se s(t) = 4t² + 2t (posição), então v(t) = s\'(t) = 8t + 2 (velocidade)']
        },
        'fotossintese': {
            simple: 'A fotossíntese é como uma **fábrica de comida** das plantas. Elas usam luz solar, água e ar (CO₂) e transformam em açúcar (alimento) e oxigênio.',
            analogy: 'Imagine a folha como uma cozinha. A luz solar é o fogão, a água é um ingrediente e o CO₂ do ar é outro ingrediente. O resultado é açúcar (a comida da planta) e oxigênio (que a gente respira!).',
            advanced: 'A fotossíntese ocorre em duas fases: (1) Fase clara (tilacoides): fotólise da água, produção de ATP e NADPH. (2) Ciclo de Calvin (estroma): fixação do CO₂ via RuBisCO, produção de G3P. Equação: 6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂.',
            examples: ['Uma árvore de porte médio pode produzir cerca de 100kg de oxigênio por ano.']
        },
        'lei de ohm': {
            simple: 'A Lei de Ohm diz que a **tensão** é igual à **corrente** multiplicada pela **resistência**: V = R × I.',
            analogy: 'Pense em um tubo de água: a tensão é a pressão da água, a corrente é a quantidade de água que passa, e a resistência é o estreitamento do tubo.',
            advanced: 'A Lei de Ohm V = R × I é válida para resistores ômicos. Em circuitos CA, generaliza-se como V = Z × I, onde Z é a impedância complexa. A potência dissipada é P = V × I = I² × R = V²/R.',
            examples: ['Se tem uma bateria de 9V e um resistor de 3Ω, a corrente é I = V/R = 9/3 = 3A.']
        },
        'oferta e demanda': {
            simple: 'Oferta é o que os vendedores querem vender. Demanda é o que os compradores querem comprar. O **preço** se ajusta até os dois lados se equilibrarem.',
            analogy: 'Imagine um leilão de bicicletas. Se há muitas bicicletas (muita oferta) e poucos compradores (pouca demanda), o preço cai.',
            advanced: 'A curva de oferta é crescente (preço maior → maior quantidade ofertada). A curva de demanda é decrescente (preço maior → menor quantidade demandada). O equilíbrio de mercado ocorre na interseção.',
            examples: ['Quando a Apple lança um novo iPhone, a demanda pelo modelo anterior cai → preço diminui.']
        },
        'limite': {
            simple: 'Um limite é o valor para o qual uma função **se aproxima** quando a variável se aproxima de um certo ponto.',
            analogy: 'Pense em um gato se aproximando de um rato. O gato nunca encosta no rato, mas chega cada vez mais perto. O limite é o ponto mínimo dessa aproximação.',
            advanced: 'Formalmente: lim(x→a) f(x) = L significa que para todo ε > 0, existe δ > 0 tal que 0 < |x - a| < δ implica |f(x) - L| < ε.',
            examples: ['lim(x→0) sin(x)/x = 1', 'lim(x→∞) (1 + 1/x)^x = e']
        },
        'matriz': {
            simple: 'Uma **matriz** é uma tabela de números organizada em linhas e colunas.',
            analogy: 'Pense em uma matriz como um tabuleiro de xadrez onde cada casa tem um número.',
            advanced: 'Uma matriz A ∈ M(m×n) é um arranjo retangular a_ij. Operações: soma, multiplicação, transposição, inversão.',
            examples: ['A matriz identidade I tem 1s na diagonal principal e 0s no resto.']
        },
        'integrais': {
            simple: 'Uma integral é como somar infinitas peças pequenas para encontrar o **total**.',
            analogy: 'Pense que você quer saber a área de um lago com formato irregular. Uma saída é dividir o lago em faixas bem finas, calcular a área de cada uma e somar tudo.',
            advanced: 'A integral definida ∫[a,b] f(x)dx é o limite de somas de Riemann. O Teorema Fundamental do Cálculo: se F\' = f, então ∫[a,b] f(x)dx = F(b) - F(a).',
            examples: ['∫ x^n dx = x^(n+1)/(n+1) + C (para n ≠ -1)']
        }
    },

    exerciseBank: {
        'derivada': [
            { q: 'Calcule a derivada de f(x) = 3x² + 2x - 5', a: 'f\'(x) = 6x + 2' },
            { q: 'Qual é a derivada de f(x) = sin(x)?', a: 'f\'(x) = cos(x)' },
            { q: 'Se f(x) = e^x, qual é f\'(x)?', a: 'f\'(x) = e^x' }
        ],
        'fotossintese': [
            { q: 'Escreva a equação geral da fotossíntese.', a: '6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂' },
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
            { q: 'Calcule lim(x→2) (x² - 4)/(x - 2)', a: 'Simplificando: (x²-4)/(x-2) = x+2, logo lim = 4' }
        ],
        'matriz': [
            { q: 'Calcule o determinante de A = [[2, 3], [1, 4]]', a: 'det(A) = 2×4 - 3×1 = 8 - 3 = 5' }
        ],
        'integrais': [
            { q: 'Calcule ∫(2x + 3) dx', a: 'x² + 3x + C' }
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
    let html = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/```(.+?)```/gs, '<pre>$1</pre>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
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
            addMessage(`✅ **Solução:**\n\n${lastExercise.a}\n\n🎯 Compreendeu? Se tiveres dúvidas, pergunta!`, 'ai');
        }
    } else {
        const response = await ClareiaTutor.generateResponse(question);
        addMessage(response, 'ai');
        const topic = ClareiaTutor.detectTopic(question);
        if (topic) ClareiaTutor.state.lastTopic = topic;
    }

    sendBtn.disabled = false;
}

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
    addMessage('Vou gerar um exercício para praticar!', 'user');
    showTyping();
    sendBtn.disabled = true;
    await new Promise(resolve => setTimeout(resolve, 800));
    removeTyping();
    const exercise = ClareiaTutor.generateExercise();
    addMessage(exercise, 'exercise');
    sendBtn.disabled = false;
});

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
            ClareiaTutor.state.context += '\n\n--- Anotações: ' + file.name + ' ---\n' + e.target.result.substring(0, 3000);
            addMessage(`📄 **Arquivo "${file.name}" carregado!** Já posso usar o conteúdo como contexto.`, 'ai');
        };
        reader.readAsText(file);
    } else {
        addMessage(`📄 **Arquivo "${file.name}" carregado!** Para agora, só consigo ler arquivos de texto (.txt, .md).`, 'ai');
    }
}

levelSelector.addEventListener('click', (e) => {
    if (e.target.classList.contains('level-btn')) {
        document.querySelectorAll('.level-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        ClareiaTutor.state.level = e.target.dataset.level;
        const levelNames = { iniciante: 'Iniciante', intermedio: 'Intermédio', avançado: 'Avançado' };
        addMessage(`🎯 **Nível alterado para: ${levelNames[e.target.dataset.level]}**`, 'ai');
    }
});

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ClareiaTutor.state.mode = btn.dataset.mode;
    });
});

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        const navLinks = document.querySelector('.nav-links');
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Modo tela cheia do tutor
const expandBtn = document.getElementById('expandBtn');
const tutorLayout = document.getElementById('tutorLayout');

function setTutorFullscreen(on) {
    if (!tutorLayout) return;
    tutorLayout.classList.toggle('tutor-fullscreen', on);
    document.body.classList.toggle('tutor-locked', on);
    if (expandBtn) {
        expandBtn.textContent = on ? '✕ Fechar' : '⛶ Tela cheia';
        expandBtn.title = on ? 'Sair da tela cheia' : 'Abrir o tutor em tela cheia';
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (expandBtn) {
    expandBtn.addEventListener('click', () => {
        setTutorFullscreen(!tutorLayout.classList.contains('tutor-fullscreen'));
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tutorLayout && tutorLayout.classList.contains('tutor-fullscreen')) {
        setTutorFullscreen(false);
    }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

console.log('💡 Clareia Tutor v3.0 ready!');
console.log('   APIs: Groq, Gemini, Mistral');
console.log('   API ativa:', window.CLAREIA_CONFIG?.ACTIVE_API || 'não configurada');