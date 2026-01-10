/**
 * Tipos do FlowBuilder Visual para Energia Solar
 *
 * Este arquivo define todos os tipos usados no construtor visual de fluxos
 * para configurar o agente de IA de vendas solar.
 */

import type { Node, Edge } from '@xyflow/react';

// ============================================
// TIPOS DE NÓS DISPONÍVEIS
// ============================================

export type SolarNodeType =
  | 'GREETING'           // Saudação inicial
  | 'QUESTION'           // Pergunta genérica
  | 'CONSUMO'            // Pergunta sobre consumo kWh
  | 'CONTA_LUZ'          // Solicita foto da conta de luz
  | 'TELHADO'            // Solicita foto do telhado
  | 'TIPO_INSTALACAO'    // Tipo: residencial, comercial, rural
  | 'FORMA_PAGAMENTO'    // Financiamento, à vista, etc.
  | 'CONDITION'          // Condição/decisão
  | 'PROPOSTA'           // Gera proposta
  | 'VISITA_TECNICA'     // Agenda visita técnica
  | 'HANDOFF'            // Transfere para humano
  | 'FOLLOWUP'           // Configura follow-up
  | 'MESSAGE';           // Envia mensagem

// ============================================
// CONFIGURAÇÃO DE CAMPOS
// ============================================

export interface FieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'phone' | 'email' | 'kWh' | 'currency';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: string;
  helpText?: string;
}

// Campos que podem ser coletados do lead
export const SOLAR_LEAD_FIELDS: FieldConfig[] = [
  { id: 'nome', label: 'Nome', type: 'text', required: true },
  { id: 'telefone', label: 'Telefone', type: 'phone', required: true },
  { id: 'email', label: 'E-mail', type: 'email', required: false },
  { id: 'consumo_kwh', label: 'Consumo (kWh)', type: 'kWh', required: true, helpText: 'Consumo médio mensal em kWh' },
  { id: 'valor_conta', label: 'Valor da Conta', type: 'currency', required: false },
  { id: 'tipo_instalacao', label: 'Tipo de Instalação', type: 'select', required: true, options: [
    { label: 'Residencial', value: 'RESIDENCIAL' },
    { label: 'Comercial', value: 'COMERCIAL' },
    { label: 'Rural', value: 'RURAL' },
    { label: 'Investimento', value: 'INVESTIMENTO' },
  ]},
  { id: 'tipo_telhado', label: 'Tipo de Telhado', type: 'select', required: false, options: [
    { label: 'Cerâmica/Barro', value: 'ceramica' },
    { label: 'Metálico/Zinco', value: 'metalico' },
    { label: 'Fibrocimento', value: 'fibrocimento' },
    { label: 'Laje', value: 'laje' },
    { label: 'Colonial', value: 'colonial' },
    { label: 'Outro', value: 'outro' },
  ]},
  { id: 'forma_pagamento', label: 'Forma de Pagamento', type: 'select', required: false, options: [
    { label: 'Financiamento', value: 'financiamento' },
    { label: 'À Vista', value: 'avista' },
    { label: 'Cartão de Crédito', value: 'cartao' },
    { label: 'A Definir', value: 'definir' },
  ]},
  { id: 'cidade', label: 'Cidade', type: 'text', required: false },
  { id: 'endereco', label: 'Endereço', type: 'text', required: false },
  { id: 'area_disponivel', label: 'Área Disponível (m²)', type: 'number', required: false },
  { id: 'interesse_bateria', label: 'Interesse em Bateria', type: 'boolean', required: false },
  { id: 'pretende_expansao', label: 'Pretende Expansão', type: 'boolean', required: false, helpText: 'Se pretende adicionar novos equipamentos' },
  { id: 'momento_compra', label: 'Momento de Compra', type: 'select', required: false, options: [
    { label: 'Quero instalar logo', value: 'instalar_logo' },
    { label: 'Ainda estou pesquisando', value: 'pesquisando' },
  ]},
  { id: 'preferencia_atendimento', label: 'Preferência de Atendimento', type: 'text', required: false, helpText: 'Presencial/ligação e horário preferido' },
];

