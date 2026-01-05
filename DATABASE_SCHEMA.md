# Schema do Banco de Dados - SAAS-SOLAR

## Visão Geral

Sistema de CRM e Gestão para Empresas de Energia Solar com suporte a multi-tenancy, IA, WhatsApp e follow-up automático.

## Diagrama de Entidades

```
MULTI-TENANCY
├── Company (Empresas)
└── User (Usuários)
    ├── Session
    ├── RefreshToken
    └── ApiKey

ASSINATURAS
├── Plan (Planos)
├── Subscription (Assinaturas)
└── Payment (Pagamentos)

CRM
├── LeadStatus (Funil de vendas)
└── Lead (Clientes potenciais)
    ├── LeadNote (Anotações)
    └── LeadActivity (Histórico)

SOLAR
├── SolarSystem (Sistemas instalados)
│   └── SystemImage
└── Simulation (Simulações)

WHATSAPP
├── WhatsAppInstance (Conexões)
├── WhatsAppMessage (Mensagens)
└── WhatsAppTemplate (Templates)

AUTOMAÇÃO
├── AIConfig (Configurações de IA)
├── FollowUpRule (Regras)
└── FollowUp (Execuções)

SISTEMA
├── AuditLog (Auditoria)
└── Notification (Notificações)
```

## Tabelas Principais

### 1. MULTI-TENANCY

#### Company
Empresas cadastradas no sistema (clientes do SAAS).

Campos principais:
- `name`: Nome da empresa
- `cnpj`: CNPJ
- `email`, `phone`: Contato
- `logo`, `primaryColor`: Personalização
- `isActive`: Status

#### User
Usuários que trabalham nas empresas.

Campos principais:
- `clerkId`: ID do Clerk (autenticação)
- `email`, `name`, `avatar`: Dados pessoais
- `companyId`: Empresa vinculada
- `role`: Papel (SUPER_ADMIN, ADMIN, MANAGER, SELLER, SUPPORT, USER)
- `twoFactorEnabled`: Autenticação 2FA

### 2. ASSINATURAS

#### Plan
Planos disponíveis no SAAS.

Tipos:
- **CRM_VOZ**: Gestão básica (R$ 97/mês)
- **IA_ATENDIMENTO**: Com IA (R$ 197/mês)
- **IA_ATENDIMENTO_FOLLOW**: IA + Follow-up (R$ 397/mês)

Campos principais:
- `hasAI`: Tem IA?
- `hasFollowup`: Tem follow-up?
- `maxUsers`, `maxLeads`, `maxWhatsApp`: Limites
- `priceMonthly`, `priceYearly`: Preços

#### Subscription
Assinatura ativa da empresa.

Campos principais:
- `companyId`: Empresa
- `planId`: Plano contratado
- `status`: ACTIVE, CANCELED, PAST_DUE, TRIALING
- `stripeSubscriptionId`: ID no Stripe
- `currentPeriodStart`, `currentPeriodEnd`: Período

#### Payment
Pagamentos realizados.

Campos principais:
- `subscriptionId`: Assinatura
- `amount`: Valor
- `status`: PENDING, COMPLETED, FAILED
- `method`: CREDIT_CARD, PIX, BOLETO
- `stripePaymentId`: ID no Stripe

### 3. CRM SOLAR

#### LeadStatus
Status do funil de vendas (personalizável por empresa).

Campos principais:
- `companyId`: Empresa
- `name`: Nome do status (ex: "Novo Lead", "Em Negociação")
- `color`: Cor (hex)
- `order`: Ordem no kanban
- `isInitial`, `isFinal`, `isWon`, `isLost`: Flags

#### Lead
Cliente em potencial.

Campos principais:
- `companyId`: Empresa
- `statusId`: Status atual no funil
- `assignedToId`: Vendedor responsável
- `name`, `email`, `phone`: Contato
- `whatsappId`: ID do WhatsApp (5511999999999@s.whatsapp.net)
- `source`: WHATSAPP, FACEBOOK, INSTAGRAM, GOOGLE, etc.
- `priority`: LOW, MEDIUM, HIGH, URGENT
- `averageEnergyBill`: Conta de luz média
- `systemType`: RESIDENCIAL, COMERCIAL, RURAL, INVESTIMENTO
- `estimatedValue`: Valor estimado da venda
- `tags`: Array de tags

#### LeadNote
Anotações sobre o lead.

Campos principais:
- `leadId`: Lead
- `userId`: Autor
- `content`: Conteúdo
- `isPinned`: Fixada?

