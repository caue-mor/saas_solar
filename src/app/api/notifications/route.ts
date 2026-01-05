import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Buscar notificações
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresaId = searchParams.get('empresaId');
    const limite = searchParams.get('limite');
    const apenasNaoLidas = searchParams.get('apenasNaoLidas') === 'true';

    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresaId é obrigatório' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('notificacoes_fotovoltaico')
      .select('*')
      .eq('id_empresa', parseInt(empresaId))
      .order('created_at', { ascending: false });

    if (apenasNaoLidas) {
      query = query.eq('lida', false);
    }

    if (limite) {
      query = query.limit(parseInt(limite));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar notificações:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar notificações' },
        { status: 500 }
      );
    }

    // Contar não lidas
    const { count } = await supabase
      .from('notificacoes_fotovoltaico')
      .select('*', { count: 'exact', head: true })
      .eq('id_empresa', parseInt(empresaId))
      .eq('lida', false);

    return NextResponse.json({
      notificacoes: data,
      naoLidas: count || 0,
    });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Marcar como lida
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificacaoId, empresaId, marcarTodas } = body;

    if (marcarTodas && empresaId) {
      // Marcar todas como lidas
      const { error } = await supabase
        .from('notificacoes_fotovoltaico')
        .update({ lida: true })
        .eq('id_empresa', empresaId)
        .eq('lida', false);

      if (error) {
        console.error('Erro ao marcar todas como lidas:', error);
        return NextResponse.json(
          { error: 'Erro ao marcar notificações' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (!notificacaoId) {
      return NextResponse.json(
        { error: 'notificacaoId é obrigatório' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('notificacoes_fotovoltaico')
      .update({ lida: true })
      .eq('id', notificacaoId);

    if (error) {
      console.error('Erro ao marcar como lida:', error);
      return NextResponse.json(
        { error: 'Erro ao marcar notificação' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar notificação
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const notificacaoId = searchParams.get('notificacaoId');

    if (!notificacaoId) {
      return NextResponse.json(
        { error: 'notificacaoId é obrigatório' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('notificacoes_fotovoltaico')
      .delete()
      .eq('id', parseInt(notificacaoId));

    if (error) {
      console.error('Erro ao deletar notificação:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar notificação' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
