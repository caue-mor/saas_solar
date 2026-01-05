import { supabase } from '@/lib/supabase';
import type { FluxoQualificacao, FluxoFormData, TipoResposta } from '@/types/database';

// ============================================
// TIPOS
// ============================================

export interface FluxoResult {
  success: boolean;
  data?: FluxoQualificacao;
  error?: string;
}

export interface FluxoListResult {
  success: boolean;
  data?: FluxoQualificacao[];
  error?: string;
}

// Tipos de resposta com labels
export const TIPOS_RESPOSTA: { value: TipoResposta; label: string }[] = [
  { value: 'texto', label: 'Texto Livre' },
  { value: 'numero', label: 'Número' },
  { value: 'opcoes', label: 'Múltipla Escolha' },
  { value: 'sim_nao', label: 'Sim/Não' },
];

// Campos destino possíveis (onde salvar a resposta no lead)
export const CAMPOS_DESTINO = [
  { value: 'potencia_consumo_medio', label: 'Consumo Médio (kWh)' },
  { value: 'cidade', label: 'Cidade' },
  { value: 'tipo_imovel', label: 'Tipo de Imóvel' },
  { value: 'tipo_telhado', label: 'Tipo de Telhado' },
  { value: 'tem_espaco', label: 'Tem Espaço Disponível' },
  { value: 'interesse', label: 'Nível de Interesse' },
  { value: 'orcamento', label: 'Orçamento Disponível' },
  { value: 'prazo', label: 'Prazo para Decisão' },
  { value: 'outro', label: 'Outro (salvar em dados_coletados)' },
];

// ============================================
// BUSCAR PERGUNTAS DO FLUXO
// ============================================

// Buscar todas as perguntas do fluxo de uma empresa
export async function getFluxoPerguntas(empresaId: number): Promise<FluxoListResult> {
  try {
    const { data, error } = await supabase
      .from('fluxo_qualificacao_fotovoltaico')
      .select('*')
      .eq('id_empresa', empresaId)
      .order('ordem', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as FluxoQualificacao[] };
  } catch (error) {
    console.error('Erro ao buscar perguntas do fluxo:', error);
    return { success: false, error: 'Erro ao buscar perguntas do fluxo' };
  }
}

// Buscar apenas perguntas ativas
export async function getFluxoPerguntasAtivas(empresaId: number): Promise<FluxoListResult> {
  try {
    const { data, error } = await supabase
      .from('fluxo_qualificacao_fotovoltaico')
      .select('*')
      .eq('id_empresa', empresaId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as FluxoQualificacao[] };
  } catch (error) {
    console.error('Erro ao buscar perguntas ativas:', error);
    return { success: false, error: 'Erro ao buscar perguntas ativas' };
  }
}

// ============================================
// CRIAR PERGUNTA
// ============================================

export async function createFluxoPergunta(
  empresaId: number,
  formData: FluxoFormData
): Promise<FluxoResult> {
  try {
    // Buscar a maior ordem atual
    const { data: existingData } = await supabase
      .from('fluxo_qualificacao_fotovoltaico')
      .select('ordem')
      .eq('id_empresa', empresaId)
      .order('ordem', { ascending: false })
      .limit(1);

    const novaOrdem = existingData && existingData.length > 0
      ? (existingData[0].ordem || 0) + 1
      : 1;

    const { data, error } = await supabase
      .from('fluxo_qualificacao_fotovoltaico')
      .insert({
        id_empresa: empresaId,
        ordem: novaOrdem,
        pergunta: formData.pergunta,
        tipo_resposta: formData.tipo_resposta,
        opcoes: formData.opcoes || null,
        campo_destino: formData.campo_destino || null,
        obrigatoria: formData.obrigatoria ?? true,
        ativo: formData.ativo ?? true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as FluxoQualificacao };
  } catch (error) {
    console.error('Erro ao criar pergunta:', error);
    return { success: false, error: 'Erro ao criar pergunta' };
  }
}

// ============================================
// ATUALIZAR PERGUNTA
// ============================================

export async function updateFluxoPergunta(
  perguntaId: number,
  formData: Partial<FluxoFormData>
): Promise<FluxoResult> {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (formData.pergunta !== undefined) updateData.pergunta = formData.pergunta;
    if (formData.tipo_resposta !== undefined) updateData.tipo_resposta = formData.tipo_resposta;
    if (formData.opcoes !== undefined) updateData.opcoes = formData.opcoes;
    if (formData.campo_destino !== undefined) updateData.campo_destino = formData.campo_destino;
    if (formData.obrigatoria !== undefined) updateData.obrigatoria = formData.obrigatoria;
    if (formData.ativo !== undefined) updateData.ativo = formData.ativo;

    const { data, error } = await supabase
      .from('fluxo_qualificacao_fotovoltaico')
      .update(updateData)
      .eq('id', perguntaId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as FluxoQualificacao };
  } catch (error) {
    console.error('Erro ao atualizar pergunta:', error);
    return { success: false, error: 'Erro ao atualizar pergunta' };
  }
}

// ============================================
// DELETAR PERGUNTA
// ============================================

export async function deleteFluxoPergunta(perguntaId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('fluxo_qualificacao_fotovoltaico')
      .delete()
      .eq('id', perguntaId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar pergunta:', error);
    return { success: false, error: 'Erro ao deletar pergunta' };
  }
}

// ============================================
// REORDENAR PERGUNTAS
// ============================================

export async function reorderFluxoPerguntas(
  perguntas: { id: number; ordem: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Atualizar cada pergunta com sua nova ordem
    for (const p of perguntas) {
      const { error } = await supabase
        .from('fluxo_qualificacao_fotovoltaico')
        .update({ ordem: p.ordem, updated_at: new Date().toISOString() })
        .eq('id', p.id);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao reordenar perguntas:', error);
    return { success: false, error: 'Erro ao reordenar perguntas' };
  }
}

// ============================================
// TOGGLE ATIVO
// ============================================

export async function toggleFluxoPerguntaAtivo(
  perguntaId: number,
  ativo: boolean
): Promise<FluxoResult> {
  try {
    const { data, error } = await supabase
      .from('fluxo_qualificacao_fotovoltaico')
      .update({ ativo, updated_at: new Date().toISOString() })
      .eq('id', perguntaId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as FluxoQualificacao };
  } catch (error) {
    console.error('Erro ao toggle pergunta:', error);
    return { success: false, error: 'Erro ao alterar status da pergunta' };
  }
}
