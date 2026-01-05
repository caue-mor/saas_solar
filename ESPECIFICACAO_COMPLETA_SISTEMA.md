# ESPECIFICACAO COMPLETA DO SISTEMA SAAS-SOLAR

## Documentos Relacionados

| Documento | Descricao |
|-----------|-----------|
| `ESPECIFICACAO_COMPLETA_SISTEMA.md` | Este documento - arquitetura e componentes |
| `REGRAS_RESTRICOES_AGENTE.md` | Regras detalhadas do comportamento da IA |
| `PLANO_ACAO_GAPS.md` | Gaps identificados e plano de correcao |

---

## Analise dos Projetos de Referencia

Este documento e baseado na analise completa de dois projetos existentes:
- **UazapiSolar** (`/Users/steveherison/Documents/UazapiSolar`)
- **CRM-SDR-AI** (`/Users/steveherison/CRM-SDR/CRM-SDR-AI`)

---

## 1. ARQUITETURA DO AGENTE DE IA

### 1.1 Componentes Principais

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SAAS-SOLAR                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Dashboard | Contatos | Kanban | WhatsApp | IA Config        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │            API Routes (Next.js)                              │   │
│  │  /api/webhook/whatsapp → Repassa para Backend Python        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────│──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SOLAR-AGENT-LG (Backend Python)                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Buffer     │  │   AI Agent   │  │    Tools     │              │
│  │   Service    │──│   (GPT-4)    │──│   (7 Tools)  │              │
│  │  (Debounce)  │  │              │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                 │                 │                       │
│         ▼                 ▼                 ▼                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Redis                                   │   │
│  │  - Buffer mensagens (debouncing)                            │   │
│  │  - Historico conversas (ultimas 20)                         │   │
│  │  - Idempotencia (PROCESSING/DONE/FAILED)                    │   │
│  │  - Outbox (previne duplicacao)                              │   │
│  │  - Rate limiting                                            │   │
│  │  - Cache empresas                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Supabase (PostgreSQL)                     │   │
│  │  - leads, empresas, mensagens, conversas                    │   │
│  │  - Checkpointer (memoria LangGraph)                         │   │
│  │  - Store (memoria longa)                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Fluxo de Processamento de Mensagem

```
1. UAZAPI → Webhook POST
2. Frontend valida + identifica empresa
3. Repassa para Backend Python
4. Backend:
   a. Buffer (debouncing 3-5s)
   b. Verifica idempotencia
   c. Carrega empresa + lead do cache/DB
   d. Verifica atendimento_automatico
   e. Recupera historico (Redis)
   f. Processa com AI Agent
   g. Executa tools se necessario
   h. Salva historico
   i. Envia resposta via UAZAPI
   j. Marca como DONE
```

---

## 2. SYSTEM PROMPT - ESTRUTURA COMPLETA

### 2.1 Secoes Obrigatorias do Prompt

```
1. CHECKPOINT - ESTADO ATUAL DA CONVERSA
   - Etapa atual (1-8)
   - Progresso percentual
   - Proxima pergunta
   - Dados ja coletados
   - Campos que faltam

2. REGRA SUPREMA - INFORMACOES COMPLEMENTARES
   - Threshold customizado (ex: R$ 500 ao inves de R$ 300)
   - Fluxo customizado de perguntas
   - Estilo de comunicacao especifico
   - Regras de negocio especificas
   - SOBRESCREVE QUALQUER INSTRUCAO PADRAO

3. IDENTIDADE E CONTEXTO
   - Nome do atendente
   - Nome da empresa
   - Informacoes do lead (nome, telefone, dados coletados)
   - Informacoes da empresa (endereco, horario, site, etc)

4. ESTILO DE COMUNICACAO
   - Max 3 quebras (\n\n) por resposta
   - Primeira mensagem: max 15 palavras
   - Demais: ate 60 palavras
   - Emojis com moderacao (variar)
   - Adaptar ao estilo do cliente

5. ACIONAMENTO OBRIGATORIO DE TOOLS
   - updateConsumo() → apos informar consumo
   - updateLead(telhado) → apos informar telhado
   - updateLead(pagamento) → apos informar pagamento
   - updateFinal() + notificaConsultor() + desativaAtendimento() → finalizacao

6. FLUXO DE QUALIFICACAO (8 ETAPAS)
   - Etapa 1: Tipo (casa/empresa)
   - Etapa 2: Cidade
   - Etapa 3: Consumo → TOOL: updateConsumo()
   - Etapa 4: Expansao
   - Etapa 5: Telhado → TOOL: updateLead()
   - Etapa 6: Prioridade
   - Etapa 7: Pagamento → TOOL: updateLead()
   - Etapa 8: Agendamento → TOOLS FINAIS

7. CAPACIDADES TECNICAS
   - O que pode responder sobre energia solar
   - Como tratar objecoes

8. REGRAS RIGIDAS
   - PROIBIDO: inventar valores, pular tools, mostrar codigos
   - OBRIGATORIO: executar tools, variar expressoes

9. OUTPUT LIMPO
   - JAMAIS mostrar nomes de tools na mensagem
   - JAMAIS mostrar parametros tecnicos
   - Execucao de tools e INVISIVEL para cliente

10. VALIDACAO FINAL
    - Checklist antes de enviar
```

