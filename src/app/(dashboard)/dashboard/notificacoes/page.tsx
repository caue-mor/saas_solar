"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  UserPlus,
  Eye,
  MessageSquare,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Notificacao {
  id: number;
  id_empresa: number;
  tipo: "novo_lead" | "proposta_visualizada" | "mensagem" | "followup" | "sistema";
  titulo: string;
  mensagem: string | null;
  link: string | null;
  id_referencia: number | null;
  lida: boolean;
  created_at: string;
}

const tipoIcones: Record<Notificacao["tipo"], React.ReactNode> = {
  novo_lead: <UserPlus className="h-5 w-5" />,
  proposta_visualizada: <Eye className="h-5 w-5" />,
  mensagem: <MessageSquare className="h-5 w-5" />,
  followup: <Clock className="h-5 w-5" />,
  sistema: <Bell className="h-5 w-5" />,
};

const tipoCores: Record<Notificacao["tipo"], string> = {
  novo_lead: "bg-green-100 text-green-600",
  proposta_visualizada: "bg-blue-100 text-blue-600",
  mensagem: "bg-purple-100 text-purple-600",
  followup: "bg-orange-100 text-orange-600",
  sistema: "bg-gray-100 text-gray-600",
};

function formatarTempoRelativo(dataString: string): string {
  const data = new Date(dataString);
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `${diffMin} min atras`;
  if (diffHoras < 24) return `${diffHoras}h atras`;
  if (diffDias < 7) return `${diffDias}d atras`;

  return data.toLocaleDateString("pt-BR");
}

export default function NotificacoesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notificacoes, setNotificacoes] = React.useState<Notificacao[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);
  const [tab, setTab] = React.useState("todas");

  // Buscar notificacoes
  const fetchNotificacoes = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/notifications?empresaId=${user.id}`);
      const data = await res.json();

      if (data.notificacoes) {
        setNotificacoes(data.notificacoes);
      }
    } catch (error) {
      console.error("Erro ao buscar notificacoes:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  // Marcar como lida
  const marcarComoLida = async (notificacaoId: number) => {
    setActionLoading(notificacaoId);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificacaoId }),
      });

      setNotificacoes((prev) =>
        prev.map((n) => (n.id === notificacaoId ? { ...n, lida: true } : n))
      );
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Marcar todas como lidas
  const marcarTodasComoLidas = async () => {
    if (!user?.id) return;

    setActionLoading(-1);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: user.id, marcarTodas: true }),
      });

      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Deletar notificacao
  const deletarNotificacao = async (notificacaoId: number) => {
    setActionLoading(notificacaoId);
    try {
      await fetch(`/api/notifications?notificacaoId=${notificacaoId}`, {
        method: "DELETE",
      });

      setNotificacoes((prev) => prev.filter((n) => n.id !== notificacaoId));
    } catch (error) {
      console.error("Erro ao deletar notificacao:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Navegar para o link
  const navegarParaLink = (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      marcarComoLida(notificacao.id);
    }
    if (notificacao.link) {
      router.push(notificacao.link);
    }
  };

  // Filtrar notificacoes por tab
  const notificacoesFiltradas = React.useMemo(() => {
    if (tab === "nao-lidas") {
      return notificacoes.filter((n) => !n.lida);
    }
    return notificacoes;
  }, [notificacoes, tab]);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Notificacoes
          </h1>
          <p className="text-muted-foreground">
            Acompanhe todas as atualizacoes do sistema
          </p>
        </div>

        {naoLidas > 0 && (
          <Button
            variant="outline"
            onClick={marcarTodasComoLidas}
            disabled={actionLoading === -1}
          >
            {actionLoading === -1 ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{notificacoes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nao lidas</CardDescription>
            <CardTitle className="text-3xl text-orange-500">{naoLidas}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lidas</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {notificacoes.length - naoLidas}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="todas">
            Todas ({notificacoes.length})
          </TabsTrigger>
          <TabsTrigger value="nao-lidas">
            Nao lidas ({naoLidas})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {notificacoesFiltradas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">
                  Nenhuma notificacao
                </p>
                <p className="text-sm text-muted-foreground">
                  {tab === "nao-lidas"
                    ? "Todas as notificacoes foram lidas"
                    : "Voce ainda nao tem notificacoes"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notificacoesFiltradas.map((notificacao) => (
                <Card
                  key={notificacao.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    !notificacao.lida && "border-l-4 border-l-solar-500 bg-solar-50/50"
                  )}
                  onClick={() => navegarParaLink(notificacao)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Icone */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        tipoCores[notificacao.tipo]
                      )}
                    >
                      {tipoIcones[notificacao.tipo]}
                    </div>

                    {/* Conteudo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{notificacao.titulo}</p>
                        {!notificacao.lida && (
                          <Badge variant="secondary" className="shrink-0">
                            Nova
                          </Badge>
                        )}
                      </div>
                      {notificacao.mensagem && (
                        <p className="text-sm text-muted-foreground truncate">
                          {notificacao.mensagem}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatarTempoRelativo(notificacao.created_at)}
                      </p>
                    </div>

                    {/* Acoes */}
                    <div className="flex items-center gap-1">
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            marcarComoLida(notificacao.id);
                          }}
                          disabled={actionLoading === notificacao.id}
                        >
                          {actionLoading === notificacao.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletarNotificacao(notificacao.id);
                        }}
                        disabled={actionLoading === notificacao.id}
                      >
                        {actionLoading === notificacao.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
