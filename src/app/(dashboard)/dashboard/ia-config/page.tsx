"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  Bot,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
  Save,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getEmpresaData, updateIAConfig } from "@/services/empresa";
import type { AcessoFotovoltaico, IAConfig } from "@/types/database";

export default function IAConfigPage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [empresa, setEmpresa] = React.useState<AcessoFotovoltaico | null>(null);

  // Estados de configuração de IA
  const [iaConfig, setIaConfig] = React.useState<IAConfig>({
    atender_apenas_trafego: false,
  });

  // Carregar dados
  const loadData = React.useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getEmpresaData(user.id);

      if (result.success && result.data) {
        setEmpresa(result.data);
        setIaConfig({
          atender_apenas_trafego: result.data.atender_apenas_trafego ?? false,
        });
      } else {
        setError(result.error || "Erro ao carregar configurações");
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Salvar configurações de IA
  const handleSaveIAConfig = async () => {
    if (!user?.id) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await updateIAConfig(user.id, iaConfig);

      if (result.success) {
        setSuccessMessage("Configurações salvas com sucesso!");
        if (result.data) {
          setEmpresa(result.data);
        }
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || "Erro ao salvar configurações");
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  // Estado de loading
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
          <p className="text-muted-foreground">Carregando configurações...</p>
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
            Configuração de IA
          </h1>
          <p className="text-muted-foreground">
            Configure o modo de atendimento do agente de IA
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Mensagens de feedback */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status da IA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-solar-500" />
              Status do Agente de IA
            </CardTitle>
            <CardDescription>
              Informações sobre o agente de atendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Agente Ativo</p>
                  <p className="text-sm text-muted-foreground">
                    Processando mensagens automaticamente
                  </p>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500">
                Online
              </Badge>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Informação</span>
              </div>
              <p className="mt-1 text-sm text-blue-600">
                O modelo de IA e as configurações avançadas são gerenciados pela equipe técnica.
                Para alterações, entre em contato com o suporte.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Modo de Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-solar-500" />
              Modo de Atendimento
            </CardTitle>
            <CardDescription>
              Configure quais leads serão atendidos automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    iaConfig.atender_apenas_trafego ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <Zap
                    className={`h-5 w-5 ${
                      iaConfig.atender_apenas_trafego ? "text-blue-600" : "text-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium">
                    {iaConfig.atender_apenas_trafego
                      ? "Apenas Tráfego Pago"
                      : "Todos os Leads"
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {iaConfig.atender_apenas_trafego
                      ? "Atendendo apenas leads de campanhas pagas"
                      : "Atendendo todos os leads que entrarem em contato"}
                  </p>
                </div>
              </div>
              <Switch
                checked={iaConfig.atender_apenas_trafego}
                onCheckedChange={(checked) =>
                  setIaConfig(prev => ({ ...prev, atender_apenas_trafego: checked }))
                }
              />
            </div>

            <div className="rounded-lg bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Atenção</span>
              </div>
              <p className="mt-1 text-sm text-amber-600">
                {iaConfig.atender_apenas_trafego
                  ? "Leads que não vierem de campanhas de tráfego pago não serão atendidos automaticamente."
                  : "Todos os leads receberão atendimento automático, independente da origem."}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="solar"
              onClick={handleSaveIAConfig}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Configurações
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo das Configurações</CardTitle>
          <CardDescription>
            Visão geral das suas configurações atuais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Status do Agente</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="font-semibold">Ativo</span>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Modo de Atendimento</p>
              <Badge variant="outline" className="mt-1">
                {iaConfig.atender_apenas_trafego ? "Tráfego Pago" : "Todos os Leads"}
              </Badge>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Empresa</p>
              <p className="mt-1 font-semibold">{empresa?.nome_empresa || empresa?.empresa || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
