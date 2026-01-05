// ============================================
// TIPOS DO BANCO DE DADOS - SUPABASE SOLAR
// Mapeamento das tabelas do projeto yfzqpeasgsoorldogqwl
// ============================================

// Tipos de Sistema Solar
export type TipoSistema = 'RESIDENCIAL' | 'COMERCIAL' | 'RURAL' | 'INVESTIMENTO';

// Status do Plano
export type StatusPlano = 'ativo' | 'inativo' | 'pendente';

// Produtos/Planos disponíveis
export type ProdutoPlano = 'CRM POR VOZ' | 'IA ATENDIMENTO' | 'IA ATENDIMENTO + FOLLOW';

// Status do WhatsApp
export type WhatsAppStatus = 'not_created' | 'connecting' | 'connected' | 'disconnected';

// ============================================
// INTERFACE: acessos_fotovoltaico (Empresas)
// ============================================
export interface AcessoFotovoltaico {
  id: number;
  empresa: string;
  email: string;
  senha: string;
  created_at: Date | null;
  updated_at: Date | null;

  // Dados da empresa
  dados_completos_preenchidos: boolean | null;
  nome_atendente: string | null;
  nome_empresa: string | null;
  endereco_completo: string | null;
  cidade: string | null;
  link_google_maps: string | null;
  horario_funcionamento: string | null;
  fuso_horario: string | null;
  site_empresa: string | null;
  instagram_empresa: string | null;
  formas_pagamento: string | null;
  garantia_pos_venda: string | null;
  informacoes_complementares: string | null;

  // Configurações WhatsApp
  webhook_url: string | null;
  uazapi_instancia: string | null;
  numero_atendimento: string | null;
  whatsapp_status: WhatsAppStatus | null;
  whatsapp_numero: string | null;
  token_whatsapp: string | null;
  notification_webhook_url: string | null;
  slug: string | null;

  // Configurações de IA
  atender_apenas_trafego: boolean | null;
  modelo_ia: string | null;

  // Configurações de Plano
  status_plano: StatusPlano | null;
  produto_plano: ProdutoPlano | null;

  // Configurações de Follow-up
  followup_ativo: boolean | null;
  followup_habilitado_em: Date | null;
  intervalo_follow_1: number | null;
  intervalo_follow_2: number | null;
  intervalo_follow_3: number | null;
  janela_ativa_horas: number | null;
  max_tentativas_por_ciclo: number | null;

  // Relations (quando incluídas)
  contatos?: ContatoFotovoltaico[];
  sistemas?: SistemaFotovoltaico[];
}

// ============================================
// INTERFACE: status_leads_fotovoltaico (Status Kanban)
// ============================================
export interface StatusLeadFotovoltaico {
  id: number;
  nome: string;
  cor: string;
  ordem: number;
  ativo: boolean | null;
  created_at: Date | null;

  // Relations (quando incluídas)
  contatos?: ContatoFotovoltaico[];
}

// ============================================
// INTERFACE: contatos_fotovoltaico (Leads)
// ============================================
export interface ContatoFotovoltaico {
  id: number;
  id_empresa: number | null;
  nome: string;
  celular: string;
  potencia_consumo_medio: string | null;
  atendimento_automatico: boolean | null;
  status_lead_id: number | null;
  observacoes_status: string | null;
  created_on: Date | null;
  last_update: Date | null;
  stage: string | null;

  // Validação do celular
  celular_formatado: string | null;
  celular_valido: boolean | null;

  // Follow-up
  follow_stage: number | null;
  follow_ativo: boolean | null;
  bloqueado: boolean | null;
  origem: string | null;
  ultimo_follow: Date | null;

  // Ligações
  ultima_ligacao_id: string | null;
  ultima_ligacao_status: string | null;
  ultima_ligacao_duracao: number | null;
  ultima_ligacao_data: Date | null;
  ultima_ligacao_gravacao: string | null;

  // Etapas de qualificação
  etapa_atual: number | null;
  dados_coletados: Record<string, unknown> | null;

  // Relations (quando incluídas)
  empresa?: AcessoFotovoltaico | null;
  status_lead?: StatusLeadFotovoltaico | null;
}

// ============================================
// INTERFACE: sistemas_fotovoltaicos (Catálogo)
// ============================================
export interface SistemaFotovoltaico {
  id: number;
  empresa_id: number | null;
  tipo_sistema: TipoSistema;
  descricao: string | null;
  imagem1: string | null;
  imagem2: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  potencia_usina: string | null;
  economia_anual: string | null;
  nome_cliente: string | null;
  detalhes: string | null;

