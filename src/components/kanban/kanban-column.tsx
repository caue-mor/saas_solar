"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeadCard, Lead } from "./lead-card";
import { Plus, MoreHorizontal } from "lucide-react";

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  leads: Lead[];
}

interface KanbanColumnProps {
  column: KanbanColumn;
  onAddLead?: (columnId: string) => void;
  onEditLead?: (lead: Lead) => void;
  onDeleteLead?: (lead: Lead) => void;
  onViewLead?: (lead: Lead) => void;
  onDragStart?: (e: React.DragEvent, lead: Lead) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, columnId: string) => void;
  isDragOver?: boolean;
}

export function KanbanColumnComponent({
  column,
  onAddLead,
  onEditLead,
  onDeleteLead,
  onViewLead,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: KanbanColumnProps) {
  return (
    <div
      className={cn(
        "kanban-column flex w-80 flex-shrink-0 flex-col rounded-lg bg-muted/50",
        isDragOver && "drag-over"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDrop={(e) => onDrop?.(e, column.id)}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-semibold">{column.title}</h3>
          <Badge variant="secondary" className="ml-1">
            {column.leads.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddLead?.(column.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Column Content */}
      <ScrollArea className="kanban-cards-container flex-1 px-3 pb-3">
        <div className="space-y-3">
          {column.leads.map((lead) => (
            <div
              key={lead.id}
              draggable
              onDragStart={(e) => onDragStart?.(e, lead)}
            >
              <LeadCard
                lead={lead}
                onEdit={onEditLead}
                onDelete={onDeleteLead}
                onView={onViewLead}
              />
            </div>
          ))}
          {column.leads.length === 0 && (
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 text-sm text-muted-foreground">
              Nenhum lead
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