// ============================================
// DADOS DOS NÓS
// ============================================

export interface BaseNodeData {
  label: string;
  description?: string;
  [key: string]: unknown; // Index signature para compatibilidade com React Flow
}

export interface GreetingNodeData extends BaseNodeData {
  mensagem: string;
  personalizarHorario?: boolean;
  mensagemManha?: string;
  mensagemTarde?: string;
  mensagemNoite?: string;
}

export interface QuestionNodeData extends BaseNodeData {
  pergunta: string;
  tipoResposta: 'texto' | 'numero' | 'opcoes' | 'sim_nao';
  opcoes?: string[];
  campoDestino?: string; // Campo do lead onde salvar
  obrigatoria: boolean;
  mensagemErro?: string;
  maxTentativas?: number;
}

export interface ConsumoNodeData extends BaseNodeData {
  pergunta: string;
  unidade: 'kWh' | 'reais';
  validarMinimo?: number;
  validarMaximo?: number;
  campoDestino: 'consumo_kwh' | 'valor_conta';
}

export interface ContaLuzNodeData extends BaseNodeData {
  mensagemSolicitacao: string;
  analisarAutomatico: boolean; // Usar Vision API
  extrairConsumo: boolean;
  extrairValor: boolean;
  timeoutSegundos: number;
  mensagemFallback?: string; // Se não enviar foto
}

export interface TelhadoNodeData extends BaseNodeData {
  mensagemSolicitacao: string;
  analisarAutomatico: boolean; // Usar Vision API
  avaliarViabilidade: boolean;
  timeoutSegundos: number;
  mensagemFallback?: string;
}

export interface TipoInstalacaoNodeData extends BaseNodeData {
  pergunta: string;
  opcoes: {
    label: string;
    value: 'RESIDENCIAL' | 'COMERCIAL' | 'RURAL' | 'INVESTIMENTO';
    descricao?: string;
  }[];
  permitirOutro: boolean;
}

export interface FormaPagamentoNodeData extends BaseNodeData {
  pergunta: string;
  opcoes: {
    label: string;
    value: string;
    descricao?: string;
    destaque?: boolean;
  }[];
  mostrarFinanciamento: boolean;
  parceirosFinanciamento?: string[];
}

export interface ConditionNodeData extends BaseNodeData {
  campo: string; // Campo do lead a verificar
  operador: 'igual' | 'diferente' | 'maior' | 'menor' | 'contem' | 'existe';
  valor: string | number | boolean;
  outputTrue: string; // ID do nó se verdadeiro
  outputFalse: string; // ID do nó se falso
  campoPersonalizado?: string; // Campo personalizado para perguntas sim/não (ex: resposta_node-5)
}

export interface PropostaNodeData extends BaseNodeData {
  gerarAutomatico: boolean;
  incluirDados: string[]; // Campos a incluir
  formatoPDF: boolean;
  enviarWhatsApp: boolean;
  mensagemEnvio?: string;
  templateId?: string;
}

export interface VisitaTecnicaNodeData extends BaseNodeData {
  pergunta: string;
  mostrarDisponibilidade: boolean;
  diasDisponiveis: number[]; // 0-6 (dom-sab)
  horariosDisponiveis: string[];
  integracaoCalendario?: boolean;
  confirmarEndereco: boolean;
}

export interface HandoffNodeData extends BaseNodeData {
  motivo: string;
  mensagemCliente: string;
  notificarEquipe: boolean;
  canalNotificacao: 'whatsapp' | 'email' | 'sistema';
  atribuirPara?: string; // ID do atendente
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
}

