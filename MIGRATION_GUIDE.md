# Guia de Migração do Sistema Antigo para SAAS-SOLAR

## Visão Geral

Este guia detalha como migrar dados do sistema antigo (Supabase) para o novo sistema (Prisma + PostgreSQL).

## Mapeamento de Tabelas

### Tabelas Antigas → Novas

| Tabela Antiga | Tabela Nova | Observações |
|--------------|-------------|-------------|
| `acessos_fotovoltaico` | `companies` + `users` | Separar empresa de usuários |
| `sistemas_fotovoltaicos` | `solar_systems` | Adicionar relação com leads |
| `contatos_fotovoltaico` | `leads` | Renomear e adicionar campos |
| `status_leads_fotovoltaico` | `lead_statuses` | Adicionar flags (isWon, isLost) |

## Scripts de Migração

### 1. Preparação

```typescript
// scripts/migrate-prepare.ts
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.OLD_SUPABASE_URL!,
  process.env.OLD_SUPABASE_KEY!
)

export { prisma, supabase }
```

### 2. Migrar Empresas e Usuários

```typescript
// scripts/migrate-companies.ts
import { prisma, supabase } from './migrate-prepare'
import bcrypt from 'bcrypt'

async function migrateCompanies() {
  console.log('🏢 Migrando empresas e usuários...')

  // Buscar acessos antigos
  const { data: oldAcessos, error } = await supabase
    .from('acessos_fotovoltaico')
    .select('*')

  if (error) throw error

  const migrations: Map<string, { companyId: string; userId: string }> = new Map()

  for (const acesso of oldAcessos) {
    // Criar empresa
    const company = await prisma.company.create({
      data: {
        name: acesso.empresa || acesso.nome_empresa || acesso.nome,
        email: acesso.email,
        phone: acesso.telefone || acesso.whatsapp,
        cnpj: acesso.cnpj,
        isActive: acesso.status === 'ativo',
        createdAt: acesso.created_at ? new Date(acesso.created_at) : new Date(),
      },
    })

    // Criar usuário admin da empresa
    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        name: acesso.nome || acesso.empresa,
        email: acesso.email,
        phone: acesso.telefone || acesso.whatsapp,
        role: 'ADMIN',
        passwordHash: await bcrypt.hash(acesso.senha || 'mudar123', 10),
        isActive: acesso.status === 'ativo',
        createdAt: acesso.created_at ? new Date(acesso.created_at) : new Date(),
      },
    })

    // Criar assinatura baseado no plano
    const planType = mapPlanType(acesso.plano)
    const plan = await prisma.plan.findUnique({
      where: { type: planType },
    })

    if (plan) {
      await prisma.subscription.create({
        data: {
          companyId: company.id,
          planId: plan.id,
          status: acesso.status === 'ativo' ? 'ACTIVE' : 'CANCELED',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
    }

    // Guardar mapeamento
    migrations.set(acesso.id, {
      companyId: company.id,
      userId: user.id,
    })

    console.log(`✅ Migrado: ${company.name}`)
  }

  // Salvar mapeamento em arquivo
  await Bun.write(
    'migrations-map-companies.json',
    JSON.stringify(Object.fromEntries(migrations), null, 2)
  )

  console.log(`\n✅ ${oldAcessos.length} empresas migradas!`)
}

function mapPlanType(planName: string): 'CRM_VOZ' | 'IA_ATENDIMENTO' | 'IA_ATENDIMENTO_FOLLOW' {
  const planLower = planName?.toLowerCase() || ''

  if (planLower.includes('follow')) {
    return 'IA_ATENDIMENTO_FOLLOW'
  } else if (planLower.includes('ia') || planLower.includes('atendimento')) {
    return 'IA_ATENDIMENTO'
  } else {
    return 'CRM_VOZ'
  }
}

migrateCompanies()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
```

### 3. Migrar Status de Leads

