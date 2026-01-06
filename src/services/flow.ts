import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { CompanyFlow } from "@/types/flow.types";
import { DEFAULT_GLOBAL_CONFIG } from "@/types/flow.types";

// Criar cliente Supabase sob demanda para evitar problemas em serverless
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[Flow Service] Variáveis de ambiente não configuradas:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
    });
    throw new Error("Supabase não configurado corretamente");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export interface FlowResponse {
  success: boolean;
  flow?: CompanyFlow;
  error?: string;
}

/**
 * Busca o fluxo de uma empresa
 */
export async function getFlowByEmpresaId(empresaId: number): Promise<FlowResponse> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("acessos_fotovoltaico")
      .select("id, empresa, nome_empresa, flow_config")
      .eq("id", empresaId)
      .single();

    if (error) {
      console.error("[Flow Service] Erro ao buscar fluxo:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Empresa não encontrada" };
    }

    // Se não tem flow_config, retorna um fluxo vazio com config padrão
    if (!data.flow_config) {
      return {
        success: true,
        flow: {
          empresaId,
          nome: "Fluxo Principal",
          versao: 0,
          ativo: true,
          nodes: [],
          edges: [],
          globalConfig: DEFAULT_GLOBAL_CONFIG,
        },
      };
    }

    // Retorna o flow_config armazenado
    const flowConfig = data.flow_config as CompanyFlow;
    return {
      success: true,
      flow: {
        ...flowConfig,
        empresaId,
      },
    };
  } catch (err) {
    console.error("[Flow Service] Erro inesperado:", err);
    return { success: false, error: "Erro interno ao buscar fluxo" };
  }
}

/**
 * Salva ou atualiza o fluxo de uma empresa
 */
export async function saveFlow(flow: CompanyFlow): Promise<FlowResponse> {
  try {
    const supabase = getSupabaseClient();
    const { empresaId, ...flowData } = flow;

    console.log("[Flow Service] Salvando fluxo para empresa:", empresaId);

    // Incrementa versão
    const novaVersao = (flow.versao || 0) + 1;
    const flowToSave = {
      ...flowData,
      versao: novaVersao,
      updatedAt: new Date().toISOString(),
    };

    console.log("[Flow Service] Dados a salvar:", {
      empresaId,
      versao: novaVersao,
      nodesCount: flowData.nodes?.length || 0,
      edgesCount: flowData.edges?.length || 0,
    });

    const { data, error } = await supabase
      .from("acessos_fotovoltaico")
      .update({
        flow_config: flowToSave,
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresaId)
      .select("id, flow_config")
      .single();

    if (error) {
      console.error("[Flow Service] Erro ao salvar fluxo:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.error("[Flow Service] Nenhum dado retornado após update - empresa não existe?");
      return { success: false, error: "Empresa não encontrada ou sem permissão" };
    }

    console.log("[Flow Service] Fluxo salvo com sucesso:", data.id);

    return {
      success: true,
      flow: {
        ...(data.flow_config as CompanyFlow),
        empresaId,
      },
    };
  } catch (err) {
    console.error("[Flow Service] Erro inesperado ao salvar:", err);
    return { success: false, error: "Erro interno ao salvar fluxo" };
  }
}

/**
 * Valida a estrutura do fluxo antes de salvar
 */
export function validateFlow(flow: CompanyFlow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verifica se tem pelo menos um nó
  if (!flow.nodes || flow.nodes.length === 0) {
    errors.push("O fluxo precisa ter pelo menos um nó");
  }

  // Verifica se tem um nó de saudação
  const hasGreeting = flow.nodes?.some((n) => n.type === "GREETING");
  if (!hasGreeting) {
    errors.push("O fluxo precisa ter um nó de Saudação (GREETING)");
  }

  // Verifica nós órfãos (sem conexões, exceto o primeiro)
  if (flow.nodes && flow.edges) {
    const connectedNodeIds = new Set<string>();
    flow.edges.forEach((edge) => {
      connectedNodeIds.add(edge.source!);
      connectedNodeIds.add(edge.target!);
    });

    // Primeiro nó pode não ter entrada
    const firstNode = flow.nodes.find((n) => n.type === "GREETING");
    if (firstNode) {
      connectedNodeIds.add(firstNode.id);
    }

    const orphanNodes = flow.nodes.filter((n) => !connectedNodeIds.has(n.id));
    if (orphanNodes.length > 0) {
      errors.push(`Existem ${orphanNodes.length} nó(s) sem conexão`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Duplica um fluxo existente
 */
export async function duplicateFlow(
  empresaId: number,
  novoNome: string
): Promise<FlowResponse> {
  const { success, flow, error } = await getFlowByEmpresaId(empresaId);

  if (!success || !flow) {
    return { success: false, error: error || "Fluxo não encontrado" };
  }

  // Cria cópia com novo nome e versão 1
  const duplicatedFlow: CompanyFlow = {
    ...flow,
    nome: novoNome,
    versao: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return saveFlow(duplicatedFlow);
}

/**
 * Exporta o fluxo como JSON para backup
 */
export async function exportFlowAsJson(empresaId: number): Promise<string | null> {
  const { success, flow } = await getFlowByEmpresaId(empresaId);

  if (!success || !flow) {
    return null;
  }

  return JSON.stringify(flow, null, 2);
}

/**
 * Importa um fluxo de um JSON
 */
export async function importFlowFromJson(
  empresaId: number,
  jsonString: string
): Promise<FlowResponse> {
  try {
    const importedFlow = JSON.parse(jsonString) as CompanyFlow;

    // Sobrescreve empresaId e reseta versão
    const flowToImport: CompanyFlow = {
      ...importedFlow,
      empresaId,
      versao: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return saveFlow(flowToImport);
  } catch (err) {
    return { success: false, error: "JSON inválido" };
  }
}