### 2.2 Customization Parser (Informacoes Complementares)

O sistema deve parsear `informacoes_complementares` da empresa:

```python
@dataclass
class CustomizationConfig:
    use_emojis: bool = True
    skip_payment_question: bool = False
    skip_priority_question: bool = False
    skip_expansion_question: bool = False
    custom_questions: List[str] = None
    tone: str = "friendly"  # "friendly", "direct", "formal"
    max_words_per_message: Optional[int] = None
    qualification_threshold: int = 300  # R$ minimo
```

**Padroes detectados via regex:**
- "Nao use emojis" → use_emojis=False
- "Nao pergunte forma de pagamento" → skip_payment_question=True
- "Textos curtos" → tone="direct", max_words_per_message=20
- "Consumo minimo R$ 500" → qualification_threshold=500

---

## 3. TOOLS (FUNCOES) DO AGENTE

### 3.1 Lista Completa de Tools

| Tool | Quando Usar | Parametros |
|------|-------------|------------|
| `updateConsumo` | Apos cliente informar valor da conta | `consumo: string` |
| `updateLead` | Apos telhado ou pagamento | `telhado?, forma_pagamento?, prioridade?, observacoes?` |
| `updateFinal` | Ao finalizar atendimento | `resumo: string, interesse: boolean` |
| `desativaAtendimento` | Junto com updateFinal | nenhum |
| `notificaConsultor` | Junto com updateFinal | `resumo: string` |
| `sendFollowupMessage` | Lead parou de responder | `last_question: string, context?: string` |
| `salvarDado` | Para tipo_propriedade, cidade, expansao | `campo: string, valor: string` |

### 3.2 Implementacao das Tools

#### updateConsumo
```python
async def update_consumo_tool(
    lead_id: int,
    consumo: str,
    company: dict,
    lead: dict
) -> Dict[str, Any]:
    """
    Registra valor da conta e qualifica automaticamente.

    - Extrai valor numerico do texto (ex: "450 reais" → 450)
    - Se valor >= threshold (default R$ 300): Status 2 (Qualificado)
    - Salva em potencia_consumo_medio
    """
```

#### updateLead
```python
async def update_lead_tool(
    lead_id: int,
    telhado: str = None,
    forma_pagamento: str = None,
    prioridade: str = None,
    observacoes: str = None
) -> Dict[str, Any]:
    """
    Atualiza dados estruturados do lead.

    Valores aceitos:
    - telhado: ceramico, metalico, laje, fibrocimento
    - forma_pagamento: a_vista, cartao, financiamento
    - prioridade: urgente, breve, pesquisando
    """
```

#### updateFinal + notificaConsultor + desativaAtendimento
```python
# SEMPRE executar em SEQUENCIA ao finalizar:
1. updateFinal(resumo="...", interesse=True/False)
   → Status 3 (Agendado)
   → Salva resumo em observacoes_status

2. notificaConsultor(resumo="...")
   → Envia WhatsApp para vendedor
   → Inclui dados principais do lead

3. desativaAtendimento()
   → atendimento_automatico = False
   → IA para de responder
```

