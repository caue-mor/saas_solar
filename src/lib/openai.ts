/**
 * @deprecated Este arquivo NÃO É MAIS USADO.
 *
 * Toda a lógica de IA foi movida para o backend Python (SOLAR-AGENT-LG)
 * que usa LangGraph com:
 * - Checkpointer (memória persistente)
 * - Tools especializadas (qualification, schedule, notification, followup)
 * - Buffer Service (debouncing de mensagens)
 * - FlowInterpreter (fluxos visuais)
 *
 * O webhook do frontend agora repassa todas as mensagens para:
 * POST ${SOLAR_AGENT_URL}/webhook/{company_id}
 *
 * Este arquivo pode ser removido com segurança.
 */

import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  companyName: string;
  companyDescription: string;
  qualificationQuestions: string[];
}

const defaultConfig: AIConfig = {
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 500,
  systemPrompt: "",
  companyName: "",
  companyDescription: "",
  qualificationQuestions: [],
};

export async function generateAIResponse(
  message: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  config: Partial<AIConfig> = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  const systemMessage = buildSystemPrompt(finalConfig);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemMessage },
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const response = await openai.chat.completions.create({
    model: finalConfig.model,
    messages,
    temperature: finalConfig.temperature,
    max_tokens: finalConfig.maxTokens,
  });

  return response.choices[0]?.message?.content || "";
}

function buildSystemPrompt(config: AIConfig): string {
  if (config.systemPrompt) {
    return config.systemPrompt;
  }

  return `Você é um assistente virtual especializado em energia solar fotovoltaica da empresa ${config.companyName}.

${config.companyDescription}

Seu objetivo é:
1. Responder dúvidas sobre energia solar de forma clara e amigável
2. Qualificar leads coletando informações importantes
3. Agendar visitas técnicas quando apropriado
4. Fornecer estimativas de economia e tamanho de sistema

Perguntas importantes para qualificação:
${config.qualificationQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Seja sempre educado, profissional e prestativo. Responda em português brasileiro.
Se não souber algo, diga que vai verificar com a equipe técnica.`;
}

export async function analyzeLeadQualification(
  conversationHistory: { role: "user" | "assistant"; content: string }[]
) {
  const analysisPrompt = `Analise a conversa abaixo e extraia as seguintes informações do lead:
- Nome
- Telefone
- Email
- Valor médio da conta de luz
- Tipo de imóvel (residencial/comercial/rural)
- Se o imóvel é próprio ou alugado
- Interesse estimado (1-10)
- Nível de qualificação (FRIO, MORNO, QUENTE)
- Próximo passo recomendado

Conversa:
${conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}

Responda em formato JSON.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: analysisPrompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(response.choices[0]?.message?.content || "{}");
  } catch {
    return {};
  }
}
