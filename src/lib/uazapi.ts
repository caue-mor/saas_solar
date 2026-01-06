/**
 * UAZAPI - WhatsApp API Integration
 * Baseado na especificação OpenAPI v2.0 e no projeto ConectUazapi
 *
 * Autenticação:
 * - Endpoints regulares: header 'token' com token da instância
 * - Endpoints administrativos: header 'admintoken'
 *
 * Estados da Instância:
 * - disconnected: Desconectado do WhatsApp
 * - connecting: Em processo de conexão
 * - connected: Conectado e autenticado
 * - not_created: Instância ainda não foi criada
 */

const UAZAPI_BASE_URL = process.env.UAZAPI_BASE_URL || "https://api.uazapi.com";
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_API_KEY || process.env.UAZAPI_GLOBAL_TOKEN || "";

// ============================================
// TIPOS
// ============================================

export type ConnectionStatus = "connected" | "disconnected" | "connecting" | "not_created";

export interface UazAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Instance {
  id: string;
  token: string;
  status: ConnectionStatus;
  paircode?: string;
  qrcode?: string;
  name: string;
  profileName?: string;
  profilePicUrl?: string;
  isBusiness?: boolean;
  owner?: string;
  adminField01?: string; // Email/ID do usuário
  adminField02?: string; // Campo extra
  created?: string;
  updated?: string;
  lastDisconnect?: string;
  lastDisconnectReason?: string;
}

export interface InstanceStatus {
  // Campos da raiz da resposta /instance/connect
  connected?: boolean;
  loggedIn?: boolean;
  jid?: object | null;
  instance?: Instance;
  // Campos que podem vir na raiz (fallback)
  status?: ConnectionStatus;
  qrcode?: string;
  paircode?: string;
  owner?: string;
  profileName?: string;
  profilePicUrl?: string;
}

export interface WebhookConfig {
  id?: string;
  enabled: boolean;
  url: string;
  events?: string[];
}

export interface SendMessageResponse {
  response: string;
  messageId?: string;
  status?: string;
}

export interface WebhookMessage {
  event: string;
  instanceId: string;
  token?: string;
  data: {
    key?: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        caption?: string;
        url?: string;
      };
      audioMessage?: {
        url?: string;
        ptt?: boolean;
      };
      documentMessage?: {
        fileName?: string;
        url?: string;
      };
    };
    messageTimestamp?: number;
    pushName?: string;
    status?: string;
    owner?: string;
    instance?: Instance;
  };
}