```typescript
// scripts/migrate-statuses.ts
import { prisma, supabase } from './migrate-prepare'
import fs from 'fs'

async function migrateStatuses() {
  console.log('📊 Migrando status de leads...')

  // Carregar mapeamento de empresas
  const companiesMap = JSON.parse(
    fs.readFileSync('migrations-map-companies.json', 'utf-8')
  )

  // Buscar status antigos
  const { data: oldStatuses, error } = await supabase
    .from('status_leads_fotovoltaico')
    .select('*')

  if (error) throw error

  const statusMap = new Map()

  for (const oldStatus of oldStatuses) {
    // Encontrar empresa correspondente
    const companyMapping = companiesMap[oldStatus.empresa_id]
    if (!companyMapping) {
      console.warn(`⚠️ Empresa não encontrada para status: ${oldStatus.nome}`)
      continue
    }

    // Criar status
    const status = await prisma.leadStatus.create({
      data: {
        companyId: companyMapping.companyId,
        name: oldStatus.nome,
        description: oldStatus.descricao,
        color: oldStatus.cor || '#6B7280',
        order: oldStatus.ordem || 0,
        isInitial: oldStatus.inicial || false,
        isFinal: oldStatus.final || false,
        isWon: oldStatus.ganho || false,
        isLost: oldStatus.perdido || false,
        isActive: true,
        createdAt: oldStatus.created_at ? new Date(oldStatus.created_at) : new Date(),
      },
    })

    statusMap.set(oldStatus.id, status.id)
    console.log(`✅ Status migrado: ${status.name}`)
  }

  // Salvar mapeamento
  await Bun.write(
    'migrations-map-statuses.json',
    JSON.stringify(Object.fromEntries(statusMap), null, 2)
  )

  console.log(`\n✅ ${oldStatuses.length} status migrados!`)
}

migrateStatuses()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
```

### 4. Migrar Leads (Contatos)

```typescript
// scripts/migrate-leads.ts
import { prisma, supabase } from './migrate-prepare'
import fs from 'fs'

async function migrateLeads() {
  console.log('👥 Migrando leads (contatos)...')

  // Carregar mapeamentos
  const companiesMap = JSON.parse(
    fs.readFileSync('migrations-map-companies.json', 'utf-8')
  )
  const statusesMap = JSON.parse(
    fs.readFileSync('migrations-map-statuses.json', 'utf-8')
  )

  // Buscar contatos antigos
  const { data: oldContatos, error } = await supabase
    .from('contatos_fotovoltaico')
    .select('*')

  if (error) throw error

  const leadsMap = new Map()

  for (const contato of oldContatos) {
    const companyMapping = companiesMap[contato.empresa_id]
    if (!companyMapping) {
      console.warn(`⚠️ Empresa não encontrada para contato: ${contato.nome}`)
      continue
    }

    const statusId = statusesMap[contato.status_id]
    if (!statusId) {
      console.warn(`⚠️ Status não encontrado para contato: ${contato.nome}`)
      continue
    }

    // Criar lead
    const lead = await prisma.lead.create({
      data: {
        companyId: companyMapping.companyId,
        statusId,
        assignedToId: companyMapping.userId, // Atribuir ao admin da empresa
        name: contato.nome,
        email: contato.email,
        phone: contato.telefone,
        whatsappId: formatPhoneToWhatsApp(contato.telefone),
        address: contato.endereco,
        city: contato.cidade,
        state: contato.estado,
        zipCode: contato.cep,
        source: mapSource(contato.origem),
        priority: mapPriority(contato.prioridade),
        averageEnergyBill: contato.conta_luz_media,
        systemType: mapSystemType(contato.tipo_sistema),
        notes: contato.observacoes,
        tags: contato.tags || [],
        lastContactAt: contato.ultimo_contato ? new Date(contato.ultimo_contato) : null,
        isActive: contato.ativo !== false,
        createdAt: contato.created_at ? new Date(contato.created_at) : new Date(),
      },
    })

    leadsMap.set(contato.id, lead.id)
    console.log(`✅ Lead migrado: ${lead.name}`)
  }

  // Salvar mapeamento
  await Bun.write(
    'migrations-map-leads.json',
    JSON.stringify(Object.fromEntries(leadsMap), null, 2)
  )

  console.log(`\n✅ ${oldContatos.length} leads migrados!`)
}

function formatPhoneToWhatsApp(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  const withoutCountry = clean.startsWith('55') ? clean.substring(2) : clean
  return `55${withoutCountry}@s.whatsapp.net`
}

function mapSource(origem?: string): string {
  const map: Record<string, string> = {
    'whatsapp': 'WHATSAPP',
    'facebook': 'FACEBOOK',
    'instagram': 'INSTAGRAM',
    'google': 'GOOGLE',
    'site': 'WEBSITE',
    'indicacao': 'INDICACAO',
    'telefone': 'TELEFONE',
  }
  return map[origem?.toLowerCase() || ''] || 'OUTROS'
}

function mapPriority(prioridade?: string): string {
  const map: Record<string, string> = {
    'baixa': 'LOW',
    'media': 'MEDIUM',
    'alta': 'HIGH',
    'urgente': 'URGENT',
  }
  return map[prioridade?.toLowerCase() || ''] || 'MEDIUM'
}

function mapSystemType(tipo?: string): string | null {
  const map: Record<string, string> = {
    'residencial': 'RESIDENCIAL',
    'comercial': 'COMERCIAL',
    'rural': 'RURAL',
    'investimento': 'INVESTIMENTO',
  }
  return map[tipo?.toLowerCase() || ''] || null
}

migrateLeads()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
```

