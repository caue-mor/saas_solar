"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageSquare,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Send,
  Clock,
  Bot,
  Users,
  FileText,
  CheckCircle,
  Loader2,
  Plus,
  Power,
  Link as LinkIcon,
  Phone,
  Smartphone,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";

type ConnectionStatus = "not_created" | "disconnected" | "connecting" | "connected" | "error";
type ConnectionType = "qrcode" | "paircode";

interface WhatsAppStatus {
  status: ConnectionStatus;
  qrcode?: string;
  paircode?: string;
  connected?: boolean;
  error?: string;
  connectionType?: ConnectionType;
  profileName?: string;
  profilePicUrl?: string;
  empresa?: {
    id: number;
    nome: string;
    numero?: string;
  };
}

export default function WhatsAppPage() {
  const { user } = useAuth();
  const [status, setStatus] = React.useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = React.useState("");

  // Modal de conexão
  const [showConnectionModal, setShowConnectionModal] = React.useState(false);
  const [connectionType, setConnectionType] = React.useState<ConnectionType>("qrcode");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const [copiedPaircode, setCopiedPaircode] = React.useState(false);

  // Polling control
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);
  const qrTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Buscar status do WhatsApp
  const fetchStatus = React.useCallback(async (silent = false) => {
    if (!user?.id) return;

    if (!silent) setLoading(true);

    try {
      const response = await fetch(`/api/whatsapp?empresaId=${user.id}`);
      const data = await response.json();
      setStatus(data);

      // Configurar webhook URL padrão
      if (!webhookUrl && typeof window !== "undefined") {
        const baseUrl = window.location.origin;
        setWebhookUrl(`${baseUrl}/api/webhook/whatsapp`);
      }

      // Parar polling se conectou
      if (data.status === "connected" && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setShowConnectionModal(false);
      }
    } catch (error) {
      console.error("Erro ao buscar status:", error);
      setStatus({ status: "error", error: "Erro ao conectar com servidor" });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id, webhookUrl]);

  // Iniciar polling para status
  const startPolling = React.useCallback(() => {
    // Limpar polling anterior
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Poll a cada 3 segundos
    pollingRef.current = setInterval(() => {
      fetchStatus(true);
    }, 3000);

    // Timeout de 90 segundos para QR Code
    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current);
    }
    qrTimeoutRef.current = setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 90000);
  }, [fetchStatus]);

  // Parar polling
  const stopPolling = React.useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current);
      qrTimeoutRef.current = null;
    }
  }, []);

  // Cleanup ao desmontar
  React.useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Buscar status inicial
  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Validar telefone brasileiro
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
    // 10 ou 11 dígitos (DDD + número)
    if (cleaned.length < 10 || cleaned.length > 11) {
      setPhoneError("Digite DDD + número (ex: 19997606702)");
      return false;
    }
    setPhoneError("");
    return true;
  };

  // Formatar telefone enquanto digita
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    let formatted = value;

    if (value.length > 2) {
      formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 7) {
      formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
    }

    setPhoneNumber(formatted);
    if (value.length >= 10) {
      validatePhone(value);
    } else {
      setPhoneError("");
    }
  };

  // Executar ação (create, connect, disconnect, webhook, sync)
  const executeAction = async (action: string, params?: Record<string, unknown>) => {
    if (!user?.id) return;

    setActionLoading(action);
    try {
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          empresaId: user.id,
          ...params,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Erro: ${data.error}`);
        return data;
      }

      // Atualizar status após ação
      await fetchStatus();
      return data;
    } catch (error) {
      console.error("Erro na ação:", error);
      alert("Erro ao executar ação");
      return null;
    } finally {
      setActionLoading(null);
    }
  };

  // Criar instância
  const handleCreate = async () => {
    const result = await executeAction("create");
    if (result?.success) {
      setShowConnectionModal(true);
    }
  };

  // Iniciar conexão
  const handleStartConnection = () => {
    setConnectionType("qrcode");
    setPhoneNumber("");
    setPhoneError("");
    setShowConnectionModal(true);
  };

  // Conectar via QR Code ou PairCode
  const handleConnect = async () => {
    const params: Record<string, unknown> = {
      type: connectionType,
    };

    if (connectionType === "paircode") {
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      if (!validatePhone(cleanPhone)) {
        return;
      }
      params.phone = cleanPhone;
    }

    const result = await executeAction("connect", params);

    if (result?.success) {
      // Atualizar status local com QR/PairCode
      setStatus((prev) => ({
        ...prev,
        status: "connecting",
        qrcode: result.qrcode,
        paircode: result.paircode,
        connectionType,
      }));

      // Iniciar polling
      startPolling();
    }
  };

  // Desconectar
  const handleDisconnect = async () => {
    if (confirm("Tem certeza que deseja desconectar o WhatsApp?")) {
      await executeAction("disconnect");
      stopPolling();
    }
  };

  // Salvar webhook
  const handleSaveWebhook = () => executeAction("webhook", { url: webhookUrl });

  // Copiar PairCode
  const copyPairCode = async () => {
    if (status?.paircode) {
      await navigator.clipboard.writeText(status.paircode);
      setCopiedPaircode(true);
      setTimeout(() => setCopiedPaircode(false), 2000);
    }
  };

  // Renderizar badge de status
  const renderStatusBadge = () => {
    const statusConfig: Record<
      ConnectionStatus,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
    > = {
      not_created: { label: "Nao Criado", variant: "secondary" },
      disconnected: { label: "Offline", variant: "destructive" },
      connecting: { label: "Conectando...", variant: "outline", className: "border-yellow-500 text-yellow-600" },
      connected: { label: "Online", variant: "default", className: "bg-green-500" },
      error: { label: "Erro", variant: "destructive" },
    };

    const config = statusConfig[status?.status || "error"];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
        <span className="ml-2 text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">WhatsApp</h1>
          <p className="text-muted-foreground">Configure a integracao do WhatsApp para atendimento</p>
        </div>
        <Button variant="outline" onClick={() => fetchStatus()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="conexao" className="space-y-6">
        <TabsList>
          <TabsTrigger value="conexao">
            <Wifi className="mr-2 h-4 w-4" />
            Conexao
          </TabsTrigger>
          <TabsTrigger value="configuracoes">
            <Settings className="mr-2 h-4 w-4" />
            Configuracoes
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="estatisticas">
            <Users className="mr-2 h-4 w-4" />
            Estatisticas
          </TabsTrigger>
        </TabsList>

        {/* Conexao Tab */}
        <TabsContent value="conexao" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Status da Conexao */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Status da Conexao
                </CardTitle>
                <CardDescription>Gerencie a conexao com o WhatsApp Business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Atual */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    {status?.status === "connected" ? (
                      <div className="relative">
                        <Wifi className="h-8 w-8 text-green-600" />
                        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                      </div>
                    ) : status?.status === "connecting" ? (
                      <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                    ) : (
                      <WifiOff className="h-8 w-8 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {status?.status === "connected" && "Conectado"}
                        {status?.status === "connecting" && "Conectando..."}
                        {status?.status === "disconnected" && "Desconectado"}
                        {status?.status === "not_created" && "Instancia nao criada"}
                        {status?.status === "error" && "Erro de conexao"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {status?.status === "connected" && (
                          <>
                            WhatsApp funcionando normalmente
                            {status.empresa?.numero && ` - ${status.empresa.numero}`}
                          </>
                        )}
                        {status?.status === "connecting" && "Aguardando escaneamento do QR Code"}
                        {status?.status === "disconnected" && "Clique em Conectar para iniciar"}
                        {status?.status === "not_created" && "Clique em Criar Instancia para comecar"}
                        {status?.status === "error" && status.error}
                      </p>
                    </div>
                  </div>
                  {renderStatusBadge()}
                </div>

                {/* Acao: Criar Instancia */}
                {status?.status === "not_created" && (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8">
                    <Plus className="h-16 w-16 text-muted-foreground/50" />
                    <p className="mt-4 text-center text-muted-foreground">
                      Voce ainda nao tem uma instancia WhatsApp configurada
                    </p>
                    <Button
                      variant="solar"
                      className="mt-4"
                      onClick={handleCreate}
                      disabled={actionLoading === "create"}
                    >
                      {actionLoading === "create" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Instancia
                    </Button>
                  </div>
                )}

                {/* Acao: Conectar */}
                {status?.status === "disconnected" && (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8">
                    <Smartphone className="h-16 w-16 text-muted-foreground/50" />
                    <p className="mt-4 text-center text-muted-foreground">
                      Conecte seu WhatsApp escaneando o QR Code ou usando o codigo de pareamento
                    </p>
                    <Button variant="solar" className="mt-4" onClick={handleStartConnection}>
                      <QrCode className="mr-2 h-4 w-4" />
                      Conectar WhatsApp
                    </Button>
                  </div>
                )}

                {/* Conectado - Mostrar info e botao desconectar */}
                {status?.status === "connected" && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Instancia Ativa</span>
                      </div>
                      {status.profileName && (
                        <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                          Perfil: {status.profileName}
                        </p>
                      )}
                      {status.empresa?.numero && (
                        <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                          Numero: {status.empresa.numero}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleDisconnect}
                      disabled={actionLoading === "disconnect"}
                    >
                      {actionLoading === "disconnect" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Power className="mr-2 h-4 w-4" />
                      Desconectar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuracao de Webhook */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Webhook
                </CardTitle>
                <CardDescription>Configure o webhook para receber mensagens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL do Webhook</Label>
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://seu-site.com/api/webhook/whatsapp"
                  />
                  <p className="text-xs text-muted-foreground">Mensagens recebidas serao enviadas para esta URL</p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-medium text-sm mb-2">Eventos recebidos:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>- messages - Novas mensagens</li>
                    <li>- messages.update - Atualizacoes de mensagens</li>
                    <li>- connection.update - Mudancas de conexao</li>
                    <li>- qrcode.updated - Atualizacao de QR Code</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="solar"
                  className="w-full"
                  onClick={handleSaveWebhook}
                  disabled={actionLoading === "webhook" || !webhookUrl}
                >
                  {actionLoading === "webhook" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Webhook
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Configuracoes Tab */}
        <TabsContent value="configuracoes" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Respostas Automaticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Respostas Automaticas
                </CardTitle>
                <CardDescription>Configure o comportamento das respostas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Resposta Automatica</Label>
                    <p className="text-sm text-muted-foreground">Responder automaticamente a mensagens</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Atendimento com IA</Label>
                    <p className="text-sm text-muted-foreground">Usar inteligencia artificial para respostas</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Apenas Horario Comercial</Label>
                    <p className="text-sm text-muted-foreground">Desativar fora do horario de funcionamento</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* Horario de Funcionamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horario de Funcionamento
                </CardTitle>
                <CardDescription>Define quando o atendimento estara disponivel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Abertura</Label>
                    <Input type="time" defaultValue="08:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fechamento</Label>
                    <Input type="time" defaultValue="18:00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dias de Funcionamento</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((day, index) => (
                      <Button
                        key={day}
                        variant={index < 6 ? "default" : "outline"}
                        size="sm"
                        className={index < 6 ? "bg-solar-500 hover:bg-solar-600" : ""}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="solar" className="w-full">
                  Salvar Horarios
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Templates de Mensagem</CardTitle>
                  <CardDescription>Mensagens pre-definidas para agilizar o atendimento</CardDescription>
                </div>
                <Button variant="solar">
                  <FileText className="mr-2 h-4 w-4" />
                  Novo Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: "Boas-vindas",
                    content: "Ola! Bem-vindo a Solar Tech. Como posso ajudar voce hoje?",
                    category: "Atendimento",
                  },
                  {
                    name: "Proposta Enviada",
                    content:
                      "Ola! Acabamos de enviar a proposta do seu sistema solar por e-mail. Qualquer duvida, estou a disposicao!",
                    category: "Vendas",
                  },
                  {
                    name: "Agendamento de Visita",
                    content: "Perfeito! Vamos agendar uma visita tecnica. Qual o melhor dia e horario para voce?",
                    category: "Agendamento",
                  },
                  {
                    name: "Follow-up",
                    content:
                      "Ola! Estou entrando em contato para saber se voce teve a oportunidade de analisar nossa proposta. Posso esclarecer alguma duvida?",
                    category: "Follow-up",
                  },
                ].map((template, index) => (
                  <div key={index} className="flex items-start justify-between rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{template.content}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estatisticas Tab */}
        <TabsContent value="estatisticas" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Mensagens Hoje", value: "156", icon: MessageSquare },
              { label: "Conversas Ativas", value: "23", icon: Users },
              { label: "Taxa de Resposta", value: "94%", icon: CheckCircle },
              { label: "Tempo Medio", value: "2min", icon: Clock },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Conexao */}
      <Dialog open={showConnectionModal} onOpenChange={setShowConnectionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>Escolha como deseja conectar seu WhatsApp</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selecao de tipo de conexao */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={connectionType === "qrcode" ? "default" : "outline"}
                className={connectionType === "qrcode" ? "bg-solar-500 hover:bg-solar-600" : ""}
                onClick={() => setConnectionType("qrcode")}
              >
                <QrCode className="mr-2 h-4 w-4" />
                QR Code
              </Button>
              <Button
                variant={connectionType === "paircode" ? "default" : "outline"}
                className={connectionType === "paircode" ? "bg-solar-500 hover:bg-solar-600" : ""}
                onClick={() => setConnectionType("paircode")}
              >
                <Phone className="mr-2 h-4 w-4" />
                Codigo
              </Button>
            </div>

            {/* Input de telefone para PairCode */}
            {connectionType === "paircode" && (
              <div className="space-y-2">
                <Label>Numero do WhatsApp</Label>
                <Input
                  placeholder="(19) 99760-6702"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={16}
                />
                {phoneError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {phoneError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Digite o DDD + numero do WhatsApp que deseja conectar</p>
              </div>
            )}

            {/* QR Code / PairCode Display */}
            {status?.status === "connecting" && (
              <div className="flex flex-col items-center justify-center p-4">
                {connectionType === "qrcode" && status.qrcode ? (
                  <>
                    <div className="relative h-56 w-56 overflow-hidden rounded-lg bg-white p-2">
                      <Image src={status.qrcode} alt="QR Code WhatsApp" fill className="object-contain" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground text-center">
                      Abra o WhatsApp no celular e escaneie o codigo
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      O QR Code expira em 90 segundos
                    </p>
                  </>
                ) : connectionType === "paircode" && status.paircode ? (
                  <>
                    <div className="rounded-lg bg-muted p-6 text-center">
                      <p className="text-3xl font-mono font-bold tracking-wider">{status.paircode}</p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4" onClick={copyPairCode}>
                      {copiedPaircode ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar Codigo
                        </>
                      )}
                    </Button>
                    <div className="mt-4 text-sm text-muted-foreground text-center">
                      <p>1. Abra o WhatsApp no celular</p>
                      <p>2. Va em Configuracoes &gt; Aparelhos conectados</p>
                      <p>3. Toque em &quot;Conectar aparelho&quot;</p>
                      <p>4. Insira o codigo acima</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
                    <p className="text-sm text-muted-foreground">Gerando codigo de conexao...</p>
                  </div>
                )}
              </div>
            )}

            {/* Status de conexao */}
            {status?.status === "connecting" && (
              <div className="flex items-center justify-center gap-2 text-yellow-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Aguardando conexao...</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConnectionModal(false);
                stopPolling();
              }}
            >
              Cancelar
            </Button>
            {status?.status !== "connecting" && (
              <Button
                variant="solar"
                onClick={handleConnect}
                disabled={
                  actionLoading === "connect" ||
                  (connectionType === "paircode" && phoneNumber.replace(/\D/g, "").length < 10)
                }
              >
                {actionLoading === "connect" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : connectionType === "qrcode" ? (
                  <QrCode className="mr-2 h-4 w-4" />
                ) : (
                  <Phone className="mr-2 h-4 w-4" />
                )}
                Conectar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
