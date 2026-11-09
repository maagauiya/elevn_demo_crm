import { addMonths, eachDayOfInterval, endOfMonth, format, isSameMonth, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { ItemParamsBar, useItemParamsState } from '@/features/item-params';
import { useNavMenu } from '@/features/navigation';
import { isApiError } from '@/shared/api';
import { cn } from '@/shared/lib/cn';
import { dateLocale } from '@/shared/lib/dates';
import {
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Label,
  PageHeader,
  Panel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  toast,
} from '@/shared/ui';
import {
  useClearCells,
  useDepartments,
  useSetStatus,
  useStatusList,
  useWorkSchedule,
  type WsStatus,
} from '../api/ws-api';
import { WorkGrid } from '../components/WorkGrid';
import { ApplyTemplateDialog, CopyPeriodDialog, SaveTemplateDialog, TimeRangesDialog } from '../components/WsDialogs';
import { NS } from '../i18n';
import { type CellRef, cellKey } from '../model/selection';
import { statusTone } from '../model/status';

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

type Dialog = { kind: 'time'; status: WsStatus } | { kind: 'apply' } | { kind: 'save' } | { kind: 'copy' } | null;

/** График работы (тип пункта -2): месяц × специалисты отделения, массовая установка статусов, шаблоны. */
export function WorkSchedulePage() {
  const { t, i18n } = useTranslation(NS);
  const locale = dateLocale(i18n.language);
  const user = useCurrentUser();
  // Филиал — входной параметр пункта меню «График работы» (COMPANYID), как в старом фронте.
  const navItem = useNavMenu().data?.items.find((i) => i.engine === 'work-schedule');
  const itemParams = useItemParamsState(navItem?.itemId);
  const companyParam = itemParams.values.COMPANYID ?? '';
  const companyId = companyParam !== '' ? Number(companyParam) : user.companyId;
  const [params, setParams] = useSearchParams();
  const month = startOfMonth(params.get('month') ? new Date(`${params.get('month') ?? ''}-01T00:00`) : new Date());
  const requestedDep = Number(params.get('dep') ?? '-1');
  const from = iso(month);
  const to = iso(endOfMonth(month));
  const dates = eachDayOfInterval({ start: month, end: endOfMonth(month) }).map(iso);

  const departments = useDepartments(companyId);
  // Отделения у каждого филиала свои: неизвестное — «Весь филиал».
  const depId = departments.data?.some((d) => d.id === requestedDep) ? requestedDep : -1;
  const data = useWorkSchedule(itemParams.ready || !navItem ? { companyId, depId, from, to } : null);
  const statuses = useStatusList(companyId, depId);
  const setStatus = useSetStatus();
  const clear = useClearCells();
  const [selected, setSelected] = useState<Map<string, CellRef>>(new Map());
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);

  const patch = (changes: Record<string, string>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(changes)) next.set(k, v);
        return next;
      },
      { replace: true },
    );
    setSelected(new Map());
  };

  const days = new Map((data.data?.days ?? []).map((d) => [`${d.docId},${d.date}`, d]));
  const q = search.trim().toLowerCase();
  const doctors = (data.data?.doctors ?? []).filter((d) => !q || d.name.toLowerCase().includes(q));
  const cells = [...selected.values()];
  const selectedDoctorIds = [...new Set(cells.map((c) => c.docId))];

  const select = (list: CellRef[], mode: 'replace' | 'toggle' | 'add') => {
    setSelected((prev) => {
      const next = mode === 'replace' ? new Map<string, CellRef>() : new Map(prev);
      for (const cell of list) {
        const key = cellKey(cell);
        if (mode === 'toggle' && next.has(key)) next.delete(key);
        else next.set(key, cell);
      }
      return next;
    });
  };

  const applyStatus = async (status: WsStatus, ranges: { from: string; to: string }[]) => {
    try {
      const message = await setStatus.mutateAsync({ cells, statusId: status.id, ranges });
      toast.success(message || t('done'));
      setSelected(new Map());
    } catch (error) {
      toast.error(isApiError(error) ? error.message : status.name);
    }
  };

  const title = format(month, 'LLLL yyyy', { locale });
  return (
    <div className="flex h-[calc(100dvh-32px)] flex-col gap-4 max-lg:h-[calc(100dvh-88px)]">
      <PageHeader
        className="pb-0"
        title={t('title')}
        subtitle={title.charAt(0).toUpperCase() + title.slice(1)}
        actions={
          <>
            <div className="flex items-center gap-1">
              <IconButton
                label={t('prevMonth')}
                onClick={() => {
                  patch({ month: format(addMonths(month, -1), 'yyyy-MM') });
                }}
              >
                <ChevronLeft />
              </IconButton>
              <Button
                size="sm"
                disabled={isSameMonth(month, new Date())}
                onClick={() => {
                  patch({ month: format(new Date(), 'yyyy-MM') });
                }}
              >
                {t('thisMonth')}
              </Button>
              <IconButton
                label={t('nextMonth')}
                onClick={() => {
                  patch({ month: format(addMonths(month, 1), 'yyyy-MM') });
                }}
              >
                <ChevronRight />
              </IconButton>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setDialog({ kind: 'apply' });
              }}
            >
              {t('applyTemplate')}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setDialog({ kind: 'copy' });
              }}
            >
              {t('copyPeriod')}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <ItemParamsBar state={itemParams} />
        <div className="flex min-w-56 flex-col gap-1">
          <Label htmlFor="ws-dep">{t('department')}</Label>
          {departments.isPending ? (
            <Skeleton className="h-8" />
          ) : (
            <Select
              value={String(depId)}
              onValueChange={(v) => {
                patch({ dep: v });
              }}
            >
              <SelectTrigger id="ws-dep" className="h-8 bg-canvas">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(departments.data ?? []).map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="relative min-w-56">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-faint" />
          <Input
            type="search"
            value={search}
            placeholder={t('search')}
            aria-label={t('search')}
            className="h-8 bg-canvas pl-8"
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
        </div>
      </div>

      {/* Панель действий: фиксированная высота — сетка не должна съезжать, пока выделяешь мышью */}
      <Panel className="flex h-12 shrink-0 items-center gap-2 overflow-x-auto px-3 whitespace-nowrap">
        {cells.length ? (
          <>
            <span className="shrink-0 pr-1 text-label">{t('selected', { count: cells.length })}</span>
            {(statuses.data ?? []).map((status) => {
              const tone = statusTone(status.id);
              return (
                <button
                  key={status.id}
                  type="button"
                  disabled={setStatus.isPending}
                  onClick={() => {
                    if (status.needsTime) setDialog({ kind: 'time', status });
                    else void applyStatus(status, []);
                  }}
                  className={cn(
                    'h-7 shrink-0 cursor-pointer rounded-pill border border-hairline px-3 text-caption transition-shadow hover:shadow-hover disabled:opacity-50',
                    tone.cell,
                    tone.text,
                  )}
                >
                  {status.name}
                </button>
              );
            })}
            <span className="mx-1 h-5 w-px bg-hairline" />
            <Button
              size="sm"
              variant="ghost"
              disabled={clear.isPending}
              onClick={async () => {
                try {
                  toast.success((await clear.mutateAsync(cells)) || t('done'));
                  setSelected(new Map());
                } catch (error) {
                  toast.error(isApiError(error) ? error.message : t('clear'));
                }
              }}
            >
              {t('clear')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDialog({ kind: 'save' });
              }}
            >
              {t('saveTemplate')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelected(new Map());
              }}
            >
              {t('deselect')}
            </Button>
          </>
        ) : (
          <span className="truncate text-body text-ink-muted">{t('hint')}</span>
        )}
      </Panel>

      <div className="min-h-[360px] min-w-0 flex-1">
        {data.isError ? (
          <Panel>
            <ErrorState onRetry={() => void data.refetch()} />
          </Panel>
        ) : !data.data ? (
          <Skeleton className="h-full" />
        ) : doctors.length === 0 ? (
          <Panel>
            <EmptyState title={t('empty')} description={t('emptyHint')} />
          </Panel>
        ) : (
          <WorkGrid
            doctors={doctors}
            dates={dates}
            days={days}
            statuses={statuses.data ?? []}
            selected={selected}
            onSelect={select}
          />
        )}
      </div>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        {dialog?.kind === 'time' ? (
          <TimeRangesDialog
            statusName={dialog.status.name}
            onApply={(ranges) => {
              setDialog(null);
              void applyStatus(dialog.status, ranges);
            }}
          />
        ) : null}
        {dialog?.kind === 'apply' ? (
          <ApplyTemplateDialog
            selectedDoctorIds={selectedDoctorIds}
            visibleDoctorIds={doctors.map((d) => d.id)}
            from={from}
            to={to}
            onDone={() => {
              setDialog(null);
            }}
          />
        ) : null}
        {dialog?.kind === 'save' ? (
          <SaveTemplateDialog
            cells={cells}
            onDone={() => {
              setDialog(null);
            }}
          />
        ) : null}
        {dialog?.kind === 'copy' ? (
          <CopyPeriodDialog
            doctorIds={selectedDoctorIds.length ? selectedDoctorIds : doctors.map((d) => d.id)}
            onDone={() => {
              setDialog(null);
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}
