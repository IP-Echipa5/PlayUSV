import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ApiError, httpApi, type Api } from './api/client';
import type { Session, User } from './api/types';
import { DEMO } from './mode';

// sesiune separata pt demo, ca un token de demo sa nu ajunga la backend-ul real
const KEY = DEMO ? 'csb.session.demo' : 'csb.session';

function load(): Session | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
}

type Auth = {
  api: Api;
  user: User | null;
  /** Mesaj aratat pe ecranul de login dupa ce sesiunea a expirat. */
  notice: string | null;
  signIn: (s: Session) => void;
  signOut: (notice?: string) => void;
  /** Ruleaza un apel; daca tokenul a expirat sau nu mai e valid, te scoate la login. */
  guard: <T>(p: Promise<T>) => Promise<T>;
};

const Ctx = createContext<Auth | null>(null);

export function AuthProvider({
  children,
  api: makeApi,
}: {
  children: ReactNode;
  api?: (token: () => string | null) => Api;
}) {
  const [session, setSession] = useState<Session | null>(load);
  const [notice, setNotice] = useState<string | null>(null);

  const signIn = useCallback((s: Session) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      // fara storage ramai logat doar in tab-ul asta
    }
    setNotice(null);
    setSession(s);
  }, []);

  const signOut = useCallback((msg?: string) => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignorat
    }
    setNotice(msg ?? null);
    setSession(null);
  }, []);

  const api = useMemo(
    () => (makeApi ?? httpApi)(() => load()?.token ?? session?.token ?? null),
    [makeApi, session?.token],
  );

  const guard = useCallback(
    async <T,>(p: Promise<T>) => {
      try {
        return await p;
      } catch (e) {
        if (
          e instanceof ApiError &&
          (e.code === 'TOKEN_EXPIRED' || e.code === 'UNAUTHORIZED' || e.code === 'ACCOUNT_BLOCKED')
        ) {
          signOut(e.message);
        }
        throw e;
      }
    },
    [signOut],
  );

  const value = useMemo(
    () => ({ api, user: session?.user ?? null, notice, signIn, signOut, guard }),
    [api, session, notice, signIn, signOut, guard],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
