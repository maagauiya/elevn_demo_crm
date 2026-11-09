import { Send } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { formatPhone } from '@/shared/lib/phone';
import { Button, EmptyState, Panel, SheetContent, Skeleton, Textarea, toast } from '@/shared/ui';
import { getGateway, useChat, useDefaultToken, useSendMessage } from '../api/messaging-api';
import { NS } from '../i18n';

/** Переписка с клиентом в WhatsApp через шлюз (история + отправка). */
export function ChatSheet({ phone, name }: { phone: string; name: string }) {
  const { t, i18n } = useTranslation(NS);
  const token = useDefaultToken();
  const chat = useChat(token, phone);
  const send = useSendMessage(token, phone);
  const [text, setText] = useState('');
  const available = getGateway().available;
  const time = (ts: number) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(ts * 1000);
  return (
    <SheetContent title={`${t('chatTitle')}: ${name || formatPhone(phone)}`}>
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
          {!available ? (
            <Panel className="bg-status-pending-bg p-4">
              <p className="text-label">{t('unavailable')}</p>
              <p className="text-body text-ink-muted">{t('unavailableHint')}</p>
            </Panel>
          ) : !token ? (
            <p className="text-body text-ink-muted">{t('noToken')}</p>
          ) : chat.isPending ? (
            <Skeleton className="h-40" />
          ) : chat.data?.length ? (
            chat.data.map((m, i) => (
              <div
                key={`${m.timestamp}-${i}`}
                className={cn(
                  'flex max-w-[80%] flex-col gap-0.5 rounded-md px-3 py-2 text-body',
                  m.fromMe ? 'self-end bg-accent-tint' : 'self-start bg-canvas-sunken',
                )}
              >
                <span className="whitespace-pre-line">{m.text}</span>
                <span className="self-end text-micro text-ink-muted">{time(m.timestamp)}</span>
              </div>
            ))
          ) : (
            <EmptyState title={t('empty')} />
          )}
        </div>
        <form
          className="flex items-end gap-2 border-t border-hairline px-5 py-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim()) return;
            try {
              await send.mutateAsync(text.trim());
              setText('');
              toast.success(t('sent'));
            } catch (error) {
              toast.error(error instanceof Error ? error.message : t('unavailable'));
            }
          }}
        >
          <Textarea
            aria-label={t('message')}
            placeholder={t('message')}
            value={text}
            disabled={!available || !token}
            className="min-h-10"
            onChange={(e) => {
              setText(e.target.value);
            }}
          />
          <Button type="submit" variant="primary" disabled={!available || !token || !text.trim() || send.isPending}>
            <Send />
            {t('send')}
          </Button>
        </form>
      </div>
    </SheetContent>
  );
}
