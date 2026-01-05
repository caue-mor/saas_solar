import { supabase } from '@/lib/supabase';
import type { PropostaFotovoltaico, PropostaFormData, StatusProposta } from '@/types/database';

// ============================================
// TIPOS
// ============================================

export interface PropostaResult {
  success: boolean;
  data?: PropostaFotovoltaico;
  error?: string;
}

export interface PropostaListResult {
  success: boolean;
  data?: PropostaFotovoltaico[];
  error?: string;
}

// Status das propostas com labels e cores
export const STATUS_PROPOSTA: { value: StatusProposta; label: string; cor: string }[] = [
  { value: 'rascunho', label: 'Rascunho', cor: '#6B7280' },
  { value: 'enviada', label: 'Enviada', cor: '#3B82F6' },
  { value: 'visualizada', label: 'Visualizada', cor: '#8B5CF6' },
  { value: 'aceita', label: 'Aceita', cor: '#10B981' },
  { value: 'recusada', label: 'Recusada', cor: '#EF4444' },
  { value: 'expirada', label: 'Expirada', cor: '#F59E0B' },
];

// Marcas de painéis comuns
export const MARCAS_PAINEIS = [
  'Canadian Solar',
  'JA Solar',
  'Trina Solar',
  'LONGi',
  'Jinko Solar',
  'BYD',
  'Risen Energy',
  'Astronergy',
  'DAH Solar',
  'Outro',
];

// Marcas de inversores comuns
export const MARCAS_INVERSORES = [
  'Growatt',
  'Fronius',
  'Huawei',
  'Sungrow',
  'Deye',
  'Goodwe',
  'SMA',
  'Sofar',
  'ABB',
  'Outro',
];

// ============================================
// BUSCAR PROPOSTAS
// ============================================

// Buscar todas as propostas de uma empresa
export async function getPropostasEmpresa(empresaId: number): Promise<PropostaListResult> {
  try {
    const { data, error } = await supabase
      .from('propostas_fotovoltaico')
      .select('*, contato:contatos_fotovoltaico(id, nome, celular)')
      .eq('id_empresa', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PropostaFotovoltaico[] };
  } catch (error) {
    console.error('Erro ao buscar propostas:', error);
    return { success: false, error: 'Erro ao buscar propostas' };
  }
}

// Buscar propostas de um contato específico
export async function getPropostasContato(contatoId: number): Promise<PropostaListResult> {
  try {
    const { data, error } = await supabase
      .from('propostas_fotovoltaico')
      .select('*')
      .eq('id_contato', contatoId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PropostaFotovoltaico[] };
  } catch (error) {
    console.error('Erro ao buscar propostas do contato:', error);
    return { success: false, error: 'Erro ao buscar propostas do contato' };
  }
}

// Buscar uma proposta específica
export async function getProposta(propostaId: number): Promise<PropostaResult> {
  try {
    const { data, error } = await supabase
      .from('propostas_fotovoltaico')
      .select('*, contato:contatos_fotovoltaico(*)')
      .eq('id', propostaId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PropostaFotovoltaico };
  } catch (error) {
    console.error('Erro ao buscar proposta:', error);
    return { success: false, error: 'Erro ao buscar proposta' };
  }
}

// ============================================
// CRIAR PROPOSTA
// ============================================

// Gerar número da proposta
async function gerarNumeroProposta(empresaId: number): Promise<string> {
  const ano = new Date().getFullYear();

  // Contar quantas propostas já existem neste ano
  const { count } = await supabase
    .from('propostas_fotovoltaico')
    .select('*', { count: 'exact', head: true })
    .eq('id_empresa', empresaId)
    .gte('created_at', `${ano}-01-01`);

  const sequencial = (count || 0) + 1;
  return `PROP-${ano}-${String(sequencial).padStart(4, '0')}`;
}

