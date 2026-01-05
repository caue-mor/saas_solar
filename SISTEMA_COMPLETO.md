# SISTEMA SOLAR COMPLETO - Documentacao

## Visao Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITETURA DO SISTEMA                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐        ┌──────────────────────┐                  │
│  │   SAAS-SOLAR         │        │   SOLAR-AGENT-LG     │                  │
│  │   (Frontend)         │        │   (Backend IA)       │                  │
│  │                      │        │                      │                  │
│  │   Next.js + React    │        │   FastAPI + Python   │                  │
│  │   TypeScript         │        │   LangGraph          │                  │
│  │                      │        │   LangChain          │                  │
│  └──────────┬───────────┘        └──────────┬───────────┘                  │
│             │                               │                              │
│             │ Supabase Client               │ asyncpg (PostgreSQL)         │
│             │                               │                              │
│             ▼                               ▼                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         SUPABASE (PostgreSQL)                        │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                      │  │
│  │  ┌─────────────────────┐    ┌─────────────────────────┐              │  │
│  │  │ acessos_fotovoltaico│    │ contatos_fotovoltaico   │              │  │
│  │  │ (Empresas)          │    │ (Leads)                 │              │  │
│  │  └─────────────────────┘    └─────────────────────────┘              │  │
│  │                                                                      │  │
│  │  ┌─────────────────────┐    ┌─────────────────────────┐              │  │
│  │  │ status_leads_       │    │ sistemas_fotovoltaicos  │              │  │
│  │  │ fotovoltaico        │    │ (Catalogo)              │              │  │
│  │  │ (Kanban)            │    └─────────────────────────┘              │  │
│  │  └─────────────────────┘                                             │  │
│  │                                                                      │  │
│  │  ┌─────────────────────┐    ┌─────────────────────────┐              │  │
│  │  │ conversas_          │    │ mensagens_fotovoltaico  │              │  │
│  │  │ fotovoltaico        │    │ (Chat History)          │              │  │
│  │  │ (Threads)           │    └─────────────────────────┘              │  │
│  │  └─────────────────────┘                                             │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                       ┌───────────────────────┐                            │
│                       │       REDIS           │                            │
│                       │  (Buffer/Debounce)    │                            │
│                       └───────────────────────┘                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tabelas do Banco de Dados

### 1. acessos_fotovoltaico (Empresas)

Armazena dados das empresas que usam o sistema.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | SERIAL | ID unico |
| empresa | VARCHAR(255) | Nome da empresa |
| email | VARCHAR(255) | Email de acesso |
| senha | VARCHAR(255) | Senha (hash) |
| nome_atendente | VARCHAR(255) | Nome do atendente IA |
| nome_empresa | VARCHAR(255) | Nome comercial |
| cidade | VARCHAR(100) | Cidade |
| token_whatsapp | TEXT | Token da UAZAPI |
| uazapi_instancia | VARCHAR(255) | Instancia UAZAPI |
| modelo_ia | VARCHAR(50) | Modelo OpenAI |
| status_plano | VARCHAR(20) | ativo/inativo/pendente |
| followup_ativo | BOOLEAN | Follow-up habilitado |

### 2. contatos_fotovoltaico (Leads)

Armazena os leads/contatos de cada empresa.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | SERIAL | ID unico |
| id_empresa | INTEGER | FK para empresa |
| nome | VARCHAR(255) | Nome do lead |
| celular | VARCHAR(20) | Celular original |
| celular_formatado | VARCHAR(20) | Formato 55DDDNNNNNNNNN |
| status_lead_id | INTEGER | FK para status Kanban |
| atendimento_automatico | BOOLEAN | IA ativa? |
| etapa_atual | INTEGER | Etapa de qualificacao (1-8) |
| dados_coletados | JSONB | Dados de qualificacao |
| origem | VARCHAR(50) | Origem do lead |
| follow_stage | INTEGER | Estagio do follow-up |

### 3. status_leads_fotovoltaico (Kanban)

Status para o quadro Kanban.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | SERIAL | ID unico |
| nome | VARCHAR(100) | Nome do status |
| cor | VARCHAR(20) | Cor hex |
| ordem | INTEGER | Ordem no Kanban |
| ativo | BOOLEAN | Status ativo? |

