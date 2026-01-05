'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Home } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { TelhadoNodeData } from '@/types/flow.types';

type TelhadoNodeProps = NodeProps & {
  data: TelhadoNodeData;
};

export const TelhadoNode = memo(function TelhadoNode({
  data,
  selected,
}: TelhadoNodeProps) {
  return (
    <BaseNode
      label={data.label || 'Foto Telhado'}
      icon={<Home className="h-4 w-4" />}
      color="#ec4899"
      selected={selected}
    >
      <p className="line-clamp-2 text-xs text-gray-600">
        {data.mensagemSolicitacao || 'Solicita foto do telhado'}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {data.analisarAutomatico && (
          <span className="rounded bg-pink-50 px-2 py-0.5 text-[10px] text-pink-700">
            Análise IA
          </span>
        )}
        {data.avaliarViabilidade && (
          <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
            Avalia viabilidade
          </span>
        )}
      </div>
    </BaseNode>
  );
});
