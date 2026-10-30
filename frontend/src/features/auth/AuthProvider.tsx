import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError } from '../../lib/api';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
  cellphone: string | null;
  cpfMasked: string | null;
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  role: 'USER' | 'ADMIN';
}
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

const SESSION_CHECK_TIMEOUT_MS = 10_000;

async function readSession(): Promise<SessionState> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), SESSION_CHECK_TIMEOUT_MS);
  try {
    const response = await api<{ user: SessionUser }>('/api/auth/me', {
      signal: controller.signal,
    });
    return { status: 'authenticated', user: response.user };
  } catch (error) {
    return {
      status: error instanceof ApiError && error.status === 401 ? 'guest' : 'unavailable',
      user: null,
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

/** One authoritative browser session state for menus, login and account pages. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: 'loading', user: null });
  const requestVersion = useRef(0);

  const refreshSession = useCallback(async () => {
    const version = ++requestVersion.current;
    setSession((current) => current.status === 'authenticated'
      ? current
      : { status: 'loading', user: null });
    const result = await readSession();
    if (version === requestVersion.current) setSession(result);
  }, []);

  useEffect(() => {
    // Commit only after the async request finishes. Late responses cannot
    // overwrite a successful login/logout or a subsequent session refresh.
    const version = ++requestVersion.current;
    void readSession().then((result) => {
      if (version === requestVersion.current) setSession(result);
    });
    return () => { requestVersion.current++; };
  }, []);

  const acceptLogin = useCallback((user: SessionUser) => {
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