#### sendFollowupMessage
```python
async def send_followup_message_tool(
    last_question: str,
    context: str = ""
) -> Dict[str, Any]:
    """
    Gera mensagem de follow-up contextual.

    Exemplo:
    Input: last_question="me dizer de qual cidade voce e"
    Output: "E ai, conseguiu me dizer de qual cidade voce e?"
    """
```

---

## 4. SERVICOS AUXILIARES

### 4.1 Redis Service

```python
class RedisService:
    # HISTORICO DE CONVERSAS
    async def append_to_history(company_id, phone, role, content)
    async def get_conversation_history(company_id, phone, limit=20)
    async def clear_history(company_id, phone)

    # BUFFER DE MENSAGENS (Debouncing)
    async def push_to_buffer(company_id, phone, message)
    async def get_buffer(company_id, phone)
    async def clear_buffer(company_id, phone)

    # IDEMPOTENCIA (2-fases)
    async def check_idempotency(message_id) → None/PROCESSING/DONE/FAILED
    async def mark_processing(message_id) → bool
    async def mark_done(message_id)
    async def mark_failed(message_id, error)

    # OUTBOX PATTERN (previne duplicacao)
    async def check_message_sent(phone, text) → bool
    async def mark_message_sent(phone, text, ttl=300)

    # RATE LIMITING
    async def check_rate_limit(company_id, max=10, window=60) → bool

    # CACHE EMPRESAS
    async def cache_company(company_id, data)
    async def get_cached_company(company_id)
```

### 4.2 Vision Service (Analise de Imagens)

```python
class VisionService:
    """Analise de contas de energia com GPT-4o Vision"""

    async def extract_bill_data(message_id, instance_token) -> Dict:
        """
        Extrai dados da conta de luz:
        - valor_total (R$)
        - consumo_kwh
        - vencimento (YYYY-MM-DD)
        - concessionaria

        Suporta: JPEG, PNG, GIF, WebP, HEIC, BMP, TIFF, PDF
        Compacta automaticamente imagens > 2MB
        """

    async def is_energy_bill(image_url) -> bool:
        """Verifica rapidamente se imagem e conta de luz"""
```

### 4.3 Audio Service (Transcricao)

```python
class AudioService:
    """Transcricao de audio com OpenAI Whisper"""

    async def transcribe_from_url(audio_url, language="pt") -> str:
        """
        1. Baixa audio da URL
        2. Salva em arquivo temporario
        3. Transcreve com Whisper
        4. Retorna texto
        """
```

### 4.4 Paid Traffic Detector

```python
def detect_paid_traffic(payload: Dict) -> Tuple[bool, Dict]:
    """
    Detecta se mensagem veio de trafego pago (Meta Ads).

    3 sinais definitivos (100% confiavel):
    1. contextInfo.conversionSource contem "ad"
    2. contextInfo.entryPointConversionSource === "ctwa_ad"
    3. contextInfo.externalAdReply.sourceType === "ad"

    Retorna:
    - is_paid: bool
    - metadata: {
        detection_method,
        source,
        ad_id,
        campaign_id,
        click_id,
        evidence[]
      }
    """
```

---

## 5. REGRAS CRITICAS DO AGENTE

### 5.1 O que a IA NUNCA pode fazer

```
PROIBIDO ABSOLUTAMENTE:
- Inventar potencia de sistemas
- Inventar valores de economia especificos
- Pular acionamento de tools
- Mostrar codigos de funcoes pro cliente
- Mostrar parametros tecnicos
- Continuar fluxo sem executar tool quando necessario
- Fornecer email da empresa (CONFIDENCIAL)
- Conversar sobre assuntos fora de energia solar
- Inventar informacoes que nao estao no banco
```

### 5.2 O que a IA DEVE fazer sempre

```
OBRIGATORIO:
- updateConsumo() SEMPRE apos cliente informar consumo
- updateLead() SEMPRE apos tipo de telhado
- updateLead() SEMPRE apos forma de pagamento
- Sequencia final SEMPRE: updateFinal() → notificaConsultor() → desativaAtendimento()
- Maximo 3 quebras (\n\n) por resposta
- Sempre retornar ao fluxo apos responder duvida tecnica
- Seguir informacoes complementares da empresa
- Variar expressoes (nao ser robotico)
```

### 5.3 Bloqueio de Assuntos Fora de Escopo

