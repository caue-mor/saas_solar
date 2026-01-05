# Plano de Ação - Correção de Gaps SAAS-SOLAR

## Sumário Executivo

| Gap | Criticidade | Complexidade | Impacto |
|-----|-------------|--------------|---------|
| Duplicidade de IA | CRÍTICO | Média | Alto |
| Memória Longa (Store) | CRÍTICO | Baixa | Alto |
| Flow Builder Visual | ALTA | Alta | Médio |
| Alinhamento de Etapas | ALTA | Baixa | Médio |
| RAG/Knowledge Base | MÉDIA | Média | Médio |

---

## 1. DUPLICIDADE DE IA (CRÍTICO)

### Problema
O sistema tem **duas implementações de IA separadas**:
- Frontend: `generateAIResponse()` com OpenAI direto
- Backend: LangGraph Agent com tools e checkpointer

### Arquivos Afetados
- `SAAS-SOLAR/src/app/api/webhook/whatsapp/route.ts`
- `SOLAR-AGENT-LG/src/api/main.py`

### Solução Proposta

**Opção A: Frontend repassa para Backend (RECOMENDADA)**

```typescript
// SAAS-SOLAR/src/app/api/webhook/whatsapp/route.ts

export async function POST(request: Request) {
    const payload = await request.json();

    // Validações básicas...

    // Repassar para backend Python
    const response = await fetch(`${SOLAR_AGENT_URL}/webhook/whatsapp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.SOLAR_AGENT_API_KEY,
        },
        body: JSON.stringify(payload),
    });

    return response;
}
```

**Opção B: Remover webhook do frontend**

Configurar UAZAPI para enviar webhooks diretamente para o backend Python.

### Passos de Implementação

1. [ ] Criar endpoint unificado no backend Python
2. [ ] Atualizar webhook frontend para repassar
3. [ ] Remover `generateAIResponse` do frontend
4. [ ] Testar fluxo completo
5. [ ] Atualizar configuração UAZAPI

---

## 2. MEMÓRIA DE LONGO PRAZO - STORE (CRÍTICO)

### Problema
Lead que retorna após dias perde todo o contexto da conversa anterior.

### Arquivo a Modificar
- `SOLAR-AGENT-LG/src/agent/graph.py`
- `SOLAR-AGENT-LG/src/services/checkpointer.py`

### Solução

```python
# SOLAR-AGENT-LG/src/services/store.py (NOVO)

from langgraph.store.postgres.aio import AsyncPostgresStore
from ..core.config import get_settings

_store = None

async def get_store() -> AsyncPostgresStore:
    """
    Retorna instância singleton do Store para memória longa.
    """
    global _store

    if _store is None:
        settings = get_settings()
        _store = AsyncPostgresStore(settings.database_url)
        await _store.setup()

    return _store
```

```python
# SOLAR-AGENT-LG/src/agent/graph.py (MODIFICAR)

from ..services.store import get_store

async def create_agent():
    model = ChatOpenAI(
        model=settings.openai_model,
        temperature=settings.openai_temperature
    )

    checkpointer = await get_checkpointer()
    store = await get_store()  # ADICIONAR

    _agent = create_react_agent(
        model=model,
        tools=ALL_TOOLS,
        checkpointer=checkpointer,
        store=store,  # ADICIONAR
        state_schema=AgentState
    )
```

### Uso do Store nas Tools

```python
# Exemplo em qualification.py

from langgraph.store.base import BaseStore

@tool
async def update_consumo(
    consumo: str,
    state: Annotated[dict, InjectedState],
    config: RunnableConfig,
    store: Annotated[BaseStore, InjectedStore],  # ADICIONAR
) -> str:
    lead_id = state.get("lead_id")
    valor = _extract_numeric_value(consumo)

    # Salvar na memória longa
    namespace = ("lead_memory", str(lead_id))
    await store.aput(
        namespace,
        "consumo_historico",
        {"valor": valor, "timestamp": datetime.now().isoformat()}
    )

    # ... resto do código
```

### Passos de Implementação

1. [ ] Criar `src/services/store.py`
2. [ ] Adicionar store ao `create_agent()`
3. [ ] Atualizar tools para usar InjectedStore
4. [ ] Criar migrations para tabelas do store
5. [ ] Implementar recuperação de memória na inicialização

---

## 3. FLOW BUILDER VISUAL (ALTA)

### Problema
Flow Builder atual é apenas lista de perguntas, não permite criar fluxos visuais.

### Arquivos a Criar/Modificar
- `SAAS-SOLAR/src/app/(dashboard)/dashboard/flow-builder/page.tsx`
- `SAAS-SOLAR/src/components/flow-builder/` (NOVO diretório)

### Solução com React Flow

```bash
# Instalar dependências
npm install @xyflow/react
```

```typescript
// SAAS-SOLAR/src/components/flow-builder/FlowCanvas.tsx

'use client';

