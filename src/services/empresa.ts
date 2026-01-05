import { supabase } from '@/lib/supabase';
import type { AcessoFotovoltaico, CompanyFormData, IAConfig } from '@/types/database';

// ============================================
// TIPOS
// ============================================

export interface EmpresaResult {
  success: boolean;
  data?: AcessoFotovoltaico;
  error?: string;
}

export interface FollowUpConfig {
  followup_ativo: boolean;
  intervalo_follow_1: number;
  intervalo_follow_2: number;
  intervalo_follow_3: number;
  janela_ativa_horas: number;
  max_tentativas_por_ciclo: number;
}

// ============================================
// DADOS DA EMPRESA
// ============================================

// Buscar dados completos da empresa
export async function getEmpresaData(empresaId: number): Promise<EmpresaResult> {
  try {
    const { data, error } = await supabase
      .from('acessos_fotovoltaico')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as AcessoFotovoltaico };
  } catch (error) {
    console.error('Erro ao buscar dados da empresa:', error);
    return { success: false, error: 'Erro ao buscar dados da empresa' };
  }
}

// Atualizar dados básicos da empresa
export async function updateEmpresaBasicData(
  empresaId: number,
  data: CompanyFormData
): Promise<EmpresaResult> {
  try {
    const { error } = await supabase
      .from('acessos_fotovoltaico')
      .update({
        nome_atendente: data.nome_atendente,
        nome_empresa: data.nome_empresa,
        endereco_completo: data.endereco_completo,
        cidade: data.cidade,
        link_google_maps: data.link_google_maps,
        horario_funcionamento: data.horario_funcionamento,
        fuso_horario: data.fuso_horario,
        site_empresa: data.site_empresa,
        instagram_empresa: data.instagram_empresa,
        formas_pagamento: data.formas_pagamento,
        garantia_pos_venda: data.garantia_pos_venda,
        informacoes_complementares: data.informacoes_complementares,
        dados_completos_preenchidos: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', empresaId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Retornar dados atualizados
    return getEmpresaData(empresaId);
  } catch (error) {
    console.error('Erro ao atualizar dados da empresa:', error);
    return { success: false, error: 'Erro ao atualizar dados da empresa' };
  }
}

// ============================================
// CONFIGURAÇÕES DE IA
// ============================================

// Atualizar configurações de IA
export async function updateIAConfig(
  empresaId: number,
  config: IAConfig
): Promise<EmpresaResult> {
  try {
    const { error } = await supabase
      .from('acessos_fotovoltaico')
      .update({
        atender_apenas_trafego: config.atender_apenas_trafego,
        updated_at: new Date().toISOString(),
      })
      .eq('id', empresaId);

    if (error) {
      return { success: false, error: error.message };
    }

    return getEmpresaData(empresaId);
  } catch (error) {
    console.error('Erro ao atualizar config de IA:', error);
    return { success: false, error: 'Erro ao atualizar configurações de IA' };
  }
}

// Atualizar modelo de IA
export async function updateModeloIA(
  empresaId: number,
  modelo: string
): Promise<EmpresaResult> {
  try {
    const { error } = await supabase
      .from('acessos_fotovoltaico')
      .update({
        modelo_ia: modelo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', empresaId);

    if (error) {
      return { success: false, error: error.message };
    }

    return getEmpresaData(empresaId);
  } catch (error) {
    console.error('Erro ao atualizar modelo IA:', error);
    return { success: false, error: 'Erro ao atualizar modelo de IA' };
  }
}

// ============================================
// CONFIGURAÇÕES DE FOLLOW-UP
// ============================================

// Atualizar configurações de follow-up
export async function updateFollowUpConfig(
  empresaId: number,
  config: FollowUpConfig
): Promise<EmpresaResult> {
  try {
    const updateData: Record<string, unknown> = {
      followup_ativo: config.followup_ativo,
      intervalo_follow_1: config.intervalo_follow_1,
      intervalo_follow_2: config.intervalo_follow_2,
      intervalo_follow_3: config.intervalo_follow_3,
      janela_ativa_horas: config.janela_ativa_horas,
      max_tentativas_por_ciclo: config.max_tentativas_por_ciclo,
      updated_at: new Date().toISOString(),
    };

    // Se estiver ativando follow-up, registrar data de habilitação
    if (config.followup_ativo) {
      updateData.followup_habilitado_em = new Date().toISOString();
    }

    const { error } = await supabase
      .from('acessos_fotovoltaico')
      .update(updateData)
      .eq('id', empresaId);

    if (error) {
      return { success: false, error: error.message };
    }

    return getEmpresaData(empresaId);
  } catch (error) {
    console.error('Erro ao atualizar config de follow-up:', error);
    return { success: false, error: 'Erro ao atualizar configurações de follow-up' };
  }
}

// Ativar/desativar follow-up
export async function toggleFollowUp(
  empresaId: number,
  ativo: boolean
): Promise<EmpresaResult> {
  try {
    const updateData: Record<string, unknown> = {
      followup_ativo: ativo,
      updated_at: new Date().toISOString(),
    };

    if (ativo) {
      updateData.followup_habilitado_em = new Date().toISOString();
    }

    const { error } = await supabase
      .from('acessos_fotovoltaico')
      .update(updateData)
      .eq('id', empresaId);

    if (error) {
      return { success: false, error: error.message };
    }

    return getEmpresaData(empresaId);
  } catch (error) {
    console.error('Erro ao toggle follow-up:', error);
    return { success: false, error: 'Erro ao alterar status do follow-up' };
  }
}

// ============================================
// CONFIGURAÇÕES DE WHATSAPP
// ============================================

// Atualizar configurações de WhatsApp
export async function updateWhatsAppConfig(
  empresaId: number,
  config: {
    webhook_url?: string;
    uazapi_instancia?: string;
    numero_atendimento?: string;
    whatsapp_status?: string;
    whatsapp_numero?: string;
    token_whatsapp?: string;
    notification_webhook_url?: string;
  }
): Promise<EmpresaResult> {
  try {
    const { error } = await supabase
      .from('acessos_fotovoltaico')
      .update({
        ...config,
        updated_at: new Date().toISOString(),
      })
      .eq('id', empresaId);

    if (error) {
      return { success: false, error: error.message };
    }

    return getEmpresaData(empresaId);
  } catch (error) {
    console.error('Erro ao atualizar config WhatsApp:', error);
    return { success: false, error: 'Erro ao atualizar configurações do WhatsApp' };
  }
}

// ============================================
// PLANO/ASSINATURA
// ============================================

// Atualizar plano da empresa
export async function updatePlano(
  empresaId: number,
  plano: {
    status_plano: string;
    produto_plano: string;
  }
): Promise<EmpresaResult> {
  try {
    const { error } = await supabase
      .from('acessos_fotovoltaico')
      .update({
        status_plano: plano.status_plano,
        produto_plano: plano.produto_plano,
        updated_at: new Date().toISOString(),
      })
      .eq('id', empresaId);

    if (error) {
      return { success: false, error: error.message };
    }

    return getEmpresaData(empresaId);
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return { success: false, error: 'Erro ao atualizar plano' };
  }
}

// ============================================
// UTILITÁRIOS
// ============================================

// Verificar se dados estão completos
export function isDadosCompletos(empresa: AcessoFotovoltaico): boolean {
  return !!(
    empresa.nome_empresa &&
    empresa.nome_atendente &&
    empresa.cidade &&
    empresa.horario_funcionamento
  );
}

// Obter percentual de preenchimento do perfil
export function getPerfilCompletude(empresa: AcessoFotovoltaico): number {
  const campos = [
    empresa.nome_empresa,
    empresa.nome_atendente,
    empresa.cidade,
    empresa.endereco_completo,
    empresa.horario_funcionamento,
    empresa.site_empresa,
    empresa.instagram_empresa,
    empresa.formas_pagamento,
    empresa.garantia_pos_venda,
  ];

  const preenchidos = campos.filter(Boolean).length;
  return Math.round((preenchidos / campos.length) * 100);
}
