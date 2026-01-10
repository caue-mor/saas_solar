'use client';

import { useCallback, useState, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type OnConnect,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Save, Loader2, RotateCcw, Settings2, Download } from 'lucide-react';
import { nodeTypes } from './nodes';
import { FlowSidebar } from './FlowSidebar';
import { GlobalConfigPanel } from './GlobalConfigPanel';
import { NodeEditorPanel } from './NodeEditorPanel';
import {
  type SolarFlowNode,
  type SolarFlowEdge,
  type CompanyFlow,
  type GlobalConfig,
  type SolarNodeType,
  type FlowTemplate,
  NODE_DEFINITIONS,
  DEFAULT_GLOBAL_CONFIG,
} from '@/types/flow.types';

interface FlowBuilderProps {
  initialFlow?: CompanyFlow;
  empresaId: number;
  empresaNome?: string;
  onSave?: (flow: CompanyFlow) => Promise<void>;
}

// Componente interno que usa useReactFlow
function FlowBuilderInner({
  initialFlow,
  empresaId,
  empresaNome,
  onSave,
}: FlowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Estados
  const [nodes, setNodes, onNodesChange] = useNodesState<SolarFlowNode>(
    initialFlow?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<SolarFlowEdge>(
    initialFlow?.edges || []
  );
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(
    initialFlow?.globalConfig || DEFAULT_GLOBAL_CONFIG
  );
  const [saving, setSaving] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Busca o nó selecionado atual no array de nodes (sempre sincronizado)
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) as SolarFlowNode | null;
  }, [nodes, selectedNodeId]);

  // ID counter para novos nós
  const nodeIdCounter = useRef(
    Math.max(0, ...nodes.map((n) => parseInt(n.id.replace('node-', '')) || 0)) +
      1
  );

  // Conexão de edges
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const newEdge: SolarFlowEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}`,
        animated: true,
        style: { strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds) as SolarFlowEdge[]);
      setHasChanges(true);
    },
    [setEdges]
  );

  // Handler para drop de novos nós
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData(
        'application/reactflow'
      ) as SolarNodeType;

      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Busca definição do nó
      const nodeDef = NODE_DEFINITIONS.find((n) => n.type === nodeType);
      if (!nodeDef) return;

      const newNode: SolarFlowNode = {
        id: `node-${nodeIdCounter.current++}`,
        type: nodeType,
        position,
        data: {
          label: nodeDef.label,
          ...nodeDef.defaultData,
        } as SolarFlowNode['data'],
      };

      setNodes((nds) => [...nds, newNode]);
      setHasChanges(true);
    },
    [screenToFlowPosition, setNodes]
  );

  // Salvar fluxo
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      const flow: CompanyFlow = {
        id: initialFlow?.id,
        empresaId,
        nome: empresaNome || 'Fluxo Principal',
        versao: (initialFlow?.versao || 0) + 1,
        ativo: true,
        nodes: nodes as SolarFlowNode[],
        edges: edges as SolarFlowEdge[],
        globalConfig,
      };

      await onSave(flow);
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, globalConfig, empresaId, empresaNome, initialFlow, onSave]);

  // Resetar fluxo
  const handleReset = useCallback(() => {
    if (confirm('Tem certeza que deseja resetar o fluxo? Todas as alterações serão perdidas.')) {
      setNodes(initialFlow?.nodes || []);
      setEdges(initialFlow?.edges || []);
      setGlobalConfig(initialFlow?.globalConfig || DEFAULT_GLOBAL_CONFIG);
      setHasChanges(false);
    }
  }, [initialFlow, setNodes, setEdges]);

  // Carregar template
  const handleLoadTemplate = useCallback(
    (template: FlowTemplate) => {
      // Gera novos IDs para os nós
      const newNodes: SolarFlowNode[] = template.nodes.map((node, index) => ({
        ...node,
        id: `node-${index + 1}`,
        data: {
          ...node.data,
          label: node.data.label,
        } as SolarFlowNode['data'],
      }));

      // Atualiza os edges com os novos IDs dos nós
      const newEdges: SolarFlowEdge[] = template.edges.map((edge, index) => {
        // Mapeia os IDs antigos para novos (node-1, node-2, etc)
        const sourceIndex = parseInt(edge.source.replace('node-', '')) - 1;
        const targetIndex = parseInt(edge.target.replace('node-', '')) - 1;

        return {
          ...edge,
          id: `edge-${index + 1}`,
          source: `node-${sourceIndex + 1}`,
          target: `node-${targetIndex + 1}`,
        };
      });

      setNodes(newNodes);
      setEdges(newEdges);
      nodeIdCounter.current = newNodes.length + 1;
      setHasChanges(true);
      setSelectedNodeId(null);
    },
    [setNodes, setEdges]
  );

  // Exportar fluxo como JSON
  const handleExport = useCallback(() => {
    const flow: CompanyFlow = {
      empresaId,
      nome: empresaNome || 'Fluxo Exportado',
      versao: 1,
      ativo: true,
      nodes: nodes as SolarFlowNode[],
      edges: edges as SolarFlowEdge[],
      globalConfig,
    };

    const blob = new Blob([JSON.stringify(flow, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluxo-solar-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, globalConfig, empresaId, empresaNome]);

  // Atualizar nó
  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<SolarFlowNode['data']>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } as SolarFlowNode['data'] }
            : node
        )
      );
      setHasChanges(true);
    },
    [setNodes]
  );

  // Deletar nó selecionado
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      // Também remove edges conectadas
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !deleted.some(
              (node) => node.id === edge.source || node.id === edge.target
            )
        )
      );
      // Limpa seleção se o nó deletado estava selecionado
      if (deleted.some((n) => n.id === selectedNodeId)) {
        setSelectedNodeId(null);
      }
      setHasChanges(true);
    },
    [setEdges, selectedNodeId]
  );

  // Clique em nó - abre painel de edição
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      setShowConfig(false); // Fecha config global ao selecionar nó
    },
    []
  );

  // Clique no canvas - fecha painel de edição
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Deletar nó específico
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
      setSelectedNodeId(null);
      setHasChanges(true);
    },
    [setNodes, setEdges]
  );

  // Cores do MiniMap
  const nodeColor = useCallback((node: Node) => {
    const def = NODE_DEFINITIONS.find((d) => d.type === node.type);
    return def?.cor || '#64748b';
  }, []);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <FlowSidebar
        onAddNode={(type) => {
          const nodeDef = NODE_DEFINITIONS.find((n) => n.type === type);
          if (!nodeDef) return;

          const newNode: SolarFlowNode = {
            id: `node-${nodeIdCounter.current++}`,
            type,
            position: { x: 250, y: 100 + nodes.length * 100 },
            data: {
              label: nodeDef.label,
              ...nodeDef.defaultData,
            } as SolarFlowNode['data'],
          };

          setNodes((nds) => [...nds, newNode]);
          setHasChanges(true);
        }}
        onLoadTemplate={handleLoadTemplate}
      />

      {/* Main Flow Area */}
      <div className="flex flex-1 flex-col" ref={reactFlowWrapper}>
        {/* Toolbar Header */}
        <div className="flex h-14 items-center justify-between border-b bg-white px-4">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-800">Canvas</h2>
            {hasChanges && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                Alterações não salvas
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Configurações
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Resetar
            </Button>
            <Button
              variant="solar"
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodesDelete={onNodesDelete}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            deleteKeyCode={['Backspace', 'Delete']}
            className="bg-gray-50"
          >
            <Background gap={15} size={1} color="#e2e8f0" />
            <Controls />
            <MiniMap
              nodeColor={nodeColor}
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="!bg-white !border-gray-200"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Config Panel */}
      {showConfig && (
        <GlobalConfigPanel
          config={globalConfig}
          onChange={(config) => {
            setGlobalConfig(config);
            setHasChanges(true);
          }}
          onClose={() => setShowConfig(false)}
        />
      )}

      {/* Node Editor Panel */}
      {selectedNode && !showConfig && (
        <NodeEditorPanel
          node={selectedNode}
          onUpdate={updateNodeData}
          onDelete={deleteNode}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}

// Componente wrapper com Provider
export default function FlowBuilder(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}
