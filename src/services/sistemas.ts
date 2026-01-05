import { supabase } from '@/lib/supabase';
import type { SistemaFotovoltaico, SistemaFormData } from '@/types/database';

export interface SistemasResult {
  success: boolean;
  data?: SistemaFotovoltaico[];
  error?: string;
}

export interface SistemaResult {
  success: boolean;
  data?: SistemaFotovoltaico;
  error?: string;
}

// Buscar todos os sistemas de uma empresa
export async function getSistemas(empresaId: number): Promise<SistemasResult> {
  try {
    const { data, error } = await supabase
      .from('sistemas_fotovoltaicos')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SistemaFotovoltaico[] };
  } catch (error) {
    console.error('Erro ao buscar sistemas:', error);
    return { success: false, error: 'Erro ao buscar sistemas' };
  }
}

// Buscar um sistema por ID
export async function getSistema(sistemaId: number): Promise<SistemaResult> {
  try {
    const { data, error } = await supabase
      .from('sistemas_fotovoltaicos')
      .select('*')
      .eq('id', sistemaId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SistemaFotovoltaico };
  } catch (error) {
    console.error('Erro ao buscar sistema:', error);
    return { success: false, error: 'Erro ao buscar sistema' };
  }
}

// Criar um novo sistema
export async function createSistema(empresaId: number, sistema: SistemaFormData): Promise<SistemaResult> {
  try {
    const { data, error } = await supabase
      .from('sistemas_fotovoltaicos')
      .insert({
        ...sistema,
        empresa_id: empresaId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SistemaFotovoltaico };
  } catch (error) {
    console.error('Erro ao criar sistema:', error);
    return { success: false, error: 'Erro ao criar sistema' };
  }
}

// Atualizar um sistema
export async function updateSistema(sistemaId: number, sistema: Partial<SistemaFormData>): Promise<SistemaResult> {
  try {
    const { data, error } = await supabase
      .from('sistemas_fotovoltaicos')
      .update({
        ...sistema,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sistemaId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SistemaFotovoltaico };
  } catch (error) {
    console.error('Erro ao atualizar sistema:', error);
    return { success: false, error: 'Erro ao atualizar sistema' };
  }
}

// Deletar um sistema
export async function deleteSistema(sistemaId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('sistemas_fotovoltaicos')
      .delete()
      .eq('id', sistemaId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar sistema:', error);
    return { success: false, error: 'Erro ao deletar sistema' };
  }
}

// Buscar sistemas por tipo
export async function getSistemasByTipo(empresaId: number, tipo: string): Promise<SistemasResult> {
  try {
    const { data, error } = await supabase
      .from('sistemas_fotovoltaicos')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('tipo_sistema', tipo)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SistemaFotovoltaico[] };
  } catch (error) {
    console.error('Erro ao buscar sistemas por tipo:', error);
    return { success: false, error: 'Erro ao buscar sistemas por tipo' };
  }
}
