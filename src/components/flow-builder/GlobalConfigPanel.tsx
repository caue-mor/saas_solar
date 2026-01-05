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
import { X, Bot, Clock, MessageSquare, Settings } from 'lucide-react';
import type { GlobalConfig } from '@/types/flow.types';

interface GlobalConfigPanelProps {
  config: GlobalConfig;
  onChange: (config: GlobalConfig) => void;
  onClose: () => void;
}

export function GlobalConfigPanel({
  config,
  onChange,
  onClose,
}: GlobalConfigPanelProps) {
  // Helper para atualizar configuração aninhada
  const updateConfig = <K extends keyof GlobalConfig>(
    key: K,
    value: Partial<GlobalConfig[K]>
  ) => {
    const currentValue = config[key];
    onChange({
      ...config,
      [key]: { ...(currentValue as object), ...value },
    });
  };

  return (
    <div className="w-80 border-l bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-solar-500" />
          <h2 className="font-semibold">Configurações</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="space-y-6 p-4">
          {/* Configurações do Agente */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Agente IA</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="agentName">Nome do Agente</Label>
                <Input
                  id="agentName"
                  value={config.agente.nome}
                  onChange={(e) =>
                    updateConfig('agente', { nome: e.target.value })
                  }
                  placeholder="Ex: Assistente Solar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personality">Personalidade</Label>
                <Select
                  value={config.agente.personalidade}
                  onValueChange={(value) =>
                    updateConfig('agente', {
                      personalidade: value as GlobalConfig['agente']['personalidade'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="amigavel">Amigável</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="consultivo">Consultivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tomVoz">Tom de Voz</Label>
                <Select
                  value={config.agente.tomVoz}
                  onValueChange={(value) =>
                    updateConfig('agente', {
                      tomVoz: value as GlobalConfig['agente']['tomVoz'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="informal">Informal</SelectItem>
                    <SelectItem value="neutro">Neutro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="emojis">Usar Emojis</Label>
                <Switch
                  id="emojis"
                  checked={config.agente.usarEmojis}
                  onCheckedChange={(checked) =>
                    updateConfig('agente', { usarEmojis: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Horário de Atendimento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Horário de Atendimento</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="horarioAtivo">Respeitar horário</Label>
                <Switch
                  id="horarioAtivo"
                  checked={config.horario.ativo}
                  onCheckedChange={(checked) =>
                    updateConfig('horario', { ativo: checked })
                  }
                />
              </div>

              {config.horario.ativo && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="horaInicio">Início</Label>
                      <Input
                        id="horaInicio"
                        type="time"
                        value={config.horario.horaInicio}
                        onChange={(e) =>
                          updateConfig('horario', { horaInicio: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="horaFim">Fim</Label>
                      <Input
                        id="horaFim"
                        type="time"
                        value={config.horario.horaFim}
                        onChange={(e) =>
                          updateConfig('horario', { horaFim: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="responderFora">Responder fora do horário</Label>
                    <Switch
                      id="responderFora"
                      checked={config.horario.responderForaHorario}
                      onCheckedChange={(checked) =>
                        updateConfig('horario', { responderForaHorario: checked })
                      }
                    />
                  </div>

                  {config.horario.responderForaHorario && (
                    <div className="space-y-2">
                      <Label htmlFor="msgFora">Mensagem fora do horário</Label>
                      <Textarea
                        id="msgFora"
                        value={config.horario.mensagemForaHorario || ''}
                        onChange={(e) =>
                          updateConfig('horario', {
                            mensagemForaHorario: e.target.value,
                          })
                        }
                        placeholder="Mensagem para enviar fora do horário..."
                        rows={2}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Follow-up */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Follow-up Automático</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="followupAtivo">Ativar follow-up</Label>
                <Switch
                  id="followupAtivo"
                  checked={config.followup.ativo}
                  onCheckedChange={(checked) =>
                    updateConfig('followup', { ativo: checked })
                  }
                />
              </div>

              {config.followup.ativo && (
                <>
                  <div className="space-y-2">
                    <Label>Intervalos (horas)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">1º</Label>
                        <Input
                          type="number"
                          value={config.followup.intervaloPrimeiro}
                          onChange={(e) =>
                            updateConfig('followup', {
                              intervaloPrimeiro: parseInt(e.target.value) || 24,
                            })
                          }
                          min={1}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">2º</Label>
                        <Input
                          type="number"
                          value={config.followup.intervaloSegundo}
                          onChange={(e) =>
                            updateConfig('followup', {
                              intervaloSegundo: parseInt(e.target.value) || 48,
                            })
                          }
                          min={1}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">3º</Label>
                        <Input
                          type="number"
                          value={config.followup.intervaloTerceiro}
                          onChange={(e) =>
                            updateConfig('followup', {
                              intervaloTerceiro: parseInt(e.target.value) || 72,
                            })
                          }
                          min={1}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="pararSeResponder">Parar se responder</Label>
                    <Switch
                      id="pararSeResponder"
                      checked={config.followup.pararSeResponder}
                      onCheckedChange={(checked) =>
                        updateConfig('followup', { pararSeResponder: checked })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Integrações */}
          <div className="space-y-4">
            <h3 className="font-medium">Integrações</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Análise de Imagens (Vision)</Label>
                  <p className="text-xs text-muted-foreground">
                    Analisar contas de luz e telhados
                  </p>
                </div>
                <Switch
                  checked={config.integracoes.visionAtivo}
                  onCheckedChange={(checked) =>
                    updateConfig('integracoes', { visionAtivo: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Transcrição de Áudio (STT)</Label>
                  <p className="text-xs text-muted-foreground">
                    Converter áudios em texto
                  </p>
                </div>
                <Switch
                  checked={config.integracoes.sttAtivo}
                  onCheckedChange={(checked) =>
                    updateConfig('integracoes', { sttAtivo: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Instruções Customizadas */}
          <div className="space-y-3">
            <Label htmlFor="instrucoes">Instruções Adicionais</Label>
            <Textarea
              id="instrucoes"
              value={config.instrucoes}
              onChange={(e) => onChange({ ...config, instrucoes: e.target.value })}
              placeholder="Instruções personalizadas para o agente..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Adicione instruções específicas que o agente deve seguir
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
