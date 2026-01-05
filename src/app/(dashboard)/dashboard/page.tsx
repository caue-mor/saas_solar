"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Sun,
  TrendingUp,
  ArrowUpRight,
  MessageSquare,
  Calendar,
  Plus,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats, getContatosRecentesComStatus, getSistemasCount } from "@/services/dashboard";
import type { DashboardStats, ContatoFotovoltaico } from "@/types/database";

// Função para formatar tempo relativo
function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "Data não informada";

  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora mesmo";
  if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `Há ${diffDays} dias`;

  return past.toLocaleDateString('pt-BR');
}

// Função para formatar celular
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Função para obter iniciais
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [sistemasCount, setSistemasCount] = React.useState(0);
  const [contatosRecentes, setContatosRecentes] = React.useState<
    Array<ContatoFotovoltaico & { status_nome?: string; status_cor?: string }>
  >([]);

  // Carregar dados do dashboard
  React.useEffect(() => {
    async function loadDashboard() {
      if (!user?.id) return;

      setLoading(true);
      setError(null);

      try {
        // Carregar todas as estatísticas em paralelo
        const [statsResult, sistemasResult, contatosResult] = await Promise.all([
          getDashboardStats(user.id),
          getSistemasCount(user.id),
          getContatosRecentesComStatus(user.id, 5),
        ]);

        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }

        if (sistemasResult.success) {
          setSistemasCount(sistemasResult.count || 0);
        }

        if (contatosResult.success && contatosResult.data) {
          setContatosRecentes(contatosResult.data);
        }

        // Verificar se algum deu erro
        if (!statsResult.success || !sistemasResult.success || !contatosResult.success) {
          setError("Alguns dados não puderam ser carregados");
        }
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        setError("Erro ao carregar dados do dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user?.id]);

  // Estado de loading
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Cards de estatísticas
  const statsCards = [
    {
      title: "Total de Leads",
      value: stats?.totalContatos.toLocaleString('pt-BR') || "0",
      subtitle: `${stats?.contatosMes || 0} este mês`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Sistemas Cadastrados",
      value: sistemasCount.toLocaleString('pt-BR'),
      subtitle: "Portfólio de sistemas",
      icon: Sun,
      color: "text-solar-600",
      bgColor: "bg-solar-100",
    },
    {
      title: "Leads Hoje",
      value: stats?.contatosHoje.toLocaleString('pt-BR') || "0",
      subtitle: `${stats?.contatosSemana || 0} esta semana`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Por Status",
      value: stats?.porStatus.length.toString() || "0",
      subtitle: "Etapas ativas",
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {user?.nome_atendente || user?.empresa}! Aqui está um resumo da sua empresa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/contatos">
              <Eye className="mr-2 h-4 w-4" />
              Ver Contatos
            </Link>
          </Button>
          <Button variant="solar" asChild>
            <Link href="/dashboard/contatos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Lead
            </Link>
          </Button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs">
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-600" />
                  <span className="text-muted-foreground">{stat.subtitle}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Leads */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Leads Recentes</CardTitle>
              <CardDescription>
                Últimos leads cadastrados no sistema
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/contatos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {contatosRecentes.length > 0 ? (
              <div className="space-y-4">
                {contatosRecentes.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-solar-100 text-sm font-semibold text-solar-700">
                        {getInitials(lead.nome)}
                      </div>
                      <div>
                        <p className="font-medium">{lead.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPhone(lead.celular)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden text-right sm:block">
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: `${lead.status_cor}20`,
                            color: lead.status_cor,
                            borderColor: lead.status_cor,
                          }}
                        >
                          {lead.status_nome}
                        </Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatRelativeTime(lead.created_on)}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/contatos/${lead.id}`}>
                          <MessageSquare className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="mb-2 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhum lead cadastrado ainda</p>
                <Button variant="solar" size="sm" className="mt-4" asChild>
                  <Link href="/dashboard/contatos/novo">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar primeiro lead
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Leads por Status</CardTitle>
              <CardDescription>Distribuição no funil de vendas</CardDescription>
            </div>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/kanban">
                <Calendar className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.porStatus && stats.porStatus.length > 0 ? (
              <div className="space-y-4">
                {stats.porStatus.map((status) => (
                  <div
                    key={status.status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: status.cor }}
                      />
                      <span className="text-sm font-medium">{status.status}</span>
                    </div>
                    <span className="text-sm font-bold">{status.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Nenhum status configurado
                </p>
              </div>
            )}
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/dashboard/kanban">
                Ver Kanban
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/dashboard/contatos/novo">
                <Users className="h-6 w-6 text-blue-600" />
                <span>Novo Lead</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/dashboard/sistemas/novo">
                <Sun className="h-6 w-6 text-solar-600" />
                <span>Novo Sistema</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/dashboard/kanban">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <span>Ver Kanban</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/dashboard/whatsapp">
                <MessageSquare className="h-6 w-6 text-purple-600" />
                <span>WhatsApp</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
