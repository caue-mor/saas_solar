import { supabase } from '@/lib/supabase';
import type { ContatoFotovoltaico, ContatoFormData, StatusLeadFotovoltaico } from '@/types/database';

// ============================================
// TIPOS
// ============================================

export interface ContatosResult {
  success: boolean;
  data?: ContatoFotovoltaico[];
  error?: string;
  count?: number;
}

export interface ContatoResult {
  success: boolean;
  data?: ContatoFotovoltaico;
  error?: string;
}

export interface StatusListResult {
  success: boolean;
  data?: StatusLeadFotovoltaico[];
  error?: string;
}

export interface QualificacaoData {
  etapa_atual: number;
  dados_coletados: Record<string, unknown>;
}

export interface FollowUpData {
  follow_stage: number;
  follow_ativo: boolean;
  ultimo_follow: string | null;
  bloqueado: boolean;
}

export interface LigacaoData {
  ultima_ligacao_id: string;
  ultima_ligacao_status: string;
  ultima_ligacao_duracao: number;
  ultima_ligacao_data: string;
  ultima_ligacao_gravacao?: string;
}

// ============================================
// CONSTANTES
// ============================================

// Lista de origens disponíveis
export const ORIGENS = [
  { value: 'manual', label: 'Cadastro Manual' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Facebook Ads' },
  { value: 'google', label: 'Google Ads' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'site', label: 'Site' },
  { value: 'telefone', label: 'Ligação Telefônica' },
  { value: 'outro', label: 'Outro' },
];

// Etapas de qualificação
export const ETAPAS_QUALIFICACAO = [
  { numero: 1, nome: 'Primeiro Contato', descricao: 'Lead acabou de entrar' },
  { numero: 2, nome: 'Interesse Confirmado', descricao: 'Lead demonstrou interesse real' },
  { numero: 3, nome: 'Dados Coletados', descricao: 'Informações básicas obtidas' },
  { numero: 4, nome: 'Proposta Enviada', descricao: 'Proposta comercial enviada' },
  { numero: 5, nome: 'Em Negociação', descricao: 'Negociação em andamento' },
  { numero: 6, nome: 'Fechamento', descricao: 'Prestes a fechar negócio' },
];

// Status de ligação
export const STATUS_LIGACAO = [
  { value: 'completed', label: 'Completada', color: 'green' },
  { value: 'busy', label: 'Ocupado', color: 'yellow' },
  { value: 'no-answer', label: 'Não Atendeu', color: 'orange' },
  { value: 'failed', label: 'Falhou', color: 'red' },
  { value: 'voicemail', label: 'Caixa Postal', color: 'blue' },
];

// ============================================
// BUSCAR CONTATOS
// ============================================

// Buscar todos os contatos de uma empresa
export async function getContatos(
  empresaId: number,
  options?: {
    limit?: number;
    offset?: number;
    statusId?: number;
    searchTerm?: string;
    origem?: string;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }
): Promise<ContatosResult> {
  try {
    let query = supabase
      .from('contatos_fotovoltaico')
      .select('*, status_lead:status_leads_fotovoltaico(*)', { count: 'exact' })
      .eq('id_empresa', empresaId);

    // Filtrar por status
    if (options?.statusId) {
      query = query.eq('status_lead_id', options.statusId);
    }

    // Filtrar por origem
    if (options?.origem) {
      query = query.eq('origem', options.origem);
    }

    // Busca por termo
    if (options?.searchTerm) {
      query = query.or(`nome.ilike.%${options.searchTerm}%,celular.ilike.%${options.searchTerm}%`);
    }

    // Ordenação
    const orderBy = options?.orderBy || 'created_on';
    const orderDirection = options?.orderDirection || 'desc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Paginação
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data as ContatoFotovoltaico[],
      count: count || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    return { success: false, error: 'Erro ao buscar contatos' };
  }
}

// Buscar contatos recentes (últimos N)
export async function getContatosRecentes(empresaId: number, limit: number = 10): Promise<ContatosResult> {
  try {
    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .select('*, status_lead:status_leads_fotovoltaico(*)')
      .eq('id_empresa', empresaId)
      .order('created_on', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico[] };
  } catch (error) {
    console.error('Erro ao buscar contatos recentes:', error);
    return { success: false, error: 'Erro ao buscar contatos recentes' };
  }
}

// Buscar um contato por ID
export async function getContato(contatoId: number): Promise<ContatoResult> {
  try {
    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .select('*, status_lead:status_leads_fotovoltaico(*)')
      .eq('id', contatoId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico };
  } catch (error) {
    console.error('Erro ao buscar contato:', error);
    return { success: false, error: 'Erro ao buscar contato' };
  }
}

// ============================================
// CRIAR/ATUALIZAR CONTATOS
// ============================================

// Criar um novo contato
export async function createContato(empresaId: number, contato: ContatoFormData): Promise<ContatoResult> {
  try {
    // Formatar e validar celular
    const celularFormatado = formatarCelular(contato.celular);
    const celularValido = validarCelular(celularFormatado);

    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .insert({
        id_empresa: empresaId,
        nome: contato.nome,
        celular: contato.celular,
        celular_formatado: celularFormatado,
        celular_valido: celularValido,
        potencia_consumo_medio: contato.potencia_consumo_medio || null,
        atendimento_automatico: contato.atendimento_automatico ?? true,
        status_lead_id: contato.status_lead_id || 1,
        observacoes_status: contato.observacoes_status || null,
        origem: contato.origem || 'manual',
        created_on: new Date().toISOString(),
        last_update: new Date().toISOString(),
        // Inicializar follow-up
        follow_stage: 0,
        follow_ativo: true,
        bloqueado: false,
        // Inicializar qualificação
        etapa_atual: 1,
        dados_coletados: {},
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico };
  } catch (error) {
    console.error('Erro ao criar contato:', error);
    return { success: false, error: 'Erro ao criar contato' };
  }
}

// Atualizar um contato
export async function updateContato(contatoId: number, contato: Partial<ContatoFormData>): Promise<ContatoResult> {
  try {
    const updateData: Record<string, unknown> = {
      last_update: new Date().toISOString(),
    };

    // Atualizar campos fornecidos
    if (contato.nome !== undefined) updateData.nome = contato.nome;
    if (contato.potencia_consumo_medio !== undefined) updateData.potencia_consumo_medio = contato.potencia_consumo_medio;
    if (contato.atendimento_automatico !== undefined) updateData.atendimento_automatico = contato.atendimento_automatico;
    if (contato.status_lead_id !== undefined) updateData.status_lead_id = contato.status_lead_id;
    if (contato.observacoes_status !== undefined) updateData.observacoes_status = contato.observacoes_status;
    if (contato.origem !== undefined) updateData.origem = contato.origem;

    // Se celular foi alterado, reformatar e validar
    if (contato.celular !== undefined) {
      updateData.celular = contato.celular;
      updateData.celular_formatado = formatarCelular(contato.celular);
      updateData.celular_valido = validarCelular(updateData.celular_formatado as string);
    }

    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .update(updateData)
      .eq('id', contatoId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico };
  } catch (error) {
    console.error('Erro ao atualizar contato:', error);
    return { success: false, error: 'Erro ao atualizar contato' };
  }
}

// Atualizar status do lead
export async function updateContatoStatus(contatoId: number, statusId: number, observacoes?: string): Promise<ContatoResult> {
  try {
    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .update({
        status_lead_id: statusId,
        observacoes_status: observacoes,
        last_update: new Date().toISOString(),
      })
      .eq('id', contatoId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico };
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return { success: false, error: 'Erro ao atualizar status' };
  }
}

// Deletar um contato
export async function deleteContato(contatoId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('contatos_fotovoltaico')
      .delete()
      .eq('id', contatoId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar contato:', error);
    return { success: false, error: 'Erro ao deletar contato' };
  }
}

// ============================================
// QUALIFICAÇÃO DE LEADS
// ============================================

// Atualizar etapa de qualificação
export async function updateQualificacao(
  contatoId: number,
  qualificacao: QualificacaoData
): Promise<ContatoResult> {
  try {
    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .update({
        etapa_atual: qualificacao.etapa_atual,
        dados_coletados: qualificacao.dados_coletados,
        last_update: new Date().toISOString(),
      })
      .eq('id', contatoId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico };
  } catch (error) {
    console.error('Erro ao atualizar qualificação:', error);
    return { success: false, error: 'Erro ao atualizar qualificação' };
  }
}

// Adicionar dado coletado
export async function addDadoColetado(
  contatoId: number,
  campo: string,
  valor: unknown
): Promise<ContatoResult> {
  try {
    // Primeiro buscar dados atuais
    const { data: contato, error: fetchError } = await supabase
      .from('contatos_fotovoltaico')
      .select('dados_coletados')
      .eq('id', contatoId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // Atualizar dados
    const dadosAtuais = (contato?.dados_coletados || {}) as Record<string, unknown>;
    dadosAtuais[campo] = valor;

    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .update({
        dados_coletados: dadosAtuais,
        last_update: new Date().toISOString(),
      })
      .eq('id', contatoId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico };
  } catch (error) {
    console.error('Erro ao adicionar dado:', error);
    return { success: false, error: 'Erro ao adicionar dado coletado' };
  }
}

// Avançar para próxima etapa
export async function avancarEtapa(contatoId: number): Promise<ContatoResult> {
  try {
    const { data: contato, error: fetchError } = await supabase
      .from('contatos_fotovoltaico')
      .select('etapa_atual')
      .eq('id', contatoId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const novaEtapa = Math.min((contato?.etapa_atual || 0) + 1, 6);

    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .update({
        etapa_atual: novaEtapa,
        last_update: new Date().toISOString(),
      })
      .eq('id', contatoId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico };
  } catch (error) {
    console.error('Erro ao avançar etapa:', error);
    return { success: false, error: 'Erro ao avançar etapa' };
  }
}

// Retroceder etapa
export async function retrocederEtapa(contatoId: number): Promise<ContatoResult> {
  try {
    const { data: contato, error: fetchError } = await supabase
      .from('contatos_fotovoltaico')
      .select('etapa_atual')
      .eq('id', contatoId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const novaEtapa = Math.max((contato?.etapa_atual || 1) - 1, 1);

    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .update({
        etapa_atual: novaEtapa,
        last_update: new Date().toISOString(),
      })
      .eq('id', contatoId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico };
  } catch (error) {
    console.error('Erro ao retroceder etapa:', error);
    return { success: false, error: 'Erro ao retroceder etapa' };
  }
}

// ============================================
// FOLLOW-UP DO LEAD
// ============================================

// Atualizar status de follow-up
export async function updateFollowUp(
  contatoId: number,
  followUp: Partial<FollowUpData>
): Promise<ContatoResult> {
  try {
    const updateData: Record<string, unknown> = {
      last_update: new Date().toISOString(),
    };

    if (followUp.follow_stage !== undefined) updateData.follow_stage = followUp.follow_stage;
    if (followUp.follow_ativo !== undefined) updateData.follow_ativo = followUp.follow_ativo;
    if (followUp.ultimo_follow !== undefined) updateData.ultimo_follow = followUp.ultimo_follow;
    if (followUp.bloqueado !== undefined) updateData.bloqueado = followUp.bloqueado;

    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .update(updateData)
      .eq('id', contatoId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico };
  } catch (error) {
    console.error('Erro ao atualizar follow-up:', error);
    return { success: false, error: 'Erro ao atualizar follow-up' };
  }
}

// Bloquear/desbloquear contato
export async function toggleBloqueio(contatoId: number, bloqueado: boolean): Promise<ContatoResult> {
  return updateFollowUp(contatoId, { bloqueado });
}

// Pausar/reativar follow-up
export async function toggleFollowUpAtivo(contatoId: number, ativo: boolean): Promise<ContatoResult> {
  return updateFollowUp(contatoId, { follow_ativo: ativo });
}

// Toggle atendimento automático (IA)
export async function toggleAtendimentoIA(contatoId: number, ativo: boolean): Promise<ContatoResult> {
  try {
    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .update({
        atendimento_automatico: ativo,
        last_update: new Date().toISOString(),
      })
      .eq('id', contatoId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico };
  } catch (error) {
    console.error('Erro ao atualizar atendimento IA:', error);
    return { success: false, error: 'Erro ao atualizar atendimento IA' };
  }
}

// ============================================
// HISTÓRICO DE LIGAÇÕES
// ============================================

// Registrar ligação
export async function registrarLigacao(
  contatoId: number,
  ligacao: LigacaoData
): Promise<ContatoResult> {
  try {
    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .update({
        ultima_ligacao_id: ligacao.ultima_ligacao_id,
        ultima_ligacao_status: ligacao.ultima_ligacao_status,
        ultima_ligacao_duracao: ligacao.ultima_ligacao_duracao,
        ultima_ligacao_data: ligacao.ultima_ligacao_data,
        ultima_ligacao_gravacao: ligacao.ultima_ligacao_gravacao || null,
        last_update: new Date().toISOString(),
      })
      .eq('id', contatoId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico };
  } catch (error) {
    console.error('Erro ao registrar ligação:', error);
    return { success: false, error: 'Erro ao registrar ligação' };
  }
}

// ============================================
// STATUS LEADS (KANBAN)
// ============================================

// Buscar todos os status de leads
export async function getStatusLeads(): Promise<StatusListResult> {
  try {
    const { data, error } = await supabase
      .from('status_leads_fotovoltaico')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as StatusLeadFotovoltaico[] };
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    return { success: false, error: 'Erro ao buscar status de leads' };
  }
}

// Buscar contatos por status
export async function getContatosByStatus(empresaId: number, statusId: number): Promise<ContatosResult> {
  try {
    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .select('*, status_lead:status_leads_fotovoltaico(*)')
      .eq('id_empresa', empresaId)
      .eq('status_lead_id', statusId)
      .order('created_on', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico[] };
  } catch (error) {
    console.error('Erro ao buscar contatos por status:', error);
    return { success: false, error: 'Erro ao buscar contatos por status' };
  }
}

// Buscar contatos agrupados por status (para Kanban)
export async function getContatosParaKanban(empresaId: number): Promise<ContatosResult> {
  try {
    const { data, error } = await supabase
      .from('contatos_fotovoltaico')
      .select('*, status_lead:status_leads_fotovoltaico(*)')
      .eq('id_empresa', empresaId)
      .order('last_update', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ContatoFotovoltaico[] };
  } catch (error) {
    console.error('Erro ao buscar contatos para Kanban:', error);
    return { success: false, error: 'Erro ao buscar contatos para Kanban' };
  }
}

// ============================================
// UTILITÁRIOS DE CELULAR
// ============================================

// Formatar celular para padrão WhatsApp (55DDDNNNNNNNNN)
export function formatarCelular(celular: string): string {
  // Remove tudo que não é número
  let numero = celular.replace(/\D/g, '');

  // Se começar com 0, remove
  if (numero.startsWith('0')) {
    numero = numero.slice(1);
  }

  // Se não começar com 55, adiciona
  if (!numero.startsWith('55')) {
    numero = '55' + numero;
  }

  // Garante que tem o 9 após o DDD (para celulares brasileiros)
  if (numero.length === 12) {
    // 55 + DDD (2 dígitos) + 8 dígitos = precisa do 9
    numero = numero.slice(0, 4) + '9' + numero.slice(4);
  }

  return numero;
}

// Validar celular brasileiro
export function validarCelular(celular: string): boolean {
  // Formato esperado: 55DDDNNNNNNNNN (13 dígitos)
  const celularFormatado = formatarCelular(celular);

  // Deve ter exatamente 13 dígitos
  if (celularFormatado.length !== 13) {
    return false;
  }

  // Deve começar com 55
  if (!celularFormatado.startsWith('55')) {
    return false;
  }

  // DDD deve estar entre 11 e 99
  const ddd = parseInt(celularFormatado.slice(2, 4), 10);
  if (ddd < 11 || ddd > 99) {
    return false;
  }

  // Celular deve começar com 9
  if (celularFormatado[4] !== '9') {
    return false;
  }

  return true;
}

// Formatar celular para exibição: (DD) 9NNNN-NNNN
export function formatarCelularExibicao(celular: string): string {
  const numero = formatarCelular(celular);

  if (numero.length !== 13) {
    return celular; // Retorna original se não conseguir formatar
  }

  const ddd = numero.slice(2, 4);
  const parte1 = numero.slice(4, 9);
  const parte2 = numero.slice(9, 13);

  return `(${ddd}) ${parte1}-${parte2}`;
}

// Obter apenas o DDD
export function obterDDD(celular: string): string {
  const numero = formatarCelular(celular);
  if (numero.length >= 4) {
    return numero.slice(2, 4);
  }
  return '';
}

// ============================================
// UTILITÁRIOS GERAIS
// ============================================

// Obter label da origem
export function getOrigemLabel(origem: string): string {
  const item = ORIGENS.find(o => o.value === origem);
  return item?.label || origem;
}

// Obter etapa de qualificação
export function getEtapaQualificacao(numero: number) {
  return ETAPAS_QUALIFICACAO.find(e => e.numero === numero) || ETAPAS_QUALIFICACAO[0];
}

// Obter label do status de ligação
export function getStatusLigacaoLabel(status: string): string {
  const item = STATUS_LIGACAO.find(s => s.value === status);
  return item?.label || status;
}

// Obter cor do status de ligação
export function getStatusLigacaoCor(status: string): string {
  const item = STATUS_LIGACAO.find(s => s.value === status);
  return item?.color || 'gray';
}

// Formatar duração de ligação
export function formatarDuracaoLigacao(segundos: number): string {
  if (segundos < 60) {
    return `${segundos}s`;
  }
  const minutos = Math.floor(segundos / 60);
  const seg = segundos % 60;
  if (minutos < 60) {
    return `${minutos}min ${seg}s`;
  }
  const horas = Math.floor(minutos / 60);
  const min = minutos % 60;
  return `${horas}h ${min}min`;
}