```python
# Se lead perguntar sobre assuntos nao relacionados a solar:
# - Responder de forma breve e educada
# - Retornar IMEDIATAMENTE ao fluxo de qualificacao
# - NAO se aprofundar em outros temas

TOPICOS_VALIDOS = [
    "energia solar", "paineis", "instalacao", "economia",
    "financiamento", "garantia", "manutencao", "telhado",
    "conta de luz", "consumo", "inversor", "kit solar",
    "usina compartilhada", "creditos de energia"
]
```

---

## 6. SISTEMA DE STATUS DO LEAD

```
Status 1: Novo/Inicial
- Lead acabou de entrar
- Atendimento automatico ATIVO
- Nenhum dado coletado

Status 2: Qualificado
- Consumo >= threshold (R$ 300 default)
- Dados parciais coletados
- Potencial cliente identificado

Status 3: Agendado/Finalizado
- updateFinal() executado
- Consultor notificado
- Atendimento automatico DESATIVADO
```

---

## 7. SISTEMA DE FOLLOW-UP

### 7.1 Quando Disparar Follow-up

```
- Lead parou de responder ha X minutos
- Verificar ultima pergunta nao respondida
- Usar tool sendFollowupMessage para gerar mensagem contextual
```

### 7.2 Formato da Mensagem de Follow-up

```
Intros variaveis:
- "E ai, conseguiu..."
- "Opa! Conseguiu..."
- "Tudo bem? Conseguiu..."
- "Ei! Ja conseguiu..."
- "Oi! Conseguiu..."

Exemplo completo:
"E ai, conseguiu verificar o valor da conta?"
```

---

## 8. PROCESSAMENTO DE MIDIA

### 8.1 Tipos Suportados

| Tipo | Acao |
|------|------|
| Texto | Processar normalmente |
| Audio | Transcrever com Whisper → Processar texto |
| Imagem | Verificar se e conta de luz → Extrair dados |
| Documento (PDF) | Converter primeira pagina → Analisar |
| Video | Placeholder: "[VIDEO RECEBIDO]" |

### 8.2 Fluxo de Imagem de Conta de Luz

```
1. Recebe imagem
2. vision_service.is_energy_bill(url)
3. Se for conta:
   a. vision_service.extract_bill_data()
   b. Extrai: valor_total, consumo_kwh, vencimento
   c. Executa updateConsumo() automaticamente
   d. Responde confirmando os dados
4. Se nao for conta:
   - Continua fluxo normal
```

---

## 9. SAFETY NETS E PROTECOES

### 9.1 Safety Net: Desativacao Obrigatoria

```python
# Se GPT executou updateFinal mas esqueceu desativaAtendimento:
async def _enforce_bot_deactivation_if_needed(lead_id, tools_executed):
    if "updateFinal" in tools_executed:
        if "desativaAtendimento" not in tools_executed:
            # FORCA DESATIVACAO
            await desativa_atendimento_tool(lead_id)
```

### 9.2 Protecao contra Race Condition

```python
# Antes de enviar mensagem, verificar se bot ainda esta ativo:
fresh_lead = supabase_service.get_lead(lead_id)
if not fresh_lead.get("atendimento_automatico", True):
    # Empresa respondeu manualmente durante processamento
    # NAO enviar mensagem da IA
    return
```

### 9.3 Outbox Pattern

```python
# Antes de enviar:
if await redis_service.check_message_sent(phone, text):
    # Mensagem ja foi enviada - duplicata
    return

# Apos enviar com sucesso:
await redis_service.mark_message_sent(phone, text, ttl=300)
```

---

## 10. CAMPOS DO BANCO DE DADOS

### 10.1 Tabela: acessos_fotovoltaico (Empresas)

```sql
id, nome_empresa, email, whatsapp_status, whatsapp_numero,
uazapi_instancia, token_whatsapp,
nome_atendente, endereco_completo, cidade, horario_funcionamento,
site_empresa, instagram_empresa, link_google_maps,
formas_pagamento, garantia_pos_venda, numero_atendimento,
informacoes_complementares,  -- REGRAS CUSTOMIZADAS
status_plano, produto_plano, ia_ativa
```

### 10.2 Tabela: leads_solar (Leads)

