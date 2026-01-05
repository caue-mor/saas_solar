"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Sun,
  Zap,
  Grid,
  List,
  Loader2,
  RefreshCw,
} from "lucide-react";

// Tipo do sistema baseado na tabela real
interface Sistema {
  id: string;
  empresa_id: string;
  tipo_sistema: "RESIDENCIAL" | "COMERCIAL" | "RURAL" | "INVESTIMENTO";
  descricao: string | null;
  imagem1: string | null;
  imagem2: string | null;
  potencia_usina: string | null;
  economia_anual: string | null;
  nome_cliente: string | null;
  detalhes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const typeColors: Record<string, string> = {
  RESIDENCIAL: "bg-green-100 text-green-700",
  COMERCIAL: "bg-blue-100 text-blue-700",
  RURAL: "bg-yellow-100 text-yellow-700",
  INVESTIMENTO: "bg-purple-100 text-purple-700",
};

const typeLabels: Record<string, string> = {
  RESIDENCIAL: "Residencial",
  COMERCIAL: "Comercial",
  RURAL: "Rural",
  INVESTIMENTO: "Investimento",
};

export default function SistemasPage() {
  const { user } = useAuth();
  const [systems, setSystems] = React.useState<Sistema[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Estado para modal de novo/editar sistema
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSystem, setEditingSystem] = React.useState<Sistema | null>(null);
  const [formData, setFormData] = React.useState({
    tipo_sistema: "RESIDENCIAL" as Sistema["tipo_sistema"],
    nome_cliente: "",
    descricao: "",
    potencia_usina: "",
    economia_anual: "",
    detalhes: "",
    imagem1: "",
    imagem2: "",
  });
  const [saving, setSaving] = React.useState(false);

  // Estado para confirmação de exclusão
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Buscar sistemas da API
  const fetchSystems = React.useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        empresaId: user.id.toString(),
      });

      if (filterType && filterType !== "all") {
        params.append("tipo", filterType);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/systems?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSystems(data);
      } else {
        console.error("Erro ao buscar sistemas:", data.error);
      }
    } catch (error) {
      console.error("Erro ao buscar sistemas:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filterType, searchTerm]);

  // Buscar sistemas quando filtros mudarem
  React.useEffect(() => {
    const debounce = setTimeout(() => {
      fetchSystems();
    }, 300);

    return () => clearTimeout(debounce);
  }, [fetchSystems]);

  // Abrir modal para novo sistema
  const handleNewSystem = () => {
    setEditingSystem(null);
    setFormData({
      tipo_sistema: "RESIDENCIAL",
      nome_cliente: "",
      descricao: "",
      potencia_usina: "",
      economia_anual: "",
      detalhes: "",
      imagem1: "",
      imagem2: "",
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar sistema
  const handleEditSystem = (system: Sistema) => {
    setEditingSystem(system);
    setFormData({
      tipo_sistema: system.tipo_sistema,
      nome_cliente: system.nome_cliente || "",
      descricao: system.descricao || "",
      potencia_usina: system.potencia_usina || "",
      economia_anual: system.economia_anual || "",
      detalhes: system.detalhes || "",
      imagem1: system.imagem1 || "",
      imagem2: system.imagem2 || "",
    });
    setIsModalOpen(true);
  };

  // Salvar sistema (criar ou atualizar)
  const handleSaveSystem = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const url = editingSystem
        ? `/api/systems/${editingSystem.id}`
        : "/api/systems";
      const method = editingSystem ? "PATCH" : "POST";

      const body = editingSystem
        ? formData
        : { ...formData, empresa_id: Number(user.id) };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchSystems();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error("Erro ao salvar sistema:", error);
      alert("Erro ao salvar sistema");
    } finally {
      setSaving(false);
    }
  };

  // Excluir sistema
  const handleDeleteSystem = async (id: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/systems/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteConfirm(null);
        fetchSystems();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error("Erro ao excluir sistema:", error);
      alert("Erro ao excluir sistema");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Sistemas Solares
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus kits de sistemas fotovoltaicos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSystems} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="solar" onClick={handleNewSystem}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Sistema
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="RESIDENCIAL">Residencial</SelectItem>
                <SelectItem value="COMERCIAL">Comercial</SelectItem>
                <SelectItem value="RURAL">Rural</SelectItem>
                <SelectItem value="INVESTIMENTO">Investimento</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 rounded-md border p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
          <span className="ml-2 text-muted-foreground">Carregando sistemas...</span>
        </div>
      )}

      {/* Systems Grid */}
      {!loading && viewMode === "grid" && systems.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {systems.map((system) => (
            <Card key={system.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {system.imagem1 ? (
                  <Image
                    src={system.imagem1}
                    alt={system.nome_cliente || "Sistema"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-solar-100 to-solar-200">
                    <Sun className="h-16 w-16 text-solar-500" />
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <Badge className="bg-green-500">Ativo</Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {system.nome_cliente || `Sistema ${system.tipo_sistema}`}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`mt-1 ${typeColors[system.tipo_sistema]}`}
                    >
                      {typeLabels[system.tipo_sistema]}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditSystem(system)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteConfirm(system.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {system.descricao || "Sem descrição"}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {system.potencia_usina && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Zap className="h-4 w-4 text-solar-500" />
                      <span>{system.potencia_usina} kWp</span>
                    </div>
                  )}
                  {system.economia_anual && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Sun className="h-4 w-4 text-solar-500" />
                      <span>Economia: {system.economia_anual}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {system.created_at
                      ? new Date(system.created_at).toLocaleDateString("pt-BR")
                      : "-"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSystem(system)}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Systems List */}
      {!loading && viewMode === "list" && systems.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {systems.map((system) => (
                <div
                  key={system.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-solar-100 overflow-hidden">
                    {system.imagem1 ? (
                      <Image
                        src={system.imagem1}
                        alt={system.nome_cliente || "Sistema"}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <Sun className="h-8 w-8 text-solar-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {system.nome_cliente || `Sistema ${system.tipo_sistema}`}
                      </h3>
                      <Badge
                        variant="outline"
                        className={typeColors[system.tipo_sistema]}
                      >
                        {typeLabels[system.tipo_sistema]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {system.potencia_usina && `${system.potencia_usina} kWp`}
                      {system.potencia_usina && system.economia_anual && " • "}
                      {system.economia_anual && `Economia: ${system.economia_anual}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {system.created_at
                        ? new Date(system.created_at).toLocaleDateString("pt-BR")
                        : "-"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditSystem(system)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteConfirm(system.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && systems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sun className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">
              Nenhum sistema encontrado
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterType !== "all"
                ? "Tente ajustar os filtros"
                : "Adicione seu primeiro sistema fotovoltaico"}
            </p>
            <Button variant="solar" className="mt-4" onClick={handleNewSystem}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Sistema
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Criar/Editar Sistema */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingSystem ? "Editar Sistema" : "Novo Sistema"}
            </DialogTitle>
            <DialogDescription>
              {editingSystem
                ? "Atualize as informações do sistema fotovoltaico"
                : "Preencha as informações do novo sistema fotovoltaico"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_sistema">Tipo de Sistema</Label>
                <Select
                  value={formData.tipo_sistema}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo_sistema: value as Sistema["tipo_sistema"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIDENCIAL">Residencial</SelectItem>
                    <SelectItem value="COMERCIAL">Comercial</SelectItem>
                    <SelectItem value="RURAL">Rural</SelectItem>
                    <SelectItem value="INVESTIMENTO">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome_cliente">Nome/Cliente</Label>
                <Input
                  id="nome_cliente"
                  value={formData.nome_cliente}
                  onChange={(e) =>
                    setFormData({ ...formData, nome_cliente: e.target.value })
                  }
                  placeholder="Ex: Família Silva"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="potencia_usina">Potência (kWp)</Label>
                <Input
                  id="potencia_usina"
                  value={formData.potencia_usina}
                  onChange={(e) =>
                    setFormData({ ...formData, potencia_usina: e.target.value })
                  }
                  placeholder="Ex: 5.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="economia_anual">Economia Anual</Label>
                <Input
                  id="economia_anual"
                  value={formData.economia_anual}
                  onChange={(e) =>
                    setFormData({ ...formData, economia_anual: e.target.value })
                  }
                  placeholder="Ex: R$ 8.000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descrição do sistema..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="detalhes">Detalhes Técnicos</Label>
              <Textarea
                id="detalhes"
                value={formData.detalhes}
                onChange={(e) =>
                  setFormData({ ...formData, detalhes: e.target.value })
                }
                placeholder="Especificações técnicas, equipamentos, etc..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imagem1">URL Imagem 1</Label>
                <Input
                  id="imagem1"
                  value={formData.imagem1}
                  onChange={(e) =>
                    setFormData({ ...formData, imagem1: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagem2">URL Imagem 2</Label>
                <Input
                  id="imagem2"
                  value={formData.imagem2}
                  onChange={(e) =>
                    setFormData({ ...formData, imagem2: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSystem} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSystem ? "Salvar Alterações" : "Criar Sistema"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este sistema? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDeleteSystem(deleteConfirm)}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
