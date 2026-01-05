# MAPEAMENTO COMPLETO - SAAS-SOLAR

## Varredura Realizada em 29/12/2025

---

# PARTE 1: BANCO DE DADOS (SUPABASE)

## Tabelas Fotovoltaico (6 tabelas principais)

### 1. acessos_fotovoltaico (Empresas) - 38 colunas

| # | Coluna | Tipo | Descricao |
|---|--------|------|-----------|
| 1 | id | integer | PK auto-increment |
| 2 | empresa | character varying(255) | Nome identificador |
| 3 | email | character varying(255) | Email de acesso |
| 4 | senha | character varying(255) | Senha hash |
| 5 | created_at | timestamp with time zone | Data criacao |
| 6 | updated_at | timestamp with time zone | Data atualizacao |
| 7 | dados_completos_preenchidos | boolean | Flag perfil completo |
| 8 | nome_atendente | character varying(255) | Nome do atendente IA |
| 9 | nome_empresa | character varying(255) | Nome comercial |
| 10 | endereco_completo | text | Endereco completo |
| 11 | cidade | character varying(100) | Cidade |
| 12 | link_google_maps | text | URL Google Maps |
| 13 | horario_funcionamento | text | Horario de funcionamento |
| 14 | fuso_horario | character varying(50) | Fuso horario |
| 15 | site_empresa | text | URL do site |
| 16 | instagram_empresa | character varying(255) | @ do Instagram |
| 17 | formas_pagamento | text | Formas de pagamento |
| 18 | garantia_pos_venda | text | Texto garantia |
| 19 | informacoes_complementares | text | Info extra |
| 20 | webhook_url | text | URL webhook UAZAPI |
| 21 | uazapi_instancia | character varying(255) | Instancia UAZAPI |
| 22 | numero_atendimento | character varying(20) | Numero atendimento |
| 23 | whatsapp_status | character varying(50) | Status conexao |
| 24 | whatsapp_numero | character varying(20) | Numero WhatsApp |
| 25 | token_whatsapp | text | Token UAZAPI |
| 26 | notification_webhook_url | text | URL notificacoes |
| 27 | slug | character varying(100) | Slug unico |
| 28 | atender_apenas_trafego | boolean | Apenas trafego pago |
| 29 | modelo_ia | character varying(50) | Modelo OpenAI |
| 30 | status_plano | character varying(20) | ativo/inativo/pendente |
| 31 | produto_plano | character varying(50) | Tipo do plano |
| 32 | followup_ativo | boolean | Follow-up habilitado |
| 33 | followup_habilitado_em | timestamp with time zone | Data ativacao |
| 34 | intervalo_follow_1 | integer | Horas para 1o follow |
| 35 | intervalo_follow_2 | integer | Horas para 2o follow |
| 36 | intervalo_follow_3 | integer | Horas para 3o follow |
| 37 | janela_ativa_horas | integer | Janela ativa em horas |
| 38 | max_tentativas_por_ciclo | integer | Max tentativas |

---

### 2. contatos_fotovoltaico (Leads) - 24 colunas

| # | Coluna | Tipo | Descricao |
|---|--------|------|-----------|
| 1 | id | integer | PK auto-increment |
| 2 | id_empresa | integer | FK para empresa |
| 3 | nome | character varying(255) | Nome do lead |
| 4 | celular | character varying(20) | Celular original |
| 5 | potencia_consumo_medio | character varying(50) | Consumo mensal |
| 6 | atendimento_automatico | boolean | IA ativa? |
| 7 | status_lead_id | integer | FK para status |
| 8 | observacoes_status | text | Observacoes |
| 9 | created_on | timestamp with time zone | Data criacao |
| 10 | last_update | timestamp with time zone | Ultima atualizacao |
| 11 | stage | character varying(50) | Estagio (legado) |
| 12 | celular_formatado | character varying(20) | Formato 55DDDNNN |
| 13 | celular_valido | boolean | Celular valido? |
| 14 | follow_stage | integer | Estagio follow-up |
| 15 | follow_ativo | boolean | Follow-up ativo |
| 16 | bloqueado | boolean | Lead bloqueado |
| 17 | origem | character varying(50) | Origem do lead |
| 18 | ultimo_follow | timestamp with time zone | Data ultimo follow |
| 19 | ultima_ligacao_id | character varying(100) | ID da ligacao |
| 20 | ultima_ligacao_status | character varying(50) | Status ligacao |
| 21 | ultima_ligacao_duracao | integer | Duracao em segundos |
| 22 | ultima_ligacao_data | timestamp with time zone | Data da ligacao |
| 23 | ultima_ligacao_gravacao | text | URL gravacao |
| 24 | etapa_atual | integer | Etapa qualificacao |
| 25 | dados_coletados | jsonb | Dados qualificacao |

