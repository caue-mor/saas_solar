# SAAS-SOLAR

Sistema de CRM e Gestão Completo para Empresas de Energia Solar com IA, WhatsApp e Follow-up Automático.

## Características Principais

- **Multi-tenancy**: Múltiplas empresas no mesmo sistema
- **Autenticação Segura**: Clerk + 2FA
- **CRM Completo**: Gestão de leads, pipeline de vendas, atividades
- **Simulações Solares**: Cálculo automático de economia e ROI
- **WhatsApp Integration**: UAZAPI para mensagens automáticas
- **IA Inteligente**: GPT-4 para atendimento automático
- **Follow-up Automático**: Regras configuráveis
- **Gestão de Sistemas**: Controle de sistemas instalados
- **Assinaturas**: 3 planos (CRM Voz, IA Atendimento, IA + Follow)
- **Analytics**: Dashboards e relatórios completos

## Stack Tecnológico

### Backend
- **Next.js 14**: Framework React com App Router
- **Prisma ORM**: Type-safe database client
- **PostgreSQL**: Banco de dados relacional
- **TypeScript**: Type safety completo

### Autenticação & Pagamentos
- **Clerk**: Autenticação completa com 2FA
- **Stripe**: Processamento de pagamentos

### Integrações
- **UAZAPI**: WhatsApp Business API
- **OpenAI**: GPT-4 para IA
- **Resend**: Envio de emails transacionais

### Frontend
- **React 18**: Biblioteca UI
- **Tailwind CSS**: Estilização
- **Shadcn/ui**: Componentes
- **React Query**: Estado servidor
- **Zustand**: Estado cliente

## Estrutura do Banco de Dados

### Principais Entidades

```
┌─────────────────────────────────────────────┐
│ MULTI-TENANCY                               │
├─────────────────────────────────────────────┤
│ • Company (Empresas)                        │
│ • User (Usuários)                           │
│ • Session, RefreshToken, ApiKey             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ASSINATURAS                                 │
├─────────────────────────────────────────────┤
│ • Plan (3 planos)                           │
│ • Subscription (Assinaturas)                │
│ • Payment (Pagamentos)                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ CRM SOLAR                                   │
├─────────────────────────────────────────────┤
│ • LeadStatus (Funil customizável)           │
│ • Lead (Clientes potenciais)                │
│ • LeadNote (Anotações)                      │
│ • LeadActivity (Histórico)                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ SISTEMAS FOTOVOLTAICOS                      │
├─────────────────────────────────────────────┤
│ • SolarSystem (Sistemas instalados)         │
│ • SystemImage (Fotos)                       │
│ • Simulation (Simulações)                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ WHATSAPP & IA                               │
├─────────────────────────────────────────────┤
│ • WhatsAppInstance (Conexões)               │
│ • WhatsAppMessage (Mensagens)               │
│ • WhatsAppTemplate (Templates)              │
│ • AIConfig (Configurações IA)               │
│ • FollowUpRule (Regras)                     │
│ • FollowUp (Execuções)                      │
└─────────────────────────────────────────────┘
```

Ver [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) para detalhes completos.

## Planos e Funcionalidades

### 1. CRM por Voz (R$ 97/mês)
- Gestão básica de leads
- Pipeline de vendas
- 3 usuários
- 500 leads
- 1 WhatsApp

### 2. IA Atendimento (R$ 197/mês)
- Tudo do CRM Voz +
- Atendimento automático IA
- Auto-resposta inteligente
- 5 usuários
- 2.000 leads
- 2 WhatsApp

### 3. IA Atendimento + Follow (R$ 397/mês)
- Tudo do IA Atendimento +
- Follow-up automático
- Regras customizáveis
- 10 usuários
- 10.000 leads
- 5 WhatsApp

## Instalação

### Pré-requisitos

```bash
node >= 18.0.0
postgresql >= 14
pnpm >= 8.0.0
```

### Setup

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/saas-solar.git
cd saas-solar

# 2. Instale dependências
pnpm install

# 3. Configure .env
cp .env.example .env
# Edite .env com suas credenciais

# 4. Setup banco de dados
createdb saas_solar
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed

# 5. Execute
pnpm dev
```

Ver [GETTING_STARTED.md](./GETTING_STARTED.md) para guia detalhado.

## Migração do Sistema Antigo

Se você está migrando do sistema Supabase antigo:

```bash
# 1. Configure credenciais antigas
export OLD_SUPABASE_URL="https://..."
export OLD_SUPABASE_KEY="..."

