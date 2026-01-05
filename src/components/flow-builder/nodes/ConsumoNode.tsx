'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { ConsumoNodeData } from '@/types/flow.types';

type ConsumoNodeProps = NodeProps & {
  data: ConsumoNodeData;
};

export const ConsumoNode = memo(function ConsumoNode({
  data,
  selected,
}: ConsumoNodeProps) {
  return (
    <BaseNode
      label={data.label || 'Consumo kWh'}
      icon={<Zap className="h-4 w-4" />}
      color="#f59e0b"
      selected={selected}
    >
      <p className="line-clamp-2 text-xs text-gray-600">
        {data.pergunta || 'Pergunta sobre consumo de energia'}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
          {data.unidade === 'kWh' ? 'Consumo kWh' : 'Valor R$'}
        </span>
        {data.validarMinimo && (
          <span className="text-[10px] text-gray-500">
            Min: {data.validarMinimo}
          </span>
        )}
        {data.validarMaximo && (
          <span className="text-[10px] text-gray-500">
            Max: {data.validarMaximo}
          </span>
        )}
      </div>
    </BaseNode>
  );
});