export interface ConnectionEventData {
  status: ConnectionStatus;
  owner?: string;
  profileName?: string;
  profilePicUrl?: string;
  isBusiness?: boolean;
  reason?: string;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function makeRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: Record<string, unknown>,
  instanceToken?: string
): Promise<UazAPIResponse<T>> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Usar token da instância ou admin token
    if (instanceToken) {
      headers["token"] = instanceToken;
    } else {
      headers["admintoken"] = UAZAPI_ADMIN_TOKEN;
    }

    console.log(`[UAZAPI] ${method} ${UAZAPI_BASE_URL}${endpoint}`);

    const response = await fetch(`${UAZAPI_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[UAZAPI] Error ${response.status}:`, data);
      return {
        success: false,
        error: data.error || data.message || `Erro ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("[UAZAPI] Request Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Formata número de telefone para o padrão WhatsApp
 */
export function formatPhone(phone: string): string {
  // Remove caracteres não numéricos
  let cleaned = phone.replace(/\D/g, "");

  // Remove @s.whatsapp.net se já tiver
  cleaned = cleaned.replace("@s.whatsapp.net", "");

  // Adiciona código do país se não tiver
  if (!cleaned.startsWith("55") && cleaned.length <= 11) {
    cleaned = "55" + cleaned;
  }

  return cleaned;
}

/**
 * Valida formato de telefone brasileiro
 */
export function validateBrazilianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  // Deve ter 10 ou 11 dígitos (sem código do país) ou 12-13 (com código)
  return cleaned.length >= 10 && cleaned.length <= 13;
}

// ============================================
// ADMINISTRAÇÃO DE INSTÂNCIAS
// ============================================

/**
 * Criar nova instância do WhatsApp
 * Requer admintoken
 */
export async function createInstance(
  name: string,
  options?: {
    systemName?: string;
    adminField01?: string; // Email ou ID do usuário
    adminField02?: string;
    webhookUrl?: string;
    webhookEvents?: string[];
  }
): Promise<UazAPIResponse<{ instance: Instance; token: string }>> {
  console.log(`[UAZAPI] Criando instância: ${name}`);

  const result = await makeRequest<{ instance: Instance; token: string }>("/instance/init", "POST", {
    name,
    systemName: options?.systemName,
    adminField01: options?.adminField01,
    adminField02: options?.adminField02,
  });

  // Se criou com sucesso e tem webhook URL, configura o webhook
  if (result.success && result.data?.token && options?.webhookUrl) {
    console.log(`[UAZAPI] Configurando webhook para nova instância`);
    await setWebhook(result.data.token, {
      url: options.webhookUrl,
      enabled: true,
      events: options.webhookEvents,
    });
  }

  return result;
}

/**
 * Criar instância com configuração completa de webhook
 */
export async function createInstanceWithWebhook(
  name: string,
  email: string,
  webhookUrl: string
): Promise<UazAPIResponse<{ instance: Instance; token: string }>> {
  return createInstance(name, {
    adminField01: email,
    webhookUrl,
    webhookEvents: [
      "messages",
      "messages.upsert",
      "messages.update",
      "connection.update",
      "qrcode.updated",
      "presence.update",
    ],
  });
}

/**
 * Listar todas as instâncias
 * Requer admintoken
 */
export async function listInstances(): Promise<UazAPIResponse<Instance[]>> {
  console.log(`[UAZAPI] Listando todas as instâncias`);
  return makeRequest("/instance/all");
}

/**
 * Obter todas as instâncias (alias com parsing)
 */
export async function getAllInstances(): Promise<Instance[]> {
  const result = await listInstances();
  console.log(`[UAZAPI] Total de instâncias encontradas: ${result.success ? (result.data?.length || 0) : 0}`);
  if (result.success && result.data) {
    return Array.isArray(result.data) ? result.data : [];
  }
  return [];
}

/**
 * Buscar instância por telefone
 */
export async function findInstanceByPhone(phoneNumber: string): Promise<Instance | null> {
  const instances = await getAllInstances();
  const formattedPhone = formatPhone(phoneNumber);

  const found = instances.find(
    (instance) => instance.owner === formattedPhone ||
                  instance.owner === `${formattedPhone}@s.whatsapp.net`
  ) || null;

  console.log(`[UAZAPI] Busca por telefone ${formattedPhone}: ${found ? 'encontrada' : 'não encontrada'}`);
  return found;
}

/**
 * Buscar instância por email (adminField01)
 */
export async function findInstanceByEmail(email: string): Promise<Instance | null> {
  const instances = await getAllInstances();

  const found = instances.find(
    (instance) => instance.adminField01 === email
  ) || null;

  console.log(`[UAZAPI] Busca por email ${email}: ${found ? 'encontrada' : 'não encontrada'}`);
  return found;
}

/**
 * Buscar instância por nome (ex: "solar-{slug}")
 */
export async function findInstanceByName(name: string): Promise<Instance | null> {
  const instances = await getAllInstances();

  const found = instances.find(
    (instance) => instance.name === name || instance.name?.startsWith(name)
  ) || null;

  console.log(`[UAZAPI] Busca por nome ${name}: ${found ? 'encontrada' : 'não encontrada'}`);
  return found;
}

/**
 * Buscar todas as instâncias de uma empresa (por email ou nome)
 */
export async function findInstancesForCompany(email: string, namePrefix: string): Promise<Instance[]> {
  const instances = await getAllInstances();

  const found = instances.filter(
    (instance) =>
      instance.adminField01 === email ||
      instance.name?.startsWith(namePrefix)
  );

  console.log(`[UAZAPI] Instâncias encontradas para empresa: ${found.length}`);
  return found;
}

/**
 * Deletar instância pelo token
 * Requer token da instância
 */
export async function deleteInstance(
  instanceToken: string
): Promise<UazAPIResponse> {
  console.log(`[UAZAPI] Deletando instância`);
  return makeRequest("/instance", "DELETE", undefined, instanceToken);
}

/**
 * Deletar instâncias duplicadas, mantendo apenas a melhor (conectada ou mais recente)
 */
export async function cleanupDuplicateInstances(
  instances: Instance[]
): Promise<{ kept: Instance | null; deleted: string[] }> {
  if (instances.length <= 1) {
    return { kept: instances[0] || null, deleted: [] };
  }

  // Ordenar: conectadas primeiro, depois por data de atualização
  const sorted = [...instances].sort((a, b) => {
    // Conectada tem prioridade
    if (a.status === "connected" && b.status !== "connected") return -1;
    if (b.status === "connected" && a.status !== "connected") return 1;

    // Depois por data de atualização (mais recente primeiro)
    const dateA = a.updated ? new Date(a.updated).getTime() : 0;
    const dateB = b.updated ? new Date(b.updated).getTime() : 0;
    return dateB - dateA;
  });

  const kept = sorted[0];
  const toDelete = sorted.slice(1);
  const deleted: string[] = [];

  console.log(`[UAZAPI] Mantendo instância: ${kept.name} (${kept.status})`);
  console.log(`[UAZAPI] Deletando ${toDelete.length} instâncias duplicadas`);

  for (const instance of toDelete) {
    if (instance.token) {
      const result = await deleteInstance(instance.token);
      if (result.success) {
        deleted.push(instance.id);
        console.log(`[UAZAPI] Deletada: ${instance.name} (${instance.id})`);
      } else {
        console.error(`[UAZAPI] Erro ao deletar ${instance.name}: ${result.error}`);
      }
    }
  }

  return { kept, deleted };
}

// ============================================
// CONEXÃO DA INSTÂNCIA
// ============================================

/**
 * Conectar instância via QR Code
 */
export async function connectWithQRCode(
  instanceToken: string
): Promise<UazAPIResponse<InstanceStatus>> {
  console.log(`[UAZAPI] Conectando via QR Code`);
  const result = await makeRequest<InstanceStatus>("/instance/connect", "POST", undefined, instanceToken);
  console.log(`[UAZAPI] Resposta connect QR:`, JSON.stringify(result, null, 2));
  return result;
}

/**
 * Conectar instância via código de pareamento (PairCode)
 */
export async function connectWithPairCode(
  instanceToken: string,
  phone: string
): Promise<UazAPIResponse<InstanceStatus>> {
  console.log(`[UAZAPI] Conectando via PairCode: ${formatPhone(phone)}`);
  return makeRequest(
    "/instance/connect",
    "POST",
    { phone: formatPhone(phone) },
    instanceToken
  );
}

/**
 * Conectar instância (gera QR Code ou código de pareamento)
 * Se phone for informado, gera código de pareamento
 * Se não, gera QR Code
 */
export async function connectInstance(
  instanceToken: string,
  connectionType: "qrcode" | "paircode" = "qrcode",
  phone?: string
): Promise<UazAPIResponse<InstanceStatus>> {
  if (connectionType === "paircode" && phone) {
    return connectWithPairCode(instanceToken, phone);
  }
  return connectWithQRCode(instanceToken);
}

/**
 * Verificar status da instância
 */
export async function getInstanceStatus(
  instanceToken: string
): Promise<UazAPIResponse<InstanceStatus>> {
  return makeRequest("/instance/status", "GET", undefined, instanceToken);
}

/**
 * Desconectar instância (logout)
 */
export async function disconnectInstance(
  instanceToken: string
): Promise<UazAPIResponse> {
  console.log(`[UAZAPI] Desconectando instância`);
  return makeRequest("/instance/logout", "POST", undefined, instanceToken);
}

/**
 * Reiniciar instância
 */
export async function restartInstance(
  instanceToken: string
): Promise<UazAPIResponse> {
  console.log(`[UAZAPI] Reiniciando instância`);
  return makeRequest("/instance/restart", "POST", undefined, instanceToken);
}

// ============================================
// WEBHOOKS
// ============================================

/**
 * Configurar webhook da instância
 * Baseado no projeto ConectUazapi - endpoint correto: POST /webhook
 */
export async function setWebhook(
  instanceToken: string,
  config: {
    url: string;
    enabled?: boolean;
    events?: string[];
    excludeMessages?: string[];
  }
): Promise<UazAPIResponse> {
  console.log(`[UAZAPI] Configurando webhook: ${config.url}`);

  const webhookConfig = {
    enabled: true, // SEMPRE habilitado
    url: config.url,
    events: config.events || ["messages", "connection"],
    excludeMessages: config.excludeMessages || ["wasSentByApi", "isGroupYes"],
  };

  console.log(`[UAZAPI] Webhook config:`, JSON.stringify(webhookConfig, null, 2));

  return makeRequest(
    "/webhook", // Endpoint correto conforme ConectUazapi
    "POST",
    webhookConfig,
    instanceToken
  );
}

/**
 * Obter configuração de webhook
 */
export async function getWebhook(
  instanceToken: string
): Promise<UazAPIResponse<WebhookConfig>> {
  return makeRequest("/instance/webhook", "GET", undefined, instanceToken);
}

// ============================================
// ENVIO DE MENSAGENS
// ============================================

/**
 * Enviar mensagem de texto
 */
export async function sendTextMessage(
  instanceToken: string,
  number: string,
  text: string,
  options?: {
    delay?: number;
    linkPreview?: boolean;
    replyId?: string;
  }
): Promise<UazAPIResponse<SendMessageResponse>> {
  console.log(`[UAZAPI] Enviando texto para: ${formatPhone(number)}`);
  return makeRequest(
    "/send/text",
    "POST",
    {
      number: formatPhone(number),
      text,
      delay: options?.delay || 0,
      linkPreview: options?.linkPreview ?? true,
      replyid: options?.replyId,
    },
    instanceToken
  );
}

/**
 * Enviar mídia (imagem, vídeo, áudio, documento)
 */
export async function sendMediaMessage(
  instanceToken: string,
  number: string,
  mediaUrl: string,
  mediaType: "image" | "video" | "audio" | "document" | "ptt" = "image",
  options?: {
    caption?: string;
    fileName?: string;
    delay?: number;
  }
): Promise<UazAPIResponse<SendMessageResponse>> {
  console.log(`[UAZAPI] Enviando ${mediaType} para: ${formatPhone(number)}`);
  return makeRequest(
    "/send/media",
    "POST",
    {
      number: formatPhone(number),
      media: mediaUrl,
      type: mediaType,
      caption: options?.caption,
      docName: options?.fileName,
      delay: options?.delay || 0,
    },
    instanceToken
  );
}

/**
 * Enviar contato (vCard)
 */
export async function sendContactMessage(
  instanceToken: string,
  number: string,
  contact: {
    fullName: string;
    phoneNumber: string;
    organization?: string;
    email?: string;
  }
): Promise<UazAPIResponse<SendMessageResponse>> {
  return makeRequest(
    "/send/contact",
    "POST",
    {
      number: formatPhone(number),
      ...contact,
    },
    instanceToken
  );
}

/**
 * Enviar localização
 */
export async function sendLocationMessage(
  instanceToken: string,
  number: string,
  location: {
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  }
): Promise<UazAPIResponse<SendMessageResponse>> {
  return makeRequest(
    "/send/location",
    "POST",
    {
      number: formatPhone(number),
      ...location,
    },
    instanceToken
  );
}

/**
 * Enviar menu interativo (botões, lista, enquete)
 */
export async function sendMenuMessage(
  instanceToken: string,
  number: string,
  menu: {
    type: "button" | "list" | "poll";
    text: string;
    choices: string[];
    footerText?: string;
    listButton?: string;
  }
): Promise<UazAPIResponse<SendMessageResponse>> {
  return makeRequest(
    "/send/menu",
    "POST",
    {
      number: formatPhone(number),
      ...menu,
    },
    instanceToken
  );
}

// ============================================
// PARSING DE WEBHOOK
// ============================================

/**
 * Parse de evento de conexão via webhook
 */
export function parseConnectionEvent(payload: unknown): ConnectionEventData | null {
  try {
    const data = payload as WebhookMessage;

    if (data.event !== "connection.update") {
      return null;
    }

    return {
      status: (data.data?.status as ConnectionStatus) || "disconnected",
      owner: data.data?.owner,
      profileName: data.data?.instance?.profileName,
      profilePicUrl: data.data?.instance?.profilePicUrl,
      isBusiness: data.data?.instance?.isBusiness,
    };
  } catch (error) {
    console.error("[UAZAPI] Error parsing connection event:", error);
    return null;
  }
}

/**
 * Parse de mensagem recebida via webhook
 */
export function parseWebhookMessage(payload: unknown): {
  event: string;
  phone: string;
  message: string;
  messageId: string;
  timestamp: Date;
  pushName?: string;
  fromMe: boolean;
  isGroup: boolean;
  mediaType?: string;
  mediaUrl?: string;
} | null {
  try {
    const data = payload as WebhookMessage;

    // Verificar se é um evento de mensagem
    if (!data.event || !data.data?.key) {
      return null;
    }

    const key = data.data.key;
    const remoteJid = key.remoteJid || "";

    // Extrair número do telefone
    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
    const isGroup = remoteJid.includes("@g.us");

    // Extrair texto da mensagem
    let message = "";
    let mediaType: string | undefined;
    let mediaUrl: string | undefined;

    if (data.data.message?.conversation) {
      message = data.data.message.conversation;
    } else if (data.data.message?.extendedTextMessage?.text) {
      message = data.data.message.extendedTextMessage.text;
    } else if (data.data.message?.imageMessage) {
      message = data.data.message.imageMessage.caption || "";
      mediaType = "image";
      mediaUrl = data.data.message.imageMessage.url;
    } else if (data.data.message?.audioMessage) {
      mediaType = data.data.message.audioMessage.ptt ? "ptt" : "audio";
      mediaUrl = data.data.message.audioMessage.url;
    } else if (data.data.message?.documentMessage) {
      message = data.data.message.documentMessage.fileName || "";
      mediaType = "document";
      mediaUrl = data.data.message.documentMessage.url;
    }

    return {
      event: data.event,
      phone,
      message,
      messageId: key.id,
      timestamp: new Date((data.data.messageTimestamp || 0) * 1000),
      pushName: data.data.pushName,
      fromMe: key.fromMe,
      isGroup,
      mediaType,
      mediaUrl,
    };
  } catch (error) {
    console.error("[UAZAPI] Error parsing webhook message:", error);
    return null;
  }
}

/**
 * Identificar tipo de evento do webhook
 */
export function identifyWebhookEvent(payload: unknown): {
  type: "message" | "connection" | "qrcode" | "status" | "unknown";
  event: string;
} {
  try {
    const data = payload as WebhookMessage;
    const event = data.event || "";

    if (event.startsWith("messages")) {
      return { type: "message", event };
    }
    if (event === "connection.update") {
      return { type: "connection", event };
    }
    if (event === "qrcode.updated") {
      return { type: "qrcode", event };
    }
    if (event === "presence.update" || event.includes("status")) {
      return { type: "status", event };
    }

    return { type: "unknown", event };
  } catch {
    return { type: "unknown", event: "" };
  }
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Verificar se número é válido no WhatsApp
 */
export async function checkNumber(
  instanceToken: string,
  number: string
): Promise<UazAPIResponse<{ exists: boolean; jid?: string }>> {
  return makeRequest(
    "/misc/onwhatsapp",
    "POST",
    {
      number: formatPhone(number),
    },
    instanceToken
  );
}

/**
 * Obter foto de perfil
 */
export async function getProfilePicture(
  instanceToken: string,
  number: string
): Promise<UazAPIResponse<{ url: string }>> {
  return makeRequest(
    "/misc/profilepic",
    "POST",
    {
      number: formatPhone(number),
    },
    instanceToken
  );
}

/**
 * Marcar mensagens como lidas
 */
export async function markAsRead(
  instanceToken: string,
  chatId: string
): Promise<UazAPIResponse> {
  return makeRequest(
    "/chat/markread",
    "POST",
    {
      chatId,
    },
    instanceToken
  );
}

/**
 * Enviar status de "digitando"
 */
export async function sendTyping(
  instanceToken: string,
  chatId: string,
  duration?: number
): Promise<UazAPIResponse> {
  return makeRequest(
    "/chat/presence",
    "POST",
    {
      chatId,
      presence: "composing",
      duration: duration || 3000,
    },
    instanceToken
  );
}

/**
 * Obter histórico de mensagens de um chat
 */
export async function getChatMessages(
  instanceToken: string,
  chatId: string,
  limit?: number
): Promise<UazAPIResponse<unknown[]>> {
  return makeRequest(
    "/chat/messages",
    "POST",
    {
      chatId,
      limit: limit || 50,
    },
    instanceToken
  );
}

/**
 * Obter lista de contatos
 */
export async function getContacts(
  instanceToken: string
): Promise<UazAPIResponse<unknown[]>> {
  return makeRequest("/misc/contacts", "GET", undefined, instanceToken);
}

/**
 * Obter lista de chats
 */
export async function getChats(
  instanceToken: string
): Promise<UazAPIResponse<unknown[]>> {
  return makeRequest("/chat/list", "GET", undefined, instanceToken);
}
