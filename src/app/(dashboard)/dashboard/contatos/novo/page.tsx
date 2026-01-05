"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, Loader2, Save, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createContato, ORIGENS } from "@/services/contatos";
import { getStatusLeads } from "@/services/status-leads";
import type { StatusLeadFotovoltaico, ContatoFormData } from "@/types/database";

export default function NovoContatoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [loadingStatus, setLoadingStatus] = React.useState(true);
  const [statusLeads, setStatusLeads] = React.useState<StatusLeadFotovoltaico[]>([]);

  // Form state
  const [formData, setFormData] = React.useState<ContatoFormData>({
    nome: "",
    celular: "",
    potencia_consumo_medio: "",
    origem: "manual",
    status_lead_id: 1,
    atendimento_automatico: true,
    observacoes_status: "",
  });

  // Carregar status
  React.useEffect(() => {
    async function loadStatus() {
      const result = await getStatusLeads();
      if (result.success && result.data) {
        setStatusLeads(result.data);
        // Set default to first status
        if (result.data.length > 0) {
          setFormData((prev) => ({ ...prev, status_lead_id: result.data![0].id }));
        }
      }
      setLoadingStatus(false);
    }
    loadStatus();
  }, []);

  // Handle input changes
  const handleChange = (field: keyof ContatoFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      alert("Erro: Usuário não autenticado");
      return;
    }

    if (!formData.nome.trim() || !formData.celular.trim()) {
      alert("Por favor, preencha nome e celular");
      return;
    }

    setLoading(true);
    try {
      const result = await createContato(user.id, formData);

      if (result.success) {
        router.push("/dashboard/contatos");
      } else {
        alert("Erro ao criar contato: " + result.error);
      }
    } catch (error) {
      console.error("Erro ao criar contato:", error);
      alert("Erro ao criar contato");
    } finally {
      setLoading(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/contatos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Novo Contato
          </h1>
          <p className="text-muted-foreground">
            Adicione um novo lead ao sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>
                Informações básicas do contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  placeholder="Nome completo"
                  value={formData.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="celular">Celular *</Label>
                <Input
                  id="celular"
                  placeholder="(99) 99999-9999"
                  value={formData.celular}
                  onChange={(e) => handleChange("celular", e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  O celular será formatado automaticamente para WhatsApp
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="potencia_consumo_medio">Consumo Médio (kWh)</Label>
                <Input
                  id="potencia_consumo_medio"
                  placeholder="Ex: 500"
                  value={formData.potencia_consumo_medio || ""}
                  onChange={(e) => handleChange("potencia_consumo_medio", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Status e configurações do lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="origem">Origem</Label>
                <Select
                  value={formData.origem}
                  onValueChange={(value) => handleChange("origem", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
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

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status_lead_id?.toString()}
                  onValueChange={(value) => handleChange("status_lead_id", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
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

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Atendimento Automático (IA)</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar atendimento por IA para este contato
                  </p>
                </div>
                <Switch
                  checked={formData.atendimento_automatico}
                  onCheckedChange={(checked) => handleChange("atendimento_automatico", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações sobre o contato..."
                  value={formData.observacoes_status || ""}
                  onChange={(e) => handleChange("observacoes_status", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/contatos">Cancelar</Link>
          </Button>
          <Button type="submit" variant="solar" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Contato
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