  // Relations (quando incluídas)
  empresa?: AcessoFotovoltaico | null;
}

// ============================================
// TIPOS AUXILIARES
// ============================================

// Dados para login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Resposta de autenticação
export interface AuthResponse {
  success: boolean;
  user?: AcessoFotovoltaico;
  error?: string;
}

// Dados do formulário da empresa
export interface CompanyFormData {
  nome_atendente: string;
  nome_empresa: string;
  endereco_completo: string;
  cidade: string;
  link_google_maps: string;
  horario_funcionamento: string;
  fuso_horario: string;
  site_empresa: string;
  instagram_empresa: string;
  formas_pagamento: string;
  garantia_pos_venda: string;
  informacoes_complementares: string;
}

// Configurações de WhatsApp
export interface WhatsAppConfig {
  webhook_url: string;
  uazapi_instancia: string;
  numero_atendimento: string;
}

// Configurações de IA
export interface IAConfig {
  atender_apenas_trafego: boolean;
}

// ============================================
// INTERFACE: fluxo_qualificacao_fotovoltaico (Flow Builder)
// ============================================
export type TipoResposta = 'texto' | 'numero' | 'opcoes' | 'sim_nao';

export interface FluxoQualificacao {
  id: number;
  id_empresa: number;
  ordem: number;
  pergunta: string;
  tipo_resposta: TipoResposta;
  opcoes: string[] | null;
  campo_destino: string | null;
  obrigatoria: boolean;
  ativo: boolean;
  created_at: Date | null;
  updated_at: Date | null;
}

// Dados para criar/editar pergunta do fluxo
export interface FluxoFormData {
  pergunta: string;
  tipo_resposta: TipoResposta;
  opcoes?: string[];
  campo_destino?: string;
  obrigatoria?: boolean;
  ativo?: boolean;
}

// ============================================
// INTERFACE: propostas_fotovoltaico (Propostas)
// ============================================
export type StatusProposta = 'rascunho' | 'enviada' | 'visualizada' | 'aceita' | 'recusada' | 'expirada';

export interface PropostaFotovoltaico {
  id: number;
  id_empresa: number;
  id_contato: number;
  numero_proposta: string;
  valor_total: number | null;
  potencia_kwp: number | null;
  quantidade_paineis: number | null;
  marca_paineis: string | null;
  marca_inversor: string | null;
  economia_mensal: number | null;
  payback_meses: number | null;
  pdf_url: string | null;
  dados_lead_snapshot: Record<string, unknown> | null;
  status: StatusProposta;
  agente_proposta_ativo: boolean;
  created_at: Date | null;
  updated_at: Date | null;
  enviada_em: Date | null;
  visualizada_em: Date | null;

  // Relations (quando incluídas)
  empresa?: AcessoFotovoltaico | null;
  contato?: ContatoFotovoltaico | null;
}

// Dados para criar/editar proposta
export interface PropostaFormData {
  id_contato: number;
  valor_total?: number;
  potencia_kwp?: number;
  quantidade_paineis?: number;
  marca_paineis?: string;
  marca_inversor?: string;
  economia_mensal?: number;
  payback_meses?: number;
  pdf_url?: string;
  dados_lead_snapshot?: Record<string, unknown>;
  agente_proposta_ativo?: boolean;
}

// Dados para criar/editar contato
export interface ContatoFormData {
  nome: string;
  celular: string;
  potencia_consumo_medio?: string;
  atendimento_automatico?: boolean;
  status_lead_id?: number;
  observacoes_status?: string;
  origem?: string;
}

// Dados para criar/editar sistema
export interface SistemaFormData {
  tipo_sistema: TipoSistema;
  descricao?: string;
  potencia_usina?: string;
  economia_anual?: string;
  nome_cliente?: string;
  detalhes?: string;
  imagem1?: string;
  imagem2?: string;
}

// Coluna do Kanban
export interface KanbanColumn {
  id: number;
  nome: string;
  cor: string;
  ordem: number;
  contatos: ContatoFotovoltaico[];
}

// Estatísticas do Dashboard
export interface DashboardStats {
  totalContatos: number;
  contatosHoje: number;
  contatosSemana: number;
  contatosMes: number;
  porStatus: {
    status: string;
    cor: string;
    total: number;
  }[];
  porOrigem: {
    origem: string;
    total: number;
  }[];
}

// Filtros do Kanban
export type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

export interface KanbanFilters {
  timeFilter: TimeFilter;
  customDateStart?: string;
  customDateEnd?: string;
  searchTerm?: string;
}