#### LeadActivity
Histórico de atividades.

Tipos:
- CALL, EMAIL, WHATSAPP, MEETING, NOTE
- STATUS_CHANGE, SIMULATION, PROPOSAL, CONTRACT

Campos principais:
- `leadId`: Lead
- `type`: Tipo
- `title`, `description`: Descrição
- `metadata`: Dados adicionais (JSON)
- `scheduledFor`, `completedAt`: Datas

### 4. SISTEMAS FOTOVOLTAICOS

#### SolarSystem
Sistemas instalados ou propostos.

Campos principais:
- `companyId`: Empresa
- `leadId`: Lead (cliente)
- `type`: RESIDENCIAL, COMERCIAL, RURAL, INVESTIMENTO
- `installedPower`: Potência instalada (kWp)
- `numberOfPanels`: Quantidade de painéis
- `panelPower`: Potência do painel (W)
- `inverterModel`: Modelo do inversor
- `monthlyGeneration`: Geração mensal (kWh)
- `monthlySavings`: Economia mensal (R$)
- `annualSavings`: Economia anual (R$)
- `paybackPeriod`: Payback (meses)
- `totalCost`: Custo total
- `installationDate`: Data de instalação

#### SystemImage
Imagens do sistema.

#### Simulation
Simulações de economia.

Campos principais:
- `averageEnergyBill`: Conta de luz média
- `systemType`: Tipo de sistema
- `recommendedPower`: Potência recomendada
- `estimatedCost`: Custo estimado
- `monthlyGeneration`: Geração estimada
- `monthlySavings`: Economia mensal
- `paybackPeriod`: Payback
- `roi`: ROI (%)

### 5. WHATSAPP

#### WhatsAppInstance
Instâncias/conexões do WhatsApp.

Campos principais:
- `companyId`: Empresa
- `name`: Nome da instância
- `phoneNumber`: Número
- `apiKey`, `instanceId`: Credenciais UAZAPI
- `isConnected`: Conectado?
- `qrCode`: QR Code para conectar

#### WhatsAppMessage
Mensagens enviadas/recebidas.

Campos principais:
- `instanceId`: Instância
- `leadId`: Lead relacionado
- `externalId`: ID do UAZAPI
- `direction`: INBOUND, OUTBOUND
- `status`: PENDING, SENT, DELIVERED, READ, FAILED
- `from`, `to`: Remetente e destinatário
- `messageType`: text, image, audio, video, document
- `content`: Conteúdo
- `mediaUrl`: URL da mídia

#### WhatsAppTemplate
Templates de mensagens.

Campos principais:
- `instanceId`: Instância
- `name`: Nome do template
- `category`: greeting, follow_up, simulation
- `content`: Conteúdo (com variáveis)
- `variables`: Variáveis disponíveis

### 6. IA E AUTOMAÇÃO

#### AIConfig
Configurações de IA por empresa.

Campos principais:
- `companyId`: Empresa
- `provider`: openai, anthropic
- `model`: gpt-4, claude-3
- `temperature`: Criatividade
- `systemPrompt`: Prompt do sistema
- `greetingMessage`: Mensagem de boas-vindas
- `autoResponseEnabled`: Auto-resposta ativa?
- `followUpEnabled`: Follow-up ativo?
- `businessHoursStart`, `businessHoursEnd`: Horário de funcionamento

#### FollowUpRule
Regras de follow-up automático.

Campos principais:
- `companyId`: Empresa
- `name`: Nome da regra
- `statusId`: Aplicar para status específico (opcional)
- `daysAfterLastContact`: Dias após último contato
- `messageTemplate`: Template da mensagem
- `maxAttempts`: Máximo de tentativas
- `intervalDays`: Intervalo entre tentativas

#### FollowUp
Execuções de follow-up.

Campos principais:
- `ruleId`: Regra
- `leadId`: Lead
- `status`: PENDING, SENT, DELIVERED, RESPONDED, FAILED
- `attemptNumber`: Número da tentativa
- `scheduledFor`: Agendado para
- `sentAt`, `deliveredAt`, `respondedAt`: Timestamps

### 7. SISTEMA

#### AuditLog
Log de auditoria.

Campos principais:
- `companyId`: Empresa
- `userId`: Usuário
- `action`: Ação realizada
- `entity`, `entityId`: Entidade afetada
- `oldData`, `newData`: Dados antes/depois (JSON)
- `ipAddress`, `userAgent`: Informações da requisição

