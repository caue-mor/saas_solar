"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Building2, Calendar, Shield, Loader2, Save } from "lucide-react";

export default function PerfilPage() {
  const { user } = useAuth();
  const [saving, setSaving] = React.useState(false);

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
      </div>
    );
  }

  const initials = user.nome_empresa
    ? user.nome_empresa.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() || "US";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Meu Perfil
        </h1>
        <p className="text-muted-foreground">
          Visualize e gerencie suas informações pessoais
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-solar-100 text-2xl text-solar-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{user.nome_empresa || "Empresa"}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Badge
                variant={user.status_plano === "ativo" ? "default" : "secondary"}
                className={user.status_plano === "ativo" ? "bg-green-500" : ""}
              >
                {user.status_plano === "ativo" ? "Plano Ativo" : "Plano Pendente"}
              </Badge>
            </div>
            {user.produto_plano && (
              <p className="text-center text-sm text-muted-foreground">
                {user.produto_plano}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações da Conta
            </CardTitle>
            <CardDescription>
              Dados básicos do seu cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Nome da Empresa
                </Label>
                <Input value={user.nome_empresa || ""} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Responsável
                </Label>
                <Input value={user.nome_atendente || ""} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input value={user.email || ""} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Membro desde
                </Label>
                <Input
                  value={
                    user.created_at
                      ? new Date(user.created_at).toLocaleDateString("pt-BR")
                      : "-"
                  }
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <a href="/dashboard/empresa">Editar dados da empresa</a>
            </Button>
          </CardFooter>
        </Card>

        {/* Security Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Gerencie sua senha e configurações de segurança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Senha</p>
                <p className="text-sm text-muted-foreground">
                  Altere sua senha periodicamente para maior segurança
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href="/dashboard/empresa?tab=seguranca">Alterar senha</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
