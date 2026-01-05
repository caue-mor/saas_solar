import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Schema de validação para atualizar sistema
const updateSystemSchema = z.object({
  tipo_sistema: z.enum(["RESIDENCIAL", "COMERCIAL", "RURAL", "INVESTIMENTO"]).optional(),
  descricao: z.string().optional(),
  imagem1: z.string().optional(),
  imagem2: z.string().optional(),
  potencia_usina: z.string().optional(),
  economia_anual: z.string().optional(),
  nome_cliente: z.string().optional(),
  detalhes: z.string().optional(),
});

// GET - Buscar sistema por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: sistema, error } = await supabase
      .from("sistemas_fotovoltaicos")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error || !sistema) {
      return NextResponse.json(
        { error: "Sistema não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(sistema);
  } catch (error) {
    console.error("Erro ao buscar sistema:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar sistema
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateSystemSchema.parse(body);

    // Verificar se sistema existe
    const { data: existing, error: findError } = await supabase
      .from("sistemas_fotovoltaicos")
      .select("id")
      .eq("id", Number(id))
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { error: "Sistema não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar sistema
    const { data: sistema, error } = await supabase
      .from("sistemas_fotovoltaicos")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", Number(id))
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar sistema:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar sistema", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(sistema);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar sistema:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Excluir sistema
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se sistema existe
    const { data: existing, error: findError } = await supabase
      .from("sistemas_fotovoltaicos")
      .select("id")
      .eq("id", Number(id))
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { error: "Sistema não encontrado" },
        { status: 404 }
      );
    }

    // Deletar sistema
    const { error } = await supabase
      .from("sistemas_fotovoltaicos")
      .delete()
      .eq("id", Number(id));

    if (error) {
      console.error("Erro ao excluir sistema:", error);
      return NextResponse.json(
        { error: "Erro ao excluir sistema", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Sistema excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir sistema:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 }
    );
  }
}
