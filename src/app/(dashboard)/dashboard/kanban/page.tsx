"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanBoard, KanbanColumn, Lead } from "@/components/kanban";
import { Plus, Search, Filter, RefreshCw, Loader2, Kanban } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getContatosParaKanban, updateContatoStatus } from "@/services/contatos";
import { getStatusLeads } from "@/services/status-leads";
import type { ContatoFotovoltaico, StatusLeadFotovoltaico } from "@/types/database";

// Função para formatar tempo relativo
function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "";

  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}sem`;
}

// Converter contato do banco para Lead do Kanban
function contatoToLead(contato: ContatoFotovoltaico): Lead {
  return {
    id: contato.id.toString(),
    name: contato.nome,
    phone: contato.celular,
    status: contato.status_lead_id?.toString() || "0",
    source: contato.origem || "Não informado",
    createdAt: formatRelativeTime(contato.created_on),
    updatedAt: formatRelativeTime(contato.last_update),
    potencia: contato.potencia_consumo_medio || undefined,
  };
}

export default function KanbanPage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [columns, setColumns] = React.useState<KanbanColumn[]>([]);
  const [statusLeads, setStatusLeads] = React.useState<StatusLeadFotovoltaico[]>([]);
  const [contatos, setContatos] = React.useState<ContatoFotovoltaico[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterSource, setFilterSource] = React.useState<string>("all");

  // Carregar dados
  const loadData = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const [contatosResult, statusResult] = await Promise.all([
        getContatosParaKanban(user.id),
        getStatusLeads(),
      ]);

      if (statusResult.success && statusResult.data) {
        setStatusLeads(statusResult.data);
      }

      if (contatosResult.success && contatosResult.data) {
        setContatos(contatosResult.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, [user?.id]);

  // Carregar dados iniciais
  React.useEffect(() => {
    async function init() {
      setLoading(true);
      await loadData();
      setLoading(false);
    }
    init();
  }, [loadData]);

  // Organizar contatos em colunas quando dados mudarem
  React.useEffect(() => {
    if (statusLeads.length === 0) return;

    // Filtrar contatos
    let filteredContatos = contatos;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredContatos = filteredContatos.filter(
        (c) =>
          c.nome.toLowerCase().includes(term) ||
          c.celular.includes(term)
      );
    }

    if (filterSource !== "all") {
      filteredContatos = filteredContatos.filter(
        (c) => c.origem === filterSource
      );
    }

    // Criar colunas baseadas nos status
    const newColumns: KanbanColumn[] = statusLeads.map((status) => ({
      id: status.id.toString(),
      title: status.nome,
      color: status.cor,
      leads: filteredContatos
        .filter((c) => c.status_lead_id === status.id)
        .map(contatoToLead),
    }));

    // Adicionar coluna para contatos sem status
    const semStatus = filteredContatos.filter((c) => !c.status_lead_id);
    if (semStatus.length > 0) {
      newColumns.unshift({
        id: "0",
        title: "Sem Status",
        color: "#9CA3AF",
        leads: semStatus.map(contatoToLead),
      });
    }

    setColumns(newColumns);
  }, [statusLeads, contatos, searchTerm, filterSource]);

  // Handlers
  const handleColumnsChange = (newColumns: KanbanColumn[]) => {
    setColumns(newColumns);
  };

  const handleLeadMove = async (
    leadId: string,
    fromColumn: string,
    toColumn: string
  ) => {
    const contatoId = parseInt(leadId);
    const newStatusId = parseInt(toColumn);

    // Atualizar localmente primeiro (otimistic update)
    setContatos((prev) =>
      prev.map((c) =>
        c.id === contatoId
          ? { ...c, status_lead_id: newStatusId || null }
          : c
      )
    );

    // Atualizar no banco
    const result = await updateContatoStatus(contatoId, newStatusId);
    if (!result.success) {
      // Reverter se falhar
      console.error("Erro ao mover lead:", result.error);
      await loadData(); // Recarregar dados do banco
    }
  };

  const handleAddLead = (columnId: string) => {
    // Navegar para página de novo contato com status pré-selecionado
    window.location.href = `/dashboard/contatos/novo?status=${columnId}`;
  };

  const handleEditLead = (lead: Lead) => {
    window.location.href = `/dashboard/contatos/${lead.id}/editar`;
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (!confirm(`Tem certeza que deseja excluir ${lead.name}?`)) return;

    // Importar delete dinamicamente para evitar problemas de circular import
    const { deleteContato } = await import("@/services/contatos");
    const result = await deleteContato(parseInt(lead.id));

    if (result.success) {
      setContatos((prev) => prev.filter((c) => c.id.toString() !== lead.id));
    } else {
      alert("Erro ao excluir: " + result.error);
    }
  };

  const handleViewLead = (lead: Lead) => {
    window.location.href = `/dashboard/contatos/${lead.id}`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculate totals
  const totalLeads = columns.reduce((acc, col) => acc + col.leads.length, 0);

  // Get unique sources for filter
  const sources = React.useMemo(() => {
    const uniqueSources = new Set(contatos.map((c) => c.origem).filter(Boolean));
    return Array.from(uniqueSources);
  }, [contatos]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
          <p className="text-muted-foreground">Carregando Kanban...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (statusLeads.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Kanban className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold">Kanban não configurado</h3>
        <p className="mt-1 text-muted-foreground">
          Nenhum status de lead foi configurado no sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Kanban de Leads
          </h1>
          <p className="text-muted-foreground">
            {totalLeads} leads no funil de vendas
          </p>
        </div>
        <Button variant="solar" asChild>
          <Link href="/dashboard/contatos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Lead
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {sources.map((source) => (
              <SelectItem key={source} value={source || "unknown"}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <KanbanBoard
          columns={columns}
          onColumnsChange={handleColumnsChange}
          onAddLead={handleAddLead}
          onEditLead={handleEditLead}
          onDeleteLead={handleDeleteLead}
          onViewLead={handleViewLead}
          onLeadMove={handleLeadMove}
        />
      </div>
    </div>
  );
}
