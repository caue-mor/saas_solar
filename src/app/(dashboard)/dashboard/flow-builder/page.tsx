'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { CompanyFlow } from '@/types/flow.types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Importação dinâmica para evitar problemas de SSR com React Flow
const FlowBuilder = dynamic(
  () => import('@/components/flow-builder/FlowBuilder'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
          <p className="text-muted-foreground">Carregando Flow Builder...</p>
        </div>
      </div>
    ),
  }
);

export default function FlowBuilderPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialFlow, setInitialFlow] = useState<CompanyFlow | undefined>();

  // Carregar fluxo existente
  useEffect(() => {
    async function loadFlow() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/flow?empresaId=${user.id}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setInitialFlow(data.flow);
        } else if (response.status === 404) {
          // Fluxo não existe ainda, inicia vazio
          setInitialFlow(undefined);
        } else {
          setError(data.error || 'Erro ao carregar fluxo');
        }
      } catch (err) {
        console.error('Erro ao carregar fluxo:', err);
        setError('Erro de conexão ao carregar fluxo');
      } finally {
        setLoading(false);
      }
    }

    loadFlow();
  }, [user?.id]);

  // Salvar fluxo
  const handleSave = async (flow: CompanyFlow) => {
    try {
      const response = await fetch('/api/flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...flow,
          skipValidation: true, // Permite salvar rascunhos
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Mostra erros de validação se houver
        if (data.validationErrors) {
          data.validationErrors.forEach((err: string) => {
            toast.warning(err);
          });
        }
        throw new Error(data.error || 'Erro ao salvar');
      }

      // Atualiza o fluxo local com a versão retornada
      if (data.flow) {
        setInitialFlow(data.flow);
      }

      toast.success('Fluxo salvo com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar fluxo:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar fluxo');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-solar-500" />
          <p className="text-muted-foreground">Carregando fluxo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center p-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="font-medium text-red-800">{error}</p>
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              setError(null);
              setLoading(true);
              window.location.reload();
            }}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <p className="text-muted-foreground">Usuário não autenticado</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)]">
      <FlowBuilder
        empresaId={user.id}
        empresaNome={user.nome_empresa || user.empresa}
        initialFlow={initialFlow}
        onSave={handleSave}
      />
    </div>
  );
}
