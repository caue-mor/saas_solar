import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const updateLeadSchema = z.object({
  nome: z.string().min(2).optional(),
  celular: z.string().min(10).optional(),
  email: z.string().email().optional().nullable(),
  origem: z
    .enum([
      "WHATSAPP",
      "SITE",
      "INDICACAO",
      "TELEFONE",
      "FACEBOOK",
      "INSTAGRAM",
      "TRAFEGO_PAGO",
      "OUTRO",
    ])
    .optional(),
  status_lead_id: z.number().optional(),
  potencia_consumo_medio: z.number().optional().nullable(),
  observacoes_status: z.string().optional().nullable(),
  atendimento_automatico: z.boolean().optional(),
  etapa_atual: z.number().optional(),
  dados_coletados: z.record(z.unknown()).optional(),
  follow_stage: z.number().optional(),
  follow_ativo: z.boolean().optional(),
  bloqueado: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: lead, error } = await supabase
      .from("contatos_fotovoltaico")
      .select("*, status_leads_fotovoltaico(*)")
      .eq("id", Number(id))
      .single();

    if (error || !lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Erro ao buscar lead:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateLeadSchema.parse(body);

    // Buscar lead atual
    const { data: currentLead, error: findError } = await supabase
      .from("contatos_fotovoltaico")
      .select("*, status_leads_fotovoltaico(*)")
      .eq("id", Number(id))
      .single();

    if (findError || !currentLead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    // Preparar dados de atualização
    const updateData: Record<string, unknown> = { ...validatedData };

    // Se celular foi alterado, formatar
    if (validatedData.celular) {
      const celularLimpo = validatedData.celular.replace(/\D/g, "");
      updateData.celular = celularLimpo;
      updateData.celular_valido = celularLimpo.length >= 10;
      if (celularLimpo.length === 11) {
        updateData.celular_formatado = `(${celularLimpo.slice(0, 2)}) ${celularLimpo.slice(2, 7)}-${celularLimpo.slice(7)}`;
      }
    }

    // Atualizar lead
    const { data: lead, error } = await supabase
      .from("contatos_fotovoltaico")
      .update(updateData)
      .eq("id", Number(id))
      .select("*, status_leads_fotovoltaico(*)")
      .single();

    if (error) {
      console.error("Erro ao atualizar lead:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar lead", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar lead:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("contatos_fotovoltaico")
      .delete()
      .eq("id", Number(id));

    if (error) {
      console.error("Erro ao deletar lead:", error);
      return NextResponse.json(
        { error: "Erro ao deletar lead", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar lead:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