**Status padrao inseridos:**
1. Novo Lead (#3B82F6)
2. Contato Feito (#10B981)
3. Qualificado (#8B5CF6)
4. Proposta Enviada (#F59E0B)
5. Negociacao (#EF4444)
6. Fechado (#059669)
7. Perdido (#6B7280)

### 4. conversas_fotovoltaico (Threads)

Threads de conversa do agente IA.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | SERIAL | ID unico |
| empresa_id | INTEGER | FK para empresa |
| contato_id | INTEGER | FK para lead |
| thread_id | VARCHAR(255) | ID unico: company_id:phone |
| status | VARCHAR(50) | ativa/encerrada |
| ultimo_contato | TIMESTAMPTZ | Ultima interacao |

### 5. mensagens_fotovoltaico (Historico)

Mensagens das conversas.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | SERIAL | ID unico |
| conversa_id | INTEGER | FK para conversa |
| role | VARCHAR(20) | user/assistant/system |
| content | TEXT | Conteudo da mensagem |
| tool_calls | JSONB | Ferramentas executadas |

---

## Fluxo de Dados

### Fluxo 1: Recebimento de Mensagem WhatsApp

```
┌────────────────┐     ┌─────────────────┐     ┌───────────────────┐
│   WhatsApp     │────▶│     UAZAPI      │────▶│ Webhook Endpoint  │
│   (Cliente)    │     │   (Gateway)     │     │ /webhook/{id}     │
└────────────────┘     └─────────────────┘     └─────────┬─────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────────┐
                                               │   Parse Payload     │
                                               │   Validar Empresa   │
                                               │   Buscar/Criar Lead │
                                               └─────────┬───────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────────┐
                                               │   Buffer Service    │
                                               │   (Redis)           │
                                               │   Debounce 7s       │
                                               └─────────┬───────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────────┐
                                               │   Invoke Agent      │
                                               │   (LangGraph)       │
                                               └─────────┬───────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────────┐
                                               │   Send Response     │
                                               │   via UAZAPI        │
                                               └─────────────────────┘
```

### Fluxo 2: Agente LangGraph

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           AGENTE LANGGRAPH                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   1. PROMPT BUILDER                                                        │
│      - Carrega config da empresa                                           │
│      - Monta system prompt dinamico                                        │
│      - Injeta contexto do lead                                            │
│                                                                            │
│   2. CREATE_REACT_AGENT                                                    │
│      - Modelo: GPT-4o-mini                                                 │
│      - Pattern: ReAct (Reasoning + Acting)                                 │
│      - Checkpointer: PostgreSQL                                           │
│                                                                            │
│   3. TOOLS DISPONIVEIS                                                     │
│      - update_qualification: Atualiza dados do lead                       │
│      - schedule_visit: Agenda visita tecnica                              │
│      - notify_seller: Notifica vendedor humano                            │
│      - deactivate_ai: Desativa atendimento automatico                     │
│      - send_follow_up: Envia follow-up                                    │
│                                                                            │
│   4. CHECKPOINTING                                                         │
│      - Salva estado da conversa                                           │
│      - Permite retomar de onde parou                                      │
│      - Thread ID: {company_id}:{phone}                                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend (SAAS-SOLAR)

### Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── contatos/
│   │       ├── kanban/
│   │       ├── sistemas/
│   │       ├── whatsapp/
│   │       ├── empresa/
│   │       ├── ia-config/
│   │       └── assinatura/
│   └── api/
├── components/
├── contexts/
├── services/
│   ├── auth.ts
│   ├── contatos.ts
│   ├── empresa.ts
│   ├── sistemas.ts
│   └── status-leads.ts
└── types/
    └── database.ts
```

### Paginas Principais

| Pagina | Rota | Descricao |
|--------|------|-----------|
| Login | /login | Autenticacao |
| Dashboard | /dashboard | Visao geral |
| Contatos | /dashboard/contatos | Lista de leads |
| Kanban | /dashboard/kanban | Pipeline visual |
| WhatsApp | /dashboard/whatsapp | Config UAZAPI |
| Empresa | /dashboard/empresa | Dados da empresa |
| IA Config | /dashboard/ia-config | Config do agente |
| Sistemas | /dashboard/sistemas | Catalogo solar |

---

## Backend (SOLAR-AGENT-LG)

### Estrutura de Pastas

```
src/
├── api/
│   └── main.py          # FastAPI endpoints
├── agent/
│   ├── graph.py         # LangGraph agent
│   ├── state.py         # AgentState TypedDict
│   ├── tools/           # Ferramentas do agente
│   └── prompts.py       # Prompt builder
├── core/
│   ├── config.py        # Settings
│   ├── database.py      # Pool PostgreSQL
│   └── redis.py         # Conexao Redis
├── models/
│   ├── company.py       # Modelo Company
│   ├── lead.py          # Modelo Lead
│   └── webhook.py       # Payload UAZAPI
├── services/
│   ├── database.py      # DatabaseService
│   ├── whatsapp.py      # WhatsAppService
│   └── buffer.py        # BufferService
└── flow/
    ├── context.py       # FlowContext
    └── interpreter.py   # FlowInterpreter
```

### Endpoints API

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | / | Root info |
| GET | /health | Health check |
| POST | /webhook/{company_id} | Recebe msg WhatsApp |
| POST | /agent/invoke | Invocacao direta (debug) |
| GET | /lead/{company_id}/{phone} | Info do lead |
| POST | /lead/{lead_id}/ai/{action} | Toggle IA |

---

## Configuracao de Ambiente

### Frontend (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://yfzqpeasgsoorldogqwl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
```

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Buffer
BUFFER_DEBOUNCE_SECONDS=7

# API
API_HOST=0.0.0.0
API_PORT=8000
```

---

## Deploy

### Frontend (Vercel)

```bash
cd SAAS-SOLAR
vercel --prod
```

### Backend (Railway)

```bash
cd SOLAR-AGENT-LG
railway up
```

### Variaveis de Ambiente Railway

- DATABASE_URL
- REDIS_URL
- OPENAI_API_KEY

---

## Etapas de Qualificacao Solar

O sistema usa 8 etapas de qualificacao:

1. **Primeiro Contato** - Tipo de propriedade (casa/empresa/rural)
2. **Localizacao** - Cidade do cliente
3. **Consumo** - Valor da conta de luz
4. **Expansao** - Planos de aumentar consumo
5. **Telhado** - Tipo do telhado
6. **Prioridade** - Urgencia de instalacao
7. **Pagamento** - Forma de pagamento preferida
8. **Agendamento** - Marcar visita tecnica

---

## Proximos Passos

1. **Criar empresa de teste** no Supabase
2. **Configurar UAZAPI** com token e instancia
3. **Fazer deploy** do backend no Railway
4. **Testar fluxo** completo de mensagem
5. **Ajustar prompts** conforme necessidade

---

*Documentacao gerada automaticamente - 29/12/2025*
