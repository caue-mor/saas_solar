import { supabase, hashPassword } from '@/lib/supabase';
import type { AcessoFotovoltaico } from '@/types/database';

// Chave para armazenar sessão no localStorage
const SESSION_KEY = 'solar_session';
const USER_KEY = 'solar_user';
const AUTH_COOKIE = 'solar_auth';

// Helper para setar cookie
function setCookie(name: string, value: string, days: number = 1) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

// Helper para deletar cookie
function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export interface AuthResult {
  success: boolean;
  user?: AcessoFotovoltaico;
  error?: string;
}

// Login com email e senha
export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const hashedPassword = hashPassword(password);

    const { data, error } = await supabase
      .from('acessos_fotovoltaico')
      .select('*')
      .eq('email', email)
      .eq('senha', hashedPassword)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'Email ou senha incorretos'
      };
    }

    // Verificar se a conta está ativa
    if (data.status_plano === 'inativo') {
      return {
        success: false,
        error: 'Sua conta está inativa. Entre em contato com o suporte.'
      };
    }

    // Salvar sessão (localStorage + cookie para middleware)
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      localStorage.setItem(SESSION_KEY, Date.now().toString());
      setCookie(AUTH_COOKIE, data.id.toString(), 1); // Cookie expira em 1 dia
    }

    return {
      success: true,
      user: data as AcessoFotovoltaico
    };
  } catch (error) {
    console.error('Erro no login:', error);
    return {
      success: false,
      error: 'Erro ao fazer login. Tente novamente.'
    };
  }
}

// Logout
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
    deleteCookie(AUTH_COOKIE);
  }
}

// Verificar se está logado
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;

  const session = localStorage.getItem(SESSION_KEY);
  const user = localStorage.getItem(USER_KEY);

  if (!session || !user) return false;

  // Verificar se a sessão expirou (24 horas)
  const sessionTime = parseInt(session, 10);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas

  if (now - sessionTime > maxAge) {
    logout();
    return false;
  }

  return true;
}

// Obter usuário atual do localStorage
export function getCurrentUser(): AcessoFotovoltaico | null {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as AcessoFotovoltaico;
  } catch {
    return null;
  }
}

// Atualizar dados do usuário no localStorage e banco
export async function updateUserData(
  userId: number,
  data: Partial<AcessoFotovoltaico>
): Promise<AuthResult> {
  try {
    const { error } = await supabase
      .from('acessos_fotovoltaico')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return {
        success: false,
        error: 'Erro ao atualizar dados'
      };
    }

    // Recarregar dados do usuário
    const { data: updatedUser, error: fetchError } = await supabase
      .from('acessos_fotovoltaico')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !updatedUser) {
      return {
        success: false,
        error: 'Erro ao recarregar dados'
      };
    }

    // Atualizar localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }

    return {
      success: true,
      user: updatedUser as AcessoFotovoltaico
    };
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return {
      success: false,
      error: 'Erro interno ao atualizar dados'
    };
  }
}

// Buscar dados atualizados do usuário no banco
export async function refreshUserData(userId: number): Promise<AcessoFotovoltaico | null> {
  try {
    const { data, error } = await supabase
      .from('acessos_fotovoltaico')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    // Atualizar localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(data));
    }

    return data as AcessoFotovoltaico;
  } catch {
    return null;
  }
}