// Criar nova proposta
export async function createProposta(
  empresaId: number,
  formData: PropostaFormData
): Promise<PropostaResult> {
  try {
    const numeroProposta = await gerarNumeroProposta(empresaId);

    const { data, error } = await supabase
      .from('propostas_fotovoltaico')
      .insert({
        id_empresa: empresaId,
        id_contato: formData.id_contato,
        numero_proposta: numeroProposta,
        valor_total: formData.valor_total || null,
        potencia_kwp: formData.potencia_kwp || null,
        quantidade_paineis: formData.quantidade_paineis || null,
        marca_paineis: formData.marca_paineis || null,
        marca_inversor: formData.marca_inversor || null,
        economia_mensal: formData.economia_mensal || null,
        payback_meses: formData.payback_meses || null,
        pdf_url: formData.pdf_url || null,
        dados_lead_snapshot: formData.dados_lead_snapshot || null,
        status: 'rascunho',
        agente_proposta_ativo: formData.agente_proposta_ativo ?? false,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PropostaFotovoltaico };
  } catch (error) {
    console.error('Erro ao criar proposta:', error);
    return { success: false, error: 'Erro ao criar proposta' };
  }
}

// ============================================
// ATUALIZAR PROPOSTA
// ============================================

export async function updateProposta(
  propostaId: number,
  formData: Partial<PropostaFormData>
): Promise<PropostaResult> {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (formData.valor_total !== undefined) updateData.valor_total = formData.valor_total;
    if (formData.potencia_kwp !== undefined) updateData.potencia_kwp = formData.potencia_kwp;
    if (formData.quantidade_paineis !== undefined) updateData.quantidade_paineis = formData.quantidade_paineis;
    if (formData.marca_paineis !== undefined) updateData.marca_paineis = formData.marca_paineis;
    if (formData.marca_inversor !== undefined) updateData.marca_inversor = formData.marca_inversor;
    if (formData.economia_mensal !== undefined) updateData.economia_mensal = formData.economia_mensal;
    if (formData.payback_meses !== undefined) updateData.payback_meses = formData.payback_meses;
    if (formData.pdf_url !== undefined) updateData.pdf_url = formData.pdf_url;
    if (formData.dados_lead_snapshot !== undefined) updateData.dados_lead_snapshot = formData.dados_lead_snapshot;
    if (formData.agente_proposta_ativo !== undefined) updateData.agente_proposta_ativo = formData.agente_proposta_ativo;

    const { data, error } = await supabase
      .from('propostas_fotovoltaico')
      .update(updateData)
      .eq('id', propostaId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PropostaFotovoltaico };
  } catch (error) {
    console.error('Erro ao atualizar proposta:', error);
    return { success: false, error: 'Erro ao atualizar proposta' };
  }
}

// ============================================
// ATUALIZAR STATUS
// ============================================

export async function updatePropostaStatus(
  propostaId: number,
  status: StatusProposta
): Promise<PropostaResult> {
  try {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Registrar data conforme status
    if (status === 'enviada') {
      updateData.enviada_em = new Date().toISOString();
    } else if (status === 'visualizada') {
      updateData.visualizada_em = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('propostas_fotovoltaico')
      .update(updateData)
      .eq('id', propostaId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PropostaFotovoltaico };
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return { success: false, error: 'Erro ao atualizar status da proposta' };
  }
}

// ============================================
// ENVIAR PROPOSTA
// ============================================

export async function enviarProposta(propostaId: number): Promise<PropostaResult> {
  return updatePropostaStatus(propostaId, 'enviada');
}

// ============================================
// DELETAR PROPOSTA
// ============================================

export async function deleteProposta(propostaId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('propostas_fotovoltaico')
      .delete()
      .eq('id', propostaId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar proposta:', error);
    return { success: false, error: 'Erro ao deletar proposta' };
  }
}

// ============================================
// TOGGLE AGENTE PROPOSTA
// ============================================

export async function toggleAgenteProposta(
  propostaId: number,
  ativo: boolean
): Promise<PropostaResult> {
  try {
    const { data, error } = await supabase
      .from('propostas_fotovoltaico')
      .update({
        agente_proposta_ativo: ativo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propostaId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PropostaFotovoltaico };
  } catch (error) {
    console.error('Erro ao toggle agente proposta:', error);
    return { success: false, error: 'Erro ao alterar status do agente' };
  }
}

// ============================================
// UTILITÁRIOS
// ============================================

// Formatar valor em reais
export function formatCurrency(value: number | null): string {
  if (value === null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Calcular payback aproximado
export function calcularPayback(valorTotal: number, economiaMensal: number): number {
  if (economiaMensal <= 0) return 0;
  return Math.ceil(valorTotal / economiaMensal);
}
