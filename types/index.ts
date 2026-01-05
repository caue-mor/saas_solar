// SAAS-SOLAR - TypeScript Types
// Tipos utilitários e interfaces compartilhadas

// ============================================
// TIPOS DO BANCO DE DADOS (SUPABASE)
// ============================================

// Contato/Lead
export type Contato = {
  id: number;
  empresa_id: number;
  nome: string;
  celular: string;
  celular_formatado?: string;
  celular_valido: boolean;
  email?: string;
  origem?: string;
  potencia_consumo_medio?: number;
  atendimento_automatico: boolean;
  status_lead_id?: number;
  observacoes_status?: string;
  etapa_atual: number;
  dados_coletados?: Record<string, unknown>;
  follow_stage?: number;
  follow_ativo: boolean;
  ultimo_follow?: string;
  bloqueado: boolean;
  ultima_ligacao_id?: string;
  ultima_ligacao_status?: string;
  ultima_ligacao_duracao?: number;
  ultima_ligacao_data?: string;
  ultima_ligacao_gravacao?: string;
  created_on: string;
  last_update: string;
  status_leads_fotovoltaico?: StatusLead;
};

// Status do Lead
export type StatusLead = {
  id: number;
  nome: string;
  cor?: string;
  ordem: number;
  ativo: boolean;
};

// Empresa/Acesso
export type Empresa = {
  id: number;
  email: string;
  senha?: string;
  nome_empresa: string;
  slug?: string;
  endereco?: string;
  cidade?: string;
  telefone_empresa?: string;
  horario_atendimento?: string;
  link_google_maps?: string;
  link_instagram?: string;
  link_site?: string;
  formas_pagamento?: string;
  garantia?: string;
  descricao_empresa?: string;
  token_whatsapp?: string;
  uazapi_instancia?: string;
  whatsapp_status?: string;
  whatsapp_numero?: string;
  webhook_url?: string;
  ia_ativa: boolean;
  modelo_ia?: string;
  system_prompt?: string;
  follow_up_ativo: boolean;
  follow_mensagem_1?: string;
  follow_mensagem_2?: string;
  follow_mensagem_3?: string;
  follow_intervalo_dias?: number;
  trafego_pago_ativo: boolean;
  produto_plano?: string;
  status_plano?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_start?: string;
  subscription_end?: string;
  created_on: string;
  last_update: string;
};

// Sistema Fotovoltaico
export type Sistema = {
  id: number;
  empresa_id: number;
  tipo_sistema: 'RESIDENCIAL' | 'COMERCIAL' | 'RURAL' | 'INVESTIMENTO';
  descricao?: string;
  imagem1?: string;
  imagem2?: string;
  potencia_usina?: string;
  economia_anual?: string;
  nome_cliente?: string;
  detalhes?: string;
  created_at: string;
  updated_at: string;
};

// ============================================
// TIPOS DE FORMULÁRIOS
// ============================================

export type CreateLeadInput = {
  nome: string;
  celular: string;
  email?: string;
  origem?: string;
  potencia_consumo_medio?: number;
  observacoes_status?: string;
  empresa_id: number;
  status_lead_id?: number;
};

export type UpdateLeadInput = Partial<CreateLeadInput> & {
  atendimento_automatico?: boolean;
  etapa_atual?: number;
  dados_coletados?: Record<string, unknown>;
  follow_stage?: number;
  follow_ativo?: boolean;
  bloqueado?: boolean;
};

export type CreateSistemaInput = {
  empresa_id: number;
  tipo_sistema: 'RESIDENCIAL' | 'COMERCIAL' | 'RURAL' | 'INVESTIMENTO';
  descricao?: string;
  imagem1?: string;
  imagem2?: string;
  potencia_usina?: string;
  economia_anual?: string;
  nome_cliente?: string;
  detalhes?: string;
};

export type UpdateSistemaInput = Partial<Omit<CreateSistemaInput, 'empresa_id'>>;

// ============================================
// TIPOS DE RESPOSTA DA API
// ============================================

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

// ============================================
// TIPOS DE WEBHOOK
// ============================================

export type UazAPIWebhookPayload = {
  event: 'message.received' | 'message.sent' | 'message.delivered' | 'message.read';
  instanceId: string;
  messageId: string;
  from: string;
  to: string;
  message: {
    type: 'text' | 'image' | 'audio' | 'video' | 'document';
    content: string;
    mediaUrl?: string;
  };
  timestamp: number;
  adminField01?: string;
};

export type StripeWebhookPayload = {
  type: string;
  data: {
    object: unknown;
  };
};

// ============================================
// TIPOS DE FILTROS
// ============================================

export type LeadFilters = {
  statusId?: number;
  origem?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

// ============================================
// TIPOS DE ESTATÍSTICAS
// ============================================

export type DashboardStats = {
  totalContatos: number;
  contatosHoje: number;
  contatosSemana: number;
  contatosMes: number;
  porStatus: Array<{
    status: string;
    cor: string;
    count: number;
  }>;
  porOrigem: Array<{
    origem: string;
    count: number;
  }>;
};

// ============================================
// TIPOS DE CONFIGURAÇÃO
// ============================================

export type AIConfig = {
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  companyDescription?: string;
  qualificationQuestions?: string[];
};

export type FollowUpConfig = {
  enabled: boolean;
  mensagem1?: string;
  mensagem2?: string;
  mensagem3?: string;
  intervaloDias?: number;
};

// ============================================
// TIPOS DE KANBAN
// ============================================

export type KanbanColumn = {
  id: string;
  title: string;
  color: string;
  leads: KanbanLead[];
};

export type KanbanLead = {
  id: number;
  nome: string;
  celular: string;
  celular_formatado?: string;
  email?: string;
  status_lead_id: number;
  origem?: string;
  potencia_consumo_medio?: number;
  observacoes_status?: string;
  etapa_atual?: number;
  atendimento_automatico?: boolean;
  created_on: string;
  last_update: string;
  createdAt: string;
  updatedAt: string;
};

// ============================================
// UTILITÁRIOS
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ============================================
// HELPERS
// ============================================

export function formatPhoneToWhatsApp(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  let finalPhone = cleanPhone;

  if (cleanPhone.startsWith('55')) {
    finalPhone = cleanPhone.substring(2);
  }

  return `55${finalPhone}@s.whatsapp.net`;
}

export function formatWhatsAppToPhone(whatsappId: string): string {
  return whatsappId.replace('@s.whatsapp.net', '');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

// Origens de lead
export const ORIGENS = [
  'WHATSAPP',
  'SITE',
  'INDICACAO',
  'TELEFONE',
  'FACEBOOK',
  'INSTAGRAM',
  'TRAFEGO_PAGO',
  'OUTRO',
] as const;

export type Origem = (typeof ORIGENS)[number];

// Tipos de sistema
export const TIPOS_SISTEMA = [
  'RESIDENCIAL',
  'COMERCIAL',
  'RURAL',
  'INVESTIMENTO',
] as const;

export type TipoSistema = (typeof TIPOS_SISTEMA)[number];
