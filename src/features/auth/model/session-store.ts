import { create } from 'zustand';
import { setApiContext } from '@/shared/api';
import { readStorage, removeStorage, writeStorage } from '@/shared/lib/storage';
import type { SessionUser } from '../api/schemas';

const KEY = 'elevn.session';

export interface Session {
  user: SessionUser;
  sessionId: string;
}

interface SessionState {
  session: Session | null;
  signIn: (session: Session, remember: boolean) => void;
  signOut: () => void;
}

/**
 * «Запомнить меня» → localStorage, иначе sessionStorage (живёт до закрытия вкладки).
 * TODO(фаза 4): договориться с бэкендом о httpOnly-cookie и не хранить sessionId в JS вообще.
 */
function restore(): Session | null {
  const session = readStorage<Session>(KEY, 'local') ?? readStorage<Session>(KEY, 'session');
  // Сессии, сохранённые до появления телефонии, — без поля ats.
  if (session && typeof session.user.ats !== 'object') {
    (session.user as { ats?: SessionUser['ats'] }).ats = {
      enabled: false,
      server: null,
      password: null,
      extension: null,
    };
  }
  return session;
}

const initial = restore();
setApiContext({ sessionId: initial?.sessionId ?? null });

export const useSessionStore = create<SessionState>()((set) => ({
  session: initial,
  signIn: (session, remember) => {
    writeStorage(KEY, session, remember ? 'local' : 'session');
    setApiContext({ sessionId: session.sessionId });
    set({ session });
  },
  signOut: () => {
    removeStorage(KEY, 'local');
    removeStorage(KEY, 'session');
    setApiContext({ sessionId: null });
    set({ session: null });
  },
}));

export const useSession = () => useSessionStore((state) => state.session);

/** Текущий пользователь. Использовать только внутри защищённых роутов. */
export function useCurrentUser(): SessionUser {
  const session = useSession();
  if (!session) throw new Error('useCurrentUser вызван вне защищённого роута');
  return session.user;
}
