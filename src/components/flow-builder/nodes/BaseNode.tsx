'use client';

import { memo, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface BaseNodeProps {
  children: ReactNode;
  label: string;
  icon: ReactNode;
  color: string;
  selected?: boolean;
  hasInput?: boolean;
  hasOutput?: boolean;
  hasConditionalOutputs?: boolean;
}

export const BaseNode = memo(function BaseNode({
  children,
  label,
  icon,
  color,
  selected,
  hasInput = true,
  hasOutput = true,
  hasConditionalOutputs = false,
}: BaseNodeProps) {
  return (
    <div
      className={cn(
        'min-w-[220px] rounded-lg border-2 bg-white shadow-md transition-all',
        selected ? 'ring-2 ring-offset-2' : ''
      )}
      style={{
        borderColor: color,
        boxShadow: selected ? `0 0 0 2px ${color}40` : undefined,
      }}
    >
      {/* Handle de entrada */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
          style={{ top: -6 }}
        />
      )}

      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-md px-3 py-2 text-white"
        style={{ backgroundColor: color }}
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>

      {/* Content */}
      <div className="p-3">{children}</div>

      {/* Handles de saída */}
      {hasOutput && !hasConditionalOutputs && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
          style={{ bottom: -6 }}
        />
      )}

      {/* Handles condicionais (para nós de decisão) */}
      {hasConditionalOutputs && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!h-3 !w-3 !border-2 !border-white !bg-green-500"
            style={{ bottom: -6, left: '30%' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!h-3 !w-3 !border-2 !border-white !bg-red-500"
            style={{ bottom: -6, left: '70%' }}
          />
          <div className="absolute -bottom-5 left-0 right-0 flex justify-between px-4 text-[10px] text-gray-500">
            <span className="ml-2">Sim</span>
            <span className="mr-2">Não</span>
          </div>
        </>
      )}
    </div>
  );
});
