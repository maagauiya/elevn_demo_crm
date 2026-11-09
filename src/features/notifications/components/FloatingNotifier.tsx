import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/shared/ui';
import { useFloatingQueue, useMarkFloated } from '../api/notifications-api';
import { NS } from '../i18n';
import { useOpenNotification } from '../model/open-target';

const CHANNEL = 'elevn-notifications';

/**
 * Всплывающие уведомления: опрашивает очередь, показывает тост, помечает уведомление «всплывшим»
 * (WANSetNotificationFloated). Вкладки договариваются через BroadcastChannel, чтобы одно уведомление
 * не всплыло в каждой открытой вкладке (замена старого BroadcastProvider).
 */
export function FloatingNotifier() {
  const { t } = useTranslation(NS);
  const queue = useFloatingQueue();
  const markFloated = useMarkFloated();
  const openTarget = useOpenNotification();
  const shown = useRef(new Set<number>());
  const channel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (e: MessageEvent<{ floated?: number }>) => {
      if (typeof e.data.floated === 'number') shown.current.add(e.data.floated);
    };
    channel.current = bc;
    return () => {
      bc.close();
      channel.current = null;
    };
  }, []);

  useEffect(() => {
    for (const n of queue.data ?? []) {
      if (shown.current.has(n.id)) continue;
      shown.current.add(n.id);
      channel.current?.postMessage({ floated: n.id });
      toast(n.text, {
        duration: 10_000,
        ...(n.recordId !== null
          ? {
              action: {
                label: t('open'),
                onClick: () => {
                  void openTarget(n);
                },
              },
            }
          : {}),
      });
      markFloated.mutate(n.id);
    }
  }, [queue.data, markFloated, openTarget, t]);

  return null;
}
