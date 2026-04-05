# Vector Scouter — Illuminated Intelligence

> Projeto desenvolvido para o processo seletivo **Inteli Academy 2026**
> Autor: Eduardo Santanna

---

## Entregáveis

### Workflow n8n (JSON)

Os arquivos JSON de todos os workflows estão na pasta `/workflows` deste repositório. Para importar no n8n:

1. Abre o n8n em `localhost:5678`
2. Clica em **"Import from file"** no menu principal
3. Seleciona cada arquivo `.json` da pasta `/workflows`
4. Configure as credenciais conforme a seção **"Como rodar"** abaixo

| Arquivo | Descrição |
|---|---|
| `workflow-1-coletor.json` | Coleta, análise e envio semanal |
| `workflow-2-buscar-relatorio.json` | API de busca do relatório |
| `workflow-3-recx.json` | RecX — recomendação única |
| `workflow-4-validx.json` | ValidX — validação conversacional |
| `workflow-5-recx-chat.json` | RecX — chat conversacional |
| `workflow-6-newsletter.json` | Newsletter + cancelamento |

---

### Vídeo de Apresentação — Workflows n8n

> 🎬 **[Assista aqui — Em breve]**

O vídeo de até 5 minutos demonstra o funcionamento completo dos workflows no n8n, cobrindo:

- Execução do **Workflow 1** — coleta de 7 fontes RSS, balanceamento, dois estágios de análise LLM e salvamento no Supabase
- Demonstração das **APIs** — Workflow 2 retornando o relatório, Workflow 5 (RecX Chat) e Workflow 4 (ValidX) respondendo via Webhook
- Fluxo completo da **Newsletter** — cadastro pelo front-end, envio via Gmail SMTP e cancelamento por link no email
- Visão geral da **arquitetura** — 6 workflows, Supabase, Groq e front-end integrados

---

### Vídeo de Demonstração — Plataforma completa

> 🎬 **[Assista aqui — Em breve]**

Demonstração completa da plataforma Vector Scouter em funcionamento, incluindo front-end, agentes conversacionais RecX e ValidX, Notebook e newsletter.

---

## Sobre o projeto

O **Vector Scouter** é um hub de inteligência artificial que coleta, analisa e distribui automaticamente as principais notícias do ecossistema de IA toda semana. O sistema combina automação com n8n, análise com LLM via Groq e uma interface moderna para explorar oportunidades de mercado em tempo real.

O projeto foi construído para responder a uma pergunta central: **como transformar o volume caótico de notícias de IA em inteligência acionável para quem quer criar negócios no setor?**

---

## Funcionalidades

### Pipeline de Inteligência
- Coleta automatizada de **7 fontes especializadas** em IA (TechCrunch, VentureBeat, MIT Technology Review, AI News, bdtechtalks, Hacker News e Google News)
- Balanceamento inteligente de fontes — máximo por domínio, prioridade para notícias recentes e filtragem de conteúdo irrelevante
- **Dois estágios de análise LLM** com Groq LLaMA 3.3 70B: primeiro extração de fatos concretos, depois análise profunda
- Relatório semanal estruturado com 7 notícias principais, 4 tendências emergentes e 4 oportunidades de mercado
- Analytics automático de temáticas e IAs citadas nas notícias

### Agentes Conversacionais
- **RecX Engine** — agente conversacional que explora oportunidades de negócio por área de mercado (saúde, educação, finanças, jurídico, agronegócio, varejo, logística, esportes)
- **ValidX Chat** — validador de ideias de negócio que cruza dados reais do mercado, tendências de IA e viabilidade técnica

### Newsletter
- Cadastro de email direto pelo front-end
- Envio imediato do relatório completo em HTML ao se cadastrar
- Envio automático semanal para todos os subscribers toda semana
- **Cancelamento de inscrição** via link no footer do email
- Template de email dark com layout profissional em HTML

