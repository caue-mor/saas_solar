'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { PropostaNodeData } from '@/types/flow.types';

type PropostaNodeProps = NodeProps & {
  data: PropostaNodeData;
};

export const PropostaNode = memo(function PropostaNode({
  data,
  selected,
}: PropostaNodeProps) {
  return (
    <BaseNode
      label={data.label || 'Gerar Proposta'}
      icon={<FileText className="h-4 w-4" />}
      color="#6366f1"
      selected={selected}
    >
      <p className="line-clamp-2 text-xs text-gray-600">
        {data.mensagemEnvio || 'Gera e envia proposta comercial'}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {data.gerarAutomatico && (
          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-700">
            Automático
          </span>
        )}
        {data.formatoPDF && (
          <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] text-red-700">
            PDF
          </span>
        )}
        {data.enviarWhatsApp && (
          <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
            WhatsApp
          </span>
        )}
      </div>
    </BaseNode>
  );
});
