import { useTranslation } from 'react-i18next';
import { APPOINTMENT_STATUSES, STATUS_STYLES } from '@/shared/lib/appointment-status';
import { cn } from '@/shared/lib/cn';
import {
  Label,
  MiniCalendar,
  Panel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import type { FilterOption } from '../api/schemas';
import { NS } from '../i18n';

const key = (f: FilterOption) => `${f.recType}:${f.recId}`;

/** Боковая колонка журнала: мини-календарь, фильтр филиала/отделения, легенда статусов. */
export function LogbookSidebar({
  date,
  onDate,
  filters,
  filter,
  onFilter,
  filterLabel,
}: {
  date: Date;
  onDate: (d: Date) => void;
  filters: FilterOption[];
  filter: FilterOption | null;
  onFilter: (f: FilterOption) => void;
  filterLabel?: string;
}) {
  const { t } = useTranslation(NS);
  const { t: tc } = useTranslation();
  const groups = new Map<string, FilterOption[]>();
  for (const f of filters) {
    const g = f.group ?? '';
    groups.set(g, [...(groups.get(g) ?? []), f]);
  }

  return (
    <aside className="flex w-full flex-col gap-3 xl:w-60 xl:shrink-0">
      <Panel className="p-3">
        <MiniCalendar value={date} onChange={onDate} />
      </Panel>
      <Panel className="flex flex-col gap-1.5 p-3">
        <Label htmlFor="logbook-filter">{filterLabel ?? t('filter')}</Label>
        <Select
          value={filter ? key(filter) : ''}
          onValueChange={(v) => {
            const next = filters.find((f) => key(f) === v);
            if (next) onFilter(next);
          }}
        >
          <SelectTrigger id="logbook-filter" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[...groups.entries()].map(([group, options]) => (
              <SelectGroup key={group || 'root'}>
                {group ? <div className="px-2 pt-2 pb-1 text-micro text-ink-faint uppercase">{group}</div> : null}
                {options.map((f) => (
                  <SelectItem key={key(f)} value={key(f)}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </Panel>
      <Panel className="hidden flex-col gap-2 p-3 xl:flex">
        <span className="text-caption text-ink-muted">{t('legend')}</span>
        {APPOINTMENT_STATUSES.map((status) => (
          <span key={status} className="flex items-center gap-2 text-micro">
            <span
              className={cn('h-3 w-4 rounded-xs border-l-4', STATUS_STYLES[status].bg, STATUS_STYLES[status].stripe)}
            />
            <span className={cn(STATUS_STYLES[status].strike && 'line-through')}>{tc(`status.${status}`)}</span>
          </span>
        ))}
        <span className="flex items-center gap-2 text-micro">
          <span className="h-3 w-4 rounded-xs bg-hatch" />
          {t('blocked')}
        </span>
      </Panel>
    </aside>
  );
}
