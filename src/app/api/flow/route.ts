import { NextRequest, NextResponse } from "next/server";
import { getFlowByEmpresaId, saveFlow, validateFlow } from "@/services/flow";
import type { CompanyFlow } from "@/types/flow.types";

/**
 * GET /api/flow?empresaId=123
 * Busca o fluxo de uma empresa
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaIdStr = searchParams.get("empresaId");

    if (!empresaIdStr) {
      return NextResponse.json(
        { success: false, error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    const empresaId = parseInt(empresaIdStr, 10);
    if (isNaN(empresaId)) {
      return NextResponse.json(
        { success: false, error: "empresaId deve ser um número" },
        { status: 400 }
      );
    }

    const result = await getFlowByEmpresaId(empresaId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      flow: result.flow,
    });
  } catch (error) {
    console.error("[API Flow GET] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/flow
 * Salva um novo fluxo ou atualiza existente
 * Body: CompanyFlow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const flow = body as CompanyFlow;

    // Validação básica
    if (!flow.empresaId) {
      return NextResponse.json(
        { success: false, error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    // Valida estrutura do fluxo (opcional, pode ser desabilitado para rascunhos)
    const skipValidation = body.skipValidation === true;
    if (!skipValidation) {
      const validation = validateFlow(flow);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: "Fluxo inválido",
            validationErrors: validation.errors,
          },
          { status: 400 }
        );
      }
    }

    const result = await saveFlow(flow);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flow: result.flow,
      message: "Fluxo salvo com sucesso",
    });
  } catch (error) {
    console.error("[API Flow POST] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/flow
 * Atualiza um fluxo existente (alias para POST)
 */
export async function PUT(request: NextRequest) {
  return POST(request);
}

/**
 * DELETE /api/flow?empresaId=123
 * Remove o fluxo de uma empresa (define como null)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaIdStr = searchParams.get("empresaId");

    if (!empresaIdStr) {
      return NextResponse.json(
        { success: false, error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    const empresaId = parseInt(empresaIdStr, 10);
    if (isNaN(empresaId)) {
      return NextResponse.json(
        { success: false, error: "empresaId deve ser um número" },
        { status: 400 }
      );
    }

    // Seta o fluxo como null no banco
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("acessos_fotovoltaico")
      .update({ flow_config: null })
      .eq("id", empresaId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Fluxo removido com sucesso",
    });
  } catch (error) {
    console.error("[API Flow DELETE] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
