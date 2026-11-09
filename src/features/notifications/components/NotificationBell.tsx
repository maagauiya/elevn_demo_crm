import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { EmptyState, ErrorState, FilterChip, IconButton, Sheet, SheetContent, Skeleton, toast } from '@/shared/ui';
import { type Notification, useNotifications, useNotificationTypes } from '../api/notifications-api';
import { NS } from '../i18n';
import { useOpenNotification } from '../model/open-target';

/** Колокольчик с числом уведомлений → шторка со списком по группам (WANGetNotificationList + WANGetTypeList). */
export function NotificationBell({ className }: { className?: string }) {
  const { t } = useTranslation(NS);
  const list = useNotifications();
  const types = useNotificationTypes();
  const openTarget = useOpenNotification();
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<number | null>(null);

  const typeById = new Map((types.data ?? []).map((ty) => [ty.id, ty]));
  const groupOf = (n: Notification) => typeById.get(n.typeId)?.groupId ?? -1;
  // Группа 0 в базе подписана старым брендом — показываем свой текст.
  const groupName = (id: number) =>
    id === 0 ? t('system') : ((types.data ?? []).find((ty) => ty.groupId === id)?.groupName ?? String(id));
  const items = list.data ?? [];
  const groups = [...new Set(items.map(groupOf))];
  const shown = group === null ? items : items.filter((n) => groupOf(n) === group);
  const count = items.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <IconButton
        label={count ? `${t('title')}: ${t('count', { count })}` : t('title')}
        className={cn('relative', className)}
        onClick={() => {
          setOpen(true);
        }}
      >
        <Bell />
        {count ? (
          <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-pill bg-danger px-1 text-micro text-on-accent">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </IconButton>
      <SheetContent title={t('title')}>
        <div className="flex flex-col gap-3 px-5 py-4">
          {groups.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              <FilterChip
                pressed={group === null}
                onPressedChange={() => {
                  setGroup(null);
                }}
              >
                {t('all')}
              </FilterChip>
              {groups.map((id) => (
                <FilterChip
                  key={id}
                  pressed={group === id}
                  onPressedChange={() => {
                    setGroup(id);
                  }}
                >
                  {groupName(id)}
                </FilterChip>
              ))}
            </div>
          ) : null}
          {list.isPending ? (
            <Skeleton className="h-32" />
          ) : list.isError ? (
            <ErrorState onRetry={() => void list.refetch()} />
          ) : shown.length === 0 ? (
            <EmptyState icon={<Bell />} title={t('empty')} />
          ) : (
            <ul className="flex flex-col divide-y divide-hairline">
              {shown.map((n) => (
                <li key={n.id} className="flex flex-col gap-1 py-3">
                  <span className="text-micro text-ink-muted">
                    {typeById.get(n.typeId)?.name ?? groupName(groupOf(n))}
                    {n.at ? ` · ${n.at}` : ''}
                  </span>
                  <p className="text-body whitespace-pre-line">{n.text}</p>
                  {n.recordId !== null ? (
                    <button
                      type="button"
                      className="cursor-pointer self-start text-caption text-accent hover:underline"
                      onClick={async () => {
                        if (await openTarget(n)) setOpen(false);
                        else toast.error(t('notFound'));
                      }}
                    >
                      {t('open')}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
