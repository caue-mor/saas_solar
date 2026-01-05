# Arquitetura Completa do Sistema SAAS-SOLAR

## Visão Geral

O sistema SAAS-SOLAR é uma plataforma multi-tenant de atendimento automatizado para empresas de energia solar fotovoltaica, composta por dois componentes principais:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SAAS-SOLAR PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────┐     ┌──────────────────────────────────────┐  │
│  │     SAAS-SOLAR           │     │        SOLAR-AGENT-LG                │  │
│  │   (Next.js Frontend)     │     │       (Python Backend)               │  │
│  │                          │     │                                      │  │
│  │  • Dashboard Admin       │     │  • LangGraph Agent (ReAct)           │  │
│  │  • Flow Builder (lista)  │◄───►│  • FlowInterpreter                   │  │
│  │  • CRM Leads             │     │  • Buffer Service (Redis)            │  │
│  │  • Propostas             │     │  • Checkpointer (PostgreSQL)         │  │
│  │  • Webhook Handler*      │     │  • WhatsApp Service (UAZAPI)         │  │
│  └──────────────────────────┘     └──────────────────────────────────────┘  │
│           │                                      │                           │
│           │                                      │                           │
│           ▼                                      ▼                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        SUPABASE (PostgreSQL)                          │   │
│  │                                                                       │   │
│  │  • acesso_fotovoltaico (empresas)   • contato_fotovoltaico (leads)   │   │
│  │  • fluxo_qualificacao_fotovoltaico  • proposta_fotovoltaico          │   │
│  │  • status_leads                      • checkpoint (langgraph)         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Fluxo Completo de Mensagens

```
                                    FLUXO DE MENSAGEM

  ┌─────────┐      ┌─────────┐      ┌─────────────┐      ┌───────────────┐
  │ WhatsApp│─────►│  UAZAPI │─────►│   Webhook   │─────►│    Buffer     │
  │  User   │      │   API   │      │   Handler   │      │   (Redis)     │
  └─────────┘      └─────────┘      └─────────────┘      └───────────────┘
                                           │                     │
                                           │                     │ 7s debounce
                                           ▼                     ▼
                                    ┌─────────────┐      ┌───────────────┐
                                    │  AI Engine  │◄─────│    Agent      │
                                    │ (OpenAI*)   │      │  (LangGraph)  │
                                    └─────────────┘      └───────────────┘
                                           │                     │
                                           │                     │ Thread State
                                           ▼                     ▼
                                    ┌─────────────┐      ┌───────────────┐
                                    │  Database   │◄─────│ Checkpointer  │
                                    │  (Supabase) │      │  (PostgreSQL) │
                                    └─────────────┘      └───────────────┘
                                           │
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │   UAZAPI    │─────► WhatsApp User
                                    │  (Resposta) │
                                    └─────────────┘

⚠️ IMPORTANTE: Há DUAS implementações de AI no sistema (ver seção "Gaps Críticos")
```

---

## 2. Arquitetura do Agente LangGraph

### 2.1 Componentes Principais

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LANGGRAPH AGENT (ReAct Pattern)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐                                                   │
│  │    AgentState        │  TypedDict para estado do agente                  │
│  │    (state.py)        │                                                   │
│  ├──────────────────────┤                                                   │
│  │ • messages           │  Lista de mensagens (HumanMessage, AIMessage)     │
│  │ • company_id         │  ID da empresa (multi-tenant)                     │
│  │ • lead_id            │  ID do lead atual                                 │
│  │ • user_phone         │  Telefone do usuário                              │
│  │ • lead               │  Dados completos do lead                          │
│  │ • company            │  Dados da empresa                                 │
│  │ • current_stage      │  Estágio atual do fluxo (0-8)                     │
│  │ • collected_fields   │  Campos já coletados                              │
│  │ • missing_fields     │  Campos pendentes                                 │
│  │ • is_qualified       │  Status de qualificação                           │
│  │ • completion_pct     │  Percentual de conclusão                          │
│  │ • followup_stage     │  Estágio de follow-up                             │
│  │ • is_followup        │  Se é mensagem de follow-up                       │
│  └──────────────────────┘                                                   │
│                                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐                     │
│  │   create_react_agent │─────►│    Checkpointer      │                     │
│  │      (graph.py)      │      │ (AsyncPostgres)      │                     │
│  └──────────────────────┘      └──────────────────────┘                     │
│           │                                                                  │
│           ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                           TOOLS (8 tools)                             │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │ qualification.py:     │ schedule.py:         │ notification.py:       │   │
│  │ • update_consumo      │ • schedule_visit     │ • notify_seller        │   │
│  │ • update_lead_data    │ • get_available_slots│ • deactivate_ai        │   │
│  │ • get_lead_info       │                      │                        │   │
│  ├────────────────────────────────────────────────────────────────────── │   │
│  │ followup.py:                                                          │   │
│  │ • send_followup_message                                               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Criação do Agente (graph.py:42-57)

