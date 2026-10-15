# 💡 Clareia — Tutor Universitário com IA

> **Projeto de empreendedorismo social e educativo**
> Candidatura ao Santander X Explorer

---

## 🎯 Sobre o Projeto

O Clareia é um tutor universitário baseado em inteligência artificial que ajuda estudantes a compreender matérias difíceis através de explicações personalizadas, gratuitas e acessíveis.

### Problema
- Conteúdos universitários complexos
- Explicações particulares com custos elevados
- Recursos que não se adaptam ao ritmo de cada estudante

### Solução
- Tutor IA gratuito e acessível
- Explicações adaptadas ao nível de conhecimento
- Múltiplos modos de explicação (analogias, exemplos, linguagem simples)
- Upload de apontamentos para contexto personalizado
- Geração de exercícios práticos

### Impacto
- **ODS 4** — Educação de Qualidade
- **ODS 10** — Redução das Desigualdades

---

## 🚀 Como Executar

### Opção 1 — Simples (recomendado para teste)
Abre o ficheiro `index.html` no browser.

### Opção 2 — Servidor local
```bash
# Na pasta do projeto
npx serve .
# ou
python -m http.server 3000
```

---

## ⚙️ Configuração da API

1. Abre `config.js`
2. Cola as tuas chaves nos espaços indicados:
   - **Groq**: https://console.groq.com/keys
   - **Gemini**: https://aistudio.google.com/app/apikey
3. Escolhe a API ativa (`groq` ou `gemini`)

> ⚠️ **Nunca partilhes o ficheiro `config.js` publicamente!**

---

## 📁 Estrutura do Projeto

```
clareia/
├── index.html      # Interface completa
├── styles.css      # Design system
├── app.js          # Lógica do tutor + integração API
├── config.js       # Chaves de API (não partilhar!)
├── api-test.html   # Teste de ligação às APIs
├── api-test.js     # Script de teste
├── GEMINI_API.md   # Documentação integração Gemini
└── README.md       # Este ficheiro
```

---

## 🧪 Funcionalidades do Tutor

| Função | Descrição |
|--------|-----------|
| 💬 Chat IA | Conversas inteligentes via Groq ou Gemini |
| 🎯 3 Níveis | Iniciante, Intermédio, Avançado |
| 🔀 4 Modos | Normal, Analogias, Simples, Exemplos |
| 📎 Upload | Carrega apontamentos (.txt, .md) |
| ✏️ Exercícios | Geração automática de exercícios |
| 🌐 Responsivo | Funciona em desktop e mobile |

---

## 📊 Tópicos Suportados

Derivadas | Fotossíntese | Lei de Ohm | Oferta & Demanda | Limites | Matrizes | Integrais | Logística | Estatística | Programação | Economia | Química | Física | Biologia | Filosofia

> A integração com Groq/Gemini permite responder sobre **qualquer** tópico!

---

## 🛣️ Roadmap

### Fase 1 — MVP (Atual)
- [x] Interface web completa
- [x] Integração com Groq e Gemini
- [x] Sistema de níveis e modos
- [x] Upload de ficheiros
- [x] Gerador de exercícios

### Fase 2 — Melhorias
- [ ] Mais tópicos na base de conhecimento
- [ ] Sistema de avaliação de exercícios
- [ ] Histórico de conversas persistente
- [ ] Exportar conversas para PDF

### Fase 3 — Deploy
- [ ] Deploy na Cloudflare
- [ ] Domínio personalizado
- [ ] Sistema de feedback

---

## 🔗 Links

- **Santander X Explorer**: https://explorerbyx.org/lk/d6hh4hfn
- **Groq Console**: https://console.groq.com/
- **Google AI Studio**: https://aistudio.google.com/

---

## 📝 Licença

© 2026 Clareia — Todos os direitos reservados.

---

*"A tecnologia é o meio; a aprendizagem e a inclusão são o propósito."*