import { useCallback, useState } from 'react';
import {
    ReactFlow,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    type Node,
    type Edge,
    type OnConnect,
    type OnNodesChange,
    type OnEdgesChange,
    Background,
    Controls,
    MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { GreetingNode } from './nodes/GreetingNode';
import { QuestionNode } from './nodes/QuestionNode';
import { ConditionNode } from './nodes/ConditionNode';
import { HandoffNode } from './nodes/HandoffNode';

const nodeTypes = {
    greeting: GreetingNode,
    question: QuestionNode,
    condition: ConditionNode,
    handoff: HandoffNode,
};

interface FlowCanvasProps {
    initialNodes?: Node[];
    initialEdges?: Edge[];
    onSave?: (nodes: Node[], edges: Edge[]) => void;
}

export function FlowCanvas({ initialNodes = [], initialEdges = [], onSave }: FlowCanvasProps) {
    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect: OnConnect = useCallback(
        (connection) => setEdges((eds) => addEdge(connection, eds)),
        []
    );

    return (
        <div className="h-[600px] w-full border rounded-lg">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
}
```

```typescript
// SAAS-SOLAR/src/components/flow-builder/nodes/QuestionNode.tsx

import { Handle, Position, type NodeProps } from '@xyflow/react';

interface QuestionData {
    label: string;
    question: string;
    fieldName: string;
    type: 'text' | 'number' | 'select';
    options?: string[];
}

export function QuestionNode({ data }: NodeProps<QuestionData>) {
    return (
        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 min-w-[200px]">
            <Handle type="target" position={Position.Top} />

            <div className="font-semibold text-blue-700 mb-2">
                Pergunta
            </div>

            <div className="text-sm text-gray-600 mb-1">
                {data.question || 'Configure a pergunta...'}
            </div>

            <div className="text-xs text-gray-400">
                Campo: {data.fieldName || 'não definido'}
            </div>

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
```

### Tipos de Nós a Implementar

| Tipo | Cor | Handles | Campos |
|------|-----|---------|--------|
| `greeting` | Verde | 1 saída | message |
| `question` | Azul | 1 entrada, 1 saída | question, fieldName, type, options |
| `condition` | Amarelo | 1 entrada, 2+ saídas | field, operator, value |
| `qualification` | Roxo | 1 entrada, 2 saídas | threshold |
| `handoff` | Vermelho | 1 entrada | message, notifyNumber |
| `ai_response` | Cinza | 1 entrada, 1 saída | promptContext |

### Passos de Implementação

1. [ ] Instalar @xyflow/react
2. [ ] Criar componentes de nós customizados
3. [ ] Criar FlowCanvas principal
4. [ ] Criar sidebar com nós arrastáveis
5. [ ] Implementar salvamento no banco (flow_config JSONB)
6. [ ] Criar preview/simulação de fluxo
7. [ ] Integrar com backend (FlowInterpreter)

---

## 4. ALINHAMENTO DE ETAPAS (ALTA)

### Problema
Frontend e backend usam definições diferentes de etapas.

### Arquivos Afetados
- `SAAS-SOLAR/src/services/contatos.ts`
- `SOLAR-AGENT-LG/src/flow/context.py`

### Solução: Unificar Definições

```typescript
// SAAS-SOLAR/src/types/etapas.ts (NOVO)

export const ETAPAS_QUALIFICACAO = {
    TIPO_PROPRIEDADE: { id: 1, nome: 'Tipo de Propriedade', campo: 'tipo_propriedade' },
    CIDADE: { id: 2, nome: 'Cidade', campo: 'cidade' },
    CONSUMO: { id: 3, nome: 'Consumo', campo: 'consumo' },
    EXPANSAO: { id: 4, nome: 'Expansão', campo: 'expansao' },
    TELHADO: { id: 5, nome: 'Telhado', campo: 'telhado' },
    PRIORIDADE: { id: 6, nome: 'Prioridade', campo: 'prioridade' },
    PAGAMENTO: { id: 7, nome: 'Pagamento', campo: 'pagamento' },
    AGENDAMENTO: { id: 8, nome: 'Agendamento', campo: 'agendamento' },
} as const;

export type EtapaKey = keyof typeof ETAPAS_QUALIFICACAO;
export type Etapa = typeof ETAPAS_QUALIFICACAO[EtapaKey];
```

```python
# SOLAR-AGENT-LG/src/models/etapas.py (NOVO)

from enum import IntEnum
from dataclasses import dataclass

class EtapaQualificacao(IntEnum):
    TIPO_PROPRIEDADE = 1
    CIDADE = 2
    CONSUMO = 3
    EXPANSAO = 4
    TELHADO = 5
    PRIORIDADE = 6
    PAGAMENTO = 7
    AGENDAMENTO = 8

@dataclass
class EtapaInfo:
    id: int
    nome: str
    campo: str

ETAPAS = {
    EtapaQualificacao.TIPO_PROPRIEDADE: EtapaInfo(1, "Tipo de Propriedade", "tipo_propriedade"),
    EtapaQualificacao.CIDADE: EtapaInfo(2, "Cidade", "cidade"),
    EtapaQualificacao.CONSUMO: EtapaInfo(3, "Consumo", "consumo"),
    EtapaQualificacao.EXPANSAO: EtapaInfo(4, "Expansão", "expansao"),
    EtapaQualificacao.TELHADO: EtapaInfo(5, "Telhado", "telhado"),
    EtapaQualificacao.PRIORIDADE: EtapaInfo(6, "Prioridade", "prioridade"),
    EtapaQualificacao.PAGAMENTO: EtapaInfo(7, "Pagamento", "pagamento"),
    EtapaQualificacao.AGENDAMENTO: EtapaInfo(8, "Agendamento", "agendamento"),
}
```

### Passos de Implementação

1. [ ] Criar definição unificada no frontend
2. [ ] Criar definição unificada no backend
3. [ ] Atualizar `contatos.ts` para usar nova definição
4. [ ] Atualizar `context.py` para usar nova definição
5. [ ] Atualizar banco de dados se necessário

---

## 5. RAG/KNOWLEDGE BASE (MÉDIA)

### Problema
Agente não consegue responder perguntas técnicas sobre energia solar.

### Arquivos a Criar
- `SOLAR-AGENT-LG/src/agent/tools/knowledge.py`
- `SOLAR-AGENT-LG/src/services/embeddings.py`

### Solução

```python
# SOLAR-AGENT-LG/src/services/embeddings.py

from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from supabase import create_client

class KnowledgeService:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings()
        self.supabase = create_client(
            settings.supabase_url,
            settings.supabase_key
        )
        self.vector_store = SupabaseVectorStore(
            client=self.supabase,
            embedding=self.embeddings,
            table_name="knowledge_embeddings",
            query_name="match_documents"
        )

    async def search(self, query: str, k: int = 3) -> list[dict]:
        """Busca documentos relevantes"""
        docs = await self.vector_store.asimilarity_search(query, k=k)
        return [
            {"content": doc.page_content, "metadata": doc.metadata}
            for doc in docs
        ]
```

```python
# SOLAR-AGENT-LG/src/agent/tools/knowledge.py

from langchain_core.tools import tool
from ...services.embeddings import KnowledgeService

_knowledge_service = None

async def get_knowledge_service():
    global _knowledge_service
    if _knowledge_service is None:
        _knowledge_service = KnowledgeService()
    return _knowledge_service

@tool
async def search_knowledge(
    query: str,
) -> str:
    """
    Busca informações técnicas sobre energia solar.

    QUANDO USAR: Quando o cliente perguntar sobre:
    - Como funciona energia solar
    - Economia e payback
    - Tipos de painéis
    - Manutenção do sistema
    - Financiamento
    - Legislação

    Args:
        query: Pergunta ou tema a pesquisar

    Returns:
        Informações relevantes encontradas
    """
    service = await get_knowledge_service()
    results = await service.search(query)

    if not results:
        return "Não encontrei informações específicas sobre isso. Posso te ajudar com outra dúvida?"

    response = "📚 *Informações encontradas:*\n\n"
    for i, doc in enumerate(results, 1):
        response += f"{i}. {doc['content']}\n\n"

    return response
```

### SQL para Vector Store

```sql
-- Criar tabela para embeddings
create table knowledge_embeddings (
    id uuid primary key default gen_random_uuid(),
    content text not null,
    metadata jsonb,
    embedding vector(1536),
    created_at timestamptz default now()
);

-- Criar função de busca
create or replace function match_documents(
    query_embedding vector(1536),
    match_count int default 3,
    filter jsonb default '{}'
) returns table (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select
        knowledge_embeddings.id,
        knowledge_embeddings.content,
        knowledge_embeddings.metadata,
        1 - (knowledge_embeddings.embedding <=> query_embedding) as similarity
    from knowledge_embeddings
    where knowledge_embeddings.metadata @> filter
    order by knowledge_embeddings.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- Criar índice para busca vetorial
create index on knowledge_embeddings using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
```

### Passos de Implementação

1. [ ] Criar tabela de embeddings no Supabase
2. [ ] Criar service de embeddings
3. [ ] Criar tool `search_knowledge`
4. [ ] Adicionar tool ao ALL_TOOLS
5. [ ] Popular base com FAQ de energia solar
6. [ ] Testar buscas

---

## Cronograma Sugerido

### Semana 1: Críticos
- [ ] Unificar implementação de IA
- [ ] Implementar Store para memória longa

### Semana 2: Alta Prioridade
- [ ] Alinhar etapas frontend/backend
- [ ] Iniciar Flow Builder Visual

### Semana 3-4: Flow Builder
- [ ] Completar Flow Builder Visual
- [ ] Testes e ajustes

### Semana 5: Melhorias
- [ ] Implementar RAG
- [ ] Popular knowledge base
- [ ] Testes finais

---

## Checklist Final

- [ ] Todas as mensagens passam pelo LangGraph Agent
- [ ] Store implementado e funcionando
- [ ] Flow Builder visual operacional
- [ ] Etapas alinhadas entre frontend e backend
- [ ] RAG respondendo perguntas técnicas
- [ ] Testes de integração passando
- [ ] Documentação atualizada
