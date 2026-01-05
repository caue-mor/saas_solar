# Guia de Início Rápido - SAAS-SOLAR

## Setup Inicial

### 1. Pré-requisitos

```bash
# Node.js 18+
node --version

# PostgreSQL 14+
psql --version

# pnpm (recomendado)
npm install -g pnpm
```

### 2. Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/saas-solar.git
cd saas-solar

# Instale as dependências
pnpm install

# Copie o arquivo de ambiente
cp .env.example .env
```

### 3. Configurar Banco de Dados

Edite o arquivo `.env`:

```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/saas_solar?schema=public"
```

Crie o banco de dados:

```bash
# PostgreSQL local
createdb saas_solar

# Ou via psql
psql -U postgres -c "CREATE DATABASE saas_solar;"
```

### 4. Executar Migrations

```bash
# Gerar cliente Prisma
pnpm prisma generate

# Executar migrations
pnpm prisma migrate dev

# Popular banco com dados iniciais
pnpm prisma db seed
```

### 5. Configurar Serviços Externos

#### Clerk (Autenticação)

1. Acesse [clerk.com](https://clerk.com)
2. Crie uma nova aplicação
3. Copie as chaves para `.env`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### Stripe (Pagamentos)

1. Acesse [stripe.com](https://stripe.com)
2. Ative o modo de teste
3. Copie as chaves para `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. Crie os produtos/preços no Stripe:
   - CRM por Voz: R$ 97/mês
   - IA Atendimento: R$ 197/mês
   - IA Atendimento + Follow: R$ 397/mês

#### OpenAI (IA)

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Crie uma API Key
3. Adicione ao `.env`:

```env
OPENAI_API_KEY=sk-...
```

### 6. Executar Aplicação

```bash
# Modo desenvolvimento
pnpm dev

# Abrir em http://localhost:3000
```

## Estrutura do Projeto

```
saas-solar/
├── prisma/
│   ├── schema.prisma      # Schema do banco
│   ├── seed.ts            # Dados iniciais
│   └── migrations/        # Histórico de migrations
├── src/
│   ├── app/               # Next.js App Router
│   ├── components/        # Componentes React
│   ├── lib/              # Bibliotecas e utilidades
│   │   ├── prisma.ts     # Cliente Prisma
│   │   ├── stripe.ts     # Cliente Stripe
│   │   └── openai.ts     # Cliente OpenAI
│   ├── hooks/            # React Hooks
│   ├── types/            # TypeScript types
│   └── utils/            # Funções utilitárias
├── public/               # Arquivos estáticos
└── .env                  # Variáveis de ambiente
```

## Fluxo de Desenvolvimento

### 1. Criar Nova Feature

```bash
# Criar branch
git checkout -b feature/nova-feature

# Desenvolver...
# Testar...

# Commit
git add .
git commit -m "feat: adiciona nova feature"

# Push
git push origin feature/nova-feature
```

### 2. Modificar Schema do Banco

```bash
# 1. Edite prisma/schema.prisma

# 2. Crie migration
pnpm prisma migrate dev --name descricao_mudanca

# 3. Gere cliente atualizado
pnpm prisma generate
```

### 3. Testar Queries

```bash
# Abra o Prisma Studio
pnpm prisma studio

# Navegador abrirá em http://localhost:5555
# Interface visual para consultar/editar dados
```

## Exemplos de Código

### 1. Criar Lead

```typescript
import { prisma } from '@/lib/prisma'

async function createLead(companyId: string, data: any) {
  const lead = await prisma.lead.create({
    data: {
      companyId,
      name: data.name,
      phone: data.phone,
      whatsappId: formatPhoneToWhatsApp(data.phone),
      email: data.email,
      source: 'WHATSAPP',
      priority: 'MEDIUM',
      statusId: await getInitialStatusId(companyId),
      averageEnergyBill: data.averageEnergyBill,
      systemType: data.systemType,
    },
  })

  return lead
}
```

### 2. Buscar Leads da Empresa

```typescript
async function getCompanyLeads(companyId: string) {
  const leads = await prisma.lead.findMany({
    where: {
      companyId,
      isActive: true,
    },
    include: {
      status: true,
      assignedTo: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          notes_rel: true,
          activities: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return leads
}
```

### 3. Kanban de Leads

```typescript
async function getLeadsByStatus(companyId: string) {
  const statuses = await prisma.leadStatus.findMany({
    where: {
      companyId,
      isActive: true,
    },
    include: {
      leads: {
        where: {
          isActive: true,
        },
        include: {
          assignedTo: true,
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  })

  return statuses
}
```

### 4. Enviar Mensagem WhatsApp

```typescript
import { sendWhatsAppMessage } from '@/lib/uazapi'

async function sendMessage(leadId: string, content: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      company: {
        include: {
          whatsappInstances: {
            where: { isActive: true },
            take: 1,
          },
        },
      },
    },
  })

  const instance = lead.company.whatsappInstances[0]

  // Enviar via UAZAPI
  const response = await sendWhatsAppMessage({
    instanceId: instance.instanceId,
    to: lead.whatsappId,
    message: content,
  })

  // Registrar no banco
  const message = await prisma.whatsAppMessage.create({
    data: {
      instanceId: instance.id,
      leadId: lead.id,
      direction: 'OUTBOUND',
      from: instance.phoneNumber,
      to: lead.whatsappId,
      content,
      messageType: 'text',
      status: 'SENT',
      externalId: response.messageId,
    },
  })

  return message
}
```

