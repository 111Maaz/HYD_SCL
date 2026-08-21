import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthState, LoginPortal } from "@/lib/auth";
import { getAuthState, signIn as authSignIn, signOut as authSignOut } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/services/supabase/client";
import { isSupabaseConfigured } from "@/services/supabase";

interface AuthContextValue {
  auth: AuthState | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, portal?: LoginPortal) => Promise<AuthState>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setAuth(null);
      setIsLoading(false);
      return;
    }

    try {
      const nextAuth = await getAuthState();
      setAuth(nextAuth);
    } catch {
      setAuth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuth();

    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshAuth]);

  const login = useCallback(async (email: string, password: string, portal?: LoginPortal) => {
    const nextAuth = await authSignIn(email, password, portal);
    setAuth(nextAuth);
    return nextAuth;
  }, []);

  const logout = useCallback(async () => {
    await authSignOut();
    setAuth(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      isLoading,
      isAuthenticated: auth !== null,
      login,
      logout,
    }),
    [auth, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
