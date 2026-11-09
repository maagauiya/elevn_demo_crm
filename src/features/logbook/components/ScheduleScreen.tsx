import { ChevronLeft, ChevronRight, Printer, Search } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { ChatSheet } from '@/features/messaging';
import { isApiError } from '@/shared/api';
import {
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  Fab,
  IconButton,
  PageHeader,
  Panel,
  PrintPortal,
  SegmentControl,
  Sheet,
  SheetContent,
  Skeleton,
  toast,
} from '@/shared/ui';
import { useUpdateAppointment } from '../api/logbook-api';
import type { Appointment, Training } from '../api/schemas';
import { NS } from '../i18n';
import type { GridColumn, GridItem } from '../model/grid';
import { formatMinutes } from '../model/time';
import { type Density, HOUR_HEIGHT } from '../model/use-logbook-state';
import {
  CopyAppointmentDialog,
  DeleteAppointmentDialog,
  type DoctorOption,
  EditAppointmentDialog,
} from './AppointmentDialogs';
import { AppointmentSheet } from './AppointmentSheet';
import { ClientSearchDialog } from './ClientSearchDialog';
import { CreateAppointmentDialog, type CreatePreset } from './CreateAppointmentDialog';
import { PrintDay, PrintSlip } from './PrintViews';
import { ScheduleGrid } from './ScheduleGrid';

export interface ScheduleNav {
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  todayDisabled: boolean;
  prevLabel: string;
  nextLabel: string;
  todayLabel: string;
}

type Dialogs =
  | { kind: 'create'; preset: CreatePreset }
  | { kind: 'edit' | 'copy' | 'delete'; appointment: Appointment; date: string }
  | { kind: 'search' }
  | null;

type Printing = { kind: 'day' } | { kind: 'slip'; appointment: Appointment; date: string } | null;

export interface ScheduleScreenProps {
  title: string;
  subtitle: string;
  nav: ScheduleNav;
  density: Density;
  onDensity: (d: Density) => void;
  /** Дополнительные элементы тулбара (фильтры) */
  toolbar?: ReactNode;
  sidebar?: ReactNode;
  query: { isError: boolean; isReady: boolean; refetch: () => void };
  columns: GridColumn[];
  items: GridItem[];
  /** Сегодняшняя ISO-дата и минута — для линии «сейчас» */
  now: { date: string; minute: number } | null;
  doctors: DoctorOption[];
  /** Можно ли создавать и переносить записи (у групповых занятий — нет) */
  editable: boolean;
  emptyTitle: string;
  emptyHint: string;
  /** Дата по умолчанию для новой записи из FAB */
  defaultDate: string;
}

const doctorName = (doctors: DoctorOption[], id: number) => doctors.find((d) => d.id === id)?.label;

/**
 * Общий экран расписания: шапка с навигацией по датам, сетка, карточка записи, диалоги действий,
 * перенос мышью с «Отменить». Используют журнал по специалистам, по кабинетам, групповые занятия
 * и неделя специалиста.
 */
