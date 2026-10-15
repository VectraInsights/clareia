# 📘 Integração com Google Gemini API

## Visão Geral

O Clareia utiliza a **Google Gemini API** (via Google AI Studio) para gerar respostas educativas personalizadas. A Gemini é um modelo de linguagem avançado da Google que compreende texto, código e muito mais.

---

## 🔑 Obter Chave de API

1. Acede a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Cria um projeto (ou usa um existente)
3. Clica em **"Create API Key"**
4. Copia a chave (começa com `AIza...`)

---

## ⚙️ Configuração

### 1. Preencher `config.js`

Abre `clareia/config.js` e cola a tua chave:

```javascript
window.CLAREIA_CONFIG = {
    GEMINI_API_KEY: 'AIzaSy...',  // <-- Tua chave aqui
    GEMINI_MODEL: 'gemini-2.0-flash',
    ACTIVE_API: 'gemini'  // Muda para 'gemini' para usar Gemini
};
```

### 2. Mudar API ativa

No `config.js`, altera:
```javascript
ACTIVE_API: 'gemini'  // ou 'groq'
```

---

## 💻 Como Funciona

### Fluxo de Comunicação

```
┌─────────────────────────────────────────────────────────────────────┐
│                          UTILIZADOR                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. Pergunta: "O que é uma derivada?"                        │   │
│  └──────────────────────┬──────────────────────────────────────┘   │
│                         │ JavaScript (app.js)                        │
│                         ▼                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 2. buildSystemPrompt()                                      │   │
│  │    - Nível: Intermédio                                       │   │
│  │    - Modo: Normal                                            │   │
│  │    - Contexto dos apontamentos                               │   │
│  │    + Pergunta do utilizador                                  │   │
│  └──────────────────────┬──────────────────────────────────────┘   │
│                         │ HTTP POST                                  │
│                         ▼                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 3. Gemini API (Google)                                      │   │
│  │    URL: generativelanguage.googleapis.com/v1beta/...        │   │
│  │    Modelo: gemini-2.0-flash                                 │   │
│  │    Gera resposta educativa personalizada                     │   │
│  └──────────────────────┬──────────────────────────────────────┘   │
│                         │ Resposta JSON                              │
│                         ▼                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 4. UI atualiza com a resposta                               │   │
│  │    - Formatação markdown                                     │   │
│  │    - Indicador de typing removido                           │   │
│  │    - Historial atualizado                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📡 Endpoint da API

```
POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}
```

### Parâmetros

| Parâmetro | Valor |
|-----------|-------|
| `MODEL` | `gemini-2.0-flash` |
| `API_KEY` | Tua chave do Google AI Studio |

### Corpo do Pedido

```json
{
    "contents": [
        {
            "role": "user",
            "content": "Explica o que é uma derivada em matemática..."
        }
    ],
    "generationConfig": {
        "temperature": 0.7,
        "maxOutputTokens": 1500
    }
}
```

### Resposta

```json
{
    "candidates": [
        {
            "content": {
                "parts": [
                    {
                        "text": "Uma derivada é uma forma matemática de medir..."
                    }
                ]
            }
        }
    ]
}
```

---

## 🧪 Testar a API

Acede a `api-test.html` no browser:
```
http://localhost:3000/api-test.html
```

Ou testa diretamente na linha de comandos:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSy..." \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"role":"user","content":"O que é uma derivada?"}]}'
```

---

## 📊 Limites da API Gratuita

| Métrica | Limite |
|---------|--------|
| Requests por minuto | 60 |
| Tokens por minuto | 32,000 |
| Requests por dia | 1,500 |

> Os limites podem variar. Consulta a [documentação oficial](https://ai.google.dev/gemini-api/docs/rate-limits) para informações atualizadas.

---

## 🔧 Resolução de Problemas

### Erro 400: API key not valid
- Verifica se a chave está correta
- Confirma se o projeto no AI Studio está ativo
- Verifica se a API "Generative Language API" está ativada no Google Cloud

### Erro 429: Rate limit
- Espera alguns segundos
- Reduz o número de pedidos
- Considera usar a Groq como alternativa (limites mais generosos)

### Erro 500: Internal server error
- Erro temporário da Google
- Tenta novamente após alguns segundos

### Resposta vazia
- Verifica o sistema de filtros de segurança da Gemini
- Reformula a pergunta

---

## 🔗 Referências

- [Documentação Gemini API](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Modelos disponíveis](https://ai.google.dev/gemini-api/docs/models)

---

## 📝 Notas de Segurança

⚠️ **IMPORTANTE:**

1. **Nunca partilhes a tua chave publicamente**
2. **Nunca faças commit do `config.js` para repositórios públicos**
3. Em produção, usa um **backend proxy** para esconder a chave
4. Para o Clareia (projeto educativo), a chave no browser é aceitável

---

*Documentação criada para o projeto Clareia — Santander X Explorer*