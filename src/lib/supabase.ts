import { createClient } from '@supabase/supabase-js';

// Supabase config - Projeto: yfzqpeasgsoorldogqwl
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yfzqpeasgsoorldogqwl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmenFwZWFzZ3Nvb3JsZG9ncXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMzkzODYsImV4cCI6MjA2MjcxNTM4Nn0.ax0InIbPxMQ4IXSiRsY5KVZyOxZhKAht7VD-INuSGuU';

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função de hash de senha (mesmo algoritmo do sistema antigo)
export function hashPassword(password: string): string {
  if (typeof window !== 'undefined') {
    return btoa(password + 'fotovoltaico_system_salt_2024');
  }
  // Server-side: usar Buffer
  return Buffer.from(password + 'fotovoltaico_system_salt_2024').toString('base64');
}

// Função para formatar telefone para WhatsApp
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  let finalPhone = cleanPhone;
  if (cleanPhone.startsWith('55')) {
    finalPhone = cleanPhone.substring(2);
  }
  return `55${finalPhone}@s.whatsapp.net`;
}

// Tipos de sistema permitidos
export const SYSTEM_TYPES = ['RESIDENCIAL', 'COMERCIAL', 'RURAL', 'INVESTIMENTO'] as const;

// Configurações de planos
export const PLANOS = {
  'CRM POR VOZ': {
    color: '#6B7280',
    hasAI: false,
    hasFollowup: false,
    description: 'Gestão básica de contatos'
  },
  'IA ATENDIMENTO': {
    color: '#3B82F6',
    hasAI: true,
    hasFollowup: false,
    description: 'IA para atendimento automático'
  },
  'IA ATENDIMENTO + FOLLOW': {
    color: '#10B981',
    hasAI: true,
    hasFollowup: true,
    description: 'IA + Follow-up automático'
  }
} as const;

// Status colors
export const STATUS_COLORS = {
  'ativo': '#10B981',
  'inativo': '#EF4444',
  'pendente': '#F59E0B'
} as const;

export default supabase;
