import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Schema de validação para criar/atualizar sistema
const systemSchema = z.object({
  tipo_sistema: z.enum(["RESIDENCIAL", "COMERCIAL", "RURAL", "INVESTIMENTO"]),
  descricao: z.string().optional(),
  imagem1: z.string().optional(),
  imagem2: z.string().optional(),
  potencia_usina: z.string().optional(),
  economia_anual: z.string().optional(),
  nome_cliente: z.string().optional(),
  detalhes: z.string().optional(),
  empresa_id: z.number(),
});

// GET - Listar sistemas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get("empresaId") || searchParams.get("companyId");
    const tipo = searchParams.get("tipo") || searchParams.get("type");
    const search = searchParams.get("search");

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    // Construir query
    let query = supabase
      .from("sistemas_fotovoltaicos")
      .select("*")
      .eq("empresa_id", Number(empresaId))
      .order("created_at", { ascending: false });

    if (tipo && tipo !== "all") {
      query = query.eq("tipo_sistema", tipo);
    }

    if (search) {
      query = query.or(
        `nome_cliente.ilike.%${search}%,descricao.ilike.%${search}%,detalhes.ilike.%${search}%`
      );
    }

    const { data: sistemas, error } = await query;

    if (error) {
      console.error("Erro ao buscar sistemas:", error);
      return NextResponse.json(
        { error: "Erro ao buscar sistemas", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(sistemas || []);
  } catch (error) {
    console.error("Erro ao buscar sistemas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Criar novo sistema
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = systemSchema.parse(body);

    const { data: sistema, error } = await supabase
      .from("sistemas_fotovoltaicos")
      .insert({
        empresa_id: validatedData.empresa_id,
        tipo_sistema: validatedData.tipo_sistema,
        descricao: validatedData.descricao,
        imagem1: validatedData.imagem1,
        imagem2: validatedData.imagem2,
        potencia_usina: validatedData.potencia_usina,
        economia_anual: validatedData.economia_anual,
        nome_cliente: validatedData.nome_cliente,
        detalhes: validatedData.detalhes,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar sistema:", error);
      return NextResponse.json(
        { error: "Erro ao criar sistema", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(sistema, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erro ao criar sistema:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 }
    );
  }
}