export function ScheduleScreen(props: ScheduleScreenProps) {
  const { t } = useTranslation(NS);
  const { columns, items, doctors, editable } = props;
  const [opened, setOpened] = useState<GridItem | null>(null);
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [printing, setPrinting] = useState<Printing>(null);
  const [chat, setChat] = useState<{ phone: string; name: string } | null>(null);
  const update = useUpdateAppointment();
  const [params, setParams] = useSearchParams();

  // ?open=<id>: запись из истории клиента или поиска открывается сразу после загрузки дня.
  const openId = Number(params.get('open') ?? '');
  const linked = openId ? items.find((i) => i.kind === 'appointment' && i.id === openId) : undefined;
  const current = opened ?? linked ?? null;
  const closeSheet = () => {
    setOpened(null);
    if (openId) {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('open');
          return next;
        },
        { replace: true },
      );
    }
  };

  // ?create=1&client=…: открыть новую запись с клиентом (например, из карточки входящего звонка).
  const createParam = params.get('create') === '1';
  const clearCreate = () => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const key of ['create', 'client', 'clientName', 'clientPhone']) next.delete(key);
        return next;
      },
      { replace: true },
    );
  };
  const linkedCreate: CreatePreset | null = createParam
    ? {
        doctorId: null,
        cabinetId: null,
        date: props.defaultDate,
        time: formatMinutes(props.now?.minute ?? 9 * 60),
        ...(params.get('client')
          ? {
              client: {
                id: Number(params.get('client')),
                name: params.get('clientName') ?? '',
                phone: params.get('clientPhone') ?? '',
                card: '',
              },
            }
          : {}),
      }
    : null;
  const activeDialog: Dialogs = dialog ?? (linkedCreate ? { kind: 'create', preset: linkedCreate } : null);

  // Границы дня: рабочее время колонок + записи вне его, по целым часам.
  const starts = [...columns.map((c) => c.workFrom ?? 9 * 60), ...items.map((i) => i.start)];
  const ends = [...columns.map((c) => c.workTo ?? 20 * 60), ...items.map((i) => i.end)];
  const dayStart = Math.floor((starts.length ? Math.min(...starts) : 9 * 60) / 60) * 60;
  const dayEnd = Math.ceil((ends.length ? Math.max(...ends) : 20 * 60) / 60) * 60;

  const dateOf = (item: GridItem) =>
    columns.find((c) => c.key === item.columnKey)?.date ??
    (item.kind === 'appointment' ? item.appointment.date : null) ??
    props.defaultDate;

  const move = (item: GridItem, column: GridColumn, start: number, end: number) => {
    if (item.kind !== 'appointment') return;
    const a = item.appointment;
    const original = { date: dateOf(item), start: a.start, end: a.end, doctorId: a.doctorId };
    const resized = column.key === item.columnKey && start === item.start;
    update.mutate(
      { appointment: a, date: column.date, start, end, doctorId: column.doctorId ?? a.doctorId },
      {
        onSuccess: () => {
          toast.success(resized ? t('actions.resized') : t('actions.moved'), {
            description: `${a.clientName}, ${formatMinutes(start)}–${formatMinutes(end)}`,
            action: {
              label: t('actions.undo'),
              onClick: () => {
                update.mutate({ appointment: { ...a, start, end }, ...original });
              },
            },
          });
        },
        onError: (error) => {
          toast.error(isApiError(error) ? error.message : t('actions.moved'));
        },
      },
    );
  };

  const openCreate = (column: GridColumn | null, minute: number | null) => {
    setDialog({
      kind: 'create',
      preset: {
        doctorId: column?.doctorId ?? null,
        cabinetId: column?.cabinetId ?? null,
        date: column?.date ?? props.defaultDate,
        time: formatMinutes(minute ?? props.now?.minute ?? dayStart),
      },
    });
  };

  const closeDialog = () => {
    setDialog(null);
    if (createParam) clearCreate();
  };
  const appointment = current?.kind === 'appointment' ? current.appointment : null;
  const training: Training | null = current?.kind === 'training' ? current.training : null;

  return (
    <div className="flex h-[calc(100dvh-32px)] flex-col gap-4 max-lg:h-[calc(100dvh-88px)]">
      <PageHeader
        className="pb-0"
        title={props.title}
        subtitle={props.subtitle || ' '}
        actions={
          <>
            <div className="flex items-center gap-1">
              <IconButton label={props.nav.prevLabel} onClick={props.nav.onPrev}>
                <ChevronLeft />
              </IconButton>
              <Button size="sm" disabled={props.nav.todayDisabled} onClick={props.nav.onToday}>
                {props.nav.todayLabel}
              </Button>
              <IconButton label={props.nav.nextLabel} onClick={props.nav.onNext}>
                <ChevronRight />
              </IconButton>
            </div>
            <IconButton
              label={t('print.day')}
              disabled={!props.query.isReady}
              onClick={() => {
                setPrinting({ kind: 'day' });
              }}
            >
              <Printer />
            </IconButton>
            <IconButton
              label={t('search.button')}
              onClick={() => {
                setDialog({ kind: 'search' });
              }}
            >
              <Search />
            </IconButton>
            {props.toolbar}
            <SegmentControl<Density>
              label={t('density.label')}
              value={props.density}
              onChange={props.onDensity}
              options={[
                { value: 'compact', label: t('density.compact') },
                { value: 'comfort', label: t('density.comfort') },
              ]}
            />
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
        {props.sidebar}
        <div className="min-h-[480px] min-w-0 flex-1">
          {props.query.isError ? (
            <Panel>
              <ErrorState onRetry={props.query.refetch} />
            </Panel>
          ) : !props.query.isReady ? (
            <Skeleton className="h-full" />
          ) : columns.length === 0 ? (
            <Panel>
              <EmptyState title={props.emptyTitle} description={props.emptyHint} />
            </Panel>
          ) : (
            <ScheduleGrid
              columns={columns}
              items={items}
              hourHeight={HOUR_HEIGHT[props.density]}
              dayStart={dayStart}
              dayEnd={dayEnd}
              now={props.now}
              onOpen={setOpened}
              {...(editable ? { onCreate: openCreate, onMove: move } : {})}
            />
          )}
        </div>
      </div>

      <Sheet
        open={current !== null}
        onOpenChange={(open) => {
          if (!open) closeSheet();
        }}
      >
        {appointment && current ? (
          <AppointmentSheet
            appointment={appointment}
            doctorName={doctorName(doctors, appointment.doctorId)}
            onClose={closeSheet}
            onAction={(action) => {
              const date = dateOf(current);
              if (action === 'chat') {
                if (appointment.clientPhone) setChat({ phone: appointment.clientPhone, name: appointment.clientName });
              } else if (action === 'print') {
                setPrinting({ kind: 'slip', appointment, date });
              } else {
                setDialog({ kind: action, appointment, date });
              }
              closeSheet();
            }}
          />
        ) : null}
        {training ? (
          <SheetContent title={training.title || t('training.title')}>
            <dl className="flex flex-col gap-3 px-5 py-4 text-body">
              <div>
                <dt className="text-caption text-ink-muted">{t('details.time')}</dt>
                <dd>
                  {formatMinutes(training.start)}–{formatMinutes(training.end)}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-ink-muted">{t('training.coach')}</dt>
                <dd>{training.doctorName || '—'}</dd>
              </div>
              {training.capacity ? (
                <div>
                  <dt className="text-caption text-ink-muted">{t('details.cabinet')}</dt>
                  <dd>{t('training.capacity', { count: training.capacity })}</dd>
                </div>
              ) : null}
              {training.subject ? <p className="whitespace-pre-line text-ink-muted">{training.subject}</p> : null}
            </dl>
          </SheetContent>
        ) : null}
      </Sheet>

      <Dialog
        open={activeDialog !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        {activeDialog?.kind === 'create' ? (
          <CreateAppointmentDialog preset={activeDialog.preset} doctors={doctors} onDone={closeDialog} />
        ) : null}
        {dialog?.kind === 'edit' ? (
          <EditAppointmentDialog
            appointment={dialog.appointment}
            date={dialog.date}
            doctors={doctors}
            onDone={closeDialog}
          />
        ) : null}
        {dialog?.kind === 'copy' ? (
          <CopyAppointmentDialog
            appointment={dialog.appointment}
            date={dialog.date}
            doctors={doctors}
            onDone={closeDialog}
          />
        ) : null}
        {dialog?.kind === 'delete' ? (
          <DeleteAppointmentDialog appointment={dialog.appointment} onDone={closeDialog} />
        ) : null}
        {dialog?.kind === 'search' ? <ClientSearchDialog onDone={closeDialog} /> : null}
      </Dialog>

      <Sheet
        open={chat !== null}
        onOpenChange={(open) => {
          if (!open) setChat(null);
        }}
      >
        {chat ? <ChatSheet phone={chat.phone} name={chat.name} /> : null}
      </Sheet>

      {printing ? (
        <PrintPortal
          onDone={() => {
            setPrinting(null);
          }}
        >
          {printing.kind === 'day' ? (
            <PrintDay title={props.title} subtitle={props.subtitle} columns={columns} items={items} />
          ) : (
            <PrintSlip
              appointment={printing.appointment}
              date={printing.date}
              doctorName={doctorName(doctors, printing.appointment.doctorId)}
            />
          )}
        </PrintPortal>
      ) : null}

      {editable ? (
        <Fab
          label={t('quickCreate')}
          onClick={() => {
            openCreate(null, null);
          }}
        />
      ) : null}
    </div>
  );
}