### Notebook
- Salvamento de conversas do RecX e ValidX para revisitar depois
- Campo de anotação livre em cada entrada salva
- Visualização da conversa completa expandida

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                     VECTOR SCOUTER                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Workflow 1 — Coletor e Analisador                      │
│  Schedule: todo domingo às 8h                           │
│  7 RSS Feeds → Merge → Code Balanceamento →             │
│  Code Compactação → Groq Call 1 (Extração) →            │
│  Code Intermediário → Groq Call 2 (Análise) →           │
│  Code Final → Supabase → Busca Emails →                 │
│  Code Newsletter → Send Email (todos subscribers)       │
│                                                         │
│  Workflow 2 — API Buscar Relatório                      │
│  GET /buscar-relatorio → Supabase → Response            │
│                                                         │
│  Workflow 3 — API RecX Recomendação                     │
│  POST /recomendar → Supabase → Groq → Response          │
│                                                         │
│  Workflow 4 — API ValidX Chat                           │
│  POST /validx → Supabase → Groq → Response              │
│                                                         │
│  Workflow 5 — API RecX Chat                             │
│  POST /recx-chat → Supabase → Groq → Response           │
│                                                         │
│  Workflow 6 — API Newsletter + Cancelamento             │
│  POST /enviar-newsletter → Supabase → Send Email        │
│  GET  /cancelar-newsletter → Supabase (ativo=false)     │
│                                                         │
└─────────────────────────────────────────────────────────┘
           ↕                    ↕                ↕
      Supabase              Groq API         Gmail SMTP
   (PostgreSQL)         (LLaMA 3.3 70B)    (SMTP 465)
           ↕
      Frontend
   index.html / style.css / app.js
```

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| **n8n** | Orquestração de workflows e automação |
| **Groq** | Inferência LLM — modelo LLaMA 3.3 70B Versatile |
| **Supabase** | Banco de dados PostgreSQL (relatórios, subscribers) |
| **Gmail SMTP** | Envio de newsletter via senha de app |
| **HTML / CSS / JS** | Front-end da plataforma |

---

## Como rodar — Passo a passo completo

### Pré-requisitos

Antes de começar, você vai precisar de:

- **n8n** rodando localmente na porta `5678`. Se ainda não tem, instale via Docker:
  ```bash
  docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
  ```
- **Navegador moderno** (Chrome, Firefox ou Edge)
- **Conta Google** com acesso ao Gmail

---

### Passo 1 — Configurar o Supabase

O Supabase é o banco de dados do projeto. É gratuito e não requer instalação local.

1. Acessa [supabase.com](https://supabase.com) e cria uma conta gratuita
2. Clica em **"New project"**, dá um nome (ex: `vector-scouter`) e define uma senha para o banco
3. Aguarda o projeto ser criado (cerca de 1 minuto)
4. No menu lateral, clica em **"Project Settings" → "API Keys"**
5. selecionar a opção **"Legacy anon, service_role API keys"**
6. Anota dois valores — você vai precisar deles em todos os workflows:
   - **Project URL** — algo como `https://abcdefghijk.supabase.co` (Adendo que está localizado em **"General"** após clicar em **"Project Settings"**)
   - **anon public key** — string longa começando com `eyJ...` (Está localizado na última opção clicada, **"Legacy anon, service_role API keys"**)
7. Clica em **"SQL Editor"** no menu lateral e roda este SQL para criar as tabelas:

```sql
CREATE TABLE relatorios (
  id SERIAL PRIMARY KEY,
  resumo TEXT,
  tendencias TEXT,
  oportunidades TEXT,
  analytics JSONB,
  periodo TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversas (
  id SERIAL PRIMARY KEY,
  sessao_id TEXT,
  area_mercado TEXT,
  mensagem_usuario TEXT,
  resposta_agente TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);
```

---

### Passo 2 — Configurar o Groq

O Groq fornece o LLM que analisa as notícias. É gratuito.