### 5. Migrar Sistemas Fotovoltaicos

```typescript
// scripts/migrate-systems.ts
import { prisma, supabase } from './migrate-prepare'
import fs from 'fs'

async function migrateSystems() {
  console.log('☀️ Migrando sistemas fotovoltaicos...')

  // Carregar mapeamentos
  const companiesMap = JSON.parse(
    fs.readFileSync('migrations-map-companies.json', 'utf-8')
  )
  const leadsMap = JSON.parse(
    fs.readFileSync('migrations-map-leads.json', 'utf-8')
  )

  // Buscar sistemas antigos
  const { data: oldSystems, error } = await supabase
    .from('sistemas_fotovoltaicos')
    .select('*')

  if (error) throw error

  for (const oldSystem of oldSystems) {
    const companyMapping = companiesMap[oldSystem.empresa_id]
    if (!companyMapping) continue

    const leadId = leadsMap[oldSystem.cliente_id]

    const system = await prisma.solarSystem.create({
      data: {
        companyId: companyMapping.companyId,
        leadId: leadId || null,
        type: oldSystem.tipo || 'RESIDENCIAL',
        name: oldSystem.nome,
        description: oldSystem.descricao,
        installedPower: oldSystem.potencia_instalada,
        numberOfPanels: oldSystem.quantidade_paineis,
        panelPower: oldSystem.potencia_painel,
        inverterModel: oldSystem.modelo_inversor,
        monthlyGeneration: oldSystem.geracao_mensal,
        monthlySavings: oldSystem.economia_mensal,
        annualSavings: oldSystem.economia_anual,
        paybackPeriod: oldSystem.payback,
        installationAddress: oldSystem.endereco_instalacao,
        installationCity: oldSystem.cidade_instalacao,
        installationState: oldSystem.estado_instalacao,
        totalCost: oldSystem.valor_total,
        installationDate: oldSystem.data_instalacao ? new Date(oldSystem.data_instalacao) : null,
        isActive: oldSystem.ativo !== false,
        createdAt: oldSystem.created_at ? new Date(oldSystem.created_at) : new Date(),
      },
    })

    console.log(`✅ Sistema migrado: ${system.name}`)
  }

  console.log(`\n✅ ${oldSystems.length} sistemas migrados!`)
}

migrateSystems()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
```

