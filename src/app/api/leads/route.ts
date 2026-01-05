import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const leadSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  celular: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().nullable(),
  origem: z.enum([
    "WHATSAPP",
    "SITE",
    "INDICACAO",
    "TELEFONE",
    "FACEBOOK",
    "INSTAGRAM",
    "TRAFEGO_PAGO",
    "OUTRO",
  ]).optional(),
  potencia_consumo_medio: z.number().optional().nullable(),
  observacoes_status: z.string().optional().nullable(),
  empresa_id: z.number(),
  status_lead_id: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get("empresaId") || searchParams.get("companyId");
    const statusId = searchParams.get("statusId");
    const origem = searchParams.get("origem") || searchParams.get("source");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    // Construir query base
    let query = supabase
      .from("contatos_fotovoltaico")
      .select("*, status_leads_fotovoltaico(*)", { count: "exact" })
      .eq("empresa_id", Number(empresaId))
      .order("created_on", { ascending: false });

    // Filtros
    if (statusId) {
      query = query.eq("status_lead_id", Number(statusId));
    }

    if (origem) {
      query = query.eq("origem", origem);
    }

    if (search) {
      query = query.or(
        `nome.ilike.%${search}%,celular.ilike.%${search}%,celular_formatado.ilike.%${search}%`
      );
    }

    // Paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error("Erro ao buscar leads:", error);
      return NextResponse.json(
        { error: "Erro ao buscar leads", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      leads: leads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = leadSchema.parse(body);

    // Formatar celular
    const celularLimpo = validatedData.celular.replace(/\D/g, "");
    let celularFormatado = celularLimpo;
    if (celularLimpo.length === 11) {
      celularFormatado = `(${celularLimpo.slice(0, 2)}) ${celularLimpo.slice(2, 7)}-${celularLimpo.slice(7)}`;
    }

    // Buscar status padrão se não fornecido
    let statusLeadId = validatedData.status_lead_id;
    if (!statusLeadId) {
      const { data: defaultStatus } = await supabase
        .from("status_leads_fotovoltaico")
        .select("id")
        .eq("nome", "Novo")
        .single();

      statusLeadId = defaultStatus?.id;
    }

    // Criar lead
    const { data: lead, error } = await supabase
      .from("contatos_fotovoltaico")
      .insert({
        nome: validatedData.nome,
        celular: celularLimpo,
        celular_formatado: celularFormatado,
        celular_valido: celularLimpo.length >= 10,
        email: validatedData.email,
        origem: validatedData.origem || "OUTRO",
        potencia_consumo_medio: validatedData.potencia_consumo_medio,
        observacoes_status: validatedData.observacoes_status,
        empresa_id: validatedData.empresa_id,
        status_lead_id: statusLeadId,
        etapa_atual: 1,
        atendimento_automatico: true,
      })
      .select("*, status_leads_fotovoltaico(*)")
      .single();

    if (error) {
      console.error("Erro ao criar lead:", error);
      return NextResponse.json(
        { error: "Erro ao criar lead", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erro ao criar lead:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
