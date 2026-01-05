'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Calendar } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { VisitaTecnicaNodeData } from '@/types/flow.types';

type VisitaNodeProps = NodeProps & {
  data: VisitaTecnicaNodeData;
};

export const VisitaNode = memo(function VisitaNode({
  data,
  selected,
}: VisitaNodeProps) {
  return (
    <BaseNode
      label={data.label || 'Visita Técnica'}
      icon={<Calendar className="h-4 w-4" />}
      color="#0ea5e9"
      selected={selected}
    >
      <p className="line-clamp-2 text-xs text-gray-600">
        {data.pergunta || 'Agenda visita técnica'}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {data.mostrarDisponibilidade && (
          <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700">
            Mostra horários
          </span>
        )}
        {data.confirmarEndereco && (
          <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] text-purple-700">
            Confirma endereço
          </span>
        )}
      </div>
    </BaseNode>
  );
});
