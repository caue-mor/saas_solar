import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  parseWebhookMessage,
  parseConnectionEvent,
  identifyWebhookEvent,
  sendTextMessage,
  type ConnectionStatus,
} from "@/lib/uazapi";

// URL do backend Python com LangGraph Agent
const SOLAR_AGENT_URL = process.env.SOLAR_AGENT_URL || "http://localhost:8000";

// POST - Receber eventos do webhook UAZAPI
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log("[Webhook WhatsApp] Evento recebido:", payload.event);

    // Identificar tipo de evento
    const { type, event } = identifyWebhookEvent(payload);

    // Extrair instanceId ou token do payload
    const instanceId = payload.instanceId || payload.token || payload.data?.instanceId;

    switch (type) {
      // ==========================================
      // EVENTO DE CONEXÃO
      // ==========================================
      case "connection": {
        console.log("[Webhook WhatsApp] Evento de conexão:", event);
        const connectionData = parseConnectionEvent(payload);

        if (!connectionData) {
          return NextResponse.json({ received: true });
        }

        // Buscar empresa pelo token ou instanceId
        let empresaQuery = supabase
          .from("acessos_fotovoltaico")
          .select("id, nome_empresa, email, whatsapp_status, whatsapp_numero");

        if (instanceId) {
          empresaQuery = empresaQuery.or(
            `uazapi_instancia.eq.${instanceId},token_whatsapp.eq.${instanceId}`
          );
        }

        // Tentar também pelo adminField01 (email)
        const adminField = payload.adminField01 || payload.data?.adminField01;
        if (adminField) {
          empresaQuery = empresaQuery.or(`email.eq.${adminField},id.eq.${adminField}`);
        }

        const { data: empresa, error: empresaError } = await empresaQuery.single();

        if (empresaError || !empresa) {
          console.log("[Webhook WhatsApp] Empresa não encontrada para conexão");
          return NextResponse.json({ received: true });
        }

        console.log(
          `[Webhook WhatsApp] Atualizando status empresa ${empresa.id}: ${connectionData.status}`
        );

        // Preparar dados para atualização
        const updates: Record<string, unknown> = {
          whatsapp_status: connectionData.status,
          last_update: new Date().toISOString(),
        };

        // Se conectou, salvar número e ativar plano
        if (connectionData.status === "connected") {
          if (connectionData.owner) {
            const cleanOwner = connectionData.owner.replace("@s.whatsapp.net", "");
            updates.whatsapp_numero = cleanOwner;
            updates.numero_atendimento = cleanOwner;
          }
          updates.status_plano = "ativo";
          updates.produto_plano = "IA ATENDIMENTO";
          updates.ia_ativa = true;
        }

        // Se desconectou, limpar número e notificar
        if (connectionData.status === "disconnected") {
          updates.whatsapp_numero = null;
          updates.numero_atendimento = null;

          // Enviar notificação de desconexão via conta master (se configurada)
          const masterToken = process.env.UAZAPI_MASTER_TOKEN;
          const adminPhone = empresa.whatsapp_numero || process.env.ADMIN_NOTIFICATION_PHONE;

          if (masterToken && adminPhone) {
            try {
              const now = new Date();
              const formattedDate = now.toLocaleDateString("pt-BR");
              const formattedTime = now.toLocaleTimeString("pt-BR");

              await sendTextMessage(
                masterToken,
                adminPhone,
                `⚠️ *ALERTA DE DESCONEXÃO*\n\n` +
                `A instância WhatsApp da empresa *${empresa.nome_empresa}* foi desconectada.\n\n` +
                `📅 Data: ${formattedDate}\n` +
                `🕐 Hora: ${formattedTime}\n\n` +
                `Acesse o painel para reconectar:\n` +
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/whatsapp`
              );
              console.log(`[Webhook WhatsApp] Notificação de desconexão enviada para ${adminPhone}`);
            } catch (notifyError) {
              console.error("[Webhook WhatsApp] Erro ao enviar notificação:", notifyError);
            }
          }
        }

        await supabase
          .from("acessos_fotovoltaico")
          .update(updates)
          .eq("id", empresa.id);

        return NextResponse.json({
          received: true,
          status: connectionData.status,
          empresaId: empresa.id,
        });
      }

      // ==========================================
      // EVENTO DE QR CODE
      // ==========================================
      case "qrcode": {
        console.log("[Webhook WhatsApp] QR Code atualizado");
        // QR Code é tratado via polling na interface, não precisamos fazer nada aqui
        return NextResponse.json({ received: true, event: "qrcode" });
      }

      // ==========================================
      // EVENTO DE MENSAGEM
      // ==========================================
      case "message": {
        return await handleMessageEvent(payload);
      }

      // ==========================================
      // OUTROS EVENTOS
      // ==========================================
      default: {
        console.log(`[Webhook WhatsApp] Evento não processado: ${event}`);
        return NextResponse.json({ received: true, event });
      }
    }
  } catch (error) {
    console.error("[Webhook WhatsApp] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}

// ============================================
// MENSAGENS SÃO REPASSADAS PARA O BACKEND PYTHON (LangGraph)
// ============================================
async function handleMessageEvent(payload: unknown) {
  const parsedMessage = parseWebhookMessage(payload);

  if (!parsedMessage) {
    return NextResponse.json({ received: true });
  }

  // Ignorar mensagens enviadas por nós
  if (parsedMessage.fromMe) {
    return NextResponse.json({ received: true, fromMe: true });
  }

  // Ignorar grupos
  if (parsedMessage.isGroup) {
    return NextResponse.json({ received: true, isGroup: true });
  }

  const { phone } = parsedMessage;

  console.log(`[Webhook WhatsApp] Mensagem de ${phone} - Repassando para LangGraph Agent`);

  // Buscar empresa pelo adminField01 ou pelo instanceId
  const webhookPayload = payload as Record<string, unknown>;
  const adminField = webhookPayload.adminField01 ||
                     (webhookPayload.data as Record<string, unknown>)?.adminField01;
  const instanceId = webhookPayload.instanceId || webhookPayload.token;

  let empresaQuery = supabase
    .from("acessos_fotovoltaico")
    .select("id");

  if (adminField) {
    empresaQuery = empresaQuery.or(`email.eq.${adminField},id.eq.${adminField}`);
  } else if (instanceId) {
    empresaQuery = empresaQuery.or(
      `uazapi_instancia.eq.${instanceId},token_whatsapp.eq.${instanceId}`
    );
  } else {
    console.log("[Webhook WhatsApp] Não foi possível identificar a empresa");
    return NextResponse.json({ received: true });
  }

  const { data: empresa, error: empresaError } = await empresaQuery.single();

  if (empresaError || !empresa) {
    console.log("[Webhook WhatsApp] Empresa não encontrada");
    return NextResponse.json({ received: true });
  }

  // ============================================
  // REPASSAR PARA O BACKEND PYTHON (LangGraph Agent)
  // O backend cuida de TUDO: buffer, agent, tools, checkpointer
  // ============================================
  try {
    const backendUrl = `${SOLAR_AGENT_URL}/webhook/${empresa.id}`;

    console.log(`[Webhook WhatsApp] Repassando para: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    console.log(`[Webhook WhatsApp] Resposta do LangGraph: ${JSON.stringify(result)}`);

    return NextResponse.json({
      received: true,
      forwarded: true,
      langraph_response: result,
    });
  } catch (error) {
    console.error("[Webhook WhatsApp] Erro ao repassar para LangGraph:", error);

    // Em caso de erro, retorna sucesso para UAZAPI não reenviar
    // mas loga o erro para investigação
    return NextResponse.json({
      received: true,
      forwarded: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// GET - Verificação de webhook
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "SAAS-SOLAR WhatsApp Webhook",
    timestamp: new Date().toISOString(),
  });
}
