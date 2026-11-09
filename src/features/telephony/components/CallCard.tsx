import { CalendarPlus, PhoneIncoming, PhoneMissed, PhoneOutgoing, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { formatPhone } from '@/shared/lib/phone';
import { Button, IconButton, Skeleton } from '@/shared/ui';
import { useCallerCard } from '../api/telephony-api';
import { NS } from '../i18n';
import type { ActiveCall } from '../model/store';

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2 text-body">
      <span className="w-32 shrink-0 text-ink-muted">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

/** Всплывающая карточка звонка: клиент по номеру (WAATSOnIncomingCall) и действия. Тень «поднято». */
export function CallCard({ call, onDismiss }: { call: ActiveCall; onDismiss: () => void }) {
  const { t } = useTranslation(NS);
  const navigate = useNavigate();
  const location = useLocation();
  const card = useCallerCard(call.phone);
  const title =
    call.state === 'missed'
      ? t('missed')
      : call.state === 'ended'
        ? t('ended')
        : call.state === 'talking'
          ? t('talking')
          : call.direction === 'in'
            ? t('incoming')
            : t('outgoing');
  const Icon = call.state === 'missed' ? PhoneMissed : call.direction === 'in' ? PhoneIncoming : PhoneOutgoing;
  const data = card.data;
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label={title}
      className="flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-3 rounded-lg border border-hairline bg-canvas p-4 shadow-raised"
    >
      <header className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-pill',
            call.state === 'missed' ? 'bg-danger-tint text-danger' : 'bg-accent-tint text-accent',
            call.state === 'ringing' && 'animate-pulse',
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-caption text-ink-muted">{title}</span>
          <span className="truncate text-label">{data?.name ?? formatPhone(call.phone)}</span>
          {data?.name ? <span className="text-subtitle text-ink-muted">{formatPhone(call.phone)}</span> : null}
        </div>
        <IconButton label={t('hide')} size="icon-sm" onClick={onDismiss}>
          <X />
        </IconButton>
      </header>
      {card.isPending ? (
        <Skeleton className="h-16" />
      ) : data ? (
        <div className="flex flex-col gap-1">
          {data.bonus && data.bonus !== '0' ? <Line label={t('bonus')}>{data.bonus}</Line> : null}
          <Line label={t('lastVisit')}>{data.lastVisit ?? t('none')}</Line>
          <Line label={t('nextVisit')}>{data.nextVisit ?? t('none')}</Line>
          {data.beloved ? <Line label={t('beloved')}>{data.beloved}</Line> : null}
          {data.comment ? <Line label={t('comment')}>{data.comment}</Line> : null}
        </div>
      ) : (
        <p className="text-body text-ink-muted">{t('unknown')}</p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            const params = new URLSearchParams({ create: '1', clientPhone: data?.phone ?? call.phone });
            if (data?.clientId) params.set('client', String(data.clientId));
            if (data?.name) params.set('clientName', data.name);
            // Администратор уже смотрит журнал на какую-то дату — не сбрасываем её на сегодня.
            const date = location.pathname === '/logbook' ? new URLSearchParams(location.search).get('date') : null;
            if (date) params.set('date', date);
            void navigate(`/logbook?${params.toString()}`);
            onDismiss();
          }}
        >
          <CalendarPlus />
          {t('book')}
        </Button>
      </div>
    </section>
  );
}
