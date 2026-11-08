import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { z } from 'zod';
import { isApiError } from '@/shared/api';
import { Button, CheckboxField, Panel, TextField } from '@/shared/ui';
import { useLogin } from '../api/auth-api';
import { AUTH_NS } from '../i18n';
import { useSession } from '../model/session-store';

const schema = z.object({
  login: z.string().trim().min(1, 'errors.required'),
  password: z.string().min(1, 'errors.required'),
  remember: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation([AUTH_NS, 'common']);
  const session = useSession();
  const location = useLocation();
  const login = useLogin();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { login: '', password: '', remember: true },
  });

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (session) return <Navigate to={from} replace />;

  const errorText = login.error
    ? isApiError(login.error) && login.error.kind === 'server'
      ? login.error.message
      : t('failed')
    : null;

  return (
    <main className="flex min-h-full items-center justify-center p-4">
      <Panel className="w-full max-w-sm p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-accent text-label text-on-accent">
            E
          </div>
          <div>
            <h1 className="text-title">{t('title')}</h1>
            <p className="text-subtitle text-ink-muted">{t('subtitle')}</p>
          </div>
        </div>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => {
            login.mutate(values);
          })}
        >
          <TextField control={control} name="login" label={t('login')} autoComplete="username" />
          <TextField
            control={control}
            name="password"
            type="password"
            label={t('password')}
            autoComplete="current-password"
          />
          <CheckboxField control={control} name="remember" label={t('remember')} />
          {errorText ? (
            <p role="alert" className="rounded-sm bg-danger-tint px-3 py-2 text-body text-danger">
              {errorText}
            </p>
          ) : null}
          <Button type="submit" variant="primary" disabled={login.isPending}>
            {t('submit')}
          </Button>
          {import.meta.env.DEV ? <p className="text-center text-micro text-ink-muted">{t('demoHint')}</p> : null}
        </form>
      </Panel>
    </main>
  );
}