```python
async def create_agent():
    model = ChatOpenAI(
        model=settings.openai_model,           # gpt-4o-mini default
        temperature=settings.openai_temperature # 0.7 default
    )

    checkpointer = await get_checkpointer()    # AsyncPostgresSaver

    _agent = create_react_agent(
        model=model,
        tools=ALL_TOOLS,                       # 8 tools
        checkpointer=checkpointer,             # Persistência de estado
        state_schema=AgentState                # TypedDict
    )
```

### 2.3 Invocação do Agente (graph.py:85-127)

```python
async def invoke_agent(
    message: str,
    company_id: int,
    lead_id: int,
    user_phone: str,
    lead: dict,
    company: dict,
    system_prompt: str,
    is_followup: bool = False,
) -> str:
    # Thread ID = company_id:phone (isolamento por empresa/cliente)
    thread_id = f"{company_id}:{user_phone}"

    # Configuração com thread_id para checkpointer
    config = {
        "configurable": {
            "thread_id": thread_id,
            "company_id": company_id,
        }
    }

    # Estado inicial
    state = {
        "messages": [
            SystemMessage(content=system_prompt),
            HumanMessage(content=message),
        ],
        "company_id": company_id,
        "lead_id": lead_id,
        # ... outros campos
    }

    result = await agent.ainvoke(state, config)
```

---

## 3. Sistema de Memória

### 3.1 Memória de Curto Prazo (Checkpointer)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CHECKPOINTER (AsyncPostgresSaver)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Thread ID Format: "{company_id}:{phone}"                                   │
│  Exemplo: "5:5511999999999"                                                 │
│                                                                              │
│  ┌─────────────────┐                                                        │
│  │ checkpoint_data │  Armazena:                                             │
│  ├─────────────────┤  • messages[] - Histórico de mensagens                 │
│  │ thread_id       │  • state - Estado completo do AgentState               │
│  │ checkpoint_id   │  • metadata - Metadados da execução                    │
│  │ parent_id       │                                                        │
│  │ data (JSONB)    │                                                        │
│  │ created_at      │                                                        │
│  └─────────────────┘                                                        │
│                                                                              │
│  PERSISTÊNCIA:                                                              │
│  • Cada invoke salva checkpoint automaticamente                             │
│  • Histórico completo de mensagens por thread                               │
│  • Permite resumir conversa de onde parou                                   │
│                                                                              │
│  ISOLAMENTO:                                                                │
│  • Thread por cliente (phone) + empresa (company_id)                        │
│  • Multi-tenant nativo                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Memória de Longo Prazo (Store) - NÃO IMPLEMENTADO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STORE (NÃO IMPLEMENTADO)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ⚠️ GAP CRÍTICO: O sistema NÃO possui memória de longo prazo                │
│                                                                              │
│  O que DEVERIA existir:                                                     │
│  • AsyncPostgresStore para persistência cross-thread                        │
│  • Namespace por lead para informações persistentes                         │
│  • Recuperação de contexto em novas conversas                               │
│                                                                              │
│  Impacto:                                                                   │
│  • Lead que volta depois de dias perde contexto                             │
│  • Informações coletadas não são recuperadas automaticamente                │
│  • Cada nova thread começa "do zero"                                        │
│                                                                              │
│  Solução recomendada:                                                       │
│  ```python                                                                  │
│  from langgraph.checkpoint.postgres.aio import AsyncPostgresStore           │
│                                                                              │
│  store = AsyncPostgresStore(connection_string)                              │
│  agent = create_react_agent(                                                │
│      model=model,                                                           │
│      tools=tools,                                                           │
│      checkpointer=checkpointer,                                             │
│      store=store  # <-- ADICIONAR                                           │
│  )                                                                          │
│  ```                                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Sistema de Flow

