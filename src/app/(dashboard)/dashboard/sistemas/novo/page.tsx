"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { createSistema } from "@/services/sistemas";
import { ArrowLeft, Loader2, Save, Sun } from "lucide-react";
import Link from "next/link";
import type { TipoSistema } from "@/types/database";

const tiposSistema: { value: TipoSistema; label: string }[] = [
  { value: "RESIDENCIAL", label: "Residencial" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "RURAL", label: "Rural" },
  { value: "INVESTIMENTO", label: "Investimento" },
];

export default function NovoSistemaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    tipo_sistema: "RESIDENCIAL" as TipoSistema,
    nome_cliente: "",
    descricao: "",
    potencia_usina: "",
    economia_anual: "",
    detalhes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    setError(null);

    const result = await createSistema(user.id, {
      tipo_sistema: formData.tipo_sistema,
      nome_cliente: formData.nome_cliente || undefined,
      descricao: formData.descricao || undefined,
      potencia_usina: formData.potencia_usina || undefined,
      economia_anual: formData.economia_anual || undefined,
      detalhes: formData.detalhes || undefined,
    });

    if (result.success) {
      router.push("/dashboard/sistemas");
    } else {
      setError(result.error || "Erro ao criar sistema");
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sistemas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Novo Sistema Solar
          </h1>
          <p className="text-muted-foreground">
            Cadastre um novo sistema no catálogo
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-solar-500" />
              Informações do Sistema
            </CardTitle>
            <CardDescription>
              Preencha os dados do sistema fotovoltaico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tipo_sistema">Tipo de Sistema *</Label>
                <Select
                  value={formData.tipo_sistema}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, tipo_sistema: v as TipoSistema }))
                  }
                >
                  <SelectTrigger id="tipo_sistema">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposSistema.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_cliente">Nome do Cliente</Label>
                <Input
                  id="nome_cliente"
                  value={formData.nome_cliente}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nome_cliente: e.target.value }))
                  }
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="potencia_usina">Potência (kWp)</Label>
                <Input
                  id="potencia_usina"
                  value={formData.potencia_usina}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, potencia_usina: e.target.value }))
                  }
                  placeholder="Ex: 5.5 kWp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="economia_anual">Economia Anual</Label>
                <Input
                  id="economia_anual"
                  value={formData.economia_anual}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, economia_anual: e.target.value }))
                  }
                  placeholder="Ex: R$ 8.000,00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="Breve descrição do sistema instalado..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detalhes">Detalhes Técnicos</Label>
              <Textarea
                id="detalhes"
                value={formData.detalhes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, detalhes: e.target.value }))
                }
                placeholder="Detalhes técnicos, equipamentos utilizados, etc..."
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/sistemas")}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="solar" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Sistema
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
