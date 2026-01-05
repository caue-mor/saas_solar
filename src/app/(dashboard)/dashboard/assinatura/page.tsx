"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import {
  CreditCard,
  Check,
  X,
  Zap,
  Star,
  Crown,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getEmpresaData, updatePlano } from "@/services/empresa";
import type { AcessoFotovoltaico, ProdutoPlano, StatusPlano } from "@/types/database";

// Definição dos planos disponíveis
const PLANOS = [
  {
    id: "CRM POR VOZ" as ProdutoPlano,
    name: "CRM + Voz",
    price: 197,
    description: "Ideal para começar a organizar seus leads",
    features: [
      { name: "CRM completo", included: true },
      { name: "Kanban de leads", included: true },
      { name: "WhatsApp integrado", included: true },
      { name: "Atendimento com IA", included: false },
      { name: "Follow-up automático", included: false },
      { name: "Relatórios avançados", included: false },
    ],
    icon: Zap,
    popular: false,
  },
  {
    id: "IA ATENDIMENTO" as ProdutoPlano,
    name: "IA Atendimento",
    price: 397,
    description: "Atendimento automatizado com inteligência artificial",
    features: [
      { name: "CRM completo", included: true },
      { name: "Kanban de leads", included: true },
      { name: "WhatsApp integrado", included: true },
      { name: "Atendimento com IA", included: true },
      { name: "Follow-up automático", included: false },
      { name: "Relatórios avançados", included: true },
    ],
    icon: Star,
    popular: true,
  },
  {
    id: "IA ATENDIMENTO + FOLLOW" as ProdutoPlano,
    name: "IA + Follow-up",
    price: 597,
    description: "Solução completa com automação total",
    features: [
      { name: "CRM completo", included: true },
      { name: "Kanban de leads", included: true },
      { name: "WhatsApp integrado", included: true },
      { name: "Atendimento com IA", included: true },
      { name: "Follow-up automático", included: true },
      { name: "Relatórios avançados", included: true },
    ],
    icon: Crown,
    popular: false,
  },
];

// Helper para mapear status para cor/estilo
function getStatusStyle(status: StatusPlano | null) {
  switch (status) {
    case "ativo":
      return { bg: "bg-green-500", text: "text-green-700", label: "Ativo" };
    case "pendente":
      return { bg: "bg-yellow-500", text: "text-yellow-700", label: "Pendente" };
    case "inativo":
      return { bg: "bg-red-500", text: "text-red-700", label: "Inativo" };
    default:
      return { bg: "bg-gray-500", text: "text-gray-700", label: "Não configurado" };
  }
}