export interface FollowupNodeData extends BaseNodeData {
  ativar: boolean;
  intervalos: number[]; // Array de horas até cada follow-up
  mensagens: string[]; // Mensagens de cada follow-up
  maxTentativas: number;
  pararSeResponder: boolean;
}

export interface MessageNodeData extends BaseNodeData {
  mensagem: string;
  incluirBotoes?: boolean;
  botoes?: { label: string; valor: string }[];
  aguardarResposta: boolean;
  timeoutSegundos?: number;
}

// Union type de todos os dados de nós
export type SolarNodeData =
  | GreetingNodeData
  | QuestionNodeData
  | ConsumoNodeData
  | ContaLuzNodeData
  | TelhadoNodeData
  | TipoInstalacaoNodeData
  | FormaPagamentoNodeData
  | ConditionNodeData
  | PropostaNodeData
  | VisitaTecnicaNodeData
  | HandoffNodeData
  | FollowupNodeData
  | MessageNodeData;

// ============================================
// TIPOS DO REACT FLOW
// ============================================

export interface SolarFlowNode extends Node {
  type: SolarNodeType;
  data: SolarNodeData & { label: string };
}

export interface SolarFlowEdge extends Edge {
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  animated?: boolean;
}

// ============================================
// CONFIGURAÇÃO GLOBAL DO AGENTE
// ============================================

export interface AgentConfig {
  nome: string;
  personalidade: 'profissional' | 'amigavel' | 'tecnico' | 'consultivo';
  tomVoz: 'formal' | 'informal' | 'neutro';
  usarEmojis: boolean;
  velocidadeDigitacao: 'rapida' | 'normal' | 'lenta';
  instrucoes?: string; // Instruções customizadas
}

export interface HorarioConfig {
  ativo: boolean;
  timezone: string;
  diasSemana: number[]; // 0-6 (dom-sab)
  horaInicio: string; // "08:00"
  horaFim: string; // "18:00"
  mensagemForaHorario?: string;
  responderForaHorario: boolean;
}

export interface FollowupConfig {
  ativo: boolean;
  intervaloPrimeiro: number; // Horas
  intervaloSegundo: number;
  intervaloTerceiro: number;
  maxTentativas: number;
  pararSeResponder: boolean;
  mensagemPadrao?: string;
}

export interface IntegracaoConfig {
  visionAtivo: boolean; // Análise de imagens
  sttAtivo: boolean; // Speech-to-text para áudios
  calendarioIntegrado: boolean;
  crmIntegrado: boolean;
}

export interface GlobalConfig {
  agente: AgentConfig;
  horario: HorarioConfig;
  followup: FollowupConfig;
  integracoes: IntegracaoConfig;
  instrucoes: string; // Instruções gerais do agente
}

// ============================================
// FLUXO COMPLETO DA EMPRESA
// ============================================

