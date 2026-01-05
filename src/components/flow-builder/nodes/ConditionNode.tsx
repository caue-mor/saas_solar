'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { ConditionNodeData } from '@/types/flow.types';

type ConditionNodeProps = NodeProps & {
  data: ConditionNodeData;
};

const OPERADOR_LABELS: Record<string, string> = {
  igual: '=',
  diferente: '!=',
  maior: '>',
  menor: '<',
  contem: 'contém',
  existe: 'existe',
};

export const ConditionNode = memo(function ConditionNode({
  data,
  selected,
}: ConditionNodeProps) {
  return (
    <BaseNode
      label={data.label || 'Condição'}
      icon={<GitBranch className="h-4 w-4" />}
      color="#f97316"
      selected={selected}
      hasConditionalOutputs={true}
    >
      <div className="space-y-1">
        <p className="text-xs text-gray-600">
          Se <span className="font-medium text-orange-600">{data.campo}</span>
        </p>
        <p className="text-xs">
          <span className="rounded bg-orange-100 px-1.5 py-0.5 font-mono text-orange-800">
            {OPERADOR_LABELS[data.operador] || data.operador}
          </span>
          <span className="ml-1 font-medium">{String(data.valor)}</span>
        </p>
      </div>
    </BaseNode>
  );
});
