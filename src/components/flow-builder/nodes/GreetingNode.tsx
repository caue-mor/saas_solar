'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Hand } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { GreetingNodeData } from '@/types/flow.types';

type GreetingNodeProps = NodeProps & {
  data: GreetingNodeData;
};

export const GreetingNode = memo(function GreetingNode({
  data,
  selected,
}: GreetingNodeProps) {
  return (
    <BaseNode
      label={data.label || 'Saudação'}
      icon={<Hand className="h-4 w-4" />}
      color="#22c55e"
      selected={selected}
      hasInput={false}
      hasOutput={true}
    >
      <p className="line-clamp-3 text-xs text-gray-600">
        {data.mensagem || 'Configure a mensagem de boas-vindas'}
      </p>
      {data.personalizarHorario && (
        <div className="mt-2 rounded bg-green-50 px-2 py-1 text-[10px] text-green-700">
          Personalizado por horário
        </div>
      )}
    </BaseNode>
  );
});