### 4.1 FlowInterpreter (interpreter.py)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLOW INTERPRETER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Processa configuração visual de fluxos (JSON) e determina próximas ações   │
│                                                                              │
│  NODE TYPES SUPORTADOS:                                                     │
│  ┌─────────────┬────────────────────────────────────────────────────────┐   │
│  │ GREETING    │ Boas-vindas, saudação inicial                          │   │
│  │ QUESTION    │ Pergunta com captura de dado (campo_destino)           │   │
│  │ CONDITION   │ Condição para ramificação (if/else)                    │   │
│  │ QUALIFICATION│ Verificação de qualificação automática                │   │
│  │ PAYMENT_METHOD│ Captura forma de pagamento                           │   │
│  │ HANDOFF     │ Transferência para humano                              │   │
│  │ AI_RESPONSE │ Resposta livre do agente                               │   │
│  │ END         │ Fim do fluxo                                           │   │
│  └─────────────┴────────────────────────────────────────────────────────┘   │
│                                                                              │
│  FLUXO PADRÃO SOLAR (8 estágios):                                           │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │ 1. tipo_propriedade → 2. cidade → 3. consumo → 4. expansao         │     │
│  │ 5. telhado → 6. prioridade → 7. pagamento → 8. agendamento         │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  create_default_solar_flow() gera fluxo quando empresa não tem customizado  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 FlowContext (context.py)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLOW CONTEXT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  @dataclass                                                                 │
│  class FlowContext:                                                         │
│      company_id: int                                                        │
│      lead_id: int                                                           │
│      current_node_id: str = "start"                                         │
│      phase: FlowPhase = FlowPhase.GREETING                                  │
│      collected_data: CollectedData                                          │
│      qualification_score: float = 0.0                                       │
│      is_qualified: bool = False                                             │
│      handoff_triggered: bool = False                                        │
│      flow_config: Optional[FlowConfig] = None                               │
│                                                                              │
│  PHASES:                                                                    │
│  ┌────────────┬─────────────────────────────────────────────────────────┐   │
│  │ GREETING   │ Início, saudação                                        │   │
│  │QUALIFICATION│ Coleta de consumo, verificação de qualificação         │   │
│  │ COLLECTION │ Coleta de dados adicionais                              │   │
│  │ NEGOTIATION│ Discussão de proposta, valores                          │   │
│  │ SCHEDULING │ Agendamento de visita                                   │   │
│  │ HANDOFF    │ Transferência para humano                               │   │
│  │ FOLLOWUP   │ Retomada de conversa                                    │   │
│  └────────────┴─────────────────────────────────────────────────────────┘   │
│                                                                              │
│  COLLECTED DATA:                                                            │
│  @dataclass                                                                 │
│  class CollectedData:                                                       │
│      nome: Optional[str]                                                    │
│      cidade: Optional[str]                                                  │
│      consumo: Optional[float]                                               │
│      tipo_propriedade: Optional[str]                                        │
│      telhado: Optional[str]                                                 │
│      pagamento: Optional[str]                                               │
│      prioridade: Optional[str]                                              │
│      expansao: Optional[bool]                                               │
│      agendamento: Optional[dict]                                            │
│      observacoes: List[str]                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Banco de Dados

### 5.1 Schema Principal