# 2. Execute migração
pnpm tsx scripts/migrate-all.ts

# 3. Valide
pnpm tsx scripts/validate-migration.ts
```

Ver [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) para detalhes.

## Uso

### Criar Lead

```typescript
import { prisma } from '@/lib/prisma'

const lead = await prisma.lead.create({
  data: {
    companyId: 'company-id',
    name: 'João Silva',
    phone: '11999999999',
    whatsappId: '5511999999999@s.whatsapp.net',
    email: 'joao@email.com',
    source: 'WHATSAPP',
    statusId: 'status-id',
    averageEnergyBill: 450.00,
    systemType: 'RESIDENCIAL',
  }
})
```

### Enviar Mensagem WhatsApp

```typescript
import { sendWhatsAppMessage } from '@/lib/uazapi'

await sendWhatsAppMessage({
  instanceId: 'instance-id',
  to: '5511999999999@s.whatsapp.net',
  content: 'Olá! Temos uma proposta para você.',
})
```

### Criar Simulação

```typescript
const simulation = await prisma.simulation.create({
  data: {
    companyId: 'company-id',
    leadId: 'lead-id',
    userId: 'user-id',
    averageEnergyBill: 450.00,
    systemType: 'RESIDENCIAL',
    recommendedPower: 5.2,
    numberOfPanels: 8,
    estimatedCost: 21840.00,
    monthlyGeneration: 780,
    monthlySavings: 427.50,
    annualSavings: 5130.00,
    paybackPeriod: 51,
    roi: 587,
  }
})
```

## API Routes

### Leads

```
GET    /api/leads              # Listar leads
POST   /api/leads              # Criar lead
GET    /api/leads/[id]         # Buscar lead
PATCH  /api/leads/[id]         # Atualizar lead
DELETE /api/leads/[id]         # Deletar lead
GET    /api/leads/kanban       # Kanban view
```

### WhatsApp

```
POST   /api/whatsapp/send      # Enviar mensagem
POST   /api/whatsapp/webhook   # Webhook UAZAPI
GET    /api/whatsapp/messages  # Histórico
```

### Simulações

```
POST   /api/simulations        # Criar simulação
GET    /api/simulations        # Listar simulações
GET    /api/simulations/[id]   # Buscar simulação
```

## Scripts Úteis

```bash
# Desenvolvimento
pnpm dev                # Rodar dev server
pnpm build              # Build produção
pnpm start              # Rodar produção

# Banco de dados
pnpm prisma generate    # Gerar cliente
pnpm prisma migrate dev # Criar migration
pnpm prisma studio      # Interface visual
pnpm prisma db seed     # Popular dados

# Testes
pnpm test               # Rodar testes
pnpm test:watch         # Watch mode

# Linting
pnpm lint               # ESLint
pnpm type-check         # TypeScript
```

## Deploy

### Vercel (Recomendado)

```bash
# 1. Instalar CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Adicionar PostgreSQL
# Use Vercel Postgres ou Supabase

# 4. Configurar variáveis de ambiente
# No dashboard Vercel
```

### Railway

```bash
# 1. Instalar CLI
npm i -g railway

# 2. Login e init
railway login
railway init

# 3. Adicionar PostgreSQL
railway add postgres

# 4. Deploy
railway up
```

## Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Payments
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# WhatsApp
UAZAPI_BASE_URL="https://api.uazapi.com"
UAZAPI_API_KEY="..."

# AI
OPENAI_API_KEY="sk-..."
```

Ver [.env.example](./.env.example) para lista completa.

## Segurança

- Autenticação via Clerk com 2FA
- Session management seguro
- API Keys com expiração
- Rate limiting
- Validação de inputs (Zod)
- CORS configurado
- Audit logs completos
- Isolamento multi-tenant

## Performance

- Índices otimizados no Prisma
- Cache com React Query
- Lazy loading de componentes
- Imagens otimizadas (Next.js Image)
- Server-side rendering
- Static generation onde possível
- API routes otimizadas

## Documentação

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Schema completo do banco
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Guia de início
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migração do sistema antigo
- [types/index.ts](./types/index.ts) - Tipos TypeScript

## Suporte

- Email: suporte@solargestao.com.br
- GitHub Issues: [github.com/seu-usuario/saas-solar/issues](https://github.com/seu-usuario/saas-solar/issues)

## Licença

Proprietary - Todos os direitos reservados

## Contribuindo

Por favor, leia [CONTRIBUTING.md](./CONTRIBUTING.md) antes de enviar pull requests.

---

Desenvolvido com energia solar ☀️
