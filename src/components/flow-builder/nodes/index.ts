/**
 * Exportação de todos os componentes de nós do FlowBuilder
 */

export { BaseNode } from './BaseNode';
export { GreetingNode } from './GreetingNode';
export { QuestionNode } from './QuestionNode';
export { ConsumoNode } from './ConsumoNode';
export { ContaLuzNode } from './ContaLuzNode';
export { TelhadoNode } from './TelhadoNode';
export { ConditionNode } from './ConditionNode';
export { HandoffNode } from './HandoffNode';
export { PropostaNode } from './PropostaNode';
export { VisitaNode } from './VisitaNode';
export { MessageNode } from './MessageNode';

// Mapeamento de tipos para componentes
import { GreetingNode } from './GreetingNode';
import { QuestionNode } from './QuestionNode';
import { ConsumoNode } from './ConsumoNode';
import { ContaLuzNode } from './ContaLuzNode';
import { TelhadoNode } from './TelhadoNode';
import { ConditionNode } from './ConditionNode';
import { HandoffNode } from './HandoffNode';
import { PropostaNode } from './PropostaNode';
import { VisitaNode } from './VisitaNode';
import { MessageNode } from './MessageNode';

export const nodeTypes = {
  GREETING: GreetingNode,
  QUESTION: QuestionNode,
  CONSUMO: ConsumoNode,
  CONTA_LUZ: ContaLuzNode,
  TELHADO: TelhadoNode,
  TIPO_INSTALACAO: QuestionNode, // Reutiliza QuestionNode
  FORMA_PAGAMENTO: QuestionNode, // Reutiliza QuestionNode
  CONDITION: ConditionNode,
  PROPOSTA: PropostaNode,
  VISITA_TECNICA: VisitaNode,
  HANDOFF: HandoffNode,
  FOLLOWUP: MessageNode, // Reutiliza MessageNode
  MESSAGE: MessageNode,
};