```sql
id, empresa_id, nome, celular, email,
potencia_consumo_medio,  -- Valor da conta
observacoes_status,  -- Formato: "CONSUMO=R$ 450; TELHADO=ceramica"
status_lead,  -- 1=Novo, 2=Qualificado, 3=Agendado
atendimento_automatico,  -- true/false
etapa_atual,  -- 1-8
dados_coletados,  -- JSONB
origem_trafego  -- organico/pago
```

---

## 11. INTEGRACAO COM UAZAPI

### 11.1 Webhook Events

```
- connection: Status da conexao (connected/disconnected)
- qrcode: QR Code atualizado
- message: Nova mensagem recebida
```

### 11.2 Envio de Mensagens

```python
async def send_text_message(token, phone, text):
    """POST /message/text"""

async def send_multiple_messages(phone, messages, token, delay_ms=150):
    """Envia multiplas mensagens com delay entre elas"""

async def send_typing_status(phone, token):
    """Envia status de 'digitando...'"""
```

---

## 12. PROXIMOS PASSOS DE IMPLEMENTACAO

### 12.1 Prioridade 1 (Critico)
1. Implementar backend Python com LangGraph
2. Implementar todas as 7 tools
3. Configurar Redis (buffer, historico, idempotencia)
4. Implementar System Prompt completo

### 12.2 Prioridade 2 (Alta)
1. Implementar Vision Service
2. Implementar Audio Service
3. Implementar Paid Traffic Detector
4. Implementar Follow-up System

### 12.3 Prioridade 3 (Media)
1. Flow Builder Visual no frontend
2. Customization Parser
3. RAG/Knowledge Base
4. Multi-agent architecture

---

## 13. VARIAVEIS DE AMBIENTE

```bash
# Backend Python
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://localhost:6379

# UAZAPI
UAZAPI_BASE_URL=https://api.uazapi.com

# Worker
WORKER_CONCURRENCY=3
CONTEXT_WINDOW_LENGTH=20
IDEMPOTENCY_TTL_PROCESSING=120
IDEMPOTENCY_TTL_DONE=86400
IDEMPOTENCY_TTL_FAILED=300
```

---

## 14. ESTRUTURA DETALHADA DO SYSTEM PROMPT

### 14.1 Template Completo

```python
SYSTEM_PROMPT_TEMPLATE = """
{SECAO_1_CHECKPOINT}

{SECAO_2_REGRAS_SUPREMAS}

{SECAO_3_IDENTIDADE}

{SECAO_4_ESTILO_COMUNICACAO}

{SECAO_5_TOOLS}

{SECAO_6_FLUXO}

{SECAO_7_CAPACIDADES_TECNICAS}

{SECAO_8_REGRAS_RIGIDAS}

{SECAO_9_OUTPUT_LIMPO}

{SECAO_10_VALIDACAO}
"""
```

### 14.2 Secao 1 - Checkpoint

```python
SECAO_1_CHECKPOINT = """
=== CHECKPOINT - ESTADO ATUAL ===
Etapa atual: {etapa_atual}/8 ({nome_etapa})
Progresso: {progresso}%
Proxima pergunta: "{proxima_pergunta}"

DADOS JA COLETADOS:
{dados_coletados_formatado}

CAMPOS QUE FALTAM:
{campos_faltantes_formatado}
=================================
"""
```

### 14.3 Secao 2 - Regras Supremas (Customizacao)

```python
SECAO_2_REGRAS_SUPREMAS = """
!!! ATENCAO - REGRAS SUPREMAS DA EMPRESA !!!

{informacoes_complementares}

ESTAS REGRAS TEM PRIORIDADE MAXIMA.
Qualquer instrucao aqui SOBRESCREVE instrucoes padrao.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
"""
```

### 14.4 Secao 3 - Identidade

```python
SECAO_3_IDENTIDADE = """
## SUA IDENTIDADE

Voce e {nome_atendente}, atendente virtual da {nome_empresa}.

### Sobre a Empresa:
- Endereco: {endereco_completo}
- Cidade: {cidade}
- Horario: {horario_funcionamento}
- Site: {site_empresa}
- Instagram: {instagram_empresa}
- Formas de pagamento: {formas_pagamento}
- Garantia: {garantia_pos_venda}

### Sobre o Lead:
- Nome: {lead_nome}
- Telefone: {lead_celular}
- Status: {status_lead} ({status_descricao})
{dados_lead_formatados}
"""
```

