"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  Shield,
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  Instagram,
  Clock,
  CreditCard,
  FileText,
  RefreshCw,
  Bell,
  Play,
  Pause,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import {
  getEmpresaData,
  updateEmpresaBasicData,
  getPerfilCompletude,
  updateFollowUpConfig,
  toggleFollowUp,
  type FollowUpConfig,
} from "@/services/empresa";
import type { AcessoFotovoltaico, CompanyFormData } from "@/types/database";

export default function EmpresaPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [empresa, setEmpresa] = React.useState<AcessoFotovoltaico | null>(null);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingFollowUp, setSavingFollowUp] = React.useState(false);

  // Follow-up config state
  const [followUpConfig, setFollowUpConfig] = React.useState<FollowUpConfig>({
    followup_ativo: false,
    intervalo_follow_1: 24,
    intervalo_follow_2: 48,
    intervalo_follow_3: 72,
    janela_ativa_horas: 12,
    max_tentativas_por_ciclo: 3,
  });

  // Form state
  const [formData, setFormData] = React.useState<CompanyFormData>({
    nome_atendente: "",
    nome_empresa: "",
    endereco_completo: "",
    cidade: "",
    link_google_maps: "",
    horario_funcionamento: "",
    fuso_horario: "",
    site_empresa: "",
    instagram_empresa: "",
    formas_pagamento: "",
    garantia_pos_venda: "",
    informacoes_complementares: "",
  });

  // Carregar dados da empresa
  React.useEffect(() => {
    async function loadEmpresa() {
      if (!user?.id) return;

      setLoading(true);
      const result = await getEmpresaData(user.id);

      if (result.success && result.data) {
        setEmpresa(result.data);
        setFormData({
          nome_atendente: result.data.nome_atendente || "",
          nome_empresa: result.data.nome_empresa || "",
          endereco_completo: result.data.endereco_completo || "",
          cidade: result.data.cidade || "",
          link_google_maps: result.data.link_google_maps || "",
          horario_funcionamento: result.data.horario_funcionamento || "",
          fuso_horario: result.data.fuso_horario || "",
          site_empresa: result.data.site_empresa || "",
          instagram_empresa: result.data.instagram_empresa || "",
          formas_pagamento: result.data.formas_pagamento || "",
          garantia_pos_venda: result.data.garantia_pos_venda || "",
          informacoes_complementares: result.data.informacoes_complementares || "",
        });
        // Carregar config de follow-up
        setFollowUpConfig({
          followup_ativo: result.data.followup_ativo || false,
          intervalo_follow_1: result.data.intervalo_follow_1 || 24,
          intervalo_follow_2: result.data.intervalo_follow_2 || 48,
          intervalo_follow_3: result.data.intervalo_follow_3 || 72,
          janela_ativa_horas: result.data.janela_ativa_horas || 12,
          max_tentativas_por_ciclo: result.data.max_tentativas_por_ciclo || 3,
        });
      }

      setLoading(false);
    }

    loadEmpresa();
  }, [user?.id]);

  // Salvar dados
  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setMessage(null);

    const result = await updateEmpresaBasicData(user.id, formData);

    if (result.success) {
      setEmpresa(result.data || null);
      setMessage({ type: 'success', text: 'Dados salvos com sucesso!' });
      refreshUser(); // Atualizar contexto de auth
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao salvar dados' });
    }

    setSaving(false);

    // Limpar mensagem após 3s
    setTimeout(() => setMessage(null), 3000);
  };

  // Atualizar campo do formulário
  const updateField = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Toggle Follow-up ativo
  const handleToggleFollowUp = async () => {
    if (!user?.id) return;

    setSavingFollowUp(true);
    setMessage(null);

    const novoStatus = !followUpConfig.followup_ativo;
    const result = await toggleFollowUp(user.id, novoStatus);

    if (result.success) {
      setFollowUpConfig(prev => ({ ...prev, followup_ativo: novoStatus }));
      setEmpresa(result.data || null);
      setMessage({
        type: 'success',
        text: novoStatus ? 'Follow-up ativado! Processamento inicia para leads a partir de agora.' : 'Follow-up desativado.'
      });
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao alterar follow-up' });
    }

    setSavingFollowUp(false);
    setTimeout(() => setMessage(null), 3000);
  };

  // Salvar configurações de follow-up
  const handleSaveFollowUp = async () => {
    if (!user?.id) return;

    setSavingFollowUp(true);
    setMessage(null);

    const result = await updateFollowUpConfig(user.id, followUpConfig);

    if (result.success) {
      setEmpresa(result.data || null);
      setMessage({ type: 'success', text: 'Configurações de follow-up salvas!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao salvar configurações' });
    }

    setSavingFollowUp(false);
    setTimeout(() => setMessage(null), 3000);
  };

  // Atualizar campo de follow-up
  const updateFollowUpField = (field: keyof FollowUpConfig, value: number | boolean) => {
    setFollowUpConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
        <span className="ml-2 text-muted-foreground">Carregando dados...</span>
      </div>
    );
  }

  const completude = empresa ? getPerfilCompletude(empresa) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Dados da Empresa
          </h1>
          <p className="text-muted-foreground">
            Gerencie as informações da sua empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={completude === 100 ? "default" : "secondary"} className={completude === 100 ? "bg-green-500" : ""}>
            {completude}% completo
          </Badge>
        </div>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`flex items-center gap-2 rounded-md p-3 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800'
            : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <Tabs defaultValue="dados" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dados">
            <Building2 className="mr-2 h-4 w-4" />
            Dados
          </TabsTrigger>
          <TabsTrigger value="contato">
            <Phone className="mr-2 h-4 w-4" />
            Contato
          </TabsTrigger>
          <TabsTrigger value="comercial">
            <CreditCard className="mr-2 h-4 w-4" />
            Comercial
          </TabsTrigger>
          <TabsTrigger value="followup">
            <RefreshCw className="mr-2 h-4 w-4" />
            Follow-up
          </TabsTrigger>
          <TabsTrigger value="seguranca">
            <Shield className="mr-2 h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* Dados Tab */}
        <TabsContent value="dados" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Status do Perfil */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Perfil</CardTitle>
                <CardDescription>
                  Completude das informações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="relative h-32 w-32">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="stroke-muted"
                        strokeWidth="10"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="stroke-solar-500 transition-all duration-500"
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                        strokeDasharray={`${completude * 2.51} 251`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{completude}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {completude < 100
                    ? "Complete seu perfil para melhor atendimento"
                    : "Perfil completo!"}
                </div>
              </CardContent>
            </Card>

            {/* Informações Básicas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Dados principais da empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome_empresa">
                      <Building2 className="mr-2 inline h-4 w-4" />
                      Nome da Empresa
                    </Label>
                    <Input
                      id="nome_empresa"
                      value={formData.nome_empresa}
                      onChange={(e) => updateField('nome_empresa', e.target.value)}
                      placeholder="Solar Tech Energia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_atendente">
                      <User className="mr-2 inline h-4 w-4" />
                      Nome do Atendente/Responsável
                    </Label>
                    <Input
                      id="nome_atendente"
                      value={formData.nome_atendente}
                      onChange={(e) => updateField('nome_atendente', e.target.value)}
                      placeholder="João Silva"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">
                      <MapPin className="mr-2 inline h-4 w-4" />
                      Cidade de Atuação
                    </Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => updateField('cidade', e.target.value)}
                      placeholder="São Paulo - SP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuso_horario">
                      <Clock className="mr-2 inline h-4 w-4" />
                      Fuso Horário
                    </Label>
                    <Select
                      value={formData.fuso_horario}
                      onValueChange={(v) => updateField('fuso_horario', v)}
                    >
                      <SelectTrigger id="fuso_horario">
                        <SelectValue placeholder="Selecione o fuso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                        <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                        <SelectItem value="America/Cuiaba">Cuiabá (GMT-4)</SelectItem>
                        <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                        <SelectItem value="America/Noronha">Noronha (GMT-2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco_completo">
                    <MapPin className="mr-2 inline h-4 w-4" />
                    Endereço Completo
                  </Label>
                  <Textarea
                    id="endereco_completo"
                    value={formData.endereco_completo}
                    onChange={(e) => updateField('endereco_completo', e.target.value)}
                    placeholder="Rua Example, 123 - Bairro - Cidade/UF - CEP"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link_google_maps">Link do Google Maps</Label>
                  <Input
                    id="link_google_maps"
                    value={formData.link_google_maps}
                    onChange={(e) => updateField('link_google_maps', e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="solar" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar Dados
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Horário de Funcionamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horário de Funcionamento
              </CardTitle>
              <CardDescription>
                Informações sobre seu horário de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="horario_funcionamento">
                  Descreva seu horário de funcionamento
                </Label>
                <Textarea
                  id="horario_funcionamento"
                  value={formData.horario_funcionamento}
                  onChange={(e) => updateField('horario_funcionamento', e.target.value)}
                  placeholder="Segunda a Sexta: 8h às 18h&#10;Sábado: 8h às 12h&#10;Domingo: Fechado"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="solar" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Horário
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Contato Tab */}
        <TabsContent value="contato" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contato e Redes Sociais</CardTitle>
              <CardDescription>
                Informações de contato da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site_empresa" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="site_empresa"
                    value={formData.site_empresa}
                    onChange={(e) => updateField('site_empresa', e.target.value)}
                    placeholder="https://www.empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram_empresa" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram_empresa"
                    value={formData.instagram_empresa}
                    onChange={(e) => updateField('instagram_empresa', e.target.value)}
                    placeholder="@empresa"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium text-sm mb-2">Dados do cadastro:</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{empresa?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span>{empresa?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cadastrado em:</span>
                    <span>{empresa?.created_at ? new Date(empresa.created_at).toLocaleDateString('pt-BR') : '-'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="solar" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Contato
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Comercial Tab */}
        <TabsContent value="comercial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informações Comerciais
              </CardTitle>
              <CardDescription>
                Dados usados pela IA para informar clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formas_pagamento">
                  <CreditCard className="mr-2 inline h-4 w-4" />
                  Formas de Pagamento
                </Label>
                <Textarea
                  id="formas_pagamento"
                  value={formData.formas_pagamento}
                  onChange={(e) => updateField('formas_pagamento', e.target.value)}
                  placeholder="• PIX&#10;• Cartão de crédito em até 12x&#10;• Boleto bancário&#10;• Financiamento em até 60x"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="garantia_pos_venda">
                  <Shield className="mr-2 inline h-4 w-4" />
                  Garantia e Pós-Venda
                </Label>
                <Textarea
                  id="garantia_pos_venda"
                  value={formData.garantia_pos_venda}
                  onChange={(e) => updateField('garantia_pos_venda', e.target.value)}
                  placeholder="• 25 anos de garantia nos módulos&#10;• 10 anos no inversor&#10;• Monitoramento 24/7&#10;• Suporte técnico permanente"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="informacoes_complementares">
                  <FileText className="mr-2 inline h-4 w-4" />
                  Informações Complementares
                </Label>
                <Textarea
                  id="informacoes_complementares"
                  value={formData.informacoes_complementares}
                  onChange={(e) => updateField('informacoes_complementares', e.target.value)}
                  placeholder="Outras informações relevantes sobre sua empresa que a IA deve saber..."
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="solar" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Informações
              </Button>
            </CardFooter>
          </Card>

          {/* Status do Plano */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Plano</CardTitle>
              <CardDescription>
                Informações sobre sua assinatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{empresa?.produto_plano || 'Sem plano'}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {empresa?.status_plano || 'pendente'}
                  </p>
                </div>
                <Badge
                  variant={empresa?.status_plano === 'ativo' ? 'default' : 'secondary'}
                  className={empresa?.status_plano === 'ativo' ? 'bg-green-500' : ''}
                >
                  {empresa?.status_plano === 'ativo' ? 'Ativo' : 'Pendente'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-up Tab */}
        <TabsContent value="followup" className="space-y-6">
          {/* Status e Toggle Principal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Follow-up Automático
                  </CardTitle>
                  <CardDescription>
                    Envie mensagens automáticas para leads que não responderam
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={followUpConfig.followup_ativo ? 'default' : 'secondary'}
                    className={followUpConfig.followup_ativo ? 'bg-green-500' : ''}
                  >
                    {followUpConfig.followup_ativo ? (
                      <><Play className="mr-1 h-3 w-3" /> Ativo</>
                    ) : (
                      <><Pause className="mr-1 h-3 w-3" /> Desativado</>
                    )}
                  </Badge>
                  <Switch
                    checked={followUpConfig.followup_ativo}
                    onCheckedChange={handleToggleFollowUp}
                    disabled={savingFollowUp}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4 text-sm">
                <h4 className="font-medium mb-2">Como funciona:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Follow-up só é enviado para leads que interagiram após a ativação</li>
                  <li>• Não envia durante conversa ativa (lead mandou msg nos últimos 30 min)</li>
                  <li>• Não envia para leads com IA desativada</li>
                  <li>• Não envia para leads com proposta enviada ou fechados</li>
                  <li>• Respeita o horário comercial configurado</li>
                </ul>
              </div>
              {empresa?.followup_habilitado_em && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Última ativação: {new Date(empresa.followup_habilitado_em).toLocaleString('pt-BR')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Configurações de Intervalos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Intervalos de Follow-up
              </CardTitle>
              <CardDescription>
                Configure o tempo de espera entre cada tentativa de follow-up
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="intervalo_follow_1">
                    1º Follow-up (horas)
                  </Label>
                  <Input
                    id="intervalo_follow_1"
                    type="number"
                    min={1}
                    max={168}
                    value={followUpConfig.intervalo_follow_1}
                    onChange={(e) => updateFollowUpField('intervalo_follow_1', parseInt(e.target.value) || 24)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo após última msg do lead
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervalo_follow_2">
                    2º Follow-up (horas)
                  </Label>
                  <Input
                    id="intervalo_follow_2"
                    type="number"
                    min={1}
                    max={336}
                    value={followUpConfig.intervalo_follow_2}
                    onChange={(e) => updateFollowUpField('intervalo_follow_2', parseInt(e.target.value) || 48)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo após 1º follow-up
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervalo_follow_3">
                    3º Follow-up (horas)
                  </Label>
                  <Input
                    id="intervalo_follow_3"
                    type="number"
                    min={1}
                    max={504}
                    value={followUpConfig.intervalo_follow_3}
                    onChange={(e) => updateFollowUpField('intervalo_follow_3', parseInt(e.target.value) || 72)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo após 2º follow-up
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="janela_ativa_horas">
                    Janela ativa (horas)
                  </Label>
                  <Input
                    id="janela_ativa_horas"
                    type="number"
                    min={1}
                    max={720}
                    value={followUpConfig.janela_ativa_horas}
                    onChange={(e) => updateFollowUpField('janela_ativa_horas', parseInt(e.target.value) || 12)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Período máximo para enviar follow-ups após última interação
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_tentativas">
                    Máximo de tentativas
                  </Label>
                  <Select
                    value={String(followUpConfig.max_tentativas_por_ciclo)}
                    onValueChange={(v) => updateFollowUpField('max_tentativas_por_ciclo', parseInt(v))}
                  >
                    <SelectTrigger id="max_tentativas">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 tentativa</SelectItem>
                      <SelectItem value="2">2 tentativas</SelectItem>
                      <SelectItem value="3">3 tentativas</SelectItem>
                      <SelectItem value="4">4 tentativas</SelectItem>
                      <SelectItem value="5">5 tentativas</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Número máximo de follow-ups por ciclo
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="solar" onClick={handleSaveFollowUp} disabled={savingFollowUp}>
                {savingFollowUp ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Configurações
              </Button>
            </CardFooter>
          </Card>

          {/* Informações adicionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Informações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                  <span>O follow-up reseta automaticamente quando o lead envia uma nova mensagem</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                  <span>Leads bloqueados ou com IA desativada não recebem follow-up</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                  <span>Leads com proposta enviada, fechados ou perdidos são excluídos</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                  <span>Configure seu horário de funcionamento na aba &quot;Dados&quot; para o follow-up respeitar</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segurança Tab */}
        <TabsContent value="seguranca" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>
                  Atualize a senha da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <Input type="password" placeholder="Digite sua senha atual" />
                </div>
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input type="password" placeholder="Digite a nova senha" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input type="password" placeholder="Confirme a nova senha" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="solar">Alterar Senha</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Informações da Conta
                </CardTitle>
                <CardDescription>
                  Dados de acesso e segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{empresa?.email}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground">Slug</span>
                    <span className="font-medium">{empresa?.slug || 'Não definido'}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground">Última atualização</span>
                    <span className="font-medium">
                      {empresa?.updated_at
                        ? new Date(empresa.updated_at).toLocaleDateString('pt-BR')
                        : '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
