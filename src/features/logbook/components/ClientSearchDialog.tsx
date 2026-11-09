import { Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatPhone } from '@/shared/lib/phone';
import { DialogContent, Input, Skeleton } from '@/shared/ui';
import { useClientSearch } from '../api/logbook-api';
import type { Client } from '../api/schemas';
import { NS } from '../i18n';
import { ClientHistory } from './ClientHistory';

/** Поиск по журналу: клиент → его записи → переход в нужный день с открытой записью. */
export function ClientSearchDialog({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation(NS);
  const [search, setSearch] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const result = useClientSearch(search);
  const short = search.trim().length < 2;
  return (
    <DialogContent title={t('search.title')} className="max-w-xl">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
          <Input
            type="search"
            autoComplete="off"
            value={search}
            placeholder={t('search.hint')}
            aria-label={t('search.hint')}
            className="pl-9"
            onChange={(e) => {
              setSearch(e.target.value);
              setClient(null);
            }}
          />
        </div>
        {client ? (
          <div className="flex flex-col gap-2">
            <p className="text-label">
              {client.name}
              <span className="text-body text-ink-muted"> · {formatPhone(client.phone)}</span>
            </p>
            <ClientHistory clientId={client.id} onNavigate={onDone} />
          </div>
        ) : short ? (
          <p className="text-micro text-ink-muted">{t('create.clientMin')}</p>
        ) : result.isPending ? (
          <Skeleton className="h-32" />
        ) : result.data?.length ? (
          <ul className="max-h-80 overflow-y-auto rounded-sm border border-hairline">
            {result.data.slice(0, 50).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setClient(c);
                  }}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-body hover:bg-canvas-sunken"
                >
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 text-caption text-ink-muted">{formatPhone(c.phone)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-micro text-ink-muted">{t('create.clientNotFound')}</p>
        )}
      </div>
    </DialogContent>
  );
}
