'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { FileImage } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { ContaLuzNodeData } from '@/types/flow.types';

type ContaLuzNodeProps = NodeProps & {
  data: ContaLuzNodeData;
};

export const ContaLuzNode = memo(function ContaLuzNode({
  data,
  selected,
}: ContaLuzNodeProps) {
  return (
    <BaseNode
      label={data.label || 'Conta de Luz'}
      icon={<FileImage className="h-4 w-4" />}
      color="#8b5cf6"
      selected={selected}
    >
      <p className="line-clamp-2 text-xs text-gray-600">
        {data.mensagemSolicitacao || 'Solicita foto da conta de luz'}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {data.analisarAutomatico && (
          <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] text-purple-700">
            Análise IA
          </span>
        )}
        {data.extrairConsumo && (
          <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
            Extrai kWh
          </span>
        )}
        {data.extrairValor && (
          <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
            Extrai R$
          </span>
        )}
      </div>
    </BaseNode>
  );
});
