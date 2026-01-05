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
  type ConnectionStatus,
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
        updates.last_update = new Date().toISOString();
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
          webhookEvents: [
            "messages",
            "messages.upsert",
            "messages.update",
            "connection.update",
            "qrcode.updated",
          ],
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
            last_update: new Date().toISOString(),
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
      // ==========================================
      case "connect": {
        if (!empresa.token_whatsapp) {
          return NextResponse.json(
            { error: "Instância não criada. Crie primeiro usando action='create'" },
            { status: 400 }
          );
        }

        const connectionType = params.type || "qrcode"; // "qrcode" ou "paircode"
        const phone = params.phone;

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

        console.log(`[API WhatsApp] Conectando via ${connectionType}${phone ? ` - ${phone}` : ""}`);

        const result = await connectInstance(
          empresa.token_whatsapp,
          connectionType,
          phone
        );

        if (!result.success) {
          console.error(`[API WhatsApp] Erro ao conectar:`, result.error);
          return NextResponse.json(
            { error: result.error || "Erro ao conectar na UAZAPI" },
            { status: 500 }
          );
        }

        // Atualizar status
        await supabase
          .from("acessos_fotovoltaico")
          .update({
            whatsapp_status: "connecting",
            last_update: new Date().toISOString(),
          })
          .eq("id", Number(empresaId));

        return NextResponse.json({
          success: true,
          status: result.data?.status || "connecting",
          qrcode: result.data?.qrcode,
          paircode: result.data?.paircode,
          connectionType,
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
            last_update: new Date().toISOString(),
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
          events: [
            "messages",
            "messages.upsert",
            "messages.update",
            "connection.update",
            "qrcode.updated",
          ],
        });

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || "Erro ao configurar webhook" },
            { status: 500 }
          );
        }

        // Salvar URL no banco
        await supabase
          .from("acessos_fotovoltaico")
          .update({
            webhook_url: webhookUrl,
            last_update: new Date().toISOString(),
          })
          .eq("id", Number(empresaId));

        return NextResponse.json({
          success: true,
          message: "Webhook configurado com sucesso",
          url: webhookUrl,
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

        // Verificar e corrigir webhook se necessário
        let webhookUpdated = false;
        if (empresa.webhook_url !== AGENT_WEBHOOK_URL) {
          console.log(`[API WhatsApp] Atualizando webhook para: ${AGENT_WEBHOOK_URL}`);
          const webhookResult = await setWebhook(empresa.token_whatsapp, {
            url: AGENT_WEBHOOK_URL,
            enabled: true,
            events: [
              "messages",
              "messages.upsert",
              "messages.update",
              "connection.update",
              "qrcode.updated",
            ],
          });
          webhookUpdated = webhookResult.success;
          if (webhookUpdated) {
            console.log(`[API WhatsApp] Webhook atualizado com sucesso`);
          }
        }

        // Atualizar banco
        const updates: Record<string, unknown> = {
          whatsapp_status: apiStatus,
          last_update: new Date().toISOString(),
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
