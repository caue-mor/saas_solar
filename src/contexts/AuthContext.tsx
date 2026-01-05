"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { AcessoFotovoltaico } from '@/types/database';
import {
  login as authLogin,
  logout as authLogout,
  getCurrentUser,
  isLoggedIn,
  refreshUserData,
  updateUserData as authUpdateUserData,
} from '@/services/auth';

interface AuthContextType {
  user: AcessoFotovoltaico | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<AcessoFotovoltaico>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AcessoFotovoltaico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar - verificar se já está logado
  useEffect(() => {
    const initAuth = async () => {
      if (isLoggedIn()) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          // Atualizar dados do banco
          const refreshed = await refreshUserData(currentUser.id);
          setUser(refreshed || currentUser);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const result = await authLogin(email, password);

    if (result.success && result.user) {
      setUser(result.user);
      setLoading(false);
      return true;
    }

    setError(result.error || 'Erro ao fazer login');
    setLoading(false);
    return false;
  }, []);

  // Logout
  const logout = useCallback(() => {
    authLogout();
    setUser(null);
    router.push('/auth/sign-in');
  }, [router]);

  // Atualizar dados do usuário
  const updateUser = useCallback(async (data: Partial<AcessoFotovoltaico>): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    const result = await authUpdateUserData(user.id, data);

    if (result.success && result.user) {
      setUser(result.user);
      setLoading(false);
      return true;
    }

    setError(result.error || 'Erro ao atualizar dados');
    setLoading(false);
    return false;
  }, [user]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!user) return;

    const refreshed = await refreshUserData(user.id);
    if (refreshed) {
      setUser(refreshed);
    }
  }, [user]);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        updateUser,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// HOC para proteger rotas
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/auth/sign-in');
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solar-500 border-t-transparent"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
