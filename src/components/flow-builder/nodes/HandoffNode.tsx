'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { UserCheck } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { HandoffNodeData } from '@/types/flow.types';

type HandoffNodeProps = NodeProps & {
  data: HandoffNodeData;
};

const PRIORIDADE_COLORS: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-700',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
};

export const HandoffNode = memo(function HandoffNode({
  data,
  selected,
}: HandoffNodeProps) {
  return (
    <BaseNode
      label={data.label || 'Transferir'}
      icon={<UserCheck className="h-4 w-4" />}
      color="#ef4444"
      selected={selected}
      hasOutput={false}
    >
      <p className="line-clamp-2 text-xs text-gray-600">
        {data.motivo || 'Transfere para atendente humano'}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <span
          className={`rounded px-2 py-0.5 text-[10px] ${PRIORIDADE_COLORS[data.prioridade] || PRIORIDADE_COLORS.media}`}
        >
          {data.prioridade}
        </span>
        {data.notificarEquipe && (
          <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
            Notifica equipe
          </span>
        )}
      </div>
    </BaseNode>
  );
});
