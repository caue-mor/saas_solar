import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get("empresaId") || searchParams.get("companyId");

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar todos os status
    const { data: statuses, error: statusError } = await supabase
      .from("status_leads_fotovoltaico")
      .select("*")
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (statusError) {
      console.error("Erro ao buscar status:", statusError);
      return NextResponse.json(
        { error: "Erro ao buscar status" },
        { status: 500 }
      );
    }

    // Buscar leads da empresa
    const { data: leads, error: leadsError } = await supabase
      .from("contatos_fotovoltaico")
      .select("*, status_leads_fotovoltaico(*)")
      .eq("empresa_id", Number(empresaId))
      .order("last_update", { ascending: false });

    if (leadsError) {
      console.error("Erro ao buscar leads:", leadsError);
      return NextResponse.json(
        { error: "Erro ao buscar leads" },
        { status: 500 }
      );
    }

    // Montar estrutura de colunas do Kanban
    const columns = (statuses || []).map((status) => ({
      id: status.id.toString(),
      title: status.nome,
      color: status.cor || "#6B7280",
      leads: (leads || [])
        .filter((lead) => lead.status_lead_id === status.id)
        .map((lead) => ({
          id: lead.id,
          nome: lead.nome,
          celular: lead.celular,
          celular_formatado: lead.celular_formatado,
          email: lead.email,
          status_lead_id: status.id,
          origem: lead.origem,
          potencia_consumo_medio: lead.potencia_consumo_medio,
          observacoes_status: lead.observacoes_status,
          etapa_atual: lead.etapa_atual,
          atendimento_automatico: lead.atendimento_automatico,
          created_on: lead.created_on,
          last_update: lead.last_update,
          createdAt: formatRelativeTime(lead.created_on),
          updatedAt: formatRelativeTime(lead.last_update),
        })),
    }));

    return NextResponse.json({ columns });
  } catch (error) {
    console.error("Erro ao buscar kanban:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, fromStatusId, toStatusId, empresaId, observacoes } = body;

    if (!leadId || !toStatusId) {
      return NextResponse.json(
        { error: "leadId e toStatusId são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar novo status
    const { data: newStatus, error: statusError } = await supabase
      .from("status_leads_fotovoltaico")
      .select("*")
      .eq("id", Number(toStatusId))
      .single();

    if (statusError || !newStatus) {
      return NextResponse.json(
        { error: "Status não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar lead
    const updateData: Record<string, unknown> = {
      status_lead_id: Number(toStatusId),
      last_update: new Date().toISOString(),
    };

    if (observacoes) {
      updateData.observacoes_status = observacoes;
    }

    const { data: lead, error } = await supabase
      .from("contatos_fotovoltaico")
      .update(updateData)
      .eq("id", Number(leadId))
      .select("*, status_leads_fotovoltaico(*)")
      .single();

    if (error) {
      console.error("Erro ao mover lead:", error);
      return NextResponse.json(
        { error: "Erro ao mover lead", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Erro ao mover lead:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function formatRelativeTime(date: string | Date | null): string {
  if (!date) return "—";

  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Agora";
  if (minutes < 60) return `Há ${minutes} min`;
  if (hours < 24) return `Há ${hours}h`;
  if (days === 1) return "Ontem";
  if (days < 7) return `Há ${days} dias`;
  if (days < 30) return `Há ${Math.floor(days / 7)} semanas`;
  return `Há ${Math.floor(days / 30)} meses`;
}
