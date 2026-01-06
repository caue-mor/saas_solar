"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  QrCode,
  WifiOff,
  RefreshCw,
  CheckCircle,
  Loader2,
  Power,
  PowerOff,
  Smartphone,
  AlertCircle,
  Info,
} from "lucide-react";

type ConnectionStatus = "not_created" | "disconnected" | "connecting" | "connected" | "error";

interface WhatsAppStatus {
  status: ConnectionStatus;
  qrcode?: string;
  paircode?: string;
  connected?: boolean;
  error?: string;
  profileName?: string;
  profilePicUrl?: string;
  empresa?: {
    id: number;
    nome: string;
    numero?: string;
  };
}

// Lista de DDDs validos do Brasil
const VALID_DDDS = [
  "11", "12", "13", "14", "15", "16", "17", "18", "19", // SP
  "21", "22", "24", // RJ
  "27", "28", // ES
  "31", "32", "33", "34", "35", "37", "38", // MG
  "41", "42", "43", "44", "45", "46", // PR
  "47", "48", "49", // SC
  "51", "53", "54", "55", // RS
  "61", // DF
  "62", "64", // GO
  "63", // TO
  "65", "66", // MT
  "67", // MS
  "68", // AC
  "69", // RO
  "71", "73", "74", "75", "77", // BA
  "79", // SE
  "81", "87", // PE
  "82", // AL
  "83", // PB
  "84", // RN
  "85", "88", // CE
  "86", "89", // PI
  "91", "93", "94", // PA
  "92", "97", // AM
  "95", // RR
  "96", // AP
  "98", "99", // MA
];

