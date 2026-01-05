# Queries Úteis do Prisma - SAAS-SOLAR

## Índice

- [Leads](#leads)
- [Companies](#companies)
- [WhatsApp](#whatsapp)
- [Simulações](#simulações)
- [Estatísticas](#estatísticas)
- [Relatórios](#relatórios)
- [Otimizações](#otimizações)

## Leads

### Listar todos os leads de uma empresa

```typescript
const leads = await prisma.lead.findMany({
  where: {
    companyId: 'company-id',
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
        whatsappMessages: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
})
```

### Kanban de leads por status

```typescript
const kanban = await prisma.leadStatus.findMany({
  where: {
    companyId: 'company-id',
    isActive: true,
  },
  include: {
    leads: {
      where: {
        isActive: true,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    },
    _count: {
      select: {
        leads: true,
      },
    },
  },
  orderBy: {
    order: 'asc',
  },
})
```

### Buscar lead com todo o histórico

```typescript
const lead = await prisma.lead.findUnique({
  where: { id: 'lead-id' },
  include: {
    status: true,
    assignedTo: true,
    company: true,
    notes_rel: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    },
    activities: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    },
    simulations: {
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    },
    solarSystems: {
      include: {
        images: true,
      },
    },
    whatsappMessages: {
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    },
  },
})
```

### Filtrar leads com múltiplas condições

```typescript
const leads = await prisma.lead.findMany({
  where: {
    companyId: 'company-id',
    isActive: true,
    AND: [
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      },
      statusId ? { statusId } : {},
      assignedToId ? { assignedToId } : {},
      source ? { source } : {},
      priority ? { priority } : {},
      tags?.length ? { tags: { hasSome: tags } } : {},
      dateFrom ? { createdAt: { gte: dateFrom } } : {},
      dateTo ? { createdAt: { lte: dateTo } } : {},
    ],
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
  },
  orderBy: {
    createdAt: 'desc',
  },
  skip: (page - 1) * limit,
  take: limit,
})

const total = await prisma.lead.count({
  where: { /* mesmas condições */ },
})
```

### Leads sem contato recente (para follow-up)

```typescript
const leadsForFollowUp = await prisma.lead.findMany({
  where: {
    companyId: 'company-id',
    isActive: true,
    status: {
      isFinal: false,
    },
    lastContactAt: {
      lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
    },
  },
  include: {
    status: true,
    assignedTo: true,
  },
})
```

### Mover lead para novo status

```typescript
const lead = await prisma.lead.update({
  where: { id: 'lead-id' },
  data: {
    statusId: 'new-status-id',
    activities: {
      create: {
        type: 'STATUS_CHANGE',
        title: 'Status alterado',
        description: `Status alterado de ${oldStatus.name} para ${newStatus.name}`,
        userId: 'user-id',
      },
    },
  },
  include: {
    status: true,
  },
})
```

## Companies

### Empresa com assinatura e limites

```typescript
const company = await prisma.company.findUnique({
  where: { id: 'company-id' },
  include: {
    subscription: {
      include: {
        plan: true,
      },
    },
    _count: {
      select: {
        users: true,
        leads: true,
        whatsappInstances: true,
      },
    },
  },
})

// Verificar se pode adicionar mais leads
const canAddLead = company._count.leads < company.subscription.plan.maxLeads
```

### Empresas com assinaturas ativas

```typescript
const activeCompanies = await prisma.company.findMany({
  where: {
    isActive: true,
    subscription: {
      status: 'ACTIVE',
      currentPeriodEnd: {
        gte: new Date(),
      },
    },
  },
  include: {
    subscription: {
      include: {
        plan: true,
      },
    },
    users: {
      where: {
        isActive: true,
      },
    },
  },
})
```

### Empresas com assinaturas vencendo

```typescript
const expiringSubscriptions = await prisma.company.findMany({
  where: {
    subscription: {
      status: 'ACTIVE',
      currentPeriodEnd: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // próximos 7 dias
      },
    },
  },
  include: {
    subscription: {
      include: {
        plan: true,
      },
    },
    users: {
      where: {
        role: 'ADMIN',
      },
    },
  },
})
```

## WhatsApp

### Histórico de conversa com lead

```typescript
const messages = await prisma.whatsAppMessage.findMany({
  where: {
    leadId: 'lead-id',
  },
  include: {
    instance: {
      select: {
        name: true,
        phoneNumber: true,
      },
    },
    user: {
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    },
  },
  orderBy: {
    createdAt: 'asc',
  },
})
```

### Mensagens não lidas

```typescript
const unreadMessages = await prisma.whatsAppMessage.findMany({
  where: {
    instance: {
      companyId: 'company-id',
    },
    direction: 'INBOUND',
    readAt: null,
  },
  include: {
    lead: {
      select: {
        id: true,
        name: true,
        phone: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
})
```

### Marcar mensagens como lidas

```typescript
await prisma.whatsAppMessage.updateMany({
  where: {
    leadId: 'lead-id',
    direction: 'INBOUND',
    readAt: null,
  },
  data: {
    readAt: new Date(),
    status: 'READ',
  },
})
```

### Estatísticas de mensagens

```typescript
const stats = await prisma.whatsAppMessage.groupBy({
  by: ['status'],
  where: {
    instance: {
      companyId: 'company-id',
    },
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  },
  _count: {
    id: true,
  },
})
```

## Simulações

### Criar simulação completa

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
    panelEfficiency: 21.5,
    solarIrradiation: 5.0,
    energyTariff: 0.85,
  },
})

// Registrar atividade
await prisma.leadActivity.create({
  data: {
    leadId: 'lead-id',
    userId: 'user-id',
    type: 'SIMULATION',
    title: 'Simulação criada',
    description: `Sistema de ${simulation.recommendedPower}kWp - R$ ${simulation.estimatedCost.toFixed(2)}`,
    metadata: {
      simulationId: simulation.id,
    },
  },
})
```

### Últimas simulações da empresa

```typescript
const recentSimulations = await prisma.simulation.findMany({
  where: {
    companyId: 'company-id',
  },
  include: {
    lead: {
      select: {
        id: true,
        name: true,
        phone: true,
      },
    },
    user: {
      select: {
        id: true,
        name: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10,
})
```

## Estatísticas

### Dashboard da empresa

```typescript
// Total de leads
const totalLeads = await prisma.lead.count({
  where: {
    companyId: 'company-id',
    isActive: true,
  },
})

// Leads por status
const leadsByStatus = await prisma.lead.groupBy({
  by: ['statusId'],
  where: {
    companyId: 'company-id',
    isActive: true,
  },
  _count: {
    id: true,
  },
})

// Leads ganhos e perdidos
const wonLeads = await prisma.lead.count({
  where: {
    companyId: 'company-id',
    status: {
      isWon: true,
    },
  },
})

const lostLeads = await prisma.lead.count({
  where: {
    companyId: 'company-id',
    status: {
      isLost: true,
    },
  },
})

// Taxa de conversão
const conversionRate = (wonLeads / totalLeads) * 100

// Valor total em negociação
const totalValue = await prisma.lead.aggregate({
  where: {
    companyId: 'company-id',
    isActive: true,
    status: {
      isFinal: false,
    },
  },
  _sum: {
    estimatedValue: true,
  },
})
```

### Performance de vendedores

```typescript
const sellerStats = await prisma.user.findMany({
  where: {
    companyId: 'company-id',
    role: { in: ['SELLER', 'MANAGER'] },
  },
  include: {
    _count: {
      select: {
        leads: {
          where: {
            isActive: true,
          },
        },
      },
    },
    leads: {
      where: {
        status: {
          isWon: true,
        },
      },
      select: {
        estimatedValue: true,
      },
    },
  },
})

const sellersWithStats = sellerStats.map(seller => ({
  id: seller.id,
  name: seller.name,
  totalLeads: seller._count.leads,
  wonLeads: seller.leads.length,
  totalRevenue: seller.leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0),
  conversionRate: (seller.leads.length / seller._count.leads) * 100,
}))
```

### Estatísticas por período

```typescript
const periodStats = await prisma.lead.findMany({
  where: {
    companyId: 'company-id',
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  },
  select: {
    createdAt: true,
    statusId: true,
    estimatedValue: true,
    source: true,
  },
})

// Agrupar por dia
const byDay = periodStats.reduce((acc, lead) => {
  const day = lead.createdAt.toISOString().split('T')[0]
  if (!acc[day]) {
    acc[day] = { count: 0, value: 0 }
  }
  acc[day].count++
  acc[day].value += lead.estimatedValue || 0
  return acc
}, {})
```

## Relatórios

### Funil de vendas completo

```typescript
const funnel = await prisma.leadStatus.findMany({
  where: {
    companyId: 'company-id',
    isActive: true,
  },
  include: {
    _count: {
      select: {
        leads: {
          where: {
            isActive: true,
          },
        },
      },
    },
    leads: {
      where: {
        isActive: true,
      },
      select: {
        estimatedValue: true,
      },
    },
  },
  orderBy: {
    order: 'asc',
  },
})

const funnelData = funnel.map(status => ({
  name: status.name,
  count: status._count.leads,
  value: status.leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0),
  color: status.color,
}))
```

### Relatório de follow-ups

```typescript
const followUpReport = await prisma.followUp.findMany({
  where: {
    rule: {
      companyId: 'company-id',
    },
    scheduledFor: {
      gte: startDate,
      lte: endDate,
    },
  },
  include: {
    rule: {
      select: {
        name: true,
      },
    },
  },
})

const summary = {
  total: followUpReport.length,
  pending: followUpReport.filter(f => f.status === 'PENDING').length,
  sent: followUpReport.filter(f => f.status === 'SENT').length,
  responded: followUpReport.filter(f => f.status === 'RESPONDED').length,
  failed: followUpReport.filter(f => f.status === 'FAILED').length,
}
```

## Otimizações

### Paginação eficiente

```typescript
// Cursor-based pagination (recomendado para grandes datasets)
const leads = await prisma.lead.findMany({
  where: {
    companyId: 'company-id',
    isActive: true,
  },
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
  take: limit,
  orderBy: {
    createdAt: 'desc',
  },
})

// Offset pagination (mais simples)
const leads = await prisma.lead.findMany({
  where: {
    companyId: 'company-id',
    isActive: true,
  },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: {
    createdAt: 'desc',
  },
})
```

### Select específico (performance)

```typescript
// ❌ Evitar - busca todos os campos
const lead = await prisma.lead.findUnique({
  where: { id: 'lead-id' },
})

// ✅ Melhor - busca apenas necessário
const lead = await prisma.lead.findUnique({
  where: { id: 'lead-id' },
  select: {
    id: true,
    name: true,
    phone: true,
    email: true,
    status: {
      select: {
        name: true,
        color: true,
      },
    },
  },
})
```

### Transações

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Criar lead
  const lead = await tx.lead.create({
    data: { /* ... */ },
  })

  // Criar atividade
  await tx.leadActivity.create({
    data: {
      leadId: lead.id,
      type: 'NOTE',
      title: 'Lead criado',
      description: 'Lead criado via formulário web',
    },
  })

  // Enviar notificação
  await tx.notification.create({
    data: {
      companyId: lead.companyId,
      toUserId: lead.assignedToId,
      title: 'Novo lead',
      message: `Novo lead: ${lead.name}`,
    },
  })

  return lead
})
```

### Upsert (create or update)

```typescript
const user = await prisma.user.upsert({
  where: {
    email: 'user@email.com',
  },
  update: {
    name: 'Nome Atualizado',
    lastLoginAt: new Date(),
  },
  create: {
    email: 'user@email.com',
    name: 'Nome Novo',
    companyId: 'company-id',
    role: 'USER',
  },
})
```

### Batch operations

```typescript
// Criar múltiplos registros
await prisma.lead.createMany({
  data: [
    { name: 'Lead 1', phone: '...', companyId: '...', statusId: '...' },
    { name: 'Lead 2', phone: '...', companyId: '...', statusId: '...' },
    { name: 'Lead 3', phone: '...', companyId: '...', statusId: '...' },
  ],
  skipDuplicates: true, // Ignora duplicatas
})

// Atualizar múltiplos
await prisma.lead.updateMany({
  where: {
    statusId: 'old-status-id',
  },
  data: {
    statusId: 'new-status-id',
  },
})
```

### Agregações

```typescript
const stats = await prisma.lead.aggregate({
  where: {
    companyId: 'company-id',
  },
  _count: {
    id: true,
  },
  _sum: {
    estimatedValue: true,
  },
  _avg: {
    estimatedValue: true,
    averageEnergyBill: true,
  },
  _max: {
    estimatedValue: true,
  },
  _min: {
    estimatedValue: true,
  },
})
```

## Middleware para Multi-tenancy

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Middleware para adicionar companyId automaticamente
prisma.$use(async (params, next) => {
  // Pegar companyId do contexto (ex: session)
  const companyId = getCompanyIdFromContext()

  // Modelos que precisam de filtro
  const modelsWithCompany = [
    'lead',
    'leadNote',
    'leadActivity',
    'solarSystem',
    'simulation',
    'whatsAppMessage',
  ]

  if (modelsWithCompany.includes(params.model?.toLowerCase() || '')) {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        companyId,
      }
    }
  }

  return next(params)
})

export { prisma }
```