### 14.5 Secao 5 - Tools

```python
SECAO_5_TOOLS = """
## TOOLS DISPONIVEIS

VOCE TEM ACESSO AS SEGUINTES FUNCOES:

1. **updateConsumo(consumo)** - OBRIGATORIO apos cliente informar valor da conta
   - Registra consumo e qualifica automaticamente
   - Parametro: valor informado pelo cliente (ex: "450 reais")

2. **updateLead(telhado?, forma_pagamento?, prioridade?)** - OBRIGATORIO apos telhado ou pagamento
   - Atualiza dados estruturados do lead
   - telhado: ceramico, metalico, laje, fibrocimento
   - forma_pagamento: a_vista, cartao, financiamento
   - prioridade: urgente, breve, pesquisando

3. **updateFinal(resumo, interesse)** - Ao finalizar qualificacao
   - Gera resumo final do atendimento
   - interesse: true se cliente quer continuar

4. **notificaConsultor(resumo)** - Junto com updateFinal
   - Envia notificacao WhatsApp para vendedor

5. **desativaAtendimento()** - Junto com updateFinal
   - Desativa atendimento automatico

6. **sendFollowupMessage(last_question)** - Para follow-up
   - Gera mensagem de retomada contextual

7. **salvarDado(campo, valor)** - Para dados gerais
   - Salva tipo_propriedade, cidade, expansao, etc.

### REGRA DE OURO:
EXECUTE A TOOL NO MOMENTO CERTO.
NAO espere o cliente confirmar.
NAO peca confirmacao antes de executar.
Executou? Siga para proxima pergunta!
"""
```

### 14.6 Secao 6 - Fluxo

```python
SECAO_6_FLUXO = """
## FLUXO DE QUALIFICACAO

Siga EXATAMENTE esta ordem (pule apenas se config permitir):

ETAPA 1 - TIPO DE PROPRIEDADE
- Pergunta: "E pra casa ou empresa?"
- Tool: salvarDado("tipo_propriedade", valor)
- Valores: residencial, comercial, rural, industria

ETAPA 2 - CIDADE
- Pergunta: "De qual cidade voce e?"
- Tool: salvarDado("cidade", valor)

ETAPA 3 - CONSUMO (CRITICO!)
- Pergunta: "Quanto paga de luz por mes, em media?"
- Tool: updateConsumo(valor) <- OBRIGATORIO!
- Se >= R$ {threshold}: lead qualificado

ETAPA 4 - EXPANSAO (opcional)
- Pergunta: "Pretende aumentar o consumo?"
- Tool: salvarDado("expansao", valor)

ETAPA 5 - TELHADO (CRITICO!)
- Pergunta: "Qual tipo de telhado?"
- Tool: updateLead(telhado=valor) <- OBRIGATORIO!

ETAPA 6 - PRIORIDADE (opcional)
- Pergunta: "Qual sua prioridade?"
- Tool: salvarDado("prioridade", valor)

ETAPA 7 - PAGAMENTO (opcional)
- Pergunta: "Preferencia de pagamento?"
- Tool: updateLead(forma_pagamento=valor) <- OBRIGATORIO!

ETAPA 8 - FINALIZACAO (CRITICO!)
- Pergunta: "Posso agendar visita tecnica gratuita?"
- Se SIM: updateFinal() + notificaConsultor() + desativaAtendimento()
- Se NAO: agradecer e desativaAtendimento()
"""
```

### 14.7 Secao 8 - Regras Rigidas

```python
SECAO_8_REGRAS_RIGIDAS = """
## REGRAS RIGIDAS - NUNCA VIOLE!

### PROIBIDO:
- Inventar potencia do sistema ("voce precisa de 5kWp")
- Inventar valores de economia ("voce economiza R$ 400")
- Inventar precos ("o sistema custa R$ 30.000")
- Fornecer email da empresa (CONFIDENCIAL!)
- Mostrar codigos de funcoes na mensagem
- Mostrar parametros JSON ou tecnicos
- Conversar sobre assuntos nao relacionados a solar
- Pular execucao de tools obrigatorias
- Continuar atendimento apos desativaAtendimento()

### OBRIGATORIO:
- Executar updateConsumo SEMPRE apos valor da conta
- Executar updateLead SEMPRE apos telhado
- Executar updateLead SEMPRE apos pagamento
- Executar TRIO FINAL ao finalizar
- Variar expressoes (nao seja robotico!)
- Retornar ao fluxo apos responder duvida
- Respeitar limites de palavras/quebras
"""
```

