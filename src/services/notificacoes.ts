import { supabase } from '@/lib/supabase';

export interface Notificacao {
  id: number;
  id_empresa: number;
  tipo: 'novo_lead' | 'proposta_visualizada' | 'mensagem' | 'followup' | 'sistema';
  titulo: string;
  mensagem: string | null;
  link: string | null;
  id_referencia: number | null;
  lida: boolean;
  created_at: string;
}

export interface NotificacoesResult {
  success: boolean;
  data?: Notificacao[];
  error?: string;
}

// Buscar notificações da empresa
export async function getNotificacoes(
  empresaId: number,
  options?: {
    limite?: number;
    apenasNaoLidas?: boolean;
  }
): Promise<NotificacoesResult> {
  try {
    let query = supabase
      .from('notificacoes_fotovoltaico')
      .select('*')
      .eq('id_empresa', empresaId)
      .order('created_at', { ascending: false });

    if (options?.apenasNaoLidas) {
      query = query.eq('lida', false);
    }

    if (options?.limite) {
      query = query.limit(options.limite);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar notificações:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Notificacao[] };
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return { success: false, error: 'Erro interno ao buscar notificações' };
  }
}

// Contar notificações não lidas
export async function contarNaoLidas(empresaId: number): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notificacoes_fotovoltaico')
      .select('*', { count: 'exact', head: true })
      .eq('id_empresa', empresaId)
      .eq('lida', false);

    if (error) {
      console.error('Erro ao contar notificações:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erro ao contar notificações:', error);
    return 0;
  }
}

// Marcar notificação como lida
export async function marcarComoLida(notificacaoId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notificacoes_fotovoltaico')
      .update({ lida: true })
      .eq('id', notificacaoId);

    if (error) {
      console.error('Erro ao marcar como lida:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    return false;
  }
}

// Marcar todas como lidas
export async function marcarTodasComoLidas(empresaId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notificacoes_fotovoltaico')
      .update({ lida: true })
      .eq('id_empresa', empresaId)
      .eq('lida', false);

    if (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    return false;
  }
}

// Criar notificação manualmente
export async function criarNotificacao(
  empresaId: number,
  dados: {
    tipo: Notificacao['tipo'];
    titulo: string;
    mensagem?: string;
    link?: string;
    id_referencia?: number;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notificacoes_fotovoltaico')
      .insert({
        id_empresa: empresaId,
        tipo: dados.tipo,
        titulo: dados.titulo,
        mensagem: dados.mensagem || null,
        link: dados.link || null,
        id_referencia: dados.id_referencia || null,
      });

    if (error) {
      console.error('Erro ao criar notificação:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return false;
  }
}

// Deletar notificação
export async function deletarNotificacao(notificacaoId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notificacoes_fotovoltaico')
      .delete()
      .eq('id', notificacaoId);

    if (error) {
      console.error('Erro ao deletar notificação:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    return false;
  }
}

// Deletar notificações antigas (mais de 30 dias)
export async function limparNotificacoesAntigas(empresaId: number): Promise<boolean> {
  try {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);

    const { error } = await supabase
      .from('notificacoes_fotovoltaico')
      .delete()
      .eq('id_empresa', empresaId)
      .eq('lida', true)
      .lt('created_at', dataLimite.toISOString());

    if (error) {
      console.error('Erro ao limpar notificações antigas:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao limpar notificações antigas:', error);
    return false;
  }
}

// Helper para formatar tempo relativo
export function formatarTempoRelativo(dataString: string): string {
  const data = new Date(dataString);
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffHoras < 24) return `${diffHoras}h atrás`;
  if (diffDias < 7) return `${diffDias}d atrás`;

  return data.toLocaleDateString('pt-BR');
}

// Helper para ícone do tipo de notificação
export function getIconeTipo(tipo: Notificacao['tipo']): string {
  const icones: Record<Notificacao['tipo'], string> = {
    novo_lead: 'UserPlus',
    proposta_visualizada: 'Eye',
    mensagem: 'MessageSquare',
    followup: 'Clock',
    sistema: 'Bell',
  };
  return icones[tipo] || 'Bell';
}

// Helper para cor do tipo de notificação
export function getCorTipo(tipo: Notificacao['tipo']): string {
  const cores: Record<Notificacao['tipo'], string> = {
    novo_lead: 'bg-green-100 text-green-600',
    proposta_visualizada: 'bg-blue-100 text-blue-600',
    mensagem: 'bg-purple-100 text-purple-600',
    followup: 'bg-orange-100 text-orange-600',
    sistema: 'bg-gray-100 text-gray-600',
  };
  return cores[tipo] || 'bg-gray-100 text-gray-600';
}
