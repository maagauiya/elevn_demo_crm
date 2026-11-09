import { LogOut, QrCode, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { Button, DialogContent, EmptyState, Panel, Skeleton, toast } from '@/shared/ui';
import { getGateway, type Instance, useInstanceAction, useInstances, useInstanceStatus } from '../api/messaging-api';
import { NS } from '../i18n';
import type { InstanceState } from '../model/gateway';

const STATE_TONE: Record<InstanceState, string> = {
  authorized: 'bg-status-done-bg text-status-done-fg',
  notAuthorized: 'bg-status-pending-bg text-status-pending-fg',
  starting: 'bg-status-confirmed-bg text-status-confirmed-fg',
  sleepMode: 'bg-status-cancelled-bg text-status-cancelled-fg',
  yellowCard: 'bg-status-pending-bg text-status-pending-fg',
  blocked: 'bg-danger-tint text-danger',
  unknown: 'bg-canvas-sunken text-ink-muted',
};

function InstanceRow({ instance }: { instance: Instance }) {
  const { t } = useTranslation(NS);
  const status = useInstanceStatus(instance.token);
  const action = useInstanceAction();
  const [qr, setQr] = useState<string | null>(null);
  const token = instance.token;
  const run = async (kind: 'reboot' | 'logout' | 'clearQueue') => {
    if (!token) return;
    try {
      await action.mutateAsync({ token, action: kind });
      toast.success(t('done'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('unavailable'));
    }
  };
  return (
    <Panel className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-label">{instance.name}</span>
        {instance.isDefault ? <span className="text-micro text-ink-muted">· {t('default')}</span> : null}
        {status.data ? (
          <span className={cn('ml-auto rounded-xs px-1.5 py-0.5 text-caption', STATE_TONE[status.data.state])}>
            {t(`state.${status.data.state}`)}
          </span>
        ) : null}
      </div>
      {instance.description ? <p className="text-body text-ink-muted">{instance.description}</p> : null}
      {!token ? (
        <p className="text-micro text-ink-muted">{t('noToken')}</p>
      ) : status.isPending ? (
        <Skeleton className="h-8" />
      ) : (
        <>
          <span className="text-caption text-ink-muted">{t('queue', { count: status.data?.queue ?? 0 })}</span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={async () => {
                const res = await getGateway().qr(token);
                if (res.kind === 'qr') setQr(res.image);
                else if (res.kind === 'logged') toast.success(t('state.authorized'));
                else toast.error(res.message);
                void status.refetch();
              }}
            >
              <QrCode />
              {t('qr')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void status.refetch()}>
              <RefreshCw />
              {t('refresh')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void run('reboot')}>
              <RotateCcw />
              {t('reboot')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void run('clearQueue')}>
              <Trash2 />
              {t('clearQueue')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-danger hover:bg-danger-tint"
              onClick={() => void run('logout')}
            >
              <LogOut />
              {t('logout')}
            </Button>
          </div>
          {qr ? (
            <div className="flex items-center gap-4">
              <img src={qr} alt={t('qr')} className="size-40 rounded-sm border border-hairline bg-canvas p-2" />
              <p className="text-body text-ink-muted">{t('qrHint')}</p>
            </div>
          ) : null}
        </>
      )}
    </Panel>
  );
}

/** Инстансы WhatsApp (WAGetMSGInstanceList) и их состояние через шлюз. */
export function InstancesDialog() {
  const { t } = useTranslation(NS);
  const instances = useInstances();
  const available = getGateway().available;
  return (
    <DialogContent title={t('instances')} description={t('instancesHint')} className="max-w-2xl">
      <div className="flex flex-col gap-3">
        {!available ? (
          <Panel className="border-status-pending-fg/40 bg-status-pending-bg p-4">
            <p className="text-label">{t('unavailable')}</p>
            <p className="text-body text-ink-muted">{t('unavailableHint')}</p>
          </Panel>
        ) : null}
        {instances.isPending ? (
          <Skeleton className="h-32" />
        ) : instances.data?.length ? (
          instances.data.map((instance) => <InstanceRow key={instance.id} instance={instance} />)
        ) : (
          <EmptyState />
        )}
      </div>
    </DialogContent>
  );
}
