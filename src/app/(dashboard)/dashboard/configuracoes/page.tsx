"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, Palette, Shield, Smartphone, Globe, ChevronRight } from "lucide-react";
import Link from "next/link";

interface ConfigCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

const configCards: ConfigCard[] = [
  {
    title: "Dados da Empresa",
    description: "Informações básicas, endereço e horário de funcionamento",
    icon: Globe,
    href: "/dashboard/empresa",
  },
  {
    title: "WhatsApp",
    description: "Configurar integração com WhatsApp e webhooks",
    icon: Smartphone,
    href: "/dashboard/whatsapp",
  },
  {
    title: "Configurações de IA",
    description: "Ajustar comportamento do atendimento automático",
    icon: Settings,
    href: "/dashboard/ia-config",
  },
  {
    title: "Follow-up Automático",
    description: "Configurar mensagens automáticas de acompanhamento",
    icon: Bell,
    href: "/dashboard/empresa?tab=followup",
    badge: "Novo",
  },
  {
    title: "Segurança",
    description: "Alterar senha e configurações de acesso",
    icon: Shield,
    href: "/dashboard/empresa?tab=seguranca",
  },
  {
    title: "Assinatura",
    description: "Gerenciar plano e pagamentos",
    icon: Palette,
    href: "/dashboard/assinatura",
  },
];

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie todas as configurações do sistema
        </p>
      </div>

      {/* Config Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configCards.map((config) => {
          const Icon = config.icon;
          return (
            <Link key={config.href} href={config.href}>
              <Card className="h-full cursor-pointer transition-all hover:border-solar-300 hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-solar-100">
                    <Icon className="h-5 w-5 text-solar-600" />
                  </div>
                  {config.badge && (
                    <Badge className="bg-green-500">{config.badge}</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <CardTitle className="mb-1 text-lg">{config.title}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                  <div className="mt-4 flex items-center text-sm text-solar-600">
                    Acessar
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Precisa de ajuda?</CardTitle>
          <CardDescription>
            Entre em contato com nosso suporte para dúvidas sobre configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            Falar com Suporte
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
