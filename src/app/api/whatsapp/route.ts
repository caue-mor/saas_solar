import { NextRequest, NextResponse } from "next/server";
import {
  getInstanceStatus,
  connectInstance,
  disconnectInstance,
  setWebhook,
  createInstance,
  sendTextMessage,
  formatPhone,
  validateBrazilianPhone,
  findInstancesForCompany,
  cleanupDuplicateInstances,
  type ConnectionStatus,
  type Instance,
} from "@/lib/uazapi";
import { supabase } from "@/lib/supabase";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// URL do webhook global do agente (Railway)
const AGENT_WEBHOOK_URL = process.env.AGENT_WEBHOOK_URL || "https://saas-solar-agente-production.up.railway.app/webhook/global";

// GET - Obter status da instância WhatsApp
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get("empresaId");

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar empresa no banco
    const { data: empresa, error } = await supabase
      .from("acessos_fotovoltaico")
      .select(
        "id, email, token_whatsapp, uazapi_instancia, whatsapp_status, whatsapp_numero, numero_atendimento, nome_empresa, webhook_url"
      )
      .eq("id", Number(empresaId))
      .single();

    if (error || !empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Se não tem token, retornar status inicial
    if (!empresa.token_whatsapp && !empresa.uazapi_instancia) {
      return NextResponse.json({
        status: "not_created" as ConnectionStatus,
        message: "Instância WhatsApp não criada",
        empresa: {
          id: empresa.id,
          nome: empresa.nome_empresa,
        },
      });
    }

    // Se tem token, buscar status na UAZAPI
    if (empresa.token_whatsapp) {
      const result = await getInstanceStatus(empresa.token_whatsapp);

      if (!result.success) {
        // Se erro na API, retornar status local
        return NextResponse.json({
          status: (empresa.whatsapp_status || "disconnected") as ConnectionStatus,
          error: result.error,
          localStatus: true,
          empresa: {
            id: empresa.id,
            nome: empresa.nome_empresa,
            numero: empresa.whatsapp_numero || empresa.numero_atendimento,
          },
        });
      }

      const apiStatus = result.data?.status || "disconnected";
      const owner = result.data?.owner || result.data?.instance?.owner;

      // Sincronizar dados com o banco se mudou
      const updates: Record<string, unknown> = {};

      if (apiStatus !== empresa.whatsapp_status) {
        updates.whatsapp_status = apiStatus;
      }

      if (owner && owner !== empresa.whatsapp_numero) {
        const cleanOwner = owner.replace("@s.whatsapp.net", "");
        updates.whatsapp_numero = cleanOwner;
        updates.numero_atendimento = cleanOwner;
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await supabase
          .from("acessos_fotovoltaico")
          .update(updates)
          .eq("id", Number(empresaId));
      }

      return NextResponse.json({
        status: apiStatus,
        qrcode: result.data?.qrcode,
        paircode: result.data?.paircode,
        connected: result.data?.connected || apiStatus === "connected",
        profileName: result.data?.profileName || result.data?.instance?.profileName,
        profilePicUrl: result.data?.profilePicUrl || result.data?.instance?.profilePicUrl,
        empresa: {
          id: empresa.id,
          nome: empresa.nome_empresa,
          numero: owner?.replace("@s.whatsapp.net", "") || empresa.whatsapp_numero,
        },
      });
    }

    // Fallback
    return NextResponse.json({
      status: (empresa.whatsapp_status || "not_created") as ConnectionStatus,
      empresa: {
        id: empresa.id,
        nome: empresa.nome_empresa,
        numero: empresa.whatsapp_numero,
      },
    });
  } catch (error) {
    console.error("[API WhatsApp] Erro ao obter status:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Ações do WhatsApp (connect, disconnect, create, webhook, send)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, empresaId, ...params } = body;

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from("acessos_fotovoltaico")
      .select(
        "id, email, token_whatsapp, uazapi_instancia, nome_empresa, slug, whatsapp_status, whatsapp_numero, webhook_url, produto_plano"
      )
      .eq("id", Number(empresaId))
      .single();

    if (empresaError || !empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    switch (action) {
      // ==========================================
      // CRIAR INSTÂNCIA
      // ==========================================
      case "create": {
        if (empresa.token_whatsapp) {
          return NextResponse.json(
            { error: "Instância já existe", token: empresa.token_whatsapp },
            { status: 400 }
          );
        }

        const instanceName = `solar-${empresa.slug || empresa.id}`;
        // Usar webhook global do agente Railway
        const webhookUrl = AGENT_WEBHOOK_URL;

        console.log(`[API WhatsApp] Criando instância: ${instanceName}`);

        const result = await createInstance(instanceName, {
          adminField01: empresa.email || String(empresaId),
          webhookUrl,
          webhookEvents: ["messages", "connection"], // Igual ConectUazapi
        });

        if (!result.success) {
          console.error(`[API WhatsApp] Erro ao criar instância:`, result.error);
          return NextResponse.json(
            { error: result.error || "Erro ao criar instância na UAZAPI" },
            { status: 500 }
          );
        }

        // Salvar dados no banco
        await supabase
          .from("acessos_fotovoltaico")
          .update({
            token_whatsapp: result.data?.token,
            uazapi_instancia: result.data?.instance?.id || result.data?.token,
            whatsapp_status: "disconnected",
            webhook_url: webhookUrl,
          })
          .eq("id", Number(empresaId));

        console.log(`[API WhatsApp] Instância criada com sucesso`);

        return NextResponse.json({
          success: true,
          message: "Instância criada com sucesso",
          token: result.data?.token,
          instance: result.data?.instance,
        });
      }

      // ==========================================
      // CONECTAR (QR CODE OU PAIRCODE)
      // CRUD Inteligente: Busca, reutiliza, cria, limpa duplicatas
      // ==========================================
      case "connect": {
        const connectionType = params.type || "qrcode";
        const phone = params.phone;
        const instanceNamePrefix = `solar-${empresa.slug || empresa.id}`;

        console.log(`[API WhatsApp] ========== INICIANDO CONEXÃO ==========`);
        console.log(`[API WhatsApp] Empresa: ${empresa.nome_empresa} (ID: ${empresaId})`);
        console.log(`[API WhatsApp] Email: ${empresa.email}`);
        console.log(`[API WhatsApp] Tipo: ${connectionType}`);
        console.log(`[API WhatsApp] Token no Supabase: ${empresa.token_whatsapp ? 'SIM' : 'NÃO'}`);

        // Validar telefone se for paircode
        if (connectionType === "paircode") {
          if (!phone) {
            return NextResponse.json(
              { error: "Número de telefone é obrigatório para conexão via PairCode" },
              { status: 400 }
            );
          }
          if (!validateBrazilianPhone(phone)) {
            return NextResponse.json(
              { error: "Formato de telefone inválido. Use DDD + número (ex: 19997606702)" },
              { status: 400 }
            );
          }
        }

        let token: string | null = null;
        let instanceId: string | null = null;
        let reusingExisting = false;
        let cleanedDuplicates: string[] = [];

        // ========================================
        // PASSO 1: Verificar se tem token no Supabase e se é válido
        // ========================================
        if (empresa.token_whatsapp) {
          console.log(`[API WhatsApp] Verificando token existente no Supabase...`);
          const statusCheck = await getInstanceStatus(empresa.token_whatsapp);

          if (statusCheck.success) {
            console.log(`[API WhatsApp] Token válido! Status: ${statusCheck.data?.status || statusCheck.data?.instance?.status}`);
            token = empresa.token_whatsapp;
            instanceId = empresa.uazapi_instancia || null;
            reusingExisting = true;

            // Se já está conectado, retornar status
            const currentStatus = statusCheck.data?.status || (statusCheck.data?.instance as unknown as Record<string, unknown>)?.status;
            if (currentStatus === "connected") {
              console.log(`[API WhatsApp] Instância já conectada!`);
              return NextResponse.json({
                success: true,
                status: "connected",
                message: "WhatsApp já está conectado",
                reusingExisting: true,
              });
            }
          } else {
            console.log(`[API WhatsApp] Token inválido ou instância não existe mais`);
            // Token inválido, limpar do banco
            await supabase
              .from("acessos_fotovoltaico")
              .update({
                token_whatsapp: null,
                uazapi_instancia: null,
                whatsapp_status: "not_created",
                  })
              .eq("id", Number(empresaId));
          }
        }

        // ========================================
        // PASSO 2: Se não tem token válido, buscar na UAZAPI por instâncias existentes
        // ========================================
        if (!token) {
          console.log(`[API WhatsApp] Buscando instâncias existentes na UAZAPI...`);
          const existingInstances = await findInstancesForCompany(
            empresa.email || "",
            instanceNamePrefix
          );

          if (existingInstances.length > 0) {
            console.log(`[API WhatsApp] Encontradas ${existingInstances.length} instância(s) para esta empresa`);

            // Se tem múltiplas, limpar duplicatas
            if (existingInstances.length > 1) {
              console.log(`[API WhatsApp] Limpando ${existingInstances.length - 1} instância(s) duplicada(s)...`);
              const cleanup = await cleanupDuplicateInstances(existingInstances);
              cleanedDuplicates = cleanup.deleted;

              if (cleanup.kept) {
                token = cleanup.kept.token;
                instanceId = cleanup.kept.id;
                reusingExisting = true;
                console.log(`[API WhatsApp] Mantendo instância: ${cleanup.kept.name} (${cleanup.kept.status})`);
              }
            } else {
              // Apenas uma instância
              const existing = existingInstances[0];
              token = existing.token;
              instanceId = existing.id;
              reusingExisting = true;
              console.log(`[API WhatsApp] Reutilizando instância existente: ${existing.name} (${existing.status})`);
            }

            // Atualizar Supabase com o token encontrado
            if (token) {
              const { error: updateTokenError } = await supabase
                .from("acessos_fotovoltaico")
                .update({
                  token_whatsapp: token,
                  uazapi_instancia: instanceId,
                      })
                .eq("id", Number(empresaId));

              if (updateTokenError) {
                console.error(`[API WhatsApp] Erro ao atualizar token no Supabase:`, updateTokenError);
              } else {
                console.log(`[API WhatsApp] Token atualizado no Supabase`);
              }
            }
          }
        }

        // ========================================
        // PASSO 3: Se ainda não tem token, criar nova instância
        // ========================================
        if (!token) {
          console.log(`[API WhatsApp] Nenhuma instância encontrada, criando nova...`);

          const createResult = await createInstance(instanceNamePrefix, {
            adminField01: empresa.email || String(empresaId),
            webhookUrl: AGENT_WEBHOOK_URL,
            webhookEvents: ["messages", "connection"], // Igual ConectUazapi
          });

          if (!createResult.success) {
            console.error(`[API WhatsApp] Erro ao criar instância:`, createResult.error);
            return NextResponse.json(
              { error: createResult.error || "Erro ao criar instância" },
              { status: 500 }
            );
          }

          token = createResult.data?.token || null;
          instanceId = createResult.data?.instance?.id || null;

          console.log(`[API WhatsApp] Nova instância criada! Token: ${token?.substring(0, 8)}...`);

          // Salvar no Supabase
          const { error: saveError } = await supabase
            .from("acessos_fotovoltaico")
            .update({
              token_whatsapp: token,
              uazapi_instancia: instanceId,
              webhook_url: AGENT_WEBHOOK_URL,
              whatsapp_status: "disconnected",
              })
            .eq("id", Number(empresaId));

          if (saveError) {
            console.error(`[API WhatsApp] Erro ao salvar no Supabase:`, saveError);
          } else {
            console.log(`[API WhatsApp] Dados salvos no Supabase com sucesso`);
          }
        }

        // ========================================
        // PASSO 4: Configurar webhook (POST /webhook - igual ConectUazapi)
        // ========================================
        console.log(`[API WhatsApp] Configurando webhook: ${AGENT_WEBHOOK_URL}`);
        const webhookResult = await setWebhook(token!, {
          url: AGENT_WEBHOOK_URL,
          enabled: true,
          events: ["messages", "connection"], // Igual ConectUazapi
          excludeMessages: ["wasSentByApi", "isGroupYes"], // Igual ConectUazapi
        });

        if (webhookResult.success) {
          console.log(`[API WhatsApp] Webhook configurado com sucesso`);
        } else {
          console.error(`[API WhatsApp] Erro ao configurar webhook:`, webhookResult.error);
        }

        // ========================================
        // PASSO 5: Salvar TODOS os dados no Supabase ANTES de conectar
        // (Igual ConectUazapi - salva tudo de uma vez)
        // ========================================
        const allDataUpdates: Record<string, unknown> = {
          // Token e instância
          token_whatsapp: token,
          uazapi_instancia: token, // Na tabela fotovoltaico, uazapi_instancia = token
          // Webhook
          webhook_url: AGENT_WEBHOOK_URL,
          // Status - já marcar como connected (igual ConectUazapi)
          whatsapp_status: "connected",
          status_plano: "ativo",
          produto_plano: "IA ATENDIMENTO",
        };

        // Número do WhatsApp
        if (phone) {
          allDataUpdates.whatsapp_numero = phone;
          allDataUpdates.numero_atendimento = phone;
        }

        console.log(`[API WhatsApp] ============ SALVANDO NO SUPABASE ============`);
        console.log(`[API WhatsApp] EmpresaId: ${empresaId}`);
        console.log(`[API WhatsApp] Updates:`, JSON.stringify(allDataUpdates, null, 2));

        let supabaseSaveSuccess = false;
        try {
          const { error: saveErr, data: savedData } = await supabase
            .from("acessos_fotovoltaico")
            .update(allDataUpdates)
            .eq("id", Number(empresaId))
            .select();

          if (saveErr) {
            console.error(`[API WhatsApp] ❌ ERRO Supabase:`, JSON.stringify(saveErr, null, 2));
          } else {
            supabaseSaveSuccess = true;
            console.log(`[API WhatsApp] ✅ Dados salvos com sucesso!`);
            console.log(`[API WhatsApp] Resultado:`, JSON.stringify(savedData, null, 2));
          }
        } catch (supabaseErr) {
          console.error(`[API WhatsApp] ❌ EXCEÇÃO Supabase:`, supabaseErr);
        }

        // ========================================
        // PASSO 6: Conectar (gerar QR Code ou PairCode)
        // ========================================
        console.log(`[API WhatsApp] Conectando via ${connectionType}...`);
        const result = await connectInstance(token!, connectionType, phone);

        console.log(`[API WhatsApp] Resposta UAZAPI connect:`, JSON.stringify(result, null, 2));

        if (!result.success) {
          console.error(`[API WhatsApp] Erro ao conectar:`, result.error);
          return NextResponse.json(
            { error: result.error || "Erro ao conectar na UAZAPI" },
            { status: 500 }
          );
        }

        // ========================================
        // PASSO 7: Extrair QR Code da resposta
        // ========================================
        const responseData = result.data as Record<string, unknown> | undefined;
        const instanceData = responseData?.instance as Record<string, unknown> | undefined;

        const qrcode = instanceData?.qrcode as string | undefined
          || responseData?.qrcode as string | undefined;

        const paircode = instanceData?.paircode as string | undefined
          || responseData?.paircode as string | undefined;

        console.log(`[API WhatsApp] QR Code: ${qrcode ? 'SIM' : 'NÃO'}, PairCode: ${paircode ? 'SIM' : 'NÃO'}`);
        console.log(`[API WhatsApp] ========== CONEXÃO FINALIZADA ==========`);

        return NextResponse.json({
          success: true,
          status: "connecting", // Status correto após gerar QR
          qrcode,
          paircode,
          connectionType,
          reusingExisting,
          cleanedDuplicates: cleanedDuplicates.length > 0 ? cleanedDuplicates : undefined,
          savedToDatabase: supabaseSaveSuccess,
          token: process.env.NODE_ENV === "development" ? token : undefined,
        });
      }

      // ==========================================
      // DESCONECTAR
      // ==========================================
      case "disconnect": {
        if (!empresa.token_whatsapp) {
          return NextResponse.json(
            { error: "Instância não existe" },
            { status: 400 }
          );
        }

        console.log(`[API WhatsApp] Desconectando instância`);

        const result = await disconnectInstance(empresa.token_whatsapp);

        if (!result.success) {
          console.error(`[API WhatsApp] Erro ao desconectar:`, result.error);
          return NextResponse.json(
            { error: result.error || "Erro ao desconectar" },
            { status: 500 }
          );
        }

        // Atualizar status e limpar número
        await supabase
          .from("acessos_fotovoltaico")
          .update({
            whatsapp_status: "disconnected",
            whatsapp_numero: null,
            numero_atendimento: null,
          })
          .eq("id", Number(empresaId));

        return NextResponse.json({
          success: true,
          message: "Desconectado com sucesso",
        });
      }

      // ==========================================
      // CONFIGURAR WEBHOOK
      // ==========================================
      case "webhook": {
        if (!empresa.token_whatsapp) {
          return NextResponse.json(
            { error: "Instância não existe" },
            { status: 400 }
          );
        }

        const { url } = params;
        // Priorizar webhook global do agente Railway
        const webhookUrl = url || AGENT_WEBHOOK_URL;

        console.log(`[API WhatsApp] Configurando webhook: ${webhookUrl}`);

        const result = await setWebhook(empresa.token_whatsapp, {
          url: webhookUrl,
          enabled: true,
          events: ["messages", "connection"], // Igual ConectUazapi
          excludeMessages: ["wasSentByApi", "isGroupYes"], // Igual ConectUazapi
        });

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || "Erro ao configurar webhook" },
            { status: 500 }
          );
        }

        // Salvar URL no banco
        const { error: webhookSaveError } = await supabase
          .from("acessos_fotovoltaico")
          .update({
            webhook_url: webhookUrl,
          })
          .eq("id", Number(empresaId));

        if (webhookSaveError) {
          console.error(`[API WhatsApp] Erro ao salvar webhook no banco:`, webhookSaveError);
        }

        return NextResponse.json({
          success: true,
          message: "Webhook configurado com sucesso",
          url: webhookUrl,
          savedToDatabase: !webhookSaveError,
        });
      }

      // ==========================================
      // ENVIAR MENSAGEM
      // ==========================================
      case "send": {
        if (!empresa.token_whatsapp) {
          return NextResponse.json(
            { error: "Instância não existe" },
            { status: 400 }
          );
        }

        // Verificar se está conectado
        if (empresa.whatsapp_status !== "connected") {
          return NextResponse.json(
            { error: "WhatsApp não está conectado" },
            { status: 400 }
          );
        }

        const { phone, message } = params;
        if (!phone || !message) {
          return NextResponse.json(
            { error: "phone e message são obrigatórios" },
            { status: 400 }
          );
        }

        console.log(`[API WhatsApp] Enviando mensagem para: ${formatPhone(phone)}`);

        const result = await sendTextMessage(
          empresa.token_whatsapp,
          phone,
          message
        );

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || "Erro ao enviar mensagem" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Mensagem enviada com sucesso",
          data: result.data,
        });
      }

      // ==========================================
      // CONFIGURAR INSTÂNCIA EXISTENTE (Setup manual)
      // ==========================================
      case "setup": {
        const { instanceToken } = params;

        if (!instanceToken) {
          return NextResponse.json(
            { error: "instanceToken é obrigatório" },
            { status: 400 }
          );
        }

        console.log(`[API WhatsApp] Configurando instância existente com token: ${instanceToken}`);

        // Verificar se o token é válido
        const statusResult = await getInstanceStatus(instanceToken);
        if (!statusResult.success) {
          return NextResponse.json(
            { error: "Token inválido ou instância não encontrada" },
            { status: 400 }
          );
        }

        // Configurar webhook (igual ConectUazapi)
        console.log(`[API WhatsApp] Configurando webhook: ${AGENT_WEBHOOK_URL}`);
        const webhookResult = await setWebhook(instanceToken, {
          url: AGENT_WEBHOOK_URL,
          enabled: true,
          events: ["messages", "connection"],
          excludeMessages: ["wasSentByApi", "isGroupYes"],
        });

        // Atualizar banco de dados
        const instanceInfo = statusResult.data?.instance || statusResult.data;
        const apiStatus = (instanceInfo as Record<string, unknown>)?.status as string || statusResult.data?.status || "disconnected";
        const owner = (instanceInfo as Record<string, unknown>)?.owner as string || statusResult.data?.owner;

        const setupUpdates: Record<string, unknown> = {
          token_whatsapp: instanceToken,
          uazapi_instancia: (instanceInfo as Record<string, unknown>)?.id as string || instanceToken,
          webhook_url: AGENT_WEBHOOK_URL,
          whatsapp_status: apiStatus,
          updated_at: new Date().toISOString(),
        };

        if (owner) {
          const cleanOwner = owner.replace("@s.whatsapp.net", "");
          setupUpdates.whatsapp_numero = cleanOwner;
          setupUpdates.numero_atendimento = cleanOwner;
        }

        if (apiStatus === "connected") {
          setupUpdates.status_plano = "ativo";
        }

        const { error: setupError } = await supabase
          .from("acessos_fotovoltaico")
          .update(setupUpdates)
          .eq("id", Number(empresaId));

        if (setupError) {
          console.error(`[API WhatsApp] Erro ao salvar setup:`, setupError);
          return NextResponse.json(
            { error: "Erro ao salvar configuração no banco" },
            { status: 500 }
          );
        }

        console.log(`[API WhatsApp] Instância configurada com sucesso`);

        return NextResponse.json({
          success: true,
          message: "Instância configurada com sucesso",
          status: apiStatus,
          numero: owner?.replace("@s.whatsapp.net", ""),
          webhookConfigured: webhookResult.success,
        });
      }

      // ==========================================
      // SINCRONIZAR STATUS COM UAZAPI
      // ==========================================
      case "sync": {
        if (!empresa.token_whatsapp) {
          return NextResponse.json({
            success: true,
            status: "not_created",
            message: "Nenhuma instância para sincronizar",
          });
        }

        console.log(`[API WhatsApp] Sincronizando status`);

        const result = await getInstanceStatus(empresa.token_whatsapp);

        if (!result.success) {
          return NextResponse.json({
            success: false,
            error: result.error,
            localStatus: empresa.whatsapp_status,
          });
        }

        const apiStatus = result.data?.status || "disconnected";
        const owner = result.data?.owner || result.data?.instance?.owner;

        // Verificar e corrigir webhook se necessário (igual ConectUazapi)
        let webhookUpdated = false;
        if (empresa.webhook_url !== AGENT_WEBHOOK_URL) {
          console.log(`[API WhatsApp] Atualizando webhook para: ${AGENT_WEBHOOK_URL}`);
          const webhookResult = await setWebhook(empresa.token_whatsapp, {
            url: AGENT_WEBHOOK_URL,
            enabled: true,
            events: ["messages", "connection"],
            excludeMessages: ["wasSentByApi", "isGroupYes"],
          });
          webhookUpdated = webhookResult.success;
          if (webhookUpdated) {
            console.log(`[API WhatsApp] Webhook atualizado com sucesso`);
          }
        }

        // Atualizar banco
        const updates: Record<string, unknown> = {
          whatsapp_status: apiStatus,
          updated_at: new Date().toISOString(),
        };

        if (webhookUpdated) {
          updates.webhook_url = AGENT_WEBHOOK_URL;
        }

        if (owner) {
          const cleanOwner = owner.replace("@s.whatsapp.net", "");
          updates.whatsapp_numero = cleanOwner;
          updates.numero_atendimento = cleanOwner;
        }

        if (apiStatus === "connected") {
          updates.status_plano = "ativo";
          updates.produto_plano = empresa.produto_plano || "IA ATENDIMENTO";
        }

        await supabase
          .from("acessos_fotovoltaico")
          .update(updates)
          .eq("id", Number(empresaId));

        return NextResponse.json({
          success: true,
          status: apiStatus,
          numero: owner?.replace("@s.whatsapp.net", ""),
          synced: true,
          webhookUpdated,
        });
      }

      default:
        return NextResponse.json(
          { error: `Ação desconhecida: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API WhatsApp] Erro na ação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 }
    );
  }
}