export default function WhatsAppPage() {
  const { user } = useAuth();
  const [status, setStatus] = React.useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Modal de conexao
  const [showConnectionModal, setShowConnectionModal] = React.useState(false);
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [connectionType, setConnectionType] = React.useState<"qrcode" | "paircode" | null>(null);
  const [qrCode, setQrCode] = React.useState<string | null>(null);
  const [pairCode, setPairCode] = React.useState<string | null>(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);

  // Polling control
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);
  const qrRefreshRef = React.useRef<NodeJS.Timeout | null>(null);

  // Formata telefone para exibicao: (99) 9 9999-9999
  const formatPhoneDisplay = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    const limited = numbers.slice(0, 11);

    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 3) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 3)} ${limited.slice(3)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 3)} ${limited.slice(3, 7)}-${limited.slice(7)}`;
    }
  };

  // Valida telefone brasileiro
  const validatePhone = (value: string): { valid: boolean; error: string | null } => {
    const numbers = value.replace(/\D/g, "");

    if (!numbers || numbers.length === 0) {
      return { valid: false, error: "Telefone e obrigatorio" };
    }

    if (numbers.length < 11) {
      return { valid: false, error: "Numero incompleto. Digite DDD + 9 + numero" };
    }

    if (numbers.length > 11) {
      return { valid: false, error: "Numero com digitos demais" };
    }

    if (numbers[2] !== "9") {
      return { valid: false, error: "Celular deve comecar com 9 apos o DDD" };
    }

    const ddd = numbers.slice(0, 2);
    if (!VALID_DDDS.includes(ddd)) {
      return { valid: false, error: `DDD ${ddd} invalido` };
    }

    return { valid: true, error: null };
  };

  // Formata telefone com codigo do pais
  const formatPhoneWithCountryCode = (phone: string): string | null => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 11) return null;
    return cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  };

  // Buscar status do WhatsApp
  const fetchStatus = React.useCallback(async (silent = false) => {
    if (!user?.id) return;

    if (!silent) setLoading(true);

    try {
      const response = await fetch(`/api/whatsapp?empresaId=${user.id}`);
      const data = await response.json();
      setStatus(data);
      setError(null);

      // Se conectou, limpa tudo
      if (data.status === "connected") {
        setQrCode(null);
        setPairCode(null);
        setIsConnecting(false);
        stopPolling();
        setShowConnectionModal(false);
      }
    } catch (err) {
      console.error("Erro ao buscar status:", err);
      if (!silent) {
        setError("Erro ao conectar com servidor");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  // Iniciar polling
  const startPolling = React.useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      fetchStatus(true);
    }, 3000);
  }, [fetchStatus]);

  // Parar polling
  const stopPolling = React.useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (qrRefreshRef.current) {
      clearInterval(qrRefreshRef.current);
      qrRefreshRef.current = null;
    }
  }, []);

  // Cleanup
  React.useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Buscar status inicial
  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Pre-preenche telefone do usuario
  React.useEffect(() => {
    if (showConnectionModal && status?.empresa?.numero) {
      let cleanNumber = status.empresa.numero.replace(/\D/g, "");
      if (cleanNumber.startsWith("55")) {
        cleanNumber = cleanNumber.substring(2);
      }
      setPhoneNumber(formatPhoneDisplay(cleanNumber));
    }
  }, [showConnectionModal, status?.empresa?.numero]);

  // Reset modal ao fechar
  React.useEffect(() => {
    if (!showConnectionModal) {
      setQrCode(null);
      setPairCode(null);
      setPhoneError(null);
      setConnectionType(null);
      setIsConnecting(false);
      stopPolling();
    }
  }, [showConnectionModal, stopPolling]);

  // Gerar QR Code
  const handleGenerateQRCode = async () => {
    const validation = validatePhone(phoneNumber);
    if (!validation.valid) {
      setPhoneError(validation.error);
      return;
    }
    setPhoneError(null);

    try {
      setError(null);
      setIsConnecting(true);
      setConnectionType("qrcode");
      setPairCode(null);

      const formattedPhone = formatPhoneWithCountryCode(phoneNumber);

      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          empresaId: user?.id,
          type: "qrcode",
          phone: formattedPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar QR Code");
      }

      if (data.qrcode) {
        setQrCode(data.qrcode);
        setLastUpdate(new Date());
        startPolling();

        // Auto-refresh QR Code a cada 90 segundos
        if (qrRefreshRef.current) {
          clearInterval(qrRefreshRef.current);
        }
        qrRefreshRef.current = setInterval(() => {
          handleGenerateQRCode();
        }, 90000);
      } else {
        throw new Error("QR Code nao retornado");
      }
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
      setError(err instanceof Error ? err.message : "Erro ao gerar QR Code");
      setIsConnecting(false);
    }
  };

  // Gerar Codigo de Pareamento
  const handleGeneratePairCode = async () => {
    const validation = validatePhone(phoneNumber);
    if (!validation.valid) {
      setPhoneError(validation.error);
      return;
    }
    setPhoneError(null);

    try {
      setError(null);
      setIsConnecting(true);
      setConnectionType("paircode");
      setQrCode(null);

      const formattedPhone = formatPhoneWithCountryCode(phoneNumber);

      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          empresaId: user?.id,
          type: "paircode",
          phone: formattedPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar codigo");
      }

      if (data.paircode) {
        setPairCode(data.paircode);
        setLastUpdate(new Date());
        startPolling();
      } else {
        throw new Error("Codigo nao retornado");
      }
    } catch (err) {
      console.error("Erro ao gerar codigo:", err);
      setError(err instanceof Error ? err.message : "Erro ao gerar codigo");
      setIsConnecting(false);
    }
  };

  // Abrir modal de conexao
  const handleConnect = () => {
    setShowConnectionModal(true);
  };

  // Desconectar
  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar? Voce precisara escanear o QR Code novamente para reconectar.")) {
      return;
    }

    setActionLoading("disconnect");
    try {
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "disconnect",
          empresaId: user?.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao desconectar");
      }

      await fetchStatus();
    } catch (err) {
      console.error("Erro ao desconectar:", err);
      setError(err instanceof Error ? err.message : "Erro ao desconectar");
    } finally {
      setActionLoading(null);
    }
  };

  // Formata timestamp
  const formatTimestamp = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  // Badge de status
  const renderStatusBadge = () => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      not_created: { label: "Nao Criado", className: "bg-gray-500" },
      disconnected: { label: "Offline", className: "bg-red-500" },
      connecting: { label: "Conectando...", className: "bg-yellow-500" },
      connected: { label: "Online", className: "bg-green-500" },
      error: { label: "Erro", className: "bg-red-500" },
    };

    const currentStatus = status?.status || "error";
    const config = statusConfig[currentStatus] || statusConfig["error"];
    return <Badge className={config.className}>{config.label}</Badge>;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie sua conexao WhatsApp</p>
        </div>
        <Button variant="outline" onClick={() => fetchStatus()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Erro Global */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 pt-4">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Erro</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Status e Acoes */}
        <div className="space-y-6">
          {/* Status da Conexao */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Status da Conexao</CardTitle>
              {renderStatusBadge()}
            </CardHeader>
            <CardContent>
              {status?.status === "connected" && (
                <div className="space-y-2">
                  {status.profileName && (
                    <p className="text-sm text-muted-foreground">
                      Perfil: <span className="font-medium text-foreground">{status.profileName}</span>
                    </p>
                  )}
                  {status.empresa?.numero && (
                    <p className="text-sm text-muted-foreground">
                      Numero: <span className="font-medium text-foreground">{status.empresa.numero}</span>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acoes */}
          <Card className="bg-zinc-900">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Acoes</h3>
              <div className="flex flex-col gap-3">
                {(status?.status === "disconnected" || status?.status === "not_created") && (
                  <Button
                    variant="default"
                    onClick={handleConnect}
                    disabled={actionLoading !== null}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Power className="mr-2 h-5 w-5" />
                    Conectar WhatsApp
                  </Button>
                )}

                {status?.status === "connected" && (
                  <>
                    <Button
                      variant="default"
                      onClick={() => fetchStatus()}
                      disabled={actionLoading !== null}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Atualizar Status
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDisconnect}
                      disabled={actionLoading === "disconnect"}
                      className="w-full"
                    >
                      {actionLoading === "disconnect" ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <PowerOff className="mr-2 h-5 w-5" />
                      )}
                      Desconectar
                    </Button>
                  </>
                )}

                {status?.status === "connecting" && (
                  <Button variant="secondary" disabled className="w-full">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Conectando...
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Status Visual */}
        <div>
          {status?.status === "connected" && (
            <Card className="bg-green-600">
              <CardContent className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-300 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-800" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">WhatsApp Conectado!</h3>
                <p className="text-green-100">Sua conexao esta ativa e funcionando normalmente.</p>
              </CardContent>
            </Card>
          )}

          {(status?.status === "disconnected" || status?.status === "not_created") && (
            <Card className="bg-gray-50">
              <CardContent className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                  <WifiOff className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">WhatsApp Desconectado</h3>
                <p className="text-gray-600 mb-4">
                  Clique em &quot;Conectar WhatsApp&quot; para iniciar uma nova conexao.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Info Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900 mb-1">Sistema de Notificacoes Ativo</p>
              <p className="text-sm text-blue-700">
                Em caso de desconexao, voce recebera automaticamente uma mensagem no WhatsApp cadastrado para reconectar rapidamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Conexao - Igual ConectUazapi */}
      <Dialog open={showConnectionModal} onOpenChange={setShowConnectionModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Conectar</DialogTitle>
            <DialogDescription>
              Digite seu numero de telefone e escolha como deseja conectar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Campo de Telefone - OBRIGATORIO */}
            <div>
              <Label className="text-sm font-medium">
                Telefone <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Obrigatorio: DDD + 9 + numero (ex: 19 9 9760-6702)
              </p>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2 border border-r-0 border-input rounded-l-md bg-muted text-muted-foreground font-medium">
                  +55
                </span>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.startsWith("55")) {
                      value = value.substring(2);
                    }
                    setPhoneNumber(formatPhoneDisplay(value));
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder="(85) 9 9967-3669"
                  maxLength={16}
                  className={`rounded-l-none ${phoneError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
              </div>
              {phoneError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {phoneError}
                </p>
              )}
            </div>

            {/* Area do QR Code ou PairCode */}
            {(qrCode || pairCode) && (
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center min-h-[350px]">
                {qrCode && (
                  <>
                    <div className="relative w-72 h-72 mb-4">
                      <Image
                        src={qrCode}
                        alt="QR Code"
                        fill
                        className="object-contain"
                      />
                    </div>
                    {lastUpdate && (
                      <p className="text-sm text-muted-foreground">
                        Atualizado: {formatTimestamp(lastUpdate)}
                      </p>
                    )}
                  </>
                )}

                {pairCode && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">Codigo de Pareamento:</p>
                    <p className="text-4xl font-bold text-blue-600 tracking-widest mb-4">{pairCode}</p>
                    <p className="text-xs text-muted-foreground">
                      Digite este codigo no WhatsApp do seu celular
                    </p>
                    {lastUpdate && (
                      <p className="text-sm text-muted-foreground mt-4">
                        Gerado: {formatTimestamp(lastUpdate)}
                      </p>
                    )}
                  </div>
                )}

                {isConnecting && (
                  <div className="mt-4 flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Aguardando conexao...</span>
                  </div>
                )}
              </div>
            )}

            {/* Botoes de Acao */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleGenerateQRCode}
                disabled={isConnecting}
                className="w-full bg-zinc-900 hover:bg-zinc-800"
              >
                {connectionType === "qrcode" && isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-5 w-5" />
                    Gerar QR Code
                  </>
                )}
              </Button>

              <Button
                onClick={handleGeneratePairCode}
                disabled={isConnecting}
                className="w-full bg-zinc-900 hover:bg-zinc-800"
              >
                {connectionType === "paircode" && isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Gerando Codigo...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-5 w-5" />
                    Gerar Codigo de Pareamento
                  </>
                )}
              </Button>
            </div>

            {/* Instrucoes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                {connectionType === "qrcode"
                  ? "Abra o WhatsApp no seu celular e escaneie o QR Code acima"
                  : connectionType === "paircode"
                  ? "Abra o WhatsApp no seu celular e digite o codigo de pareamento"
                  : "Escolha uma das opcoes acima para conectar seu WhatsApp"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
