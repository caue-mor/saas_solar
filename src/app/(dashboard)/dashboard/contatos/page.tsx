"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Phone,
  Download,
  Upload,
  Loader2,
  Users,
  Calendar,
  Bot,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getContatos, deleteContato, toggleAtendimentoIA } from "@/services/contatos";
import { getStatusLeads } from "@/services/status-leads";
import type { ContatoFotovoltaico, StatusLeadFotovoltaico } from "@/types/database";

// Função para formatar celular (remove @s.whatsapp.net e código do país na exibição)
function formatPhone(phone: string): string {
  // Remove @s.whatsapp.net ou similar do final
  let cleanPhone = phone.replace(/@s\.whatsapp\.net$/i, '').replace(/@c\.us$/i, '');

  // Remove caracteres não numéricos
  const cleaned = cleanPhone.replace(/\D/g, '');

  // Remove código do país (55) se presente (13 dígitos = 55 + DDD + número)
  let finalNumber = cleaned;
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    finalNumber = cleaned.slice(2);
  }

  // Formata o número
  if (finalNumber.length === 11) {
    return `(${finalNumber.slice(0, 2)}) ${finalNumber.slice(2, 7)}-${finalNumber.slice(7)}`;
  }
  if (finalNumber.length === 10) {
    return `(${finalNumber.slice(0, 2)}) ${finalNumber.slice(2, 6)}-${finalNumber.slice(6)}`;
  }
  return finalNumber || phone;
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

// Função para formatar data
function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR");
}

export default function ContatosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [contatos, setContatos] = React.useState<ContatoFotovoltaico[]>([]);
  const [statusLeads, setStatusLeads] = React.useState<StatusLeadFotovoltaico[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [dataInicial, setDataInicial] = React.useState<string>("");
  const [dataFinal, setDataFinal] = React.useState<string>("");
  const [togglingIA, setTogglingIA] = React.useState<number | null>(null);

  // Carregar dados
  React.useEffect(() => {
    async function loadData() {
      if (!user?.id) return;

      setLoading(true);
      try {
        const [contatosResult, statusResult] = await Promise.all([
          getContatos(user.id),
          getStatusLeads(),
        ]);

        if (contatosResult.success && contatosResult.data) {
          setContatos(contatosResult.data);
        }

        if (statusResult.success && statusResult.data) {
          setStatusLeads(statusResult.data);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id]);

  // Mapear status por ID
  const statusMap = React.useMemo(() => {
    const map = new Map<number, StatusLeadFotovoltaico>();
    statusLeads.forEach((s) => map.set(s.id, s));
    return map;
  }, [statusLeads]);

  // Filtrar contatos
  const filteredContacts = React.useMemo(() => {
    return contatos.filter((contact) => {
      const matchesSearch =
        contact.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.celular.includes(searchTerm);

      const matchesStatus =
        filterStatus === "all" ||
        contact.status_lead_id?.toString() === filterStatus;

      // Filtro por data inicial
      let matchesDataInicial = true;
      if (dataInicial && contact.created_on) {
        const contactDate = new Date(contact.created_on);
        const filterDate = new Date(dataInicial);
        matchesDataInicial = contactDate >= filterDate;
      }

      // Filtro por data final
      let matchesDataFinal = true;
      if (dataFinal && contact.created_on) {
        const contactDate = new Date(contact.created_on);
        const filterDate = new Date(dataFinal);
        filterDate.setHours(23, 59, 59, 999);
        matchesDataFinal = contactDate <= filterDate;
      }

      return matchesSearch && matchesStatus && matchesDataInicial && matchesDataFinal;
    });
  }, [contatos, searchTerm, filterStatus, dataInicial, dataFinal]);

  // Deletar contato
  const handleDelete = async (contatoId: number) => {
    if (!confirm("Tem certeza que deseja excluir este contato?")) return;

    const result = await deleteContato(contatoId);
    if (result.success) {
      setContatos((prev) => prev.filter((c) => c.id !== contatoId));
    } else {
      alert("Erro ao excluir contato: " + result.error);
    }
  };

  // Toggle IA para um lead
  const handleToggleIA = async (contatoId: number, novoStatus: boolean) => {
    setTogglingIA(contatoId);
    try {
      const result = await toggleAtendimentoIA(contatoId, novoStatus);
      if (result.success) {
        setContatos((prev) =>
          prev.map((c) =>
            c.id === contatoId ? { ...c, atendimento_automatico: novoStatus } : c
          )
        );
      } else {
        alert("Erro ao alterar status da IA: " + result.error);
      }
    } finally {
      setTogglingIA(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
          <p className="text-muted-foreground">Carregando contatos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Contatos
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus leads e clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="solar" asChild>
            <Link href="/dashboard/contatos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Contato
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Linha 1: Busca e Status */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statusLeads.map((status) => (
                    <SelectItem key={status.id} value={status.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: status.cor }}
                        />
                        {status.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Linha 2: Filtros de Data */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Data inicial:</span>
                <Input
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Data final:</span>
                <Input
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  className="w-40"
                />
              </div>
              {(dataInicial || dataFinal) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDataInicial("");
                    setDataFinal("");
                  }}
                >
                  Limpar datas
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contatos</CardTitle>
          <CardDescription>
            {filteredContacts.length} contatos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredContacts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Atendimento IA</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Consumo</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => {
                    const status = contact.status_lead_id
                      ? statusMap.get(contact.status_lead_id)
                      : null;

                    return (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-solar-100 text-sm font-semibold text-solar-700">
                              {getInitials(contact.nome)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{contact.nome}</p>
                                {contact.etapa_atual === 1 && (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                    Contato inicial
                                  </Badge>
                                )}
                              </div>
                              {contact.origem && (
                                <p className="text-xs text-muted-foreground">
                                  {contact.origem}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p>{formatPhone(contact.celular)}</p>
                        </TableCell>
                        <TableCell>
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
                            <Badge variant="outline">Sem status</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={contact.atendimento_automatico ?? true}
                              onCheckedChange={(checked) => handleToggleIA(contact.id, checked)}
                              disabled={togglingIA === contact.id}
                            />
                            <span className={`text-xs ${contact.atendimento_automatico ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {contact.atendimento_automatico ? 'Ativo' : 'Inativo'}
                            </span>
                            {togglingIA === contact.id && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {contact.origem || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {contact.potencia_consumo_medio || "-"}
                        </TableCell>
                        <TableCell>
                          {formatDate(contact.created_on)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <a
                                href={`https://wa.me/55${contact.celular.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageSquare className="h-4 w-4 text-green-600" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <a href={`tel:${contact.celular}`}>
                                <Phone className="h-4 w-4 text-blue-600" />
                              </a>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/contatos/${contact.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Detalhes
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/contatos/${contact.id}/editar`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(contact.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">Nenhum contato encontrado</h3>
              <p className="mt-1 text-muted-foreground">
                {searchTerm || filterStatus !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece adicionando seu primeiro contato"}
              </p>
              <Button variant="solar" className="mt-4" asChild>
                <Link href="/dashboard/contatos/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Contato
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
