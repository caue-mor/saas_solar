"use client";

import * as React from "react";
import { cn, formatCurrency, formatPhone } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Phone,
  MessageSquare,
  MoreVertical,
  Calendar,
  DollarSign,
  Sun,
  User,
  Trash2,
  Eye,
} from "lucide-react";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  source: string;
  estimatedValue?: number;
  systemSize?: number;
  potencia?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  onView?: (lead: Lead) => void;
  onWhatsApp?: (lead: Lead) => void;
  onCall?: (lead: Lead) => void;
}

const sourceColors: Record<string, string> = {
  WHATSAPP: "bg-green-100 text-green-700",
  SITE: "bg-blue-100 text-blue-700",
  INDICACAO: "bg-purple-100 text-purple-700",
  TELEFONE: "bg-orange-100 text-orange-700",
  FACEBOOK: "bg-indigo-100 text-indigo-700",
  INSTAGRAM: "bg-pink-100 text-pink-700",
  TRAFEGO_PAGO: "bg-red-100 text-red-700",
  OUTRO: "bg-gray-100 text-gray-700",
};

const sourceLabels: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  SITE: "Site",
  INDICACAO: "Indicação",
  TELEFONE: "Telefone",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TRAFEGO_PAGO: "Tráfego Pago",
  OUTRO: "Outro",
};

export function LeadCard({
  lead,
  isDragging,
  onEdit,
  onDelete,
  onView,
  onWhatsApp,
  onCall,
}: LeadCardProps) {
  return (
    <Card
      className={cn(
        "lead-card cursor-grab bg-white p-3 shadow-sm",
        isDragging && "dragging opacity-50 rotate-2"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-solar-100 text-xs font-semibold text-solar-700">
            {lead.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-medium">{lead.name}</h4>
            <p className="text-xs text-muted-foreground">
              {formatPhone(lead.phone)}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(lead)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(lead)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-2">
        {lead.estimatedValue && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>{formatCurrency(lead.estimatedValue)}</span>
          </div>
        )}
        {lead.systemSize && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sun className="h-3 w-3" />
            <span>{lead.systemSize} kWp</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <Badge variant="outline" className={sourceColors[lead.source] || "bg-gray-100"}>
          {sourceLabels[lead.source] || lead.source}
        </Badge>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onWhatsApp?.(lead)}
          >
            <MessageSquare className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onCall?.(lead)}
          >
            <Phone className="h-3.5 w-3.5 text-blue-600" />
          </Button>
        </div>
      </div>

      {/* Date */}
      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{lead.createdAt}</span>
      </div>
    </Card>
  );
}