```sql
-- EMPRESAS (Multi-tenant)
acesso_fotovoltaico
├── id (PK)
├── nome_empresa
├── email
├── token_whatsapp          -- Token UAZAPI
├── numero_atendimento      -- Número para notificações
├── system_prompt           -- Prompt personalizado
├── modelo_ia               -- gpt-4, gpt-4o-mini, etc
├── threshold_qualificacao  -- Valor mínimo para qualificar (default: 300)
├── atendimento_automatico  -- Toggle global de IA
├── horario_atendimento     -- JSON com horários
├── mensagem_fora_horario
├── flow_config             -- JSON do fluxo visual (JSONB)
└── created_at

-- LEADS/CONTATOS
contato_fotovoltaico
├── id (PK)
├── empresa_id (FK → acesso_fotovoltaico)
├── telefone
├── nome
├── email
├── cidade
├── potencia_consumo_medio  -- Valor da conta de luz
├── dados_coletados         -- JSON com todos os dados (JSONB)
├── etapa_atual             -- Estágio atual do fluxo
├── status_lead_id (FK → status_leads)
├── atendimento_automatico  -- Toggle de IA por lead
├── historico_mensagens     -- JSON com histórico
├── ultima_interacao
└── created_at

-- STATUS DE LEADS
status_leads
├── id (PK)
├── nome                    -- Novo, Qualificado, Agendado, Fechado, Perdido
├── cor
└── ordem

-- FLUXO DE QUALIFICAÇÃO (lista)
fluxo_qualificacao_fotovoltaico
├── id (PK)
├── empresa_id (FK)
├── pergunta
├── tipo                    -- texto, numero, selecao, multipla
├── opcoes                  -- JSON para seleção
├── campo_destino           -- Campo do lead a atualizar
├── ordem
├── obrigatoria
└── ativa

-- PROPOSTAS
proposta_fotovoltaico
├── id (PK)
├── contato_id (FK)
├── empresa_id (FK)
├── potencia_sistema        -- kWp
├── valor_sistema           -- R$
├── economia_mensal
├── tempo_retorno           -- Payback em meses
├── equipamentos            -- JSON
├── observacoes
├── status                  -- rascunho, enviada, aceita, recusada
└── created_at
```

### 5.2 Checkpoints LangGraph

```sql
-- Tabelas criadas pelo AsyncPostgresSaver
checkpoint_migrations
├── v (PK)

checkpoints
├── thread_id (PK)
├── checkpoint_ns (PK)
├── checkpoint_id (PK)
├── parent_checkpoint_id
├── type
├── checkpoint (JSONB)      -- Estado completo serializado
├── metadata (JSONB)
└── created_at

checkpoint_blobs
├── thread_id (PK)
├── checkpoint_ns (PK)
├── channel
├── version (PK)
├── type
└── blob (BYTEA)

checkpoint_writes
├── thread_id (PK)
├── checkpoint_ns (PK)
├── checkpoint_id (PK)
├── task_id (PK)
├── idx (PK)
├── channel
├── type
└── blob (BYTEA)
```

---

## 6. Tools do Agente

### 6.1 Qualification Tools (qualification.py)

```python
@tool
async def update_consumo(consumo: str, state, config) -> str:
    """
    QUANDO USAR: IMEDIATAMENTE após cliente informar conta de luz
    - Extrai valor numérico do texto
    - Atualiza potencia_consumo_medio no banco
    - Determina qualificação (>= threshold)
    - Atualiza status do lead (2=Qualificado, 1=Novo)
    """

@tool
async def update_lead_data(field: str, value: str, state, config) -> str:
    """
    QUANDO USAR: Após cliente informar dados como:
    - telhado (ceramica, metal, laje)
    - pagamento (avista, financiamento, cartao)
    - prioridade (pesquisando, instalar_logo)
    - tipo_propriedade (casa, empresa, rural)
    - cidade
    """

@tool
async def get_lead_info(state, config) -> str:
    """
    QUANDO USAR: Para verificar dados coletados ou resumir informações
    """
```

### 6.2 Schedule Tools (schedule.py)

```python
@tool
async def schedule_visit(date: str, time: str, state, config, notes=None) -> str:
    """
    QUANDO USAR: Após coletar dados e cliente confirmar visita
    IMPORTANTE: Também DESATIVA a IA automaticamente
    - Valida formato data/hora
    - Verifica dia útil e horário comercial
    - Salva agendamento no lead
    - Atualiza status para 3 (Agendado)
    - Desativa IA para handoff humano
    """

@tool
async def get_available_slots(date: str = None) -> str:
    """
    QUANDO USAR: Cliente pergunta sobre disponibilidade
    - Retorna próximos 3 dias úteis
    - Seg-Sex: 08:00-17:00
    - Sáb: 08:00-11:00
    """
```

### 6.3 Notification Tools (notification.py)

```python
@tool
async def notify_seller(summary: str, state, config, priority="normal") -> str:
    """
    QUANDO USAR:
    - Após agendar visita
    - Cliente pede humano
    - Lead muito qualificado
    - Situações fora do escopo

    Envia mensagem WhatsApp para numero_atendimento da empresa
    """

@tool
async def deactivate_ai(state, config) -> str:
    """
    QUANDO USAR:
    - Após agendar visita
    - Cliente solicita humano

    Desativa atendimento_automatico para o lead
    """
```

