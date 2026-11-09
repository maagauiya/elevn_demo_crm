import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth';
import { toast } from '@/shared/ui';
import { useSaveCall } from '../api/telephony-api';
import { NS } from '../i18n';
import { createPzClient } from '../model/pz-client';
import { createSimulator } from '../model/simulator';
import { useTelephony } from '../model/store';
import type { CallEvent } from '../model/types';
import { CallCard } from './CallCard';

/** Карточка завершённого звонка остаётся на экране минуту (MS_ATS_CALL старого фронта). */
const ENDED_VISIBLE_MS = 60_000;

const simulatorEnabled = import.meta.env.VITE_API_MOCKS === 'true' || import.meta.env.VITE_ATS_SIMULATOR === 'true';

/**
 * Телефония: подключается к АТС пользователя («Простые звонки») или к симулятору в dev,
 * показывает карточки звонков, фиксирует завершённые звонки (WAATSOnCallEnd).
 */
export function TelephonyCenter() {
  const { t, i18n } = useTranslation(NS);
  const user = useCurrentUser();
  const { calls, setClient, setStatus, upsertCall, dismiss } = useTelephony();
  const saveCall = useSaveCall();
  const answered = useRef(new Set<string>());
  const handlers = useRef<(e: CallEvent) => void>(() => undefined);

  const handle = (e: CallEvent) => {
    if (e.kind === 'incoming' || e.kind === 'outgoing') {
      upsertCall({ callId: e.callId, direction: e.direction, phone: e.phone, state: 'ringing' });
      return;
    }
    if (e.kind === 'answered') {
      answered.current.add(e.callId);
      upsertCall({ callId: e.callId, direction: e.direction, phone: e.phone, state: 'talking' });
      return;
    }
    const missed = !answered.current.has(e.callId);
    answered.current.delete(e.callId);
    upsertCall({ callId: e.callId, direction: e.direction, phone: e.phone, state: missed ? 'missed' : 'ended' });
    saveCall.mutate(
      { event: e, missed, clientPhone: null },
      {
        onError: () => {
          toast.error(t('saveFailed'));
        },
      },
    );
    setTimeout(() => {
      dismiss(e.callId);
    }, ENDED_VISIBLE_MS);
  };

  // Обработчик событий обновляем после рендера: подписка на клиента АТС одна, а данные — свежие.
  useEffect(() => {
    handlers.current = handle;
  });

  const { enabled, server, password, extension } = user.ats;
  useEffect(() => {
    let cancelled = false;
    let disconnect: () => void = () => undefined;
    const start = async () => {
      const client = simulatorEnabled
        ? createSimulator()
        : enabled && server && password && extension
          ? await createPzClient({ server, password, extension, lang: i18n.language })
          : null;
      if (!client || cancelled) return;
      client.onStatus((status, reason) => {
        setStatus(status);
        if (status === 'disconnected')
          toast.warning(reason ? `${t('status.disconnected')}: ${reason}` : t('status.disconnected'));
      });
      client.onEvent((e) => {
        handlers.current(e);
      });
      client.connect();
      setClient(client);
      disconnect = () => {
        client.disconnect();
      };
    };
    void start().catch(() => {
      setStatus('disconnected');
    });
    return () => {
      cancelled = true;
      disconnect();
      setClient(null);
      setStatus('off');
    };
  }, [enabled, server, password, extension, i18n.language, setClient, setStatus, t]);

  if (!calls.length) return null;
  return (
    <div className="fixed bottom-6 left-4 z-50 flex flex-col gap-2 lg:left-[264px]">
      {calls.map((call) => (
        <CallCard
          key={call.callId}
          call={call}
          onDismiss={() => {
            dismiss(call.callId);
          }}
        />
      ))}
    </div>
  );
}
