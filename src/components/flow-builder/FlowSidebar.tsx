'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Hand,
  HelpCircle,
  Zap,
  FileImage,
  Home,
  Building2,
  CreditCard,
  GitBranch,
  FileText,
  Calendar,
  UserCheck,
  Clock,
  MessageCircle,
  Rocket,
  Stars,
  BookOpen,
} from 'lucide-react';
import {
  NODE_DEFINITIONS,
  NODE_CATEGORIES,
  FLOW_TEMPLATES,
  type SolarNodeType,
  type FlowTemplate,
} from '@/types/flow.types';

interface FlowSidebarProps {
  onAddNode: (type: SolarNodeType) => void;
  onLoadTemplate?: (template: FlowTemplate) => void;
}

// Mapeamento de ícones
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  HandWaving: Hand,
  HelpCircle,
  Zap,
  FileImage,
  Home,
  Building2,
  CreditCard,
  GitBranch,
  FileText,
  Calendar,
  UserCheck,
  Clock,
  MessageCircle,
  Rocket,
  Stars,
};

export function FlowSidebar({ onAddNode, onLoadTemplate }: FlowSidebarProps) {
  const [activeTab, setActiveTab] = useState('nodes');

  // Handler para drag start
  const onDragStart = (
    event: React.DragEvent,
    nodeType: SolarNodeType
  ) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-72 border-r bg-white">
      <div className="border-b p-4">
        <h2 className="font-semibold">Flow Builder</h2>
        <p className="text-xs text-muted-foreground">
          Arraste os nós para o canvas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2">
          <TabsTrigger value="nodes" className="text-xs">
            Etapas
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">
            Templates
          </TabsTrigger>
          <TabsTrigger value="help" className="text-xs">
            Ajuda
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-180px)]">
          {/* Tab: Nós */}
          <TabsContent value="nodes" className="m-0 p-1">
            <div className="space-y-6">
              {NODE_CATEGORIES.map((category) => {
                const categoryNodes = NODE_DEFINITIONS.filter(
                  (n) => n.categoria === category.id
                );

                if (categoryNodes.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                      {category.label}
                    </h3>
                    <div className="space-y-2">
                      {categoryNodes.map((node) => {
                        const Icon = ICONS[node.icone] || MessageCircle;

                        return (
                          <div
                            key={node.type}
                            className="group flex cursor-grab items-center gap-3 rounded-lg border p-3 transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm active:cursor-grabbing"
                            draggable
                            onDragStart={(e) => onDragStart(e, node.type)}
                            onClick={() => onAddNode(node.type)}
                          >
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-md text-white"
                              style={{ backgroundColor: node.cor }}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-medium">{node.label}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {node.descricao}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Tab: Templates */}
          <TabsContent value="templates" className="m-0 p-4">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Templates prontos para começar rapidamente
              </p>

              {FLOW_TEMPLATES.map((template) => {
                const Icon = ICONS[template.icone] || Rocket;
                const hasNodes = template.nodes && template.nodes.length > 0;

                return (
                  <div
                    key={template.id}
                    className={`rounded-lg border p-4 transition-all ${
                      hasNodes
                        ? 'cursor-pointer hover:border-solar-300 hover:bg-solar-50'
                        : 'cursor-not-allowed opacity-60'
                    }`}
                    onClick={() => {
                      if (hasNodes && onLoadTemplate) {
                        if (confirm(`Carregar o template "${template.nome}"? Isso substituirá o fluxo atual.`)) {
                          onLoadTemplate(template);
                        }
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-solar-100 text-solar-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{template.nome}</h4>
                          <Badge variant="outline" className="text-[10px]">
                            {template.categoria}
                          </Badge>
                          {hasNodes && (
                            <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">
                              {template.nodes.length} etapas
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {template.descricao}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Mais templates em breve...
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Ajuda */}
          <TabsContent value="help" className="m-0 p-4">
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <BookOpen className="h-4 w-4" />
                  <h4 className="font-medium">Como usar</h4>
                </div>
                <ul className="mt-2 space-y-2 text-xs text-blue-600">
                  <li>1. Arraste os nós da sidebar para o canvas</li>
                  <li>2. Conecte os nós arrastando de um handle para outro</li>
                  <li>3. Clique em um nó para editar suas configurações</li>
                  <li>4. Use Delete/Backspace para remover nós</li>
                  <li>5. Salve o fluxo quando terminar</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-medium uppercase text-muted-foreground">
                  Tipos de Nós
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
                    <div>
                      <span className="font-medium">Início:</span> Saudação inicial
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
                    <div>
                      <span className="font-medium">Coleta:</span> Perguntas e dados
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-purple-500" />
                    <div>
                      <span className="font-medium">Mídia:</span> Fotos e documentos
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-orange-500" />
                    <div>
                      <span className="font-medium">Decisão:</span> Condições e ramificações
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-indigo-500" />
                    <div>
                      <span className="font-medium">Ação:</span> Propostas, visitas, etc
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500" />
                    <div>
                      <span className="font-medium">Fim:</span> Transferência para humano
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium">Dicas</h4>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>- Sempre comece com um nó de Saudação</li>
                  <li>- Colete o consumo antes de gerar proposta</li>
                  <li>- Use condições para fluxos personalizados</li>
                  <li>- Configure follow-up para leads não convertidos</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
