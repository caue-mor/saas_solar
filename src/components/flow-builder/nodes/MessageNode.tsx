'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { MessageCircle } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { MessageNodeData } from '@/types/flow.types';

type MessageNodeProps = NodeProps & {
  data: MessageNodeData;
};

export const MessageNode = memo(function MessageNode({
  data,
  selected,
}: MessageNodeProps) {
  return (
    <BaseNode
      label={data.label || 'Mensagem'}
      icon={<MessageCircle className="h-4 w-4" />}
      color="#64748b"
      selected={selected}
    >
      <p className="line-clamp-3 text-xs text-gray-600">
        {data.mensagem || 'Configure a mensagem'}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {data.aguardarResposta && (
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
            Aguarda resposta
          </span>
        )}
        {data.incluirBotoes && data.botoes && data.botoes.length > 0 && (
          <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
            {data.botoes.length} botões
          </span>
        )}
      </div>
    </BaseNode>
  );
});
