"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  MessageSquare,
  Phone,
  Edit,
  Trash2,
  Calendar,
  Bot,
  Target,
  FileText,
  Plus,
  Send,
  Eye,
  DollarSign,
  Zap,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getContato,
  updateContato,
  deleteContato,
  toggleAtendimentoIA,
  ORIGENS,
  ETAPAS_QUALIFICACAO,
  formatarCelularExibicao,
} from "@/services/contatos";
import { getStatusLeads } from "@/services/status-leads";
import {
  getPropostasContato,
  createProposta,
  enviarProposta,
  deleteProposta,
  toggleAgenteProposta,
  STATUS_PROPOSTA,
  MARCAS_PAINEIS,
  MARCAS_INVERSORES,
  formatCurrency,
  calcularPayback,
} from "@/services/propostas";
import type { ContatoFotovoltaico, StatusLeadFotovoltaico, ContatoFormData, PropostaFotovoltaico, PropostaFormData } from "@/types/database";

export default function ContatoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const contatoId = parseInt(params.id as string);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [contato, setContato] = React.useState<ContatoFotovoltaico | null>(null);
  const [statusLeads, setStatusLeads] = React.useState<StatusLeadFotovoltaico[]>([]);
  const [togglingIA, setTogglingIA] = React.useState(false);

  // Form state for editing
  const [formData, setFormData] = React.useState<Partial<ContatoFormData>>({});

  // Propostas state
  const [propostas, setPropostas] = React.useState<PropostaFotovoltaico[]>([]);
  const [loadingPropostas, setLoadingPropostas] = React.useState(false);
  const [propostaModalOpen, setPropostaModalOpen] = React.useState(false);
  const [savingProposta, setSavingProposta] = React.useState(false);
  const [propostaSuccess, setPropostaSuccess] = React.useState<string | null>(null);
  const [propostaError, setPropostaError] = React.useState<string | null>(null);
  const [propostaFormData, setPropostaFormData] = React.useState<Partial<PropostaFormData>>({
    valor_total: undefined,
    potencia_kwp: undefined,
    quantidade_paineis: undefined,
    marca_paineis: '',
    marca_inversor: '',
    economia_mensal: undefined,
    agente_proposta_ativo: true,
  });

  // Carregar dados
  React.useEffect(() => {
    async function loadData() {
      if (isNaN(contatoId)) {
        router.push("/dashboard/contatos");
        return;
      }

      setLoading(true);
      try {
        const [contatoResult, statusResult] = await Promise.all([
          getContato(contatoId),
          getStatusLeads(),
        ]);

        if (contatoResult.success && contatoResult.data) {
          setContato(contatoResult.data);
          setFormData({
            nome: contatoResult.data.nome,
            celular: contatoResult.data.celular,
            potencia_consumo_medio: contatoResult.data.potencia_consumo_medio || "",
            origem: contatoResult.data.origem || "manual",
            status_lead_id: contatoResult.data.status_lead_id || 1,
            observacoes_status: contatoResult.data.observacoes_status || "",
          });
        } else {
          router.push("/dashboard/contatos");
          return;
        }

        if (statusResult.success && statusResult.data) {
          setStatusLeads(statusResult.data);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        router.push("/dashboard/contatos");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [contatoId, router]);

  // Carregar propostas
  const loadPropostas = React.useCallback(async () => {
    if (isNaN(contatoId)) return;

    setLoadingPropostas(true);
    try {
      const result = await getPropostasContato(contatoId);
      if (result.success && result.data) {
        setPropostas(result.data);
      }
    } catch (error) {
      console.error("Erro ao carregar propostas:", error);
    } finally {
      setLoadingPropostas(false);
    }
  }, [contatoId]);

  React.useEffect(() => {
    if (contato) {
      loadPropostas();
    }
  }, [contato, loadPropostas]);

  // Handle input changes
  const handleChange = (field: keyof ContatoFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle toggle IA
  const handleToggleIA = async (novoStatus: boolean) => {
    if (!contato) return;

    setTogglingIA(true);
    try {
      const result = await toggleAtendimentoIA(contato.id, novoStatus);
      if (result.success) {
        setContato((prev) => prev ? { ...prev, atendimento_automatico: novoStatus } : null);
      } else {
        alert("Erro ao alterar status da IA: " + result.error);
      }
    } finally {
      setTogglingIA(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!contato) return;

    setSaving(true);
    try {
      const result = await updateContato(contato.id, formData);

      if (result.success && result.data) {
        setContato(result.data);
        setIsEditing(false);
      } else {
        alert("Erro ao atualizar contato: " + result.error);
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar contato");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!contato) return;

    if (!confirm("Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const result = await deleteContato(contato.id);
      if (result.success) {
        router.push("/dashboard/contatos");
      } else {
        alert("Erro ao excluir contato: " + result.error);
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir contato");
    }
  };

  // Handle nova proposta
  const handleNovaProposta = () => {
    setPropostaFormData({
      valor_total: undefined,
      potencia_kwp: undefined,
      quantidade_paineis: undefined,
      marca_paineis: '',
      marca_inversor: '',
      economia_mensal: undefined,
      agente_proposta_ativo: true,
    });
    setPropostaError(null);
    setPropostaSuccess(null);
    setPropostaModalOpen(true);
  };

  // Handle criar proposta
  const handleCriarProposta = async () => {
    if (!user?.id || !contato) return;

    setSavingProposta(true);
    setPropostaError(null);

    try {
      // Montar snapshot dos dados do lead
      const dadosSnapshot = {
        nome: contato.nome,
        celular: contato.celular,
        potencia_consumo_medio: contato.potencia_consumo_medio,
        origem: contato.origem,
        dados_coletados: contato.dados_coletados,
      };

      // Calcular payback se tiver os dados
      let paybackMeses = propostaFormData.payback_meses;
      if (!paybackMeses && propostaFormData.valor_total && propostaFormData.economia_mensal) {
        paybackMeses = calcularPayback(propostaFormData.valor_total, propostaFormData.economia_mensal);
      }

      const result = await createProposta(user.id, {
        id_contato: contato.id,
        valor_total: propostaFormData.valor_total,
        potencia_kwp: propostaFormData.potencia_kwp,
        quantidade_paineis: propostaFormData.quantidade_paineis,
        marca_paineis: propostaFormData.marca_paineis,
        marca_inversor: propostaFormData.marca_inversor,
        economia_mensal: propostaFormData.economia_mensal,
        payback_meses: paybackMeses,
        dados_lead_snapshot: dadosSnapshot,
        agente_proposta_ativo: propostaFormData.agente_proposta_ativo,
      });

      if (result.success) {
        setPropostaSuccess("Proposta criada com sucesso!");
        loadPropostas();
        setTimeout(() => {
          setPropostaModalOpen(false);
          setPropostaSuccess(null);
        }, 1500);
      } else {
        setPropostaError(result.error || "Erro ao criar proposta");
      }
    } catch (error) {
      console.error("Erro ao criar proposta:", error);
      setPropostaError("Erro ao criar proposta");
    } finally {
      setSavingProposta(false);
    }
  };

  // Handle enviar proposta
  const handleEnviarProposta = async (propostaId: number) => {
    try {
      const result = await enviarProposta(propostaId);
      if (result.success) {
        loadPropostas();
      } else {
        alert("Erro ao enviar proposta: " + result.error);
      }
    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Erro ao enviar proposta");
    }
  };

  // Handle deletar proposta
  const handleDeletarProposta = async (propostaId: number) => {
    if (!confirm("Tem certeza que deseja excluir esta proposta?")) return;

    try {
      const result = await deleteProposta(propostaId);
      if (result.success) {
        setPropostas((prev) => prev.filter((p) => p.id !== propostaId));
      } else {
        alert("Erro ao excluir proposta: " + result.error);
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir proposta");
    }
  };

  // Handle toggle agente proposta
  const handleToggleAgenteProposta = async (propostaId: number, ativo: boolean) => {
    try {
      const result = await toggleAgenteProposta(propostaId, ativo);
      if (result.success) {
        setPropostas((prev) =>
          prev.map((p) =>
            p.id === propostaId ? { ...p, agente_proposta_ativo: ativo } : p
          )
        );
      }
    } catch (error) {
      console.error("Erro ao toggle agente:", error);
    }
  };

  // Format date
  const formatDate = (date: Date | string | null): string => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status info
  const getStatus = () => {
    if (!contato?.status_lead_id) return null;
    return statusLeads.find((s) => s.id === contato.status_lead_id);
  };

  // Get etapa info
  const getEtapa = () => {
    if (!contato?.etapa_atual) return ETAPAS_QUALIFICACAO[0];
    return ETAPAS_QUALIFICACAO.find((e) => e.numero === contato.etapa_atual) || ETAPAS_QUALIFICACAO[0];
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
          <p className="text-muted-foreground">Carregando contato...</p>
        </div>
      </div>
    );
  }

  if (!contato) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Contato não encontrado</p>
      </div>
    );
  }

  const status = getStatus();
  const etapa = getEtapa();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/contatos">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {contato.nome}
              </h1>
              {contato.etapa_atual === 1 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Contato inicial
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {formatarCelularExibicao(contato.celular)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a
              href={`https://wa.me/55${contato.celular.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageSquare className="mr-2 h-4 w-4 text-green-600" />
              WhatsApp
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`tel:${contato.celular}`}>
              <Phone className="mr-2 h-4 w-4 text-blue-600" />
              Ligar
            </a>
          </Button>
          {!isEditing ? (
            <Button variant="solar" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button variant="solar" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados do Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        value={formData.nome || ""}
                        onChange={(e) => handleChange("nome", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="celular">Celular</Label>
                      <Input
                        id="celular"
                        value={formData.celular || ""}
                        onChange={(e) => handleChange("celular", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="consumo">Consumo Médio (kWh)</Label>
                      <Input
                        id="consumo"
                        value={formData.potencia_consumo_medio || ""}
                        onChange={(e) => handleChange("potencia_consumo_medio", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="origem">Origem</Label>
                      <Select
                        value={formData.origem}
                        onValueChange={(value) => handleChange("origem", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORIGENS.map((origem) => (
                            <SelectItem key={origem.value} value={origem.value}>
                              {origem.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status_lead_id?.toString()}
                      onValueChange={(value) => handleChange("status_lead_id", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusLeads.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: s.cor }}
                              />
                              {s.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes_status || ""}
                      onChange={(e) => handleChange("observacoes_status", e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{contato.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Celular</p>
                    <p className="font-medium">{formatarCelularExibicao(contato.celular)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Consumo Médio</p>
                    <p className="font-medium">{contato.potencia_consumo_medio || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Origem</p>
                    <p className="font-medium capitalize">{contato.origem || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {status ? (
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${status.cor}20`,
                          color: status.cor,
                          borderColor: status.cor,
                        }}
                      >
                        {status.nome}
                      </Badge>
                    ) : (
                      <p className="font-medium">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cadastrado em</p>
                    <p className="font-medium">{formatDate(contato.created_on)}</p>
                  </div>
                  {contato.observacoes_status && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p className="font-medium">{contato.observacoes_status}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados Coletados */}
          {contato.dados_coletados && Object.keys(contato.dados_coletados).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Dados Coletados
                </CardTitle>
                <CardDescription>
                  Informações coletadas durante a qualificação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(contato.dados_coletados as Record<string, unknown>).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Propostas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-solar-500" />
                  Propostas
                </CardTitle>
                <Button variant="solar" size="sm" onClick={handleNovaProposta}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Proposta
                </Button>
              </div>
              <CardDescription>
                Propostas enviadas para este lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPropostas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-solar-500" />
                </div>
              ) : propostas.length > 0 ? (
                <div className="space-y-3">
                  {propostas.map((proposta) => {
                    const statusInfo = STATUS_PROPOSTA.find((s) => s.value === proposta.status);
                    return (
                      <div
                        key={proposta.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{proposta.numero_proposta}</p>
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: `${statusInfo?.cor}20`,
                                color: statusInfo?.cor,
                                borderColor: statusInfo?.cor,
                              }}
                            >
                              {statusInfo?.label}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            {proposta.valor_total && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(proposta.valor_total)}
                              </span>
                            )}
                            {proposta.potencia_kwp && (
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {proposta.potencia_kwp} kWp
                              </span>
                            )}
                            {proposta.payback_meses && (
                              <span>Payback: {proposta.payback_meses} meses</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {proposta.status === 'rascunho' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEnviarProposta(proposta.id)}
                            >
                              <Send className="mr-1 h-3 w-3" />
                              Enviar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletarProposta(proposta.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma proposta criada ainda
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleNovaProposta}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Proposta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Atendimento IA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Atendimento IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Status da IA</p>
                  <p className="text-sm text-muted-foreground">
                    {contato.atendimento_automatico
                      ? "IA ativa para este contato"
                      : "IA desativada para este contato"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={contato.atendimento_automatico ?? true}
                    onCheckedChange={handleToggleIA}
                    disabled={togglingIA}
                  />
                  {togglingIA && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Etapa de Qualificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Qualificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Etapa Atual</p>
                <p className="font-medium">{etapa.nome}</p>
                <p className="text-xs text-muted-foreground">{etapa.descricao}</p>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{contato.etapa_atual || 1}/{ETAPAS_QUALIFICACAO.length}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-solar-500 transition-all"
                    style={{
                      width: `${((contato.etapa_atual || 1) / ETAPAS_QUALIFICACAO.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Cadastrado em</p>
                <p className="font-medium">{formatDate(contato.created_on)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última atualização</p>
                <p className="font-medium">{formatDate(contato.last_update)}</p>
              </div>
              {contato.ultimo_follow && (
                <div>
                  <p className="text-sm text-muted-foreground">Último follow-up</p>
                  <p className="font-medium">{formatDate(contato.ultimo_follow)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Contato
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Nova Proposta */}
      <Dialog open={propostaModalOpen} onOpenChange={setPropostaModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-solar-500" />
              Nova Proposta
            </DialogTitle>
            <DialogDescription>
              Crie uma proposta para {contato.nome}
            </DialogDescription>
          </DialogHeader>

          {/* Mensagens de feedback */}
          {propostaError && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4" />
              {propostaError}
            </div>
          )}

          {propostaSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle className="h-4 w-4" />
              {propostaSuccess}
            </div>
          )}

          <div className="grid gap-4 py-4">
            {/* Linha 1: Valor e Potência */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valor_total">Valor Total (R$)</Label>
                <Input
                  id="valor_total"
                  type="number"
                  placeholder="Ex: 35000"
                  value={propostaFormData.valor_total || ''}
                  onChange={(e) =>
                    setPropostaFormData((prev) => ({
                      ...prev,
                      valor_total: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="potencia_kwp">Potência (kWp)</Label>
                <Input
                  id="potencia_kwp"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 5.5"
                  value={propostaFormData.potencia_kwp || ''}
                  onChange={(e) =>
                    setPropostaFormData((prev) => ({
                      ...prev,
                      potencia_kwp: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
            </div>

            {/* Linha 2: Painéis e Marca */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantidade_paineis">Qtd. Painéis</Label>
                <Input
                  id="quantidade_paineis"
                  type="number"
                  placeholder="Ex: 10"
                  value={propostaFormData.quantidade_paineis || ''}
                  onChange={(e) =>
                    setPropostaFormData((prev) => ({
                      ...prev,
                      quantidade_paineis: e.target.value ? parseInt(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marca_paineis">Marca dos Painéis</Label>
                <Select
                  value={propostaFormData.marca_paineis || ''}
                  onValueChange={(value) =>
                    setPropostaFormData((prev) => ({ ...prev, marca_paineis: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARCAS_PAINEIS.map((marca) => (
                      <SelectItem key={marca} value={marca}>
                        {marca}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 3: Inversor e Economia */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="marca_inversor">Marca do Inversor</Label>
                <Select
                  value={propostaFormData.marca_inversor || ''}
                  onValueChange={(value) =>
                    setPropostaFormData((prev) => ({ ...prev, marca_inversor: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARCAS_INVERSORES.map((marca) => (
                      <SelectItem key={marca} value={marca}>
                        {marca}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="economia_mensal">Economia Mensal (R$)</Label>
                <Input
                  id="economia_mensal"
                  type="number"
                  placeholder="Ex: 500"
                  value={propostaFormData.economia_mensal || ''}
                  onChange={(e) =>
                    setPropostaFormData((prev) => ({
                      ...prev,
                      economia_mensal: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
            </div>

            {/* Payback calculado */}
            {propostaFormData.valor_total && propostaFormData.economia_mensal && (
              <div className="rounded-lg bg-solar-50 p-4">
                <p className="text-sm text-solar-700">
                  <strong>Payback estimado:</strong>{' '}
                  {calcularPayback(propostaFormData.valor_total, propostaFormData.economia_mensal)} meses
                  ({(calcularPayback(propostaFormData.valor_total, propostaFormData.economia_mensal) / 12).toFixed(1)} anos)
                </p>
              </div>
            )}

            {/* Toggle Agente */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Ativar Agente de Proposta (GPT-4.1)</Label>
                <p className="text-sm text-muted-foreground">
                  O agente conversará com o lead sobre esta proposta
                </p>
              </div>
              <Switch
                checked={propostaFormData.agente_proposta_ativo ?? true}
                onCheckedChange={(checked) =>
                  setPropostaFormData((prev) => ({ ...prev, agente_proposta_ativo: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPropostaModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="solar" onClick={handleCriarProposta} disabled={savingProposta}>
              {savingProposta ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Criar Proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