### 6.4 Follow-up Tools (followup.py)

```python
@tool
async def send_followup_message(last_question: str, state, config, context=None) -> str:
    """
    QUANDO USAR: Mensagens de follow-up automático

    Templates contextualizados:
    - consumo: Pergunta sobre conta de luz
    - telhado: Pergunta sobre tipo de telhado
    - pagamento: Pergunta sobre forma de pagamento
    - agendamento: Pergunta sobre visita
    - default: Retomada genérica
    """
```

---

## 7. Buffer Service (Redis)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BUFFER SERVICE (Redis)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PROPÓSITO: Debouncing de mensagens (usuários enviam múltiplas mensagens)   │
│                                                                              │
│  FUNCIONAMENTO:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 1. Mensagem chega                                                   │    │
│  │ 2. Armazena em Redis com TTL de 7 segundos                          │    │
│  │ 3. Se chegar outra mensagem antes do TTL:                           │    │
│  │    - Concatena ao buffer existente                                  │    │
│  │    - Reseta o timer                                                 │    │
│  │ 4. Após 7s sem novas mensagens:                                     │    │
│  │    - Processa buffer completo                                       │    │
│  │    - Envia para o Agent                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  CHAVE REDIS: buffer:{company_id}:{phone}                                   │
│  VALOR: Lista de mensagens concatenadas                                     │
│  TTL: 7 segundos (configurável)                                             │
│                                                                              │
│  BENEFÍCIOS:                                                                │
│  • Evita múltiplas invocações do agente                                     │
│  • Consolida contexto de mensagens fragmentadas                             │
│  • Reduz custos de API (menos chamadas)                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. GAPS CRÍTICOS IDENTIFICADOS

### 8.1 DUAS IMPLEMENTAÇÕES DE IA (CRÍTICO)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ⚠️ DUPLICIDADE DE IMPLEMENTAÇÃO IA                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FRONTEND (SAAS-SOLAR/src/app/api/webhook/whatsapp/route.ts)               │
│  ─────────────────────────────────────────────────────────────              │
│  • Usa generateAIResponse() diretamente com OpenAI                          │
│  • Histórico manual em dados_coletados.historico                            │
│  • NÃO usa o LangGraph Agent                                                │
│  • NÃO usa checkpointer                                                     │
│  • NÃO usa as tools                                                         │
│                                                                              │
│  ```typescript                                                              │
│  const aiResponse = await generateAIResponse(                               │
│      message,                                                               │
│      conversationHistory,                                                   │
│      {                                                                      │
│          model: empresa.modelo_ia || "gpt-4",                               │
│          systemPrompt: empresa.system_prompt,                               │
│          companyName: empresa.nome_empresa,                                 │
│      }                                                                      │
│  );                                                                         │
│  ```                                                                        │
│                                                                              │
│  BACKEND (SOLAR-AGENT-LG/src/api/main.py)                                   │
│  ─────────────────────────────────────────                                  │
│  • Usa LangGraph Agent com ReAct pattern                                    │
│  • Checkpointer PostgreSQL para estado                                      │
│  • 8 tools especializadas                                                   │
│  • FlowInterpreter para fluxos visuais                                      │
│                                                                              │
│  IMPACTO:                                                                   │
│  • Comportamento inconsistente dependendo de qual handler processa          │
│  • Tools não são usadas no frontend                                         │
│  • Memória/estado não é compartilhada                                       │
│  • Qualificação automática não funciona no frontend                         │
│                                                                              │
│  SOLUÇÃO:                                                                   │
│  Frontend deve APENAS receber webhook e repassar para backend Python        │
│  OU remover processamento de IA do frontend completamente                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Memória de Longo Prazo Ausente

```
PROBLEMA: Store não implementado
IMPACTO: Lead que volta após dias perde todo o contexto
SOLUÇÃO: Implementar AsyncPostgresStore no create_react_agent
```

### 8.3 Flow Builder Visual Inexistente

```
PROBLEMA: Flow Builder atual é apenas lista de perguntas
IMPACTO: Usuário não consegue criar fluxos visuais complexos
SOLUÇÃO: Implementar React Flow ou similar para drag-and-drop
```

### 8.4 Inconsistência de Etapas

