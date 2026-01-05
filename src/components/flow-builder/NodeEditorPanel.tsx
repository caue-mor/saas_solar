'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, Trash2 } from 'lucide-react';
import type {
  SolarFlowNode,
  GreetingNodeData,
  QuestionNodeData,
  ConsumoNodeData,
  ContaLuzNodeData,
  TelhadoNodeData,
  MessageNodeData,
  HandoffNodeData,
  PropostaNodeData,
  VisitaTecnicaNodeData,
  FollowupNodeData,
  SOLAR_LEAD_FIELDS,
} from '@/types/flow.types';

interface NodeEditorPanelProps {
  node: SolarFlowNode;
  onUpdate: (nodeId: string, data: Partial<SolarFlowNode['data']>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export function NodeEditorPanel({
  node,
  onUpdate,
  onDelete,
  onClose,
}: NodeEditorPanelProps) {
  const updateField = <K extends keyof SolarFlowNode['data']>(
    key: K,
    value: SolarFlowNode['data'][K]
  ) => {
    onUpdate(node.id, { [key]: value } as Partial<SolarFlowNode['data']>);
  };

  // Campos de destino disponíveis
  const camposDestino = [
    { value: 'nome', label: 'Nome' },
    { value: 'telefone', label: 'Telefone' },
    { value: 'email', label: 'E-mail' },
    { value: 'consumo_kwh', label: 'Consumo (kWh)' },
    { value: 'valor_conta', label: 'Valor da Conta' },
    { value: 'tipo_instalacao', label: 'Tipo de Instalação' },
    { value: 'tipo_telhado', label: 'Tipo de Telhado' },
    { value: 'forma_pagamento', label: 'Forma de Pagamento' },
    { value: 'cidade', label: 'Cidade' },
    { value: 'endereco', label: 'Endereço' },
  ];

  const renderGreetingEditor = () => {
    const data = node.data as GreetingNodeData;
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Nome do Nó</Label>
          <Input
            id="label"
            value={data.label || ''}
            onChange={(e) => updateField('label', e.target.value)}
            placeholder="Ex: Saudação Inicial"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensagem">Mensagem de Boas-vindas</Label>
          <Textarea
            id="mensagem"
            value={data.mensagem || ''}
            onChange={(e) => updateField('mensagem' as any, e.target.value)}
            placeholder="Olá! Bem-vindo à nossa empresa..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Use {'{nome}'} para personalizar com o nome do cliente
          </p>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <Label>Personalizar por Horário</Label>
            <p className="text-xs text-muted-foreground">
              Mensagens diferentes para manhã, tarde e noite
            </p>
          </div>
          <Switch
            checked={data.personalizarHorario || false}
            onCheckedChange={(checked) =>
              updateField('personalizarHorario' as any, checked)
            }
          />
        </div>

        {data.personalizarHorario && (
          <div className="space-y-3 rounded-lg bg-gray-50 p-3">
            <div className="space-y-2">
              <Label htmlFor="mensagemManha">Mensagem Manhã (6h-12h)</Label>
              <Textarea
                id="mensagemManha"
                value={data.mensagemManha || ''}
                onChange={(e) =>
                  updateField('mensagemManha' as any, e.target.value)
                }
                placeholder="Bom dia! Como posso ajudar?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensagemTarde">Mensagem Tarde (12h-18h)</Label>
              <Textarea
                id="mensagemTarde"
                value={data.mensagemTarde || ''}
                onChange={(e) =>
                  updateField('mensagemTarde' as any, e.target.value)
                }
                placeholder="Boa tarde! Como posso ajudar?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensagemNoite">Mensagem Noite (18h-6h)</Label>
              <Textarea
                id="mensagemNoite"
                value={data.mensagemNoite || ''}
                onChange={(e) =>
                  updateField('mensagemNoite' as any, e.target.value)
                }
                placeholder="Boa noite! Como posso ajudar?"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuestionEditor = () => {
    const data = node.data as QuestionNodeData;
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Nome do Nó</Label>
          <Input
            id="label"
            value={data.label || ''}
            onChange={(e) => updateField('label', e.target.value)}
            placeholder="Ex: Pergunta Nome"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pergunta">Texto da Pergunta</Label>
          <Textarea
            id="pergunta"
            value={data.pergunta || ''}
            onChange={(e) => updateField('pergunta' as any, e.target.value)}
            placeholder="Qual é o seu nome completo?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipoResposta">Tipo de Resposta</Label>
          <Select
            value={data.tipoResposta || 'texto'}
            onValueChange={(value) => updateField('tipoResposta' as any, value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="texto">Texto Livre</SelectItem>
              <SelectItem value="numero">Número</SelectItem>
              <SelectItem value="opcoes">Opções</SelectItem>
              <SelectItem value="sim_nao">Sim/Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.tipoResposta === 'opcoes' && (
          <div className="space-y-2">
            <Label>Opções (uma por linha)</Label>
            <Textarea
              value={(data.opcoes || []).join('\n')}
              onChange={(e) =>
                updateField(
                  'opcoes' as any,
                  e.target.value.split('\n').filter((o) => o.trim())
                )
              }
              placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
              rows={4}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="campoDestino">Salvar em Campo</Label>
          <Select
            value={data.campoDestino || '_none'}
            onValueChange={(value) =>
              updateField('campoDestino' as any, value === '_none' ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um campo (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Nenhum</SelectItem>
              {camposDestino.map((campo) => (
                <SelectItem key={campo.value} value={campo.value}>
                  {campo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Campo do lead onde a resposta será salva
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label>Pergunta Obrigatória</Label>
          <Switch
            checked={data.obrigatoria ?? true}
            onCheckedChange={(checked) =>
              updateField('obrigatoria' as any, checked)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxTentativas">Máx. Tentativas</Label>
          <Input
            id="maxTentativas"
            type="number"
            value={data.maxTentativas || 3}
            onChange={(e) =>
              updateField('maxTentativas' as any, parseInt(e.target.value) || 3)
            }
            min={1}
            max={10}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensagemErro">Mensagem de Erro</Label>
          <Textarea
            id="mensagemErro"
            value={data.mensagemErro || ''}
            onChange={(e) =>
              updateField('mensagemErro' as any, e.target.value)
            }
            placeholder="Desculpe, não entendi. Pode repetir?"
            rows={2}
          />
        </div>
      </div>
    );
  };

  const renderConsumoEditor = () => {
    const data = node.data as ConsumoNodeData;
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Nome do Nó</Label>
          <Input
            id="label"
            value={data.label || ''}
            onChange={(e) => updateField('label', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pergunta">Pergunta</Label>
          <Textarea
            id="pergunta"
            value={data.pergunta || ''}
            onChange={(e) => updateField('pergunta' as any, e.target.value)}
            placeholder="Qual seu consumo médio mensal?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unidade">Unidade</Label>
          <Select
            value={data.unidade || 'kWh'}
            onValueChange={(value) => updateField('unidade' as any, value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kWh">kWh (Consumo)</SelectItem>
              <SelectItem value="reais">R$ (Valor)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="validarMinimo">Mínimo</Label>
            <Input
              id="validarMinimo"
              type="number"
              value={data.validarMinimo || ''}
              onChange={(e) =>
                updateField(
                  'validarMinimo' as any,
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validarMaximo">Máximo</Label>
            <Input
              id="validarMaximo"
              type="number"
              value={data.validarMaximo || ''}
              onChange={(e) =>
                updateField(
                  'validarMaximo' as any,
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="50000"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderMessageEditor = () => {
    const data = node.data as MessageNodeData;
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Nome do Nó</Label>
          <Input
            id="label"
            value={data.label || ''}
            onChange={(e) => updateField('label', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensagem">Mensagem</Label>
          <Textarea
            id="mensagem"
            value={data.mensagem || ''}
            onChange={(e) => updateField('mensagem' as any, e.target.value)}
            placeholder="Digite a mensagem a ser enviada..."
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Aguardar Resposta</Label>
            <p className="text-xs text-muted-foreground">
              Espera o cliente responder antes de continuar
            </p>
          </div>
          <Switch
            checked={data.aguardarResposta || false}
            onCheckedChange={(checked) =>
              updateField('aguardarResposta' as any, checked)
            }
          />
        </div>

        {data.aguardarResposta && (
          <div className="space-y-2">
            <Label htmlFor="timeoutSegundos">Timeout (segundos)</Label>
            <Input
              id="timeoutSegundos"
              type="number"
              value={data.timeoutSegundos || 300}
              onChange={(e) =>
                updateField(
                  'timeoutSegundos' as any,
                  parseInt(e.target.value) || 300
                )
              }
              min={30}
              max={3600}
            />
          </div>
        )}
      </div>
    );
  };

  const renderContaLuzEditor = () => {
    const data = node.data as ContaLuzNodeData;
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Nome do Nó</Label>
          <Input
            id="label"
            value={data.label || ''}
            onChange={(e) => updateField('label', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensagemSolicitacao">Mensagem de Solicitação</Label>
          <Textarea
            id="mensagemSolicitacao"
            value={data.mensagemSolicitacao || ''}
            onChange={(e) =>
              updateField('mensagemSolicitacao' as any, e.target.value)
            }
            placeholder="Pode me enviar uma foto da sua conta de luz?"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Analisar Automaticamente</Label>
            <p className="text-xs text-muted-foreground">Usar IA para ler a conta</p>
          </div>
          <Switch
            checked={data.analisarAutomatico ?? true}
            onCheckedChange={(checked) =>
              updateField('analisarAutomatico' as any, checked)
            }
          />
        </div>

        {data.analisarAutomatico && (
          <>
            <div className="flex items-center justify-between">
              <Label>Extrair Consumo (kWh)</Label>
              <Switch
                checked={data.extrairConsumo ?? true}
                onCheckedChange={(checked) =>
                  updateField('extrairConsumo' as any, checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Extrair Valor (R$)</Label>
              <Switch
                checked={data.extrairValor ?? true}
                onCheckedChange={(checked) =>
                  updateField('extrairValor' as any, checked)
                }
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="timeoutSegundos">Timeout (segundos)</Label>
          <Input
            id="timeoutSegundos"
            type="number"
            value={data.timeoutSegundos || 300}
            onChange={(e) =>
              updateField('timeoutSegundos' as any, parseInt(e.target.value) || 300)
            }
            min={60}
            max={600}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensagemFallback">Mensagem Fallback</Label>
          <Textarea
            id="mensagemFallback"
            value={data.mensagemFallback || ''}
            onChange={(e) =>
              updateField('mensagemFallback' as any, e.target.value)
            }
            placeholder="Se não enviar a foto, qual mensagem enviar?"
            rows={2}
          />
        </div>
      </div>
    );
  };

  const renderHandoffEditor = () => {
    const data = node.data as HandoffNodeData;
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Nome do Nó</Label>
          <Input
            id="label"
            value={data.label || ''}
            onChange={(e) => updateField('label', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivo">Motivo da Transferência</Label>
          <Input
            id="motivo"
            value={data.motivo || ''}
            onChange={(e) => updateField('motivo' as any, e.target.value)}
            placeholder="Cliente solicitou atendimento humano"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensagemCliente">Mensagem para o Cliente</Label>
          <Textarea
            id="mensagemCliente"
            value={data.mensagemCliente || ''}
            onChange={(e) =>
              updateField('mensagemCliente' as any, e.target.value)
            }
            placeholder="Estou transferindo você para um especialista..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prioridade">Prioridade</Label>
          <Select
            value={data.prioridade || 'media'}
            onValueChange={(value) => updateField('prioridade' as any, value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label>Notificar Equipe</Label>
          <Switch
            checked={data.notificarEquipe ?? true}
            onCheckedChange={(checked) =>
              updateField('notificarEquipe' as any, checked)
            }
          />
        </div>
      </div>
    );
  };

  const renderDefaultEditor = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Nome do Nó</Label>
          <Input
            id="label"
            value={node.data.label || ''}
            onChange={(e) => updateField('label', e.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Editor específico para este tipo de nó em desenvolvimento.
        </p>
      </div>
    );
  };

  const renderEditor = () => {
    switch (node.type) {
      case 'GREETING':
        return renderGreetingEditor();
      case 'QUESTION':
        return renderQuestionEditor();
      case 'CONSUMO':
        return renderConsumoEditor();
      case 'MESSAGE':
        return renderMessageEditor();
      case 'CONTA_LUZ':
        return renderContaLuzEditor();
      case 'HANDOFF':
        return renderHandoffEditor();
      default:
        return renderDefaultEditor();
    }
  };

  const getNodeTitle = () => {
    switch (node.type) {
      case 'GREETING':
        return 'Editar Saudação';
      case 'QUESTION':
        return 'Editar Pergunta';
      case 'CONSUMO':
        return 'Editar Consumo';
      case 'MESSAGE':
        return 'Editar Mensagem';
      case 'CONTA_LUZ':
        return 'Editar Conta de Luz';
      case 'TELHADO':
        return 'Editar Foto Telhado';
      case 'HANDOFF':
        return 'Editar Transferência';
      case 'PROPOSTA':
        return 'Editar Proposta';
      case 'VISITA_TECNICA':
        return 'Editar Visita Técnica';
      case 'CONDITION':
        return 'Editar Condição';
      case 'FOLLOWUP':
        return 'Editar Follow-up';
      default:
        return 'Editar Nó';
    }
  };

  return (
    <div className="w-80 border-l bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-semibold">{getNodeTitle()}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4">{renderEditor()}</div>
      </ScrollArea>

      {/* Footer com botão de deletar */}
      <div className="border-t p-4">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => {
            if (confirm('Tem certeza que deseja excluir este nó?')) {
              onDelete(node.id);
              onClose();
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir Nó
        </Button>
      </div>
    </div>
  );
}