### 14.8 Secao 9 - Output Limpo

```python
SECAO_9_OUTPUT_LIMPO = """
## OUTPUT LIMPO

SUA RESPOSTA DEVE:
- Parecer mensagem natural de WhatsApp
- NAO conter nomes de funcoes
- NAO conter colchetes ou parenteses tecnicos
- NAO revelar que voce e uma IA (exceto se perguntado diretamente)

EXECUCAO DE TOOLS E INVISIVEL PARA O CLIENTE.

RUIM:
"Vou executar updateConsumo(450) para registrar..."
"[updateLead chamado com telhado=ceramico]"

BOM:
"Otimo, conta de R$ 450! Com esse consumo voce tem um bom potencial!"
"Perfeito, telhado ceramica e o mais comum! E sobre a forma de pagamento?"
"""
```

---

## 15. IMPLEMENTACAO DO BACKEND PYTHON

### 15.1 Estrutura de Diretorios

```
SOLAR-AGENT-LG/
├── src/
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── graph.py          # LangGraph agent principal
│   │   ├── prompts.py        # System prompts
│   │   ├── state.py          # AgentState definition
│   │   └── tools/
│   │       ├── __init__.py
│   │       ├── update_consumo.py
│   │       ├── update_lead.py
│   │       ├── update_final.py
│   │       ├── desativa_atendimento.py
│   │       ├── notifica_consultor.py
│   │       ├── send_followup.py
│   │       └── salvar_dado.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app
│   │   └── routes/
│   │       ├── webhook.py    # POST /webhook/{company_id}
│   │       └── health.py     # GET /health
│   ├── services/
│   │   ├── __init__.py
│   │   ├── redis_service.py
│   │   ├── supabase_service.py
│   │   ├── uazapi_service.py
│   │   ├── vision_service.py
│   │   ├── audio_service.py
│   │   └── buffer_service.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py         # Settings/env vars
│   │   └── logging.py
│   └── utils/
│       ├── __init__.py
│       ├── paid_traffic.py
│       └── customization.py
├── tests/
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

### 15.2 Dependencias Python

```txt
# requirements.txt
langgraph>=0.2.0
langchain>=0.3.0
langchain-openai>=0.2.0
fastapi>=0.115.0
uvicorn>=0.32.0
redis>=5.0.0
supabase>=2.0.0
httpx>=0.27.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-multipart>=0.0.9
pillow>=10.0.0
openai>=1.50.0
python-dotenv>=1.0.0
```

---

## 16. DECISOES DE ARQUITETURA

### 16.1 Por que LangGraph?

| Recurso | OpenAI Direto | LangGraph |
|---------|--------------|-----------|
| Memoria persistente | Manual | Checkpointer integrado |
| Tools/Function Calling | Manual | Automatico com ReAct |
| Estado entre requisicoes | Manual | StateGraph |
| Interrupcoes humanas | Complexo | human-in-the-loop nativo |
| Observabilidade | Manual | LangSmith integrado |

### 16.2 Por que Redis + PostgreSQL?

```
Redis (cache quente):
- Buffer de mensagens (3-5s TTL)
- Historico recente (ultimas 20)
- Idempotencia (TTL curto)
- Rate limiting
- Cache de empresas

PostgreSQL (persistencia):
- Leads, empresas, mensagens
- Checkpointer do LangGraph
- Store (memoria longa)
- Auditoria completa
```

### 16.3 Fluxo de Dados Simplificado

```
UAZAPI → Next.js Webhook → Backend Python
                              ↓
                         Buffer (Redis)
                              ↓
                         AI Agent (LangGraph)
                              ↓
                    ┌────────┴────────┐
                    ↓                 ↓
              Tools (Supabase)   Resposta
                    ↓                 ↓
              Salva dados      Envia via UAZAPI
```

---

*Documento gerado a partir da analise dos projetos UazapiSolar e CRM-SDR-AI*
*Versao: 2.0*
*Data: 2025-12-30*