export default function AssinaturaPage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [empresa, setEmpresa] = React.useState<AcessoFotovoltaico | null>(null);

  // Carregar dados da empresa
  const loadData = React.useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getEmpresaData(user.id);

      if (result.success && result.data) {
        setEmpresa(result.data);
      } else {
        setError(result.error || "Erro ao carregar dados da assinatura");
      }
    } catch (err) {
      console.error("Erro ao carregar:", err);
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Selecionar plano
  const handleSelectPlan = async (planoId: ProdutoPlano) => {
    if (!user?.id) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await updatePlano(user.id, {
        status_plano: "pendente",
        produto_plano: planoId,
      });

      if (result.success) {
        setSuccessMessage("Plano selecionado! Aguardando confirmação de pagamento.");
        if (result.data) {
          setEmpresa(result.data);
        }
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(result.error || "Erro ao selecionar plano");
      }
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro ao selecionar plano");
    } finally {
      setSaving(false);
    }
  };

  // Obter plano atual
  const planoAtual = PLANOS.find((p) => p.id === empresa?.produto_plano);
  const statusPlano = getStatusStyle(empresa?.status_plano ?? null);

  // Estado de loading
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
          <p className="text-muted-foreground">Carregando assinatura...</p>
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
            Assinatura
          </h1>
          <p className="text-muted-foreground">
            Gerencie seu plano e pagamentos
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

      <Tabs defaultValue="plano" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plano">
            <CreditCard className="mr-2 h-4 w-4" />
            Meu Plano
          </TabsTrigger>
          <TabsTrigger value="planos">
            <Star className="mr-2 h-4 w-4" />
            Planos Disponíveis
          </TabsTrigger>
        </TabsList>

        {/* Meu Plano Tab */}
        <TabsContent value="plano" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Plano Atual */}
            <Card>
              <CardHeader>
                <CardTitle>Plano Atual</CardTitle>
                <CardDescription>
                  Detalhes da sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {planoAtual ? (
                  <>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-solar-100">
                          <planoAtual.icon className="h-6 w-6 text-solar-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{planoAtual.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(planoAtual.price)}/mês
                          </p>
                        </div>
                      </div>
                      <Badge variant="default" className={statusPlano.bg}>
                        {statusPlano.label}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Produto</span>
                        <span className="font-medium">{empresa?.produto_plano}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className={`font-medium ${statusPlano.text}`}>
                          {statusPlano.label}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Empresa</span>
                        <span className="font-medium">{empresa?.nome_empresa || empresa?.empresa}</span>
                      </div>
                      {empresa?.created_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cliente desde</span>
                          <span className="font-medium">
                            {new Date(empresa.created_at).toLocaleDateString("pt-BR", {
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="mb-2 h-12 w-12 text-muted-foreground/50" />
                    <p className="font-medium">Nenhum plano selecionado</p>
                    <p className="text-sm text-muted-foreground">
                      Selecione um plano na aba "Planos Disponíveis"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recursos do Plano */}
            <Card>
              <CardHeader>
                <CardTitle>Recursos do Plano</CardTitle>
                <CardDescription>
                  Funcionalidades incluídas na sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                {planoAtual ? (
                  <ul className="space-y-3">
                    {planoAtual.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span
                          className={feature.included ? "" : "text-muted-foreground"}
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-muted-foreground">
                    Selecione um plano para ver os recursos
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alerta de Upgrade */}
          {planoAtual && planoAtual.id !== "IA ATENDIMENTO + FOLLOW" && empresa?.status_plano === "ativo" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="flex items-center gap-4 pt-6">
                <AlertCircle className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800">
                    Upgrade disponível!
                  </p>
                  <p className="text-sm text-yellow-700">
                    {planoAtual.id === "CRM POR VOZ"
                      ? "Desbloqueie o atendimento com IA e aumente suas conversões."
                      : "Desbloqueie o Follow-up automático e aumente suas conversões em até 40%."}
                  </p>
                </div>
                <Button
                  variant="default"
                  className="ml-auto bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => {
                    const nextPlan = planoAtual.id === "CRM POR VOZ"
                      ? "IA ATENDIMENTO" as ProdutoPlano
                      : "IA ATENDIMENTO + FOLLOW" as ProdutoPlano;
                    handleSelectPlan(nextPlan);
                  }}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fazer Upgrade"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status Pendente */}
          {empresa?.status_plano === "pendente" && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="flex items-center gap-4 pt-6">
                <Calendar className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800">
                    Pagamento Pendente
                  </p>
                  <p className="text-sm text-blue-700">
                    Seu plano está aguardando confirmação de pagamento.
                    Entre em contato com o suporte se precisar de ajuda.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Inativo */}
          {empresa?.status_plano === "inativo" && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-4 pt-6">
                <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">
                    Assinatura Inativa
                  </p>
                  <p className="text-sm text-red-700">
                    Sua assinatura está inativa. Selecione um plano para reativar o acesso.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Planos Tab */}
        <TabsContent value="planos" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {PLANOS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = plan.id === empresa?.produto_plano;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    plan.popular ? "border-solar-500 shadow-lg" : ""
                  } ${isCurrentPlan ? "ring-2 ring-solar-500" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-solar-500">Mais Popular</Badge>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500">Seu Plano</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-solar-100">
                      <Icon className="h-6 w-6 text-solar-600" />
                    </div>
                    <CardTitle className="mt-4">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span
                            className={
                              feature.included ? "" : "text-muted-foreground"
                            }
                          >
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={isCurrentPlan ? "outline" : "solar"}
                      className="w-full"
                      disabled={isCurrentPlan || saving}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {saving && !isCurrentPlan ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {isCurrentPlan ? "Plano Atual" : "Selecionar Plano"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Nota sobre pagamento */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Sobre os pagamentos</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ao selecionar um plano, o status será alterado para "Pendente".
                    Após a confirmação do pagamento, seu plano será ativado automaticamente.
                    Para dúvidas sobre faturamento, entre em contato com nosso suporte.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
