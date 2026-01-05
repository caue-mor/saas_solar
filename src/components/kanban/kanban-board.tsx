"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { KanbanColumnComponent, KanbanColumn } from "./kanban-column";
import { Lead } from "./lead-card";

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onColumnsChange?: (columns: KanbanColumn[]) => void;
  onAddLead?: (columnId: string) => void;
  onEditLead?: (lead: Lead) => void;
  onDeleteLead?: (lead: Lead) => void;
  onViewLead?: (lead: Lead) => void;
  onLeadMove?: (leadId: string, fromColumn: string, toColumn: string) => void;
}

export function KanbanBoard({
  columns,
  onColumnsChange,
  onAddLead,
  onEditLead,
  onDeleteLead,
  onViewLead,
  onLeadMove,
}: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = React.useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", lead.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();

    if (!draggedLead) return;

    // Find source column
    const sourceColumn = columns.find((col) =>
      col.leads.some((lead) => lead.id === draggedLead.id)
    );

    if (!sourceColumn || sourceColumn.id === targetColumnId) {
      setDraggedLead(null);
      setDragOverColumn(null);
      return;
    }

    // Update columns
    const newColumns = columns.map((col) => {
      if (col.id === sourceColumn.id) {
        return {
          ...col,
          leads: col.leads.filter((lead) => lead.id !== draggedLead.id),
        };
      }
      if (col.id === targetColumnId) {
        return {
          ...col,
          leads: [...col.leads, { ...draggedLead, status: targetColumnId }],
        };
      }
      return col;
    });

    onColumnsChange?.(newColumns);
    onLeadMove?.(draggedLead.id, sourceColumn.id, targetColumnId);
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  const handleDragEnter = (columnId: string) => {
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          onDragEnter={() => handleDragEnter(column.id)}
          onDragLeave={handleDragLeave}
        >
          <KanbanColumnComponent
            column={column}
            onAddLead={onAddLead}
            onEditLead={onEditLead}
            onDeleteLead={onDeleteLead}
            onViewLead={onViewLead}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragOver={dragOverColumn === column.id}
          />
        </div>
      ))}
    </div>
  );
}