1. Acessa [console.groq.com](https://console.groq.com) e cria uma conta
2. No menu superior a lateral , clica em **"API Keys"**
3. Clica em **"Create API Key"**, dá um nome (ex: `vector-scouter`)
> ⚠️ Guarde bem essa key que irá aparecer, ela só aparece uma vez
4. Copia e salva a key gerada — ela começa com `gsk_...`

---

### Passo 3 — Configurar o Gmail para envio de email

1. Acessa [myaccount.google.com](https://myaccount.google.com)
2. Clica em **"Segurança"** no menu lateral
3. Em **"Como você faz login no Google"**, ativa a **Verificação em duas etapas**
4. Depois de ativar, volta em **"Segurança"** e procura por **"Senhas de app"**
5. Seleciona **"Outro (nome personalizado)"**, digita `n8n` e clica em **"Gerar"**
> ⚠️ Essa senha não vai aparecer novamente após fechar a janela
6. Uma senha de **16 caracteres** será gerada — copie e guarde

---

### Passo 4 — Importar os workflows no n8n

1. Abre o n8n em `http://localhost:5678`
2. No menu lateral, clica em **"Workflows"**
3. Clica em **"Import from file"** (ícone de upload no canto superior direito)
4. Seleciona os arquivos JSON da pasta `/workflows` um por um
5. Repita para todos os 6 workflows

---

### Passo 5 — Configurar as credenciais nos workflows

Após importar, você precisa substituir as credenciais em cada workflow. Veja exatamente o que mudar:

---

#### 5.1 — Supabase (todos os workflows)

Em **todos os nodes "HTTP Request"** que se comunicam com o Supabase, você vai encontrar dois pontos que precisam ser atualizados:

**Na URL de cada node**, substitui a URL do projeto. Por exemplo, no Workflow 1 o node que salva o relatório tem esta URL:

```
# Encontra isso:
https://fsbdzxztnabrvfubowac.supabase.co/rest/v1/relatorios

# Troca pelo seu Project URL:
https://SEU_PROJECT_ID.supabase.co/rest/v1/relatorios
```

O mesmo vale para todas as outras URLs que aparecem nos workflows — todas começam com `https://fsbdzxztnabrvfubowac.supabase.co`. Substitui essa parte pelo seu próprio Project URL em todos os nodes HTTP Request de todos os workflows.

**No header `apikey`** de cada node HTTP Request, encontra o valor atual:

```
# Encontra o header apikey com o valor:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYmR6...

# Substitui pelo seu anon public key copiado do Supabase Settings → API
eyJ... (o seu próprio key)
```

> 💡 Para localizar todos esses nodes rapidamente: em cada workflow, procura os nodes com ícone de globo (HTTP Request). Todos que têm `supabase.co` na URL precisam ser atualizados com seus dados.

---

#### 5.2 — Groq (Workflows 1, 3, 4 e 5)

Em cada workflow que usa o Groq, clica no node **"Groq Chat Model"** (ícone roxo conectado abaixo do Basic LLM Chain):

1. Clica no campo **"Credential"**
2. Clica em **"Create new credential"**
3. No campo **"API Key"**, cola sua key do Groq que começa com `gsk_...`
4. Clica em **"Save"**
5. Confirma que o modelo está selecionado como `llama-3.3-70b-versatile`

No Workflow 1 existem **dois** nodes Groq Chat Model (um para cada estágio de análise) — configura a mesma credencial nos dois.

---

#### 5.3 — Gmail SMTP (Workflows 1 e 6)

Nos nodes **"Send Email"** presentes nos Workflows 1 e 6:

1. Clica no node **"Send Email"**
2. Em **"Credential"**, clica em **"Create new"** e seleciona **"SMTP"**
3. Preenche os campos exatamente assim:

```
User:     seu-email@gmail.com     ← seu email Gmail completo
Password: xxxx xxxx xxxx xxxx    ← a senha de 16 caracteres do Passo 3
Host:     smtp.gmail.com
Port:     465
SSL/TLS:  ativado (toggle ligado)
```

4. Clica em **"Save"**
5. No campo **"From Email"** do node Send Email, coloca: `seu-email@gmail.com`
6. Confirma que **"To Email"** está com a expressão correta:
   - No Workflow 6: `{{ $('CodeG').first().json.email }}`
   - No Workflow 1: `{{ $json.email }}`

> ⚠️ Se o nome do node Code no seu workflow for diferente de `CodeG`, ajusta a expressão para o nome correto que aparece no topo do node quando você clica nele.

---

#### 5.4 — Link de cancelamento no email (Workflows 1 e 6)

No template HTML do email, dentro dos nodes Code que montam o email, existe um link de cancelamento no footer:

```javascript
# Encontra esta linha no código do node Code:
<a href="http://localhost:5678/webhook/cancelar-newsletter?email=${email}">

# Se o seu n8n estiver em outra URL ou porta, substitui:
<a href="http://SUA_URL_N8N/webhook/cancelar-newsletter?email=${email}">
```

Se estiver rodando localmente na porta 5678, não precisa mudar nada.

---

#### 5.5 — Front-end (arquivo `frontend/app.js`)

Abre o arquivo `frontend/app.js` e localiza as primeiras linhas do arquivo:

```javascript
# Encontra este bloco no início do arquivo:
const N8N = 'http://localhost:5678';
const URL_RELATORIO  = `${N8N}/webhook/buscar-relatorio`;
const URL_RECX_CHAT  = `${N8N}/webhook/recx-chat`;
const URL_VALIDX     = `${N8N}/webhook/validx`;
const URL_NEWSLETTER = `${N8N}/webhook/enviar-newsletter`;
```

Se o seu n8n estiver rodando na porta `5678` localmente, não precisa mudar nada. Caso esteja em outra porta ou servidor, substitui apenas o valor de `N8N`:

```javascript
# Por exemplo, se estiver na porta 5679:
const N8N = 'http://localhost:5679';

# Ou se estiver em um servidor remoto:
const N8N = 'https://seu-servidor.com';
```

---

### Passo 6 — Publicar os workflows

Para que os webhooks funcionem e o front-end consiga se comunicar com o n8n, todos os workflows precisam estar **publicados**:

1. Abre cada workflow no n8n
2. Clica no botão **"Publish"** no canto superior direito
3. Confirma que o status mudou para **"Active"** (indicador verde)

> ⚠️ Workflows não publicados não respondem a chamadas externas. Se o front-end não carregar dados ou os agentes não responderem, verifique se todos os workflows estão com status Active.

---

### Passo 7 — Gerar o primeiro relatório

1. Abre o **Workflow 1** no n8n
2. Clica em **"Execute workflow"** para rodar manualmente pela primeira vez
3. Aguarda a execução completa (pode levar 1-2 minutos devido às chamadas ao Groq)
4. Abre o arquivo `frontend/index.html` diretamente no navegador
5. Clica em **"Sync archive"** para carregar o relatório gerado

A partir daí, o Workflow 1 vai rodar automaticamente **todo domingo às 8h** e enviar o relatório para todos os emails cadastrados no front-end.

---

## Fontes monitoradas

| Fonte | Foco |
|---|---|
| TechCrunch AI | Notícias gerais de IA e startups |
| VentureBeat AI | IA em negócios e investimentos |
| Hacker News | Comunidade tech e discussões técnicas |
| MIT Technology Review | Análises técnicas profundas |
| AI News | Notícias específicas do setor de IA |
| bdtechtalks | Pesquisa técnica e modelos de IA |
| Google News AI | Agregador amplo de notícias de IA |

---

## Estrutura do repositório

```
vector-scouter/
├── workflows/
│   ├── workflow-1-coletor.json
│   ├── workflow-2-buscar-relatorio.json
│   ├── workflow-3-recx.json
│   ├── workflow-4-validx.json
│   ├── workflow-5-recx-chat.json
│   └── workflow-6-newsletter.json
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── README.md
```