export interface CompanyFlow {
  id?: string;
  empresaId: number;
  nome: string;
  descricao?: string;
  versao: number;
  ativo: boolean;
  nodes: SolarFlowNode[];
  edges: SolarFlowEdge[];
  globalConfig: GlobalConfig;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// TEMPLATES PRÉ-DEFINIDOS
// ============================================

export interface FlowTemplate {
  id: string;
  nome: string;
  descricao: string;
  categoria: 'basico' | 'completo' | 'rapido' | 'personalizado';
  icone: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: Array<{
    type: SolarNodeType;
    position: { x: number; y: number };
    data: Record<string, unknown> & { label: string };
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edges: Array<{
    source: string;
    target: string;
    animated?: boolean;
  }>;
  preview?: string; // URL da imagem de preview
}

// Definições dos nós disponíveis para a sidebar
export interface NodeDefinition {
  type: SolarNodeType;
  label: string;
  descricao: string;
  icone: string;
  cor: string;
  categoria: 'inicio' | 'coleta' | 'midia' | 'decisao' | 'acao' | 'fim';
  defaultData: Partial<SolarNodeData>;
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  {
    type: 'GREETING',
    label: 'Saudação',
    descricao: 'Mensagem inicial de boas-vindas',
    icone: 'HandWaving',
    cor: '#22c55e',
    categoria: 'inicio',
    defaultData: {
      label: 'Saudação',
      mensagem: 'Olá! Bem-vindo à nossa empresa de energia solar. Como posso ajudá-lo hoje?',
    },
  },
  {
    type: 'QUESTION',
    label: 'Pergunta',
    descricao: 'Faz uma pergunta ao lead',
    icone: 'HelpCircle',
    cor: '#3b82f6',
    categoria: 'coleta',
    defaultData: {
      label: 'Pergunta',
      pergunta: '',
      tipoResposta: 'texto',
      obrigatoria: true,
    },
  },
  {
    type: 'CONSUMO',
    label: 'Consumo kWh',
    descricao: 'Pergunta sobre consumo de energia',
    icone: 'Zap',
    cor: '#f59e0b',
    categoria: 'coleta',
    defaultData: {
      label: 'Consumo',
      pergunta: 'Qual o seu consumo médio mensal de energia em kWh?',
      unidade: 'kWh',
      campoDestino: 'consumo_kwh',
    },
  },
  {
    type: 'CONTA_LUZ',
    label: 'Conta de Luz',
    descricao: 'Solicita foto da conta de luz',
    icone: 'FileImage',
    cor: '#8b5cf6',
    categoria: 'midia',
    defaultData: {
      label: 'Conta de Luz',
      mensagemSolicitacao: 'Pode me enviar uma foto da sua conta de luz? Assim consigo calcular sua economia com precisão.',
      analisarAutomatico: true,
      extrairConsumo: true,
      extrairValor: true,
      timeoutSegundos: 300,
    },
  },
  {
    type: 'TELHADO',
    label: 'Foto Telhado',
    descricao: 'Solicita foto do telhado',
    icone: 'Home',
    cor: '#ec4899',
    categoria: 'midia',
    defaultData: {
      label: 'Foto Telhado',
      mensagemSolicitacao: 'Pode me enviar uma foto do seu telhado? Vou avaliar a viabilidade da instalação.',
      analisarAutomatico: true,
      avaliarViabilidade: true,
      timeoutSegundos: 300,
    },
  },
  {
    type: 'TIPO_INSTALACAO',
    label: 'Tipo Instalação',
    descricao: 'Pergunta tipo de instalação',
    icone: 'Building2',
    cor: '#06b6d4',
    categoria: 'coleta',
    defaultData: {
      label: 'Tipo Instalação',
      pergunta: 'Qual o tipo de instalação?',
      opcoes: [
        { label: 'Residencial', value: 'RESIDENCIAL', descricao: 'Casa ou apartamento' },
        { label: 'Comercial', value: 'COMERCIAL', descricao: 'Empresa ou comércio' },
        { label: 'Rural', value: 'RURAL', descricao: 'Fazenda ou sítio' },
        { label: 'Investimento', value: 'INVESTIMENTO', descricao: 'Para gerar créditos' },
      ],
      permitirOutro: false,
    },
  },
  {
    type: 'FORMA_PAGAMENTO',
    label: 'Forma Pagamento',
    descricao: 'Pergunta forma de pagamento',
    icone: 'CreditCard',
    cor: '#10b981',
    categoria: 'coleta',
    defaultData: {
      label: 'Forma Pagamento',
      pergunta: 'Como pretende realizar o pagamento?',
      opcoes: [
        { label: 'Financiamento', value: 'financiamento', descricao: 'Parcelado com banco', destaque: true },
        { label: 'À Vista', value: 'avista', descricao: 'Pagamento único' },
        { label: 'A Definir', value: 'definir', descricao: 'Quero ver as opções' },
      ],
      mostrarFinanciamento: true,
    },
  },
  {
    type: 'CONDITION',
    label: 'Condição',
    descricao: 'Decisão baseada em dados',
    icone: 'GitBranch',
    cor: '#f97316',
    categoria: 'decisao',
    defaultData: {
      label: 'Condição',
      campo: 'consumo_kwh',
      operador: 'maior',
      valor: 300,
    },
  },
  {
    type: 'PROPOSTA',
    label: 'Gerar Proposta',
    descricao: 'Gera proposta comercial',
    icone: 'FileText',
    cor: '#6366f1',
    categoria: 'acao',
    defaultData: {
      label: 'Gerar Proposta',
      gerarAutomatico: true,
      incluirDados: ['consumo_kwh', 'tipo_instalacao', 'forma_pagamento'],
      formatoPDF: true,
      enviarWhatsApp: true,
      mensagemEnvio: 'Preparei uma proposta personalizada para você! Confira:',
    },
  },
  {
    type: 'VISITA_TECNICA',
    label: 'Visita Técnica',
    descricao: 'Agenda visita técnica',
    icone: 'Calendar',
    cor: '#0ea5e9',
    categoria: 'acao',
    defaultData: {
      label: 'Visita Técnica',
      pergunta: 'Gostaria de agendar uma visita técnica gratuita?',
      mostrarDisponibilidade: true,
      diasDisponiveis: [1, 2, 3, 4, 5], // Seg-Sex
      horariosDisponiveis: ['09:00', '10:00', '14:00', '15:00', '16:00'],
      confirmarEndereco: true,
    },
  },
  {
    type: 'HANDOFF',
    label: 'Transferir',
    descricao: 'Transfere para atendente',
    icone: 'UserCheck',
    cor: '#ef4444',
    categoria: 'fim',
    defaultData: {
      label: 'Transferir',
      motivo: 'Cliente solicitou atendimento humano',
      mensagemCliente: 'Estou transferindo você para um de nossos especialistas. Aguarde um momento.',
      notificarEquipe: true,
      canalNotificacao: 'whatsapp',
      prioridade: 'media',
    },
  },
  {
    type: 'FOLLOWUP',
    label: 'Follow-up',
    descricao: 'Configura follow-up',
    icone: 'Clock',
    cor: '#a855f7',
    categoria: 'acao',
    defaultData: {
      label: 'Follow-up',
      ativar: true,
      intervalos: [24, 48, 72],
      mensagens: [
        'Olá! Notei que não finalizamos nossa conversa. Posso ajudar com mais alguma dúvida?',
        'Oi! Só passando para lembrar que sua proposta ainda está disponível. Quer que eu explique algo?',
        'Última mensagem! Se tiver interesse em economizar na conta de luz, me chame. Estou aqui para ajudar!',
      ],
      maxTentativas: 3,
      pararSeResponder: true,
    },
  },
  {
    type: 'MESSAGE',
    label: 'Mensagem',
    descricao: 'Envia mensagem simples',
    icone: 'MessageCircle',
    cor: '#64748b',
    categoria: 'acao',
    defaultData: {
      label: 'Mensagem',
      mensagem: '',
      aguardarResposta: false,
    },
  },
];

// Agrupa nós por categoria para a sidebar
export const NODE_CATEGORIES = [
  { id: 'inicio', label: 'Início', descricao: 'Nós para iniciar o fluxo' },
  { id: 'coleta', label: 'Coleta de Dados', descricao: 'Nós para coletar informações' },
  { id: 'midia', label: 'Mídia', descricao: 'Nós para receber arquivos' },
  { id: 'decisao', label: 'Decisão', descricao: 'Nós de condição e ramificação' },
  { id: 'acao', label: 'Ações', descricao: 'Nós que executam ações' },
  { id: 'fim', label: 'Finalização', descricao: 'Nós para encerrar ou transferir' },
];

// ============================================
// TEMPLATES PRÉ-DEFINIDOS
// ============================================

/**
 * Template de Qualificação Padrão
 * Sequência completa de perguntas para qualificação de leads
 */
export const TEMPLATE_QUALIFICACAO_PADRAO = {
  nodes: [
    // 1. SAUDAÇÃO + TIPO (casa/empresa)
    {
      type: 'GREETING' as SolarNodeType,
      position: { x: 250, y: 0 },
      data: {
        label: 'Saudação',
        mensagem: 'Olá, tudo bem? ☀️ Você está buscando energia solar para sua casa ou empresa?',
        personalizarHorario: true,
        mensagemManha: 'Bom dia! ☀️ Você está buscando energia solar para sua casa ou empresa?',
        mensagemTarde: 'Boa tarde! ☀️ Você está buscando energia solar para sua casa ou empresa?',
        mensagemNoite: 'Boa noite! 🌙 Você está buscando energia solar para sua casa ou empresa?',
      },
    },
    // 2. CONSUMO
    {
      type: 'QUESTION' as SolarNodeType,
      position: { x: 250, y: 150 },
      data: {
        label: 'Consumo',
        pergunta: 'Qual o consumo mensal de energia? (pode ser em kWh ou o valor aproximado da conta)',
        tipoResposta: 'texto',
        campoDestino: 'consumo_kwh',
        obrigatoria: true,
        mensagemErro: 'Por favor, informe o consumo mensal de energia para que eu possa dimensionar o sistema ideal.',
        maxTentativas: 2,
      },
    },
    // 3. EXPANSÃO
    {
      type: 'QUESTION' as SolarNodeType,
      position: { x: 250, y: 300 },
      data: {
        label: 'Expansão',
        pergunta: 'Pretende adicionar novos equipamentos que consumam energia (ar-condicionado, piscina, carro elétrico)?',
        tipoResposta: 'sim_nao',
        campoDestino: 'pretende_expansao',
        obrigatoria: true,
        maxTentativas: 2,
      },
    },
    // 4. TELHADO
    {
      type: 'QUESTION' as SolarNodeType,
      position: { x: 250, y: 450 },
      data: {
        label: 'Tipo Telhado',
        pergunta: 'Qual o tipo de telhado do local?',
        tipoResposta: 'opcoes',
        opcoes: ['Cerâmica/Barro', 'Metálico/Zinco', 'Fibrocimento', 'Laje', 'Colonial', 'Outro'],
        campoDestino: 'tipo_telhado',
        obrigatoria: true,
        maxTentativas: 2,
      },
    },
    // 5. CIDADE
    {
      type: 'QUESTION' as SolarNodeType,
      position: { x: 250, y: 600 },
      data: {
        label: 'Cidade',
        pergunta: 'Qual sua cidade?',
        tipoResposta: 'texto',
        campoDestino: 'cidade',
        obrigatoria: true,
        maxTentativas: 2,
      },
    },
    // 6. MOMENTO DE COMPRA
    {
      type: 'QUESTION' as SolarNodeType,
      position: { x: 250, y: 750 },
      data: {
        label: 'Momento Compra',
        pergunta: 'Você já entende como funciona o sistema e quer instalar logo, ou ainda está pesquisando?',
        tipoResposta: 'opcoes',
        opcoes: ['Quero instalar logo', 'Ainda estou pesquisando'],
        campoDestino: 'momento_compra',
        obrigatoria: true,
        maxTentativas: 2,
      },
    },
    // 7. PAGAMENTO
    {
      type: 'FORMA_PAGAMENTO' as SolarNodeType,
      position: { x: 250, y: 900 },
      data: {
        label: 'Forma Pagamento',
        pergunta: 'Entre as opções abaixo, qual seria mais interessante para você?',
        opcoes: [
          { label: 'Financiamento', value: 'financiamento', descricao: 'Parcelas que cabem no bolso', destaque: true },
          { label: 'À Vista', value: 'avista', descricao: 'Melhor desconto' },
          { label: 'Cartão de Crédito', value: 'cartao', descricao: 'Parcelado no cartão' },
          { label: 'Quero ver as opções', value: 'definir', descricao: 'Me apresente todas as formas' },
        ],
        mostrarFinanciamento: true,
        parceirosFinanciamento: ['BV', 'Santander', 'Banco do Brasil'],
      },
    },
    // 8. AGENDAMENTO
    {
      type: 'QUESTION' as SolarNodeType,
      position: { x: 250, y: 1050 },
      data: {
        label: 'Agendamento',
        pergunta: 'Prefere ver a proposta presencialmente ou por ligação? Qual melhor horário para você?',
        tipoResposta: 'texto',
        campoDestino: 'preferencia_atendimento',
        obrigatoria: true,
        maxTentativas: 2,
      },
    },
    // 9. FINALIZAÇÃO
    {
      type: 'MESSAGE' as SolarNodeType,
      position: { x: 250, y: 1200 },
      data: {
        label: 'Finalização',
        mensagem: 'Perfeito! 🎉 Coletei todas as informações. Um de nossos especialistas entrará em contato no horário combinado para apresentar a melhor solução para você. Obrigado pelo interesse em energia solar!',
        aguardarResposta: false,
      },
    },
    // 10. FOLLOW-UP
    {
      type: 'FOLLOWUP' as SolarNodeType,
      position: { x: 500, y: 1200 },
      data: {
        label: 'Follow-up',
        ativar: true,
        intervalos: [24, 48, 72],
        mensagens: [
          'Olá! ☀️ Passando para lembrar que seu orçamento de energia solar está pronto. Podemos agendar uma conversa?',
          'Oi! Ainda temos uma proposta especial esperando por você. Quer que eu explique os benefícios?',
          'Última mensagem! Se tiver interesse em economizar até 95% na conta de luz, me chame. Estou aqui para ajudar! 🌞',
        ],
        maxTentativas: 3,
        pararSeResponder: true,
      },
    },
    // 11. HANDOFF (transferência para atendente)
    {
      type: 'HANDOFF' as SolarNodeType,
      position: { x: 500, y: 1350 },
      data: {
        label: 'Transferir',
        motivo: 'Lead qualificado - pronto para atendimento',
        mensagemCliente: 'Estou transferindo você para um de nossos especialistas que vai preparar sua proposta personalizada. Aguarde um momento! 🚀',
        notificarEquipe: true,
        canalNotificacao: 'whatsapp',
        prioridade: 'alta',
      },
    },
  ],
  edges: [
    { source: 'node-1', target: 'node-2', animated: true },
    { source: 'node-2', target: 'node-3' },
    { source: 'node-3', target: 'node-4' },
    { source: 'node-4', target: 'node-5' },
    { source: 'node-5', target: 'node-6' },
    { source: 'node-6', target: 'node-7' },
    { source: 'node-7', target: 'node-8' },
    { source: 'node-8', target: 'node-9' },
    { source: 'node-9', target: 'node-10' },
    { source: 'node-9', target: 'node-11' },
  ],
};

export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: 'qualificacao-padrao',
    nome: 'Qualificação Padrão',
    descricao: 'Fluxo completo de qualificação com 8 perguntas essenciais para converter leads em clientes',
    categoria: 'completo',
    icone: 'Stars',
    nodes: TEMPLATE_QUALIFICACAO_PADRAO.nodes,
    edges: TEMPLATE_QUALIFICACAO_PADRAO.edges,
  },
  {
    id: 'basico',
    nome: 'Fluxo Básico',
    descricao: 'Fluxo simples para qualificação rápida de leads',
    categoria: 'basico',
    icone: 'Rocket',
    nodes: [
      {
        type: 'GREETING' as SolarNodeType,
        position: { x: 250, y: 0 },
        data: {
          label: 'Saudação',
          mensagem: 'Olá! ☀️ Bem-vindo! Como posso ajudá-lo com energia solar hoje?',
        },
      },
      {
        type: 'CONSUMO' as SolarNodeType,
        position: { x: 250, y: 150 },
        data: {
          label: 'Consumo',
          pergunta: 'Qual o seu consumo médio mensal de energia em kWh?',
          unidade: 'kWh',
          campoDestino: 'consumo_kwh',
        },
      },
      {
        type: 'QUESTION' as SolarNodeType,
        position: { x: 250, y: 300 },
        data: {
          label: 'Cidade',
          pergunta: 'Qual sua cidade?',
          tipoResposta: 'texto',
          campoDestino: 'cidade',
          obrigatoria: true,
        },
      },
      {
        type: 'HANDOFF' as SolarNodeType,
        position: { x: 250, y: 450 },
        data: {
          label: 'Transferir',
          motivo: 'Lead captado',
          mensagemCliente: 'Obrigado pelas informações! Um especialista entrará em contato em breve.',
          notificarEquipe: true,
          canalNotificacao: 'whatsapp',
          prioridade: 'media',
        },
      },
    ],
    edges: [
      { source: 'node-1', target: 'node-2', animated: true },
      { source: 'node-2', target: 'node-3' },
      { source: 'node-3', target: 'node-4' },
    ],
  },
  {
    id: 'rapido',
    nome: 'Fluxo Rápido',
    descricao: 'Apenas consumo e agendamento de visita',
    categoria: 'rapido',
    icone: 'Zap',
    nodes: [
      {
        type: 'GREETING' as SolarNodeType,
        position: { x: 250, y: 0 },
        data: {
          label: 'Saudação',
          mensagem: 'Olá! ☀️ Quer economizar até 95% na conta de luz?',
        },
      },
      {
        type: 'CONSUMO' as SolarNodeType,
        position: { x: 250, y: 150 },
        data: {
          label: 'Consumo',
          pergunta: 'Me conta: qual o valor médio da sua conta de luz?',
          unidade: 'reais',
          campoDestino: 'valor_conta',
        },
      },
      {
        type: 'VISITA_TECNICA' as SolarNodeType,
        position: { x: 250, y: 300 },
        data: {
          label: 'Visita Técnica',
          pergunta: 'Posso agendar uma visita técnica gratuita para fazer um orçamento sem compromisso?',
          mostrarDisponibilidade: true,
          diasDisponiveis: [1, 2, 3, 4, 5],
          horariosDisponiveis: ['09:00', '10:00', '14:00', '15:00', '16:00'],
          confirmarEndereco: true,
        },
      },
    ],
    edges: [
      { source: 'node-1', target: 'node-2', animated: true },
      { source: 'node-2', target: 'node-3' },
    ],
  },
];

// ============================================
// CONFIGURAÇÃO DEFAULT
// ============================================

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  agente: {
    nome: 'Assistente Solar',
    personalidade: 'consultivo',
    tomVoz: 'neutro',
    usarEmojis: true,
    velocidadeDigitacao: 'normal',
  },
  horario: {
    ativo: true,
    timezone: 'America/Sao_Paulo',
    diasSemana: [1, 2, 3, 4, 5], // Seg-Sex
    horaInicio: '08:00',
    horaFim: '18:00',
    responderForaHorario: true,
    mensagemForaHorario: 'Olá! Estamos fora do horário de atendimento. Retornaremos em breve!',
  },
  followup: {
    ativo: true,
    intervaloPrimeiro: 24,
    intervaloSegundo: 48,
    intervaloTerceiro: 72,
    maxTentativas: 3,
    pararSeResponder: true,
  },
  integracoes: {
    visionAtivo: true,
    sttAtivo: true,
    calendarioIntegrado: false,
    crmIntegrado: true,
  },
  instrucoes: '',
};
