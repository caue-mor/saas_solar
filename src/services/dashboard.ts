import { supabase } from '@/lib/supabase';
import type { DashboardStats, ContatoFotovoltaico } from '@/types/database';

export interface DashboardResult {
  success: boolean;
  data?: DashboardStats;
  error?: string;
}

// Calcular estatísticas do dashboard
export async function getDashboardStats(empresaId: number): Promise<DashboardResult> {
  try {
    // Buscar todos os contatos da empresa
    const { data: contatos, error: contatosError } = await supabase
      .from('contatos_fotovoltaico')
      .select('*')
      .eq('id_empresa', empresaId);

    if (contatosError) {
      return { success: false, error: contatosError.message };
    }

    // Buscar status leads para mapear cores e nomes
    const { data: statusLeads, error: statusError } = await supabase
      .from('status_leads_fotovoltaico')
      .select('*');

    if (statusError) {
      return { success: false, error: statusError.message };
    }

    const contatosArray = (contatos || []) as ContatoFotovoltaico[];
    const now = new Date();
    const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calcular contatos por período
    const contatosHoje = contatosArray.filter(c => {
      if (!c.created_on) return false;
      const data = new Date(c.created_on);
      return data >= hoje;
    }).length;

    const contatosSemana = contatosArray.filter(c => {
      if (!c.created_on) return false;
      const data = new Date(c.created_on);
      return data >= inicioSemana;
    }).length;

    const contatosMes = contatosArray.filter(c => {
      if (!c.created_on) return false;
      const data = new Date(c.created_on);
      return data >= inicioMes;
    }).length;

    // Agrupar por status
    const statusMap = new Map<number, { nome: string; cor: string; total: number }>();
    statusLeads?.forEach(s => {
      statusMap.set(s.id, { nome: s.nome, cor: s.cor, total: 0 });
    });

    contatosArray.forEach(c => {
      if (c.status_lead_id && statusMap.has(c.status_lead_id)) {
        const status = statusMap.get(c.status_lead_id)!;
        status.total++;
      }
    });

    const porStatus = Array.from(statusMap.values())
      .filter(s => s.total > 0)
      .map(s => ({ status: s.nome, cor: s.cor, total: s.total }));

    // Agrupar por origem
    const origemMap = new Map<string, number>();
    contatosArray.forEach(c => {
      const origem = c.origem || 'Não informado';
      origemMap.set(origem, (origemMap.get(origem) || 0) + 1);
    });

    const porOrigem = Array.from(origemMap.entries())
      .map(([origem, total]) => ({ origem, total }))
      .sort((a, b) => b.total - a.total);

    return {
      success: true,
      data: {
        totalContatos: contatosArray.length,
        contatosHoje,
        contatosSemana,
        contatosMes,
        porStatus,
        porOrigem,
      }
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { success: false, error: 'Erro ao buscar estatísticas do dashboard' };
  }
}

// Buscar contagem de sistemas
export async function getSistemasCount(empresaId: number): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { count, error } = await supabase
      .from('sistemas_fotovoltaicos')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Erro ao contar sistemas:', error);
    return { success: false, error: 'Erro ao contar sistemas' };
  }
}

// Buscar contatos recentes com status
export async function getContatosRecentesComStatus(empresaId: number, limit: number = 5): Promise<{
  success: boolean;
  data?: Array<ContatoFotovoltaico & { status_nome?: string; status_cor?: string }>;
  error?: string;
}> {
  try {
    // Buscar contatos
    const { data: contatos, error: contatosError } = await supabase
      .from('contatos_fotovoltaico')
      .select('*')
      .eq('id_empresa', empresaId)
      .order('created_on', { ascending: false })
      .limit(limit);

    if (contatosError) {
      return { success: false, error: contatosError.message };
    }

    // Buscar status
    const { data: statusLeads, error: statusError } = await supabase
      .from('status_leads_fotovoltaico')
      .select('*');

    if (statusError) {
      return { success: false, error: statusError.message };
    }

    // Mapear status
    const statusMap = new Map<number, { nome: string; cor: string }>();
    statusLeads?.forEach(s => {
      statusMap.set(s.id, { nome: s.nome, cor: s.cor });
    });

    // Adicionar info de status aos contatos
    const contatosComStatus = (contatos || []).map(c => {
      const status = c.status_lead_id ? statusMap.get(c.status_lead_id) : null;
      return {
        ...c,
        status_nome: status?.nome || 'Sem status',
        status_cor: status?.cor || '#9CA3AF',
      };
    });

    return { success: true, data: contatosComStatus };
  } catch (error) {
    console.error('Erro ao buscar contatos recentes:', error);
    return { success: false, error: 'Erro ao buscar contatos recentes' };
  }
}
