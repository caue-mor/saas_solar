import { supabase } from '@/lib/supabase';
import type { StatusLeadFotovoltaico } from '@/types/database';

export interface StatusLeadsResult {
  success: boolean;
  data?: StatusLeadFotovoltaico[];
  error?: string;
}

// Buscar todos os status de leads
export async function getStatusLeads(): Promise<StatusLeadsResult> {
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
    console.error('Erro ao buscar status leads:', error);
    return { success: false, error: 'Erro ao buscar status leads' };
  }
}

// Buscar todos os status (incluindo inativos)
export async function getAllStatusLeads(): Promise<StatusLeadsResult> {
  try {
    const { data, error } = await supabase
      .from('status_leads_fotovoltaico')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as StatusLeadFotovoltaico[] };
  } catch (error) {
    console.error('Erro ao buscar todos os status leads:', error);
    return { success: false, error: 'Erro ao buscar status leads' };
  }
}

// Buscar status por ID
export async function getStatusLeadById(id: number): Promise<{ success: boolean; data?: StatusLeadFotovoltaico; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('status_leads_fotovoltaico')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as StatusLeadFotovoltaico };
  } catch (error) {
    console.error('Erro ao buscar status lead:', error);
    return { success: false, error: 'Erro ao buscar status lead' };
  }
}