#### Notification
Notificações.

Campos principais:
- `companyId`: Empresa
- `fromUserId`, `toUserId`: De/Para
- `title`, `message`: Conteúdo
- `priority`: LOW, MEDIUM, HIGH, CRITICAL
- `isRead`: Lida?

## Relacionamentos Principais

```
Company (1) ──< (N) User
Company (1) ──< (1) Subscription
Company (1) ──< (N) Lead
Company (1) ──< (N) LeadStatus
Company (1) ──< (N) SolarSystem
Company (1) ──< (N) WhatsAppInstance
Company (1) ──< (1) AIConfig

Lead (1) ──< (N) LeadNote
Lead (1) ──< (N) LeadActivity
Lead (1) ──< (N) Simulation
Lead (1) ──< (N) SolarSystem
Lead (1) ──< (N) WhatsAppMessage

WhatsAppInstance (1) ──< (N) WhatsAppMessage
WhatsAppInstance (1) ──< (N) WhatsAppTemplate

FollowUpRule (1) ──< (N) FollowUp
```

## Índices Importantes

```sql
-- Performance em queries frequentes
INDEX idx_lead_company ON leads(company_id)
INDEX idx_lead_status ON leads(status_id)
INDEX idx_lead_phone ON leads(phone)
INDEX idx_lead_whatsapp ON leads(whatsapp_id)
INDEX idx_lead_created ON leads(created_at)

INDEX idx_message_instance ON whatsapp_messages(instance_id)
INDEX idx_message_lead ON whatsapp_messages(lead_id)
INDEX idx_message_from ON whatsapp_messages(from)
INDEX idx_message_created ON whatsapp_messages(created_at)

INDEX idx_activity_lead ON lead_activities(lead_id)
INDEX idx_activity_type ON lead_activities(type)

INDEX idx_followup_scheduled ON follow_ups(scheduled_for)
INDEX idx_followup_status ON follow_ups(status)
```

## Migração do Sistema Antigo

### Mapeamento de Tabelas

```
ANTIGA                          NOVA
─────────────────────────────────────────────
acessos_fotovoltaico      →     companies + users
sistemas_fotovoltaicos    →     solar_systems
contatos_fotovoltaico     →     leads
status_leads_fotovoltaico →     lead_statuses
```

### Script de Migração

```typescript
// Exemplo de migração de contatos
const oldContacts = await supabase
  .from('contatos_fotovoltaico')
  .select('*')

for (const contact of oldContacts.data) {
  await prisma.lead.create({
    data: {
      name: contact.nome,
      email: contact.email,
      phone: contact.telefone,
      whatsappId: formatPhoneToWhatsApp(contact.telefone),
      companyId: mapCompanyId(contact.empresa_id),
      statusId: mapStatusId(contact.status_id),
      source: contact.origem || 'WHATSAPP',
      averageEnergyBill: contact.conta_luz_media,
      systemType: contact.tipo_sistema,
      tags: contact.tags || [],
    }
  })
}
```

## Boas Práticas

### 1. Multi-tenancy
- SEMPRE filtrar por `companyId`
- Usar middleware no Prisma para injetar filtro
- Validar acesso em todas as queries

### 2. Soft Delete
- Usar `isActive: false` ao invés de deletar
- Manter histórico completo
- Implementar limpeza periódica de dados antigos

### 3. Auditoria
- Registrar todas as alterações importantes
- Usar hooks do Prisma para audit log automático
- Manter IP e User-Agent

### 4. Performance
- Usar índices adequados
- Paginar resultados grandes
- Cache de dados frequentes (Redis)
- Otimizar queries N+1

### 5. Validação
- Validar no cliente E no servidor
- Usar Zod para schemas
- Sanitizar inputs
- Validar permissões

## Comandos Úteis

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations
npx prisma migrate deploy

# Abrir Prisma Studio
npx prisma studio

# Seed inicial
npx tsx prisma/seed.ts

# Reset completo
npx prisma migrate reset
```

## Variáveis de Ambiente

```env
DATABASE_URL="postgresql://user:password@localhost:5432/saas_solar"
```

## Backup e Manutenção

```bash
# Backup diário
pg_dump -h localhost -U user -d saas_solar > backup_$(date +%Y%m%d).sql

# Restore
psql -h localhost -U user -d saas_solar < backup.sql

# Análise de performance
EXPLAIN ANALYZE SELECT ...
```
