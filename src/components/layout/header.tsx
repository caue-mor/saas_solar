"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  HelpCircle,
  UserPlus,
  Eye,
  MessageSquare,
  Clock,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

interface Notificacao {
  id: number;
  tipo: "novo_lead" | "proposta_visualizada" | "mensagem" | "followup" | "sistema";
  titulo: string;
  mensagem: string | null;
  link: string | null;
  lida: boolean;
  created_at: string;
}

const tipoIcones: Record<Notificacao["tipo"], React.ReactNode> = {
  novo_lead: <UserPlus className="h-4 w-4" />,
  proposta_visualizada: <Eye className="h-4 w-4" />,
  mensagem: <MessageSquare className="h-4 w-4" />,
  followup: <Clock className="h-4 w-4" />,
  sistema: <Bell className="h-4 w-4" />,
};

const tipoCores: Record<Notificacao["tipo"], string> = {
  novo_lead: "text-green-600",
  proposta_visualizada: "text-blue-600",
  mensagem: "text-purple-600",
  followup: "text-orange-600",
  sistema: "text-gray-600",
};

function formatarTempoRelativo(dataString: string): string {
  const data = new Date(dataString);
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHoras < 24) return `${diffHoras}h`;
  if (diffDias < 7) return `${diffDias}d`;

  return data.toLocaleDateString("pt-BR");
}

export function Header({ sidebarCollapsed, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const { user: authUser, logout } = useAuth();
  const [notificacoes, setNotificacoes] = React.useState<Notificacao[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loadingNotif, setLoadingNotif] = React.useState(false);

  // Dados do usuario autenticado
  const user = {
    name: authUser?.nome_atendente || authUser?.empresa || "Usuario",
    email: authUser?.email || "",
    avatar: "",
    company: authUser?.nome_empresa || authUser?.empresa || "",
  };

  // Buscar notificacoes
  const fetchNotificacoes = React.useCallback(async () => {
    if (!authUser?.id) return;

    try {
      const res = await fetch(`/api/notifications?empresaId=${authUser.id}&limite=5`);
      const data = await res.json();

      if (data.notificacoes) {
        setNotificacoes(data.notificacoes);
        setUnreadCount(data.naoLidas || 0);
      }
    } catch (error) {
      console.error("Erro ao buscar notificacoes:", error);
    }
  }, [authUser?.id]);

  // Buscar notificacoes ao montar e a cada 30 segundos
  React.useEffect(() => {
    fetchNotificacoes();

    const interval = setInterval(fetchNotificacoes, 30000);
    return () => clearInterval(interval);
  }, [fetchNotificacoes]);

  // Marcar todas como lidas
  const marcarTodasComoLidas = async () => {
    if (!authUser?.id) return;

    setLoadingNotif(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: authUser.id, marcarTodas: true }),
      });

      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Erro ao marcar como lidas:", error);
    } finally {
      setLoadingNotif(false);
    }
  };

  // Clicar em notificacao
  const handleNotificacaoClick = async (notificacao: Notificacao) => {
    // Marcar como lida se nao estiver
    if (!notificacao.lida) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificacaoId: notificacao.id }),
        });

        setNotificacoes((prev) =>
          prev.map((n) => (n.id === notificacao.id ? { ...n, lida: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Erro ao marcar como lida:", error);
      }
    }

    // Navegar para o link
    if (notificacao.link) {
      router.push(notificacao.link);
    }
  };

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 transition-all duration-300",
        sidebarCollapsed ? "left-16" : "left-64"
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos, sistemas..."
            className="w-64 pl-9 lg:w-80"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px]"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificacoes</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-solar-600"
                  onClick={marcarTodasComoLidas}
                  disabled={loadingNotif}
                >
                  {loadingNotif ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Marcar todas como lidas"
                  )}
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificacoes.length > 0 ? (
              notificacoes.map((notificacao) => (
                <DropdownMenuItem
                  key={notificacao.id}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer",
                    !notificacao.lida && "bg-solar-50"
                  )}
                  onClick={() => handleNotificacaoClick(notificacao)}
                >
                  <span className={cn("mt-0.5", tipoCores[notificacao.tipo])}>
                    {tipoIcones[notificacao.tipo]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{notificacao.titulo}</p>
                    {notificacao.mensagem && (
                      <p className="text-xs text-muted-foreground truncate">
                        {notificacao.mensagem}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatarTempoRelativo(notificacao.created_at)}
                    </p>
                  </div>
                  {!notificacao.lida && (
                    <span className="h-2 w-2 rounded-full bg-solar-500 shrink-0 mt-1.5" />
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma notificacao
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/notificacoes" className="w-full justify-center text-solar-600">
                Ver todas
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-solar-100 text-solar-700">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-solar-600">{user.company}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/perfil">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                Configuracoes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-full border-b bg-background p-4 md:hidden">
          <Input
            placeholder="Buscar contatos, sistemas..."
            autoFocus
            onBlur={() => setSearchOpen(false)}
          />
        </div>
      )}
    </header>
  );
}