---

### 3. status_leads_fotovoltaico (Kanban) - 6 colunas

| # | Coluna | Tipo | Descricao |
|---|--------|------|-----------|
| 1 | id | integer | PK auto-increment |
| 2 | nome | character varying(100) | Nome do status |
| 3 | cor | character varying(20) | Cor hex (#XXXXXX) |
| 4 | ordem | integer | Ordem no Kanban |
| 5 | ativo | boolean | Status ativo? |
| 6 | created_at | timestamp with time zone | Data criacao |

**Status Padrao:**
1. Novo Lead (#3B82F6)
2. Contato Feito (#10B981)
3. Qualificado (#8B5CF6)
4. Proposta Enviada (#F59E0B)
5. Negociacao (#EF4444)
6. Fechado (#059669)
7. Perdido (#6B7280)

---

### 4. sistemas_fotovoltaicos (Catalogo) - 12 colunas

| # | Coluna | Tipo | Descricao |
|---|--------|------|-----------|
| 1 | id | integer | PK auto-increment |
| 2 | empresa_id | integer | FK para empresa |
| 3 | tipo_sistema | character varying(50) | RESIDENCIAL/COMERCIAL/RURAL/INVESTIMENTO |
| 4 | descricao | text | Descricao do sistema |
| 5 | imagem1 | text | URL imagem 1 |
| 6 | imagem2 | text | URL imagem 2 |
| 7 | created_at | timestamp with time zone | Data criacao |
| 8 | updated_at | timestamp with time zone | Data atualizacao |
| 9 | potencia_usina | character varying(50) | Potencia kWp |
| 10 | economia_anual | character varying(50) | Economia estimada |
| 11 | nome_cliente | character varying(255) | Nome/Cliente |
| 12 | detalhes | text | Detalhes tecnicos |

---

### 5. conversas_fotovoltaico (Threads) - 10 colunas

| # | Coluna | Tipo | Descricao |
|---|--------|------|-----------|
| 1 | id | integer | PK auto-increment |
| 2 | empresa_id | integer | FK para empresa |
| 3 | contato_id | integer | FK para lead |
| 4 | thread_id | character varying(255) | ID unico: company:phone |
| 5 | etapa_funil | character varying(50) | Etapa do funil |
| 6 | status | character varying(50) | ativa/encerrada |
| 7 | ultimo_contato | timestamp with time zone | Ultima interacao |
| 8 | created_at | timestamp with time zone | Data criacao |
| 9 | updated_at | timestamp with time zone | Data atualizacao |
| 10 | metadata | jsonb | Dados extras |

---

### 6. mensagens_fotovoltaico (Historico) - 8 colunas

| # | Coluna | Tipo | Descricao |
|---|--------|------|-----------|
| 1 | id | integer | PK auto-increment |
| 2 | conversa_id | integer | FK para conversa |
| 3 | role | character varying(20) | user/assistant/system |
| 4 | content | text | Conteudo da mensagem |
| 5 | tool_calls | jsonb | Ferramentas executadas |
| 6 | message_id | character varying(100) | ID original UAZAPI |
| 7 | created_at | timestamp with time zone | Data criacao |
| 8 | metadata | jsonb | Dados extras |

---

# PARTE 2: FRONTEND (NEXT.JS)

## Estrutura de Arquivos

```
src/
├── app/
│   ├── (auth)/
│   │   └── auth/
│   │       ├── sign-in/page.tsx    # Login
│   │       └── sign-up/page.tsx    # Registro
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── page.tsx            # Dashboard principal
│   │       ├── contatos/page.tsx   # Lista de leads
│   │       ├── kanban/page.tsx     # Kanban de leads
│   │       ├── sistemas/page.tsx   # Catalogo solar
│   │       ├── empresa/page.tsx    # Config empresa
│   │       ├── ia-config/page.tsx  # Config IA
│   │       ├── whatsapp/page.tsx   # Config WhatsApp
│   │       └── assinatura/page.tsx # Planos
│   └── api/                        # API Routes
├── components/                     # Componentes UI
├── contexts/
│   └── AuthContext.tsx             # Contexto de auth
├── services/
│   ├── auth.ts                     # Servico auth
│   ├── contatos.ts                 # Servico contatos
│   ├── empresa.ts                  # Servico empresa
│   ├── dashboard.ts                # Servico dashboard
│   ├── sistemas.ts                 # Servico sistemas
│   └── status-leads.ts             # Servico status
└── types/
    └── database.ts                 # Tipos TypeScript
```

---

## Paginas e Formularios

### 1. /dashboard (Dashboard Principal)

**Funcionalidade:** Visao geral do sistema

**Dados Exibidos:**
- Total de leads
- Sistemas cadastrados
- Leads hoje/semana/mes
- Leads por status
- Leads recentes (5 ultimos)

**Services Usados:**
- `getDashboardStats(empresaId)`
- `getSistemasCount(empresaId)`
- `getContatosRecentesComStatus(empresaId, limit)`

**Tabelas Consultadas:**
- `contatos_fotovoltaico`
- `sistemas_fotovoltaicos`
- `status_leads_fotovoltaico`

---

### 2. /dashboard/empresa (Configuracoes da Empresa)

**Funcionalidade:** Dados cadastrais da empresa

**4 Abas:**
1. Dados Basicos
2. Contato
3. Comercial
4. Seguranca (senha)

**Formulario (12 campos):**
```typescript
{
  nome_atendente: string;      // Tab: Dados
  nome_empresa: string;        // Tab: Dados
  endereco_completo: string;   // Tab: Contato
  cidade: string;              // Tab: Dados
  link_google_maps: string;    // Tab: Contato
  horario_funcionamento: string; // Tab: Comercial
  fuso_horario: string;        // Tab: Comercial
  site_empresa: string;        // Tab: Contato
  instagram_empresa: string;   // Tab: Contato
  formas_pagamento: string;    // Tab: Comercial
  garantia_pos_venda: string;  // Tab: Comercial
  informacoes_complementares: string; // Tab: Comercial
}
```

**Services Usados:**
- `getEmpresaData(empresaId)`
- `updateEmpresaBasicData(empresaId, data)`
- `getPerfilCompletude(empresa)`

**Tabela:** `acessos_fotovoltaico`

---

### 3. /dashboard/ia-config (Configuracoes de IA)

**Funcionalidade:** Configurar comportamento da IA

**3 Abas:**
1. Geral
2. Modelo
3. Follow-up

**Formularios:**

**IAConfig:**
```typescript
{
  atender_apenas_trafego: boolean;  // Tab: Geral
  followup_ativo: boolean;          // Tab: Follow-up
  modelo_ia: string;                // Tab: Modelo
}
```

**FollowUpConfig:**
```typescript
{
  followup_ativo: boolean;          // Tab: Follow-up
  intervalo_follow_1: number;       // Tab: Follow-up (horas)
  intervalo_follow_2: number;       // Tab: Follow-up (horas)
  intervalo_follow_3: number;       // Tab: Follow-up (horas)
  janela_ativa_horas: number;       // Tab: Follow-up
  max_tentativas_por_ciclo: number; // Tab: Follow-up
}
```

**Modelos Disponiveis:**
- gpt-4o-mini (padrao)
- gpt-4o
- gpt-4-turbo
- gpt-3.5-turbo

**Services Usados:**
- `getEmpresaData(empresaId)`
- `updateIAConfig(empresaId, config)`
- `updateFollowUpConfig(empresaId, config)`

**Tabela:** `acessos_fotovoltaico`

---

### 4. /dashboard/whatsapp (Integracao WhatsApp)

**Funcionalidade:** Conectar/configurar WhatsApp

**4 Abas:**
1. Conexao (QR Code ou Paircode)
2. Configuracoes
3. Templates
4. Estatisticas

**Estados de Conexao:**
- `not_created`: Instancia nao criada
- `disconnected`: Desconectado
- `connecting`: Conectando
- `connected`: Conectado
- `error`: Erro

**Configuracoes:**
```typescript
{
  webhook_url: string;
  uazapi_instancia: string;
  numero_atendimento: string;
  whatsapp_status: string;
  whatsapp_numero: string;
  token_whatsapp: string;
}
```

**Services Usados:**
- `getEmpresaData(empresaId)`
- `updateWhatsAppConfig(empresaId, config)`

**Tabela:** `acessos_fotovoltaico`

---

### 5. /dashboard/contatos (Lista de Leads)

**Funcionalidade:** Listar/gerenciar leads

**Campos Exibidos na Tabela:**
| Coluna | Campo DB |
|--------|----------|
| Nome | nome |
| Telefone | celular |
| Status | status_lead_id -> status_leads_fotovoltaico |
| Origem | origem |
| Consumo | potencia_consumo_medio |
| Cadastro | created_on |

**Filtros:**
- Busca por nome/telefone (searchTerm)
- Filtro por status (filterStatus)

**Acoes:**
- WhatsApp (link externo)
- Ligar (tel:)
- Ver detalhes
- Editar
- Excluir

**Services Usados:**
- `getContatos(empresaId)`
- `getStatusLeads()`
- `deleteContato(contatoId)`

**Tabelas:**
- `contatos_fotovoltaico`
- `status_leads_fotovoltaico`

---

### 6. /dashboard/kanban (Pipeline Visual)

**Funcionalidade:** Kanban drag-and-drop de leads

**Dados do Lead no Card:**
```typescript
{
  id: string;
  name: string;      // nome
  phone: string;     // celular
  status: string;    // status_lead_id
  source: string;    // origem
  createdAt: string; // created_on (relativo)
  updatedAt: string; // last_update (relativo)
  potencia?: string; // potencia_consumo_medio
}
```

**Filtros:**
- Busca por nome/telefone
- Filtro por origem

**Acoes:**
- Drag & Drop (mover entre colunas)
- Adicionar lead
- Editar lead
- Excluir lead
- Ver lead

**Services Usados:**
- `getContatosParaKanban(empresaId)`
- `getStatusLeads()`
- `updateContatoStatus(contatoId, statusId)`
- `deleteContato(contatoId)`

**Tabelas:**
- `contatos_fotovoltaico`
- `status_leads_fotovoltaico`

---

### 7. /dashboard/sistemas (Catalogo Solar)

**Funcionalidade:** Gerenciar portfolio de sistemas

**Interface Sistema:**
```typescript
{
  id: string;
  empresa_id: string;
  tipo_sistema: "RESIDENCIAL" | "COMERCIAL" | "RURAL" | "INVESTIMENTO";
  descricao: string | null;
  imagem1: string | null;
  imagem2: string | null;
  potencia_usina: string | null;
  economia_anual: string | null;
  nome_cliente: string | null;
  detalhes: string | null;
  created_at: string | null;
  updated_at: string | null;
}
```

**Formulario (8 campos):**
```typescript
{
  tipo_sistema: TipoSistema;
  nome_cliente: string;
  descricao: string;
  potencia_usina: string;
  economia_anual: string;
  detalhes: string;
  imagem1: string;
  imagem2: string;
}
```

**Filtros:**
- Busca por nome/descricao
- Filtro por tipo

**Views:**
- Grid (cards)
- List (tabela)

**API Routes:**
- GET `/api/systems?empresaId=X&tipo=Y&search=Z`
- POST `/api/systems`
- PATCH `/api/systems/{id}`
- DELETE `/api/systems/{id}`

**Tabela:** `sistemas_fotovoltaicos`

---

### 8. /dashboard/assinatura (Planos)

**Funcionalidade:** Gerenciar assinatura

**2 Abas:**
1. Meu Plano
2. Planos Disponiveis

**Planos Disponiveis:**
```typescript
const PLANOS = [
  {
    id: "CRM POR VOZ",
    name: "CRM + Voz",
    price: 197,
  },
  {
    id: "IA ATENDIMENTO",
    name: "IA Atendimento",
    price: 397,
    popular: true,
  },
  {
    id: "IA ATENDIMENTO + FOLLOW",
    name: "IA + Follow-up",
    price: 597,
  },
];
```

**Status do Plano:**
- `ativo`: Verde
- `pendente`: Amarelo
- `inativo`: Vermelho

**Services Usados:**
- `getEmpresaData(empresaId)`
- `updatePlano(empresaId, { status_plano, produto_plano })`

**Tabela:** `acessos_fotovoltaico`

---

# PARTE 3: MAPEAMENTO FRONTEND <-> BANCO

## Tabela de Correspondencia

### acessos_fotovoltaico (Empresas)

| Pagina | Campo Frontend | Coluna DB | Status |
|--------|----------------|-----------|--------|
| empresa | nome_atendente | nome_atendente | OK |
| empresa | nome_empresa | nome_empresa | OK |
| empresa | endereco_completo | endereco_completo | OK |
| empresa | cidade | cidade | OK |
| empresa | link_google_maps | link_google_maps | OK |
| empresa | horario_funcionamento | horario_funcionamento | OK |
| empresa | fuso_horario | fuso_horario | OK |
| empresa | site_empresa | site_empresa | OK |
| empresa | instagram_empresa | instagram_empresa | OK |
| empresa | formas_pagamento | formas_pagamento | OK |
| empresa | garantia_pos_venda | garantia_pos_venda | OK |
| empresa | informacoes_complementares | informacoes_complementares | OK |
| ia-config | atender_apenas_trafego | atender_apenas_trafego | OK |
| ia-config | modelo_ia | modelo_ia | OK |
| ia-config | followup_ativo | followup_ativo | OK |
| ia-config | intervalo_follow_1 | intervalo_follow_1 | OK |
| ia-config | intervalo_follow_2 | intervalo_follow_2 | OK |
| ia-config | intervalo_follow_3 | intervalo_follow_3 | OK |
| ia-config | janela_ativa_horas | janela_ativa_horas | OK |
| ia-config | max_tentativas_por_ciclo | max_tentativas_por_ciclo | OK |
| whatsapp | webhook_url | webhook_url | OK |
| whatsapp | uazapi_instancia | uazapi_instancia | OK |
| whatsapp | numero_atendimento | numero_atendimento | OK |
| whatsapp | whatsapp_status | whatsapp_status | OK |
| whatsapp | whatsapp_numero | whatsapp_numero | OK |
| whatsapp | token_whatsapp | token_whatsapp | OK |
| assinatura | status_plano | status_plano | OK |
| assinatura | produto_plano | produto_plano | OK |

### contatos_fotovoltaico (Leads)

| Pagina | Campo Frontend | Coluna DB | Status |
|--------|----------------|-----------|--------|
| contatos | nome | nome | OK |
| contatos | celular | celular | OK |
| contatos | status | status_lead_id | OK |
| contatos | origem | origem | OK |
| contatos | potencia | potencia_consumo_medio | OK |
| contatos | created_on | created_on | OK |
| kanban | name | nome | OK |
| kanban | phone | celular | OK |
| kanban | status | status_lead_id | OK |
| kanban | source | origem | OK |
| kanban | createdAt | created_on | OK |
| kanban | updatedAt | last_update | OK |
| kanban | potencia | potencia_consumo_medio | OK |

### sistemas_fotovoltaicos (Catalogo)

| Pagina | Campo Frontend | Coluna DB | Status |
|--------|----------------|-----------|--------|
| sistemas | tipo_sistema | tipo_sistema | OK |
| sistemas | nome_cliente | nome_cliente | OK |
| sistemas | descricao | descricao | OK |
| sistemas | potencia_usina | potencia_usina | OK |
| sistemas | economia_anual | economia_anual | OK |
| sistemas | detalhes | detalhes | OK |
| sistemas | imagem1 | imagem1 | OK |
| sistemas | imagem2 | imagem2 | OK |

---

# PARTE 4: GAPS E PENDENCIAS

## Campos no DB Nao Usados no Frontend

### acessos_fotovoltaico
- `notification_webhook_url` - Nao tem UI para configurar
- `slug` - Nao tem UI para exibir/editar

### contatos_fotovoltaico
- `observacoes_status` - Nao exibido na tabela
- `stage` - Campo legado, nao usado
- `celular_formatado` - Usado internamente
- `celular_valido` - Usado internamente
- `follow_stage` - Nao exibido
- `follow_ativo` - Nao exibido
- `bloqueado` - Nao exibido
- `ultimo_follow` - Nao exibido
- `ultima_ligacao_*` - Nenhum campo de ligacao exibido
- `etapa_atual` - Nao exibido
- `dados_coletados` - Nao exibido

## Paginas Faltantes

1. `/dashboard/contatos/novo` - Formulario de novo contato (referenciado mas nao lido)
2. `/dashboard/contatos/[id]` - Detalhes do contato
3. `/dashboard/contatos/[id]/editar` - Editar contato
4. `/dashboard/sistemas/novo` - Novo sistema (referenciado)

## Funcionalidades Backend Nao Integradas

1. **Conversas/Mensagens** - As tabelas `conversas_fotovoltaico` e `mensagens_fotovoltaico` existem mas nao tem UI no frontend
2. **Historico de Chat** - Nao ha pagina para ver conversas do agente
3. **Qualificacao** - Os campos `etapa_atual` e `dados_coletados` existem mas nao sao editaveis
4. **Follow-up individual** - Campos do lead para follow-up nao sao gerenciaveis

---

# PARTE 5: TIPOS TYPESCRIPT

## Tipos Principais (src/types/database.ts)

```typescript
// Enums
type TipoSistema = 'RESIDENCIAL' | 'COMERCIAL' | 'RURAL' | 'INVESTIMENTO';
type StatusPlano = 'ativo' | 'inativo' | 'pendente';
type ProdutoPlano = 'CRM POR VOZ' | 'IA ATENDIMENTO' | 'IA ATENDIMENTO + FOLLOW';
type WhatsAppStatus = 'not_created' | 'connecting' | 'connected' | 'disconnected';

// Interfaces principais
interface AcessoFotovoltaico { ... }      // 38 campos
interface ContatoFotovoltaico { ... }     // 24 campos
interface StatusLeadFotovoltaico { ... }  // 6 campos
interface SistemaFotovoltaico { ... }     // 12 campos

// Formularios
interface CompanyFormData { ... }         // 12 campos
interface ContatoFormData { ... }         // 7 campos
interface SistemaFormData { ... }         // 8 campos
interface IAConfig { ... }                // 3 campos
interface WhatsAppConfig { ... }          // 3 campos
```

---

# PARTE 6: SERVICES

## Resumo dos Services

| Service | Funcoes | Tabela |
|---------|---------|--------|
| auth.ts | login, logout, getUser | acessos_fotovoltaico |
| empresa.ts | getEmpresaData, updateEmpresaBasicData, updateIAConfig, updateFollowUpConfig, updateWhatsAppConfig, updatePlano | acessos_fotovoltaico |
| contatos.ts | getContatos, createContato, updateContato, deleteContato, getStatusLeads, updateContatoStatus, updateQualificacao, updateFollowUp | contatos_fotovoltaico, status_leads_fotovoltaico |
| dashboard.ts | getDashboardStats, getContatosRecentesComStatus, getSistemasCount | contatos, sistemas, status |
| sistemas.ts | via API Routes | sistemas_fotovoltaicos |
| status-leads.ts | getStatusLeads | status_leads_fotovoltaico |

---

# CONCLUSAO

## Status Geral: ALINHADO

O frontend SAAS-SOLAR esta bem alinhado com o banco de dados. Todos os campos dos formularios tem correspondencia direta nas tabelas.

## Proximos Passos Recomendados

1. **Criar paginas faltantes:**
   - Formulario de novo contato
   - Detalhes do contato
   - Historico de conversas

2. **Expor campos ocultos:**
   - etapa_atual (qualificacao)
   - dados_coletados (dados do lead)
   - follow_stage/follow_ativo (status follow-up)

3. **Integrar conversas:**
   - Criar UI para ver conversas
   - Exibir historico de mensagens

4. **Melhorar UX:**
   - Adicionar notification_webhook_url na config
   - Exibir campos de ligacao nos detalhes do lead

---

*Documento gerado automaticamente - 29/12/2025*