### 5. Criar Simulação

```typescript
async function createSimulation(leadId: string, userId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  })

  // Cálculos
  const recommendedPower = calculatePower(lead.averageEnergyBill)
  const numberOfPanels = Math.ceil(recommendedPower / 0.65) // Painel 650W
  const estimatedCost = recommendedPower * 4200 // R$ 4.200/kWp
  const monthlyGeneration = recommendedPower * 150 // 150 kWh/kWp/mês
  const monthlySavings = lead.averageEnergyBill * 0.95
  const paybackPeriod = Math.ceil(estimatedCost / monthlySavings)

  const simulation = await prisma.simulation.create({
    data: {
      companyId: lead.companyId,
      leadId,
      userId,
      averageEnergyBill: lead.averageEnergyBill,
      systemType: lead.systemType,
      recommendedPower,
      numberOfPanels,
      estimatedCost,
      monthlyGeneration,
      monthlySavings,
      annualSavings: monthlySavings * 12,
      paybackPeriod,
      roi: (monthlySavings * 12 * 25 / estimatedCost) * 100, // ROI 25 anos
    },
  })

  return simulation
}
```

### 6. Follow-up Automático

```typescript
import { scheduleFollowUp } from '@/lib/scheduler'

async function processFollowUpRules() {
  const rules = await prisma.followUpRule.findMany({
    where: { isActive: true },
  })

  for (const rule of rules) {
    // Buscar leads que precisam de follow-up
    const leads = await prisma.lead.findMany({
      where: {
        companyId: rule.companyId,
        statusId: rule.statusId,
        lastContactAt: {
          lte: new Date(Date.now() - rule.daysAfterLastContact * 24 * 60 * 60 * 1000),
        },
      },
    })

    for (const lead of leads) {
      // Verificar se já não há follow-up pendente
      const existingFollowUp = await prisma.followUp.findFirst({
        where: {
          ruleId: rule.id,
          leadId: lead.id,
          status: { in: ['PENDING', 'SENT'] },
        },
      })

      if (!existingFollowUp) {
        // Criar follow-up
        const message = rule.messageTemplate
          .replace('{{nome}}', lead.name)
          .replace('{{empresa}}', lead.company.name)

        await prisma.followUp.create({
          data: {
            ruleId: rule.id,
            leadId: lead.id,
            status: 'PENDING',
            attemptNumber: 1,
            scheduledFor: new Date(),
            message,
          },
        })
      }
    }
  }
}
```

## Testes

### Configurar Jest

```bash
pnpm add -D jest @testing-library/react @testing-library/jest-dom
```

### Exemplo de Teste

```typescript
// __tests__/lib/prisma.test.ts
import { prisma } from '@/lib/prisma'

describe('Prisma', () => {
  it('should create a lead', async () => {
    const company = await prisma.company.findFirst()
    const status = await prisma.leadStatus.findFirst({
      where: { companyId: company.id },
    })

    const lead = await prisma.lead.create({
      data: {
        companyId: company.id,
        statusId: status.id,
        name: 'Test Lead',
        phone: '11999999999',
        whatsappId: '5511999999999@s.whatsapp.net',
        source: 'WHATSAPP',
        priority: 'MEDIUM',
      },
    })

    expect(lead).toBeDefined()
    expect(lead.name).toBe('Test Lead')

    // Cleanup
    await prisma.lead.delete({ where: { id: lead.id } })
  })
})
```

## Deploy

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente no dashboard
# https://vercel.com/seu-projeto/settings/environment-variables
```

### Railway

```bash
# Instalar Railway CLI
npm i -g railway

# Login
railway login

# Criar projeto
railway init

# Deploy
railway up

# Adicionar PostgreSQL
railway add postgres

# Variáveis de ambiente são configuradas automaticamente
```

## Troubleshooting

### Erro: "Cannot find module '@prisma/client'"

```bash
pnpm prisma generate
```

### Erro: "Database connection failed"

Verifique:
1. PostgreSQL está rodando?
2. DATABASE_URL está correto?
3. Banco de dados existe?

```bash
# Verificar PostgreSQL
pg_isready

# Criar banco
createdb saas_solar
```

### Erro: "Migration failed"

```bash
# Reset completo (CUIDADO: apaga dados)
pnpm prisma migrate reset

# Ou aplicar manualmente
pnpm prisma migrate deploy
```

### Performance lenta

```bash
# Analisar queries lentas
# Adicionar em lib/prisma.ts:

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

# Ver queries no console
```

## Recursos

- [Documentação Prisma](https://www.prisma.io/docs)
- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Clerk](https://clerk.com/docs)
- [Documentação Stripe](https://stripe.com/docs)
- [UAZAPI Docs](https://uazapi.com/docs)

## Suporte

- GitHub Issues: [github.com/seu-usuario/saas-solar/issues](https://github.com/seu-usuario/saas-solar/issues)
- Email: suporte@solargestao.com.br
