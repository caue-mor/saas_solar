  ---
  📊 Resumo do CRM-SDR-AI (Agente Atual)

  | Aspecto  | Implementação                                                                          |
  |----------|----------------------------------------------------------------------------------------|
  | Stack    | FastAPI + OpenAI GPT-4o-mini + RabbitMQ                                                |
  | Fluxo    | 8 etapas de qualificação (tipo → cidade → consumo → telhado → pagamento → agendamento) |
  | Context  | Redis (histórico 40 msgs, 7 dias TTL)                                                  |
  | Tools    | 7 function calls (updateConsumo, updateLead, notificaConsultor, etc)                   |
  | Mídia    | Vision (imagens/PDF) + Whisper (áudio)                                                 |
  | WhatsApp | UAZAPI integration                                                                     |

  ---
  🏗️ Proposta: Arquitetura Multi-Agente com LangGraph

  ┌─────────────────────────────────────────────────────────────────────┐
  │                     SISTEMA MULTI-AGENTE SOLAR                       │
  └─────────────────────────────────────────────────────────────────────┘

                                WhatsApp (UAZAPI)
                                       │
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                         ORQUESTRADOR (StateGraph)                    │
  │                                                                      │
  │   Estado Compartilhado:                                              │
  │   - lead_id, company_id                                              │
  │   - conversation_history (todas perguntas/respostas)                │
  │   - qualification_data (dados coletados)                            │
  │   - proposal_data (dados da proposta)                               │
  │   - current_stage: "qualification" | "proposal" | "support"         │
  └─────────────────────────────────────────────────────────────────────┘
                      │                              │
           ┌──────────┴──────────┐       ┌──────────┴──────────┐
           ▼                      ▼       ▼                      ▼
  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
  │   AGENTE 1      │    │   AGENTE 2      │    │   AGENTE 3      │
  │  QUALIFICAÇÃO   │───▶│    PROPOSTA     │───▶│    SUPORTE      │
  │                 │    │                 │    │   (futuro)      │
  │ • Atende lead   │    │ • Recebe TODO   │    │                 │
  │ • 8 etapas      │    │   contexto      │    │ • Pós-venda     │
  │ • Qualifica     │    │ • Processa PDF  │    │ • Dúvidas       │
  │ • Function call │    │ • Extrai dados  │    │ • Suporte       │
  │                 │    │ • Apresenta     │    │                 │
  └─────────────────┘    └─────────────────┘    └─────────────────┘

  ---
  🔄 Fluxo Detalhado

  Agente 1: Qualificação (baseado no CRM-SDR-AI)

  # LangGraph Node
  class QualificationAgent:
      """
      Responsável por:
      1. Atender lead via WhatsApp
      2. Coletar dados (tipo, cidade, consumo, telhado, etc)
      3. Qualificar (consumo >= threshold)
      4. Passar contexto completo para Agente 2
      """

      # Estado que será compartilhado
      class State(TypedDict):
          lead_id: int
          company_id: int
          messages: List[BaseMessage]  # Histórico completo
          qualification_data: Dict[str, Any]  # Dados coletados
          current_stage: str  # "qualification"
          is_qualified: bool

  Agente 2: Proposta/PDF (NOVO)

  # LangGraph Node
  class ProposalAgent:
      """
      Responsável por:
      1. RECEBER TODO contexto do Agente 1 (perguntas + respostas)
      2. Buscar PDF da proposta para este lead
      3. Processar PDF (extrair texto + imagens)
      4. Estruturar dados da proposta
      5. Apresentar proposta ao lead
      6. Responder dúvidas técnicas
      """

      class State(TypedDict):
          # Herda do Agente 1
          lead_id: int
          company_id: int
          messages: List[BaseMessage]  # CONTEXTO COMPLETO
          qualification_data: Dict  # DADOS JÁ COLETADOS

          # Novos campos
          proposal_pdf_path: str
          proposal_data: ProposalData  # Estruturado
          proposal_images: List[str]  # URLs das imagens
          proposal_presented: bool

  ---
  📄 Processamento de PDF

  Para o Agente 2 processar os PDFs de proposta, você tem duas opções:

  Opção 1: PDF → Imagens + Vision (GPT-4o)

  from pypdfium2 import PdfDocument
  from langchain_openai import ChatOpenAI

  class PDFProposalProcessor:
      async def process_pdf(self, pdf_path: str) -> ProposalData:
          # 1. Converter PDF para imagens
          pdf = PdfDocument(pdf_path)
          images = []
          for page in pdf:
              bitmap = page.render(scale=2)  # 144 DPI
              image = bitmap.to_pil()
              images.append(image)

          # 2. Enviar para GPT-4o Vision
          llm = ChatOpenAI(model="gpt-4o")

          response = await llm.invoke([
              HumanMessage(content=[
                  {"type": "text", "text": """
                      Analise esta proposta de energia solar e extraia:
                      - Potência do sistema (kWp)
                      - Quantidade de módulos
                      - Marca dos equipamentos
                      - Valor total
                      - Economia mensal estimada
                      - Payback em meses
                      - Garantias
                      Retorne em JSON estruturado.
                  """},
                  {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}}
                  for img_b64 in images_base64
              ])
          ])

          return ProposalData.parse(response.content)

  Opção 2: PDF → JSON Estruturado (se PDFs são padronizados)

  import pdfplumber
  from pydantic import BaseModel

  class ProposalData(BaseModel):
      potencia_kwp: float
      num_modulos: int
      marca_modulos: str
      marca_inversor: str
      valor_total: float
      economia_mensal: float
      payback_meses: int
      garantia_anos: int
      imagens: List[str]  # URLs das imagens extraídas

  class PDFExtractor:
      def extract(self, pdf_path: str) -> ProposalData:
          with pdfplumber.open(pdf_path) as pdf:
              # Extrair texto
              text = "\n".join(page.extract_text() for page in pdf.pages)

              # Extrair imagens
              images = []
              for page in pdf.pages:
                  for img in page.images:
                      # Salvar imagem e obter URL
                      images.append(save_image(img))

              # Usar LLM para estruturar
              return self._parse_with_llm(text, images)

  ---
  🔗 Como Passar Contexto Entre Agentes

  Com LangGraph StateGraph:

  from langgraph.graph import StateGraph, END
  from typing import TypedDict, List, Annotated
  from langchain_core.messages import BaseMessage

  # Estado compartilhado entre TODOS os agentes
  class AgentState(TypedDict):
      # Identificação
      lead_id: int
      company_id: int
      phone: str

      # Conversa COMPLETA (Agente 1 → Agente 2)
      messages: Annotated[List[BaseMessage], "append"]

      # Dados de qualificação (Agente 1 preenche)
      qualification_data: dict
      is_qualified: bool

      # Dados da proposta (Agente 2 preenche)
      proposal_data: dict
      proposal_presented: bool

      # Controle de fluxo
      current_agent: str  # "qualification" | "proposal" | "support"
      should_end: bool

  # Criar o grafo
  workflow = StateGraph(AgentState)

  # Adicionar nós (agentes)
  workflow.add_node("qualification", qualification_agent)
  workflow.add_node("proposal", proposal_agent)
  workflow.add_node("support", support_agent)

  # Definir transições
  workflow.add_edge("qualification", "proposal")  # Quando qualificado
  workflow.add_edge("proposal", "support")         # Quando proposta aceita
  workflow.add_edge("support", END)

  # Roteador condicional
  def route_agent(state: AgentState) -> str:
      if not state["is_qualified"]:
          return "qualification"
      elif not state["proposal_presented"]:
          return "proposal"
      else:
          return "support"

  workflow.set_conditional_entry_point(route_agent)

  # Compilar
  app = workflow.compile()

  ---
  📊 Estrutura Proposta para o Projeto

  solar-multi-agent/
  ├── src/
  │   ├── agents/
  │   │   ├── __init__.py
  │   │   ├── base.py              # BaseAgent com tools comuns
  │   │   ├── qualification.py      # Agente 1 - Qualificação
  │   │   ├── proposal.py           # Agente 2 - Proposta/PDF
  │   │   └── support.py            # Agente 3 - Suporte (futuro)
  │   │
  │   ├── graph/
  │   │   ├── __init__.py
  │   │   ├── state.py              # AgentState compartilhado
  │   │   ├── nodes.py              # Funções dos nós
  │   │   ├── edges.py              # Transições condicionais
  │   │   └── workflow.py           # StateGraph principal
  │   │
  │   ├── tools/
  │   │   ├── __init__.py
  │   │   ├── qualification/        # Tools do Agente 1
  │   │   │   ├── update_consumo.py
  │   │   │   ├── update_lead.py
  │   │   │   └── notifica_consultor.py
  │   │   │
  │   │   └── proposal/             # Tools do Agente 2
  │   │       ├── process_pdf.py
  │   │       ├── extract_images.py
  │   │       ├── send_proposal.py
  │   │       └── answer_questions.py
  │   │
  │   ├── processors/
  │   │   ├── pdf_processor.py      # PDF → Dados estruturados
  │   │   ├── image_extractor.py    # Extrai imagens do PDF
  │   │   └── vision_analyzer.py    # GPT-4o Vision
  │   │
  │   ├── services/
  │   │   ├── redis_service.py      # Cache + histórico
  │   │   ├── supabase_service.py   # Database
  │   │   ├── whatsapp_service.py   # UAZAPI
  │   │   └── storage_service.py    # Armazenar PDFs/imagens
  │   │
  │   ├── prompts/
  │   │   ├── qualification.py      # Prompts Agente 1
  │   │   └── proposal.py           # Prompts Agente 2
  │   │
  │   ├── api.py                    # FastAPI webhook
  │   ├── worker.py                 # RabbitMQ consumer
  │   └── config.py                 # Settings
  │
  ├── proposals/                     # PDFs das propostas
  │   └── {lead_id}/
  │       └── proposta.pdf
  │
  ├── requirements.txt
  └── README.md

  ---
  🎯 Resumo da Arquitetura

  | Componente   | Tecnologia                | Função                             |
  |--------------|---------------------------|------------------------------------|
  | Orquestrador | LangGraph StateGraph      | Gerencia fluxo entre agentes       |
  | Agente 1     | LangChain + GPT-4o        | Qualifica leads (8 etapas)         |
  | Agente 2     | LangChain + GPT-4o Vision | Processa PDF + apresenta proposta  |
  | Contexto     | LangGraph State           | Perguntas/respostas compartilhadas |
  | PDF          | pypdfium2 + Vision        | Extrai dados + imagens             |
  | Persistência | Redis + Supabase          | Histórico + dados                  |
  | WhatsApp     | UAZAPI                    | Comunicação                        |

  ---
  Quer que eu comece a implementar essa arquitetura? Posso:

  1. Criar a estrutura base do projeto multi-agente
  2. Migrar o Agente 1 (qualificação) para LangGraph
  3. Implementar o Agente 2 (proposta/PDF) do zero
  4. Criar o processador de PDF com extração de imagens

  Qual parte você quer que eu comece primeiro?


