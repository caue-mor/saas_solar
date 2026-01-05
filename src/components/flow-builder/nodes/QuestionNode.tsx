'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { HelpCircle } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { QuestionNodeData } from '@/types/flow.types';

type QuestionNodeProps = NodeProps & {
  data: QuestionNodeData;
};

const TIPO_LABELS: Record<string, string> = {
  texto: 'Texto',
  numero: 'Número',
  opcoes: 'Opções',
  sim_nao: 'Sim/Não',
};

export const QuestionNode = memo(function QuestionNode({
  data,
  selected,
}: QuestionNodeProps) {
  return (
    <BaseNode
      label={data.label || 'Pergunta'}
      icon={<HelpCircle className="h-4 w-4" />}
      color="#3b82f6"
      selected={selected}
    >
      <p className="line-clamp-2 text-xs text-gray-600">
        {data.pergunta || 'Configure a pergunta'}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
          {TIPO_LABELS[data.tipoResposta] || data.tipoResposta}
        </span>
        {data.obrigatoria && (
          <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] text-red-700">
            Obrigatória
          </span>
        )}
        {data.campoDestino && (
          <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] text-purple-700">
            {data.campoDestino}
          </span>
        )}
      </div>
    </BaseNode>
  );
});
