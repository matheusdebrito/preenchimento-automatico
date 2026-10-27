import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError } from '../../lib/api';

export interface SessionUser { id: string; email: string }
type SessionState =
  | { status: 'loading' | 'guest' | 'unavailable'; user: null }
  | { status: 'authenticated'; user: SessionUser };

interface AuthContextValue {
  session: SessionState;
  refreshSession: () => Promise<void>;
  acceptLogin: (user: SessionUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** One authoritative browser session state for menus, login and account pages. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: 'loading', user: null });
  const requestVersion = useRef(0);

  const refreshSession = useCallback(async () => {
    const version = ++requestVersion.current;
    // Initial state is already loading. Avoid a synchronous state update
    // inside the mount effect; only the resolved request commits new state.
    try {
      const response = await api<{ user: SessionUser }>('/api/auth/me');
      if (version === requestVersion.current) {
        setSession({ status: 'authenticated', user: response.user });
      }
    } catch (error) {
      if (version === requestVersion.current) {
        setSession({
          status: error instanceof ApiError && error.status === 401 ? 'guest' : 'unavailable',
          user: null,
        });
      }
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    return () => { requestVersion.current++; };
  }, [refreshSession]);

  const acceptLogin = useCallback((user: SessionUser) => {
    // Discard an older /me response if login completed before it.
    requestVersion.current++;
    setSession({ status: 'authenticated', user });
  }, []);

  const logout = useCallback(async () => {
    await api<{ ok: boolean }>('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) });
    requestVersion.current++;
    setSession({ status: 'guest', user: null });
  }, []);

  return (
    <AuthContext.Provider value={{ session, refreshSession, acceptLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requer AuthProvider.');
  return context;
}
