import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { callApi, queryClient } from '@/shared/api';
import { useSessionStore } from '../model/session-store';
import { emptyRowSchema, loginRowSchema } from './schemas';

export interface LoginInput {
  login: string;
  password: string;
  remember: boolean;
}

export function useLogin() {
  const signIn = useSessionStore((s) => s.signIn);
  return useMutation({
    mutationFn: async ({ login, password }: LoginInput) => {
      const sessionId = crypto.randomUUID();
      const [user] = await callApi(
        'WAEmpLogin',
        { ULogin: login, UPassword: password, SessionUUID: sessionId },
        { schema: loginRowSchema, retry: false },
      );
      if (!user) throw new Error('Пустой ответ WAEmpLogin');
      return { user, sessionId };
    },
    onSuccess: (session, { remember }) => {
      signIn(session, remember);
    },
  });
}

export function useLogout() {
  const session = useSessionStore((s) => s.session);
  const signOut = useSessionStore((s) => s.signOut);
  const navigate = useNavigate();
  return () => {
    if (session) {
      // Сообщаем бэкенду, но не ждём: выйти из интерфейса нужно даже без сети.
      void callApi('WAEmpLogout', { UserId: session.user.userId }, { schema: emptyRowSchema }).catch(() => undefined);
    }
    signOut();
    queryClient.clear();
    void navigate('/login', { replace: true });
  };
}