## Executar Migração Completa

### Script Principal

```typescript
// scripts/migrate-all.ts
import { execSync } from 'child_process'

const scripts = [
  'migrate-companies.ts',
  'migrate-statuses.ts',
  'migrate-leads.ts',
  'migrate-systems.ts',
]

async function migrateAll() {
  console.log('🚀 Iniciando migração completa...\n')

  for (const script of scripts) {
    console.log(`\n📦 Executando: ${script}`)
    console.log('─'.repeat(50))

    try {
      execSync(`tsx scripts/${script}`, { stdio: 'inherit' })
    } catch (error) {
      console.error(`❌ Erro em ${script}:`, error)
      process.exit(1)
    }
  }

  console.log('\n✅✅✅ Migração completa concluída! ✅✅✅')
}

migrateAll()
```

### Executar

```bash
# Instalar dependências
pnpm add @supabase/supabase-js bcrypt

# Configurar variáveis de ambiente
export OLD_SUPABASE_URL="https://..."
export OLD_SUPABASE_KEY="..."

# Executar migração
pnpm tsx scripts/migrate-all.ts
```

## Validação Pós-Migração

### Script de Validação

```typescript
// scripts/validate-migration.ts
import { prisma, supabase } from './migrate-prepare'

async function validate() {
  console.log('🔍 Validando migração...\n')

  // Contar registros
  const [companies, users, statuses, leads, systems] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.leadStatus.count(),
    prisma.lead.count(),
    prisma.solarSystem.count(),
  ])

  const { count: oldAcessos } = await supabase
    .from('acessos_fotovoltaico')
    .select('*', { count: 'exact', head: true })

  const { count: oldContatos } = await supabase
    .from('contatos_fotovoltaico')
    .select('*', { count: 'exact', head: true })

  const { count: oldSystems } = await supabase
    .from('sistemas_fotovoltaicos')
    .select('*', { count: 'exact', head: true })

  console.log('📊 Comparação de Registros:')
  console.log('─'.repeat(50))
  console.log(`Empresas:  ${oldAcessos} → ${companies}`)
  console.log(`Usuários:  ${oldAcessos} → ${users}`)
  console.log(`Leads:     ${oldContatos} → ${leads}`)
  console.log(`Sistemas:  ${oldSystems} → ${systems}`)
  console.log()

  const issues = []

  if (companies !== oldAcessos) {
    issues.push(`⚠️ Diferença em empresas: esperado ${oldAcessos}, obtido ${companies}`)
  }

  if (leads !== oldContatos) {
    issues.push(`⚠️ Diferença em leads: esperado ${oldContatos}, obtido ${leads}`)
  }

  if (issues.length > 0) {
    console.log('⚠️ Problemas encontrados:')
    issues.forEach(issue => console.log(issue))
  } else {
    console.log('✅ Migração validada com sucesso!')
  }
}

validate()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
```

## Rollback

Se algo der errado:

```bash
# Resetar banco de dados
pnpm prisma migrate reset

# Ou dropar manualmente
psql -U postgres -c "DROP DATABASE saas_solar;"
psql -U postgres -c "CREATE DATABASE saas_solar;"

# Executar migrations novamente
pnpm prisma migrate deploy
```

## Checklist

- [ ] Backup do banco antigo
- [ ] Configurar variáveis de ambiente
- [ ] Executar migrations do Prisma
- [ ] Executar seed (dados iniciais)
- [ ] Executar migração de empresas
- [ ] Executar migração de status
- [ ] Executar migração de leads
- [ ] Executar migração de sistemas
- [ ] Validar dados migrados
- [ ] Testar funcionalidades
- [ ] Documentar problemas encontrados