```
PROBLEMA:
- Frontend (contatos.ts): 6 ETAPAS_QUALIFICACAO
- Backend (flow): 8 estágios

Frontend:
1. inicio → 2. qualificacao → 3. coleta → 4. proposta → 5. fechamento → 6. pos_venda

Backend:
1. tipo_propriedade → 2. cidade → 3. consumo → 4. expansao →
5. telhado → 6. prioridade → 7. pagamento → 8. agendamento

SOLUÇÃO: Alinhar definições entre frontend e backend
```

### 8.5 RAG/Knowledge Base Ausente

```
PROBLEMA: Agente não tem acesso a base de conhecimento
IMPACTO: Não responde perguntas técnicas sobre solar
SOLUÇÃO: Implementar tool de RAG com embeddings de FAQ/documentação
```

---

## 9. Recomendações de Melhorias

### 9.1 Prioridade CRÍTICA

1. **Unificar implementação de IA**
   - Remover `generateAIResponse` do frontend
   - Frontend apenas repassa para backend Python
   - Garantir que TODAS as mensagens passem pelo LangGraph Agent

2. **Implementar Store para memória longa**
   ```python
   from langgraph.checkpoint.postgres.aio import AsyncPostgresStore

   store = AsyncPostgresStore(connection_string)
   agent = create_react_agent(
       model=model,
       tools=tools,
       checkpointer=checkpointer,
       store=store
   )
   ```

### 9.2 Prioridade ALTA

3. **Flow Builder Visual**
   - Implementar com React Flow
   - Arrastar e soltar nós
   - Conexões visuais entre nós
   - Preview em tempo real

4. **Alinhar etapas frontend/backend**
   - Usar mesma definição em ambos
   - Sincronizar via API

### 9.3 Prioridade MÉDIA

5. **RAG Tool**
   - Criar embeddings de FAQ solar
   - Tool para busca semântica
   - Integrar com LangChain retrievers

6. **Métricas e Analytics**
   - Dashboard de conversões
   - Tempo médio de qualificação
   - Taxa de agendamento

7. **Testes automatizados**
   - Unit tests para tools
   - Integration tests para fluxos
   - E2E tests para conversas

---

## 10. Estrutura de Diretórios

```
SOLAR-AGENT-LG/
├── src/
│   ├── agent/
│   │   ├── graph.py           # LangGraph agent creation
│   │   ├── state.py           # AgentState TypedDict
│   │   ├── prompts.py         # System prompts
│   │   └── tools/
│   │       ├── __init__.py    # Export ALL_TOOLS
│   │       ├── qualification.py
│   │       ├── schedule.py
│   │       ├── notification.py
│   │       └── followup.py
│   ├── api/
│   │   └── main.py            # FastAPI endpoints
│   ├── flow/
│   │   ├── interpreter.py     # FlowInterpreter
│   │   ├── context.py         # FlowContext
│   │   └── __init__.py
│   ├── models/
│   │   └── flow.py            # Flow data models
│   ├── services/
│   │   ├── database.py        # DatabaseService
│   │   ├── whatsapp.py        # WhatsAppService (UAZAPI)
│   │   ├── buffer.py          # BufferService (Redis)
│   │   └── checkpointer.py    # AsyncPostgresSaver
│   └── core/
│       └── config.py          # Settings

SAAS-SOLAR/
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login/Register
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           # Dashboard home
│   │   │       ├── contatos/          # CRM leads
│   │   │       ├── flow-builder/      # Lista de perguntas
│   │   │       ├── propostas/         # Propostas
│   │   │       └── ...
│   │   └── api/
│   │       └── webhook/
│   │           └── whatsapp/
│   │               └── route.ts       # ⚠️ Tem IA própria
│   ├── components/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── services/
│   │   ├── contatos.ts
│   │   ├── fluxo.ts
│   │   └── ...
│   └── types/
│       └── database.ts
```

---

## 11. Conclusão

O sistema SAAS-SOLAR possui uma arquitetura sólida com LangGraph para o agente de IA, mas tem **gaps críticos** que precisam ser endereçados:

1. **Duplicidade de IA** - Maior problema, causa inconsistências
2. **Memória longa ausente** - Perde contexto em conversas longas
3. **Flow Builder básico** - Não atende necessidade visual
4. **Desalinhamento de etapas** - Frontend e backend divergentes

A correção desses pontos elevará significativamente a qualidade e consistência do sistema.
