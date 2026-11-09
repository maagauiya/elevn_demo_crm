import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { IconButton, Popover, PopoverContent, PopoverTrigger } from '@/shared/ui';
import { NS } from '../i18n';
import type { GridColumn, GridItem } from '../model/grid';
import { capLanes, layoutColumn } from '../model/layout';
import { formatMinutes } from '../model/time';
import { AppointmentCard } from './AppointmentCard';
import { TrainingCard } from './TrainingCard';

const TIME_W = 56;
const HEADER_H = 52;
const COL_MIN = 168;
const SLOT = 30;
const SNAP = 15;
/** Минимальная ширина карточки: уже — текст не читается, лишнее уходит в «+N». */
const CARD_MIN = 64;
/** Сдвиг мыши, после которого нажатие считается переносом, а не кликом. */
const DRAG_THRESHOLD = 4;

export interface ScheduleGridProps {
  columns: GridColumn[];
  items: GridItem[];
  hourHeight: number;
  dayStart: number;
  dayEnd: number;
  /** Минута «сейчас» для колонок с сегодняшней датой */
  now: { date: string; minute: number } | null;
  onOpen: (item: GridItem) => void;
  onCreate?: (column: GridColumn, minute: number) => void;
  /** Перенос/растягивание записи. Нет — карточки не перетаскиваются. */
  onMove?: (item: GridItem, column: GridColumn, start: number, end: number) => void;
}

interface DragState {
  item: GridItem;
  mode: 'move' | 'resize';
  originX: number;
  originY: number;
  /** Разница между минутой под курсором и началом записи в момент захвата */
  grabOffset: number;
  active: boolean;
  columnKey: string;
  start: number;
  end: number;
}

function useWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [ref]);
  return width;
}

const snap = (minute: number) => Math.round(minute / SNAP) * SNAP;

function ItemCard({ item, height, onOpen }: { item: GridItem; height: number; onOpen: (item: GridItem) => void }) {
  const open = () => {
    onOpen(item);
  };
  return item.kind === 'appointment' ? (
    <AppointmentCard appointment={item.appointment} height={height} onOpen={open} />
  ) : (
    <TrainingCard training={item.training} onOpen={open} />
  );
}

/**
 * Сетка расписания: колонки (специалисты / кабинеты / дни) виртуализированы по горизонтали,
 * шкала времени и шапка закреплены. Перенос мышью с привязкой к 15 минутам, растягивание за нижний край,
 * Esc — отмена. На тач-устройствах перенос — через «Изменить» в карточке записи.
 */
export function ScheduleGrid({
  columns,
  items,
  hourHeight,
  dayStart,
  dayEnd,
  now,
  onOpen,
  onCreate,
  onMove,
}: ScheduleGridProps) {
  const { t } = useTranslation(NS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const width = useWidth(scrollRef);
  const colWidth = Math.max(COL_MIN, columns.length ? Math.floor((width - TIME_W) / columns.length) : COL_MIN);
  const pxPerMin = hourHeight / 60;
  const bodyHeight = (dayEnd - dayStart) * pxPerMin;
  const [drag, setDrag] = useState<DragState | null>(null);
  const suppressClick = useRef(false);

  const byColumn = useMemo(() => {
    const map = new Map<string, GridItem[]>();
    for (const item of items) map.set(item.columnKey, [...(map.get(item.columnKey) ?? []), item]);
    return map;
  }, [items]);

  // TanStack Virtual несовместим с React Compiler: компилятор пропускает этот компонент (предупреждение линтера).
  const virtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => colWidth,
    overscan: 3,
    scrollMargin: TIME_W,
  });
  useEffect(() => {
    virtualizer.measure();
  }, [colWidth, virtualizer]);

  // При смене дня прокручиваем к первой записи (или к «сейчас»).
  const firstMinute = now?.minute ?? Math.min(...items.map((i) => i.start), dayEnd);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: Math.max(0, (firstMinute - dayStart - 30) * pxPerMin) });
  }, [firstMinute, dayStart, pxPerMin]);

  const virtualColumns = virtualizer.getVirtualItems();
  const top = (minute: number) => (minute - dayStart) * pxPerMin;

  /** Колонка и минута под курсором. */
  const locate = (clientX: number, clientY: number) => {
    const body = bodyRef.current;
    if (!body) return null;
    const rect = body.getBoundingClientRect();
    const x = clientX - rect.left;
    const vc = virtualColumns.find((c) => x >= c.start - TIME_W && x < c.start - TIME_W + c.size);
    const column = vc ? columns[vc.index] : undefined;
    return { column, minute: dayStart + (clientY - rect.top) / pxPerMin };
  };

  // Перенос: слушаем окно, пока кнопка мыши зажата.
  useEffect(() => {
    if (!drag) return;
    const onPointerMove = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - drag.originX, e.clientY - drag.originY);
      if (!drag.active && moved < DRAG_THRESHOLD) return;
      // Автопрокрутка у краёв.
      const scroller = scrollRef.current;
      if (scroller) {
        const r = scroller.getBoundingClientRect();
        if (e.clientY > r.bottom - 48) scroller.scrollBy(0, 12);
        else if (e.clientY < r.top + HEADER_H + 24) scroller.scrollBy(0, -12);
        if (e.clientX > r.right - 48) scroller.scrollBy(12, 0);
        else if (e.clientX < r.left + TIME_W + 24) scroller.scrollBy(-12, 0);
      }
      const spot = locate(e.clientX, e.clientY);
      if (!spot) return;
      const duration = drag.item.end - drag.item.start;
      if (drag.mode === 'move') {
        const start = Math.min(Math.max(snap(spot.minute - drag.grabOffset), dayStart), dayEnd - duration);
        setDrag({ ...drag, active: true, columnKey: spot.column?.key ?? drag.columnKey, start, end: start + duration });
      } else {
        const end = Math.min(Math.max(snap(spot.minute), drag.start + SNAP), dayEnd);
        setDrag({ ...drag, active: true, end });
      }
    };
    const onPointerUp = () => {
      if (drag.active) {
        // Клик после отпускания придёт в этом же такте — гасим только его. Если кнопку отпустили
        // вне карточки, клик уйдёт другому элементу, и флаг не должен «съесть» следующий настоящий клик.
        suppressClick.current = true;
        setTimeout(() => {
          suppressClick.current = false;
        }, 0);
        const column = columns.find((c) => c.key === drag.columnKey);
        const changed =
          drag.columnKey !== drag.item.columnKey || drag.start !== drag.item.start || drag.end !== drag.item.end;
        if (column && changed) onMove?.(drag.item, column, drag.start, drag.end);
      }
      setDrag(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrag(null);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  });

  const startDrag = (e: React.PointerEvent, item: GridItem, mode: DragState['mode']) => {
    // Только мышь/перо и левая кнопка: на таче перенос через форму, чтобы не ломать прокрутку.
    if (!onMove || e.pointerType === 'touch' || e.button !== 0) return;
    if (item.kind === 'appointment' && item.appointment.kind === 'blocked') return;
    const spot = locate(e.clientX, e.clientY);
    if (!spot) return;
    if (mode === 'resize') e.stopPropagation();
    setDrag({
      item,
      mode,
      originX: e.clientX,
      originY: e.clientY,
      grabOffset: spot.minute - item.start,
      active: false,
      columnKey: item.columnKey,
      start: item.start,
      end: item.end,
    });
  };

  const slots: number[] = [];
  for (let m = dayStart; m < dayEnd; m += SLOT) slots.push(m);
  const hours = slots.filter((m) => m % 60 === 0);
  const nowInRange = now !== null && now.minute >= dayStart && now.minute <= dayEnd;
  const totalWidth = TIME_W + virtualizer.getTotalSize();

  return (
    <div
      ref={scrollRef}
      className={cn(
        'relative h-full overflow-auto rounded-md border border-hairline bg-canvas',
        drag?.active && 'cursor-grabbing select-none',
      )}
    >
      <div style={{ width: totalWidth, height: HEADER_H + bodyHeight }} className="relative">
        {/* Шапка */}
        <div className="sticky top-0 z-20 flex border-b border-hairline bg-canvas" style={{ height: HEADER_H }}>
          <div className="sticky left-0 z-10 shrink-0 border-r border-hairline bg-canvas" style={{ width: TIME_W }} />
          <div className="relative flex-1">
            {virtualColumns.map((vc) => {
              const column = columns[vc.index];
              if (!column) return null;
              const count = byColumn.get(column.key)?.length ?? 0;
              return (
                <div
                  key={column.key}
                  className="absolute top-0 flex h-full items-center gap-1 border-r border-hairline px-2"
                  style={{ left: vc.start - TIME_W, width: vc.size }}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    {column.href ? (
                      <Link to={column.href} className="truncate text-label hover:text-accent" title={column.title}>
                        {column.title}
                      </Link>
                    ) : (
                      <span className={cn('truncate text-label', column.off && 'text-ink-faint')} title={column.title}>
                        {column.title}
                      </span>
                    )}
                    <span className="truncate text-subtitle text-ink-muted">
                      {column.subtitle}
                      {count ? ` · ${count}` : ''}
                    </span>
                  </div>
                  {onCreate && !column.off ? (
                    <IconButton
                      label={`${t('newAppointment')}: ${column.title}`}
                      size="icon-sm"
                      onClick={() => {
                        onCreate(column, column.workFrom ?? dayStart);
                      }}
                    >
                      <Plus />
                    </IconButton>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex" style={{ height: bodyHeight }}>
          {/* Шкала времени */}
          <div className="sticky left-0 z-10 shrink-0 border-r border-hairline bg-canvas" style={{ width: TIME_W }}>
            {hours.map((m) => (
              <span
                key={m}
                className="absolute right-2 -translate-y-1/2 text-caption text-ink-muted"
                style={{ top: top(m) }}
              >
                {formatMinutes(m)}
              </span>
            ))}
          </div>

          <div ref={bodyRef} className="relative flex-1">
            {slots.map((m) => (
              <div
                key={m}
                className={
                  m % 60 === 0
                    ? 'absolute inset-x-0 border-t border-hairline'
                    : 'absolute inset-x-0 border-t border-dashed border-hairline/60'
                }
                style={{ top: top(m) }}
              />
            ))}

            {virtualColumns.map((vc) => {
              const column = columns[vc.index];
              if (!column) return null;
              const maxLanes = Math.max(1, Math.floor(vc.size / CARD_MIN));
              const { visible, overflow } = capLanes(layoutColumn(byColumn.get(column.key) ?? []), maxLanes);
              const isNowColumn = nowInRange && column.date === now.date;
              return (
                <div
                  key={column.key}
                  className="absolute top-0 h-full border-r border-hairline"
                  style={{ left: vc.start - TIME_W, width: vc.size }}
                >
                  {column.off ? (
                    <div className="absolute inset-0 bg-hatch" />
                  ) : (
                    <>
                      {column.workFrom !== null && column.workFrom > dayStart ? (
                        <div className="absolute inset-x-0 top-0 bg-hatch" style={{ height: top(column.workFrom) }} />
                      ) : null}
                      {column.workTo !== null && column.workTo < dayEnd ? (
                        <div className="absolute inset-x-0 bottom-0 bg-hatch" style={{ top: top(column.workTo) }} />
                      ) : null}
                    </>
                  )}

                  {onCreate && !column.off
                    ? slots.map((m) => (
                        <button
                          key={m}
                          type="button"
                          aria-label={`${t('newAppointment')}: ${column.title}, ${formatMinutes(m)}`}
                          onClick={() => {
                            onCreate(column, m);
                          }}
                          className="group absolute inset-x-0 flex cursor-pointer items-center justify-center hover:bg-accent-tint/60 focus-visible:bg-accent-tint"
                          style={{ top: top(m), height: SLOT * pxPerMin }}
                        >
                          <Plus className="size-3.5 text-accent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
                        </button>
                      ))
                    : null}

                  {visible.map(({ item, lane, shownLanes: lanes }) => {
                    const height = Math.max((item.end - item.start) * pxPerMin - 2, 18);
                    const dragging = drag?.active && drag.item.id === item.id && drag.item.kind === item.kind;
                    const draggable =
                      Boolean(onMove) && item.kind === 'appointment' && item.appointment.kind !== 'blocked';
                    return (
                      <div
                        key={`${item.kind}-${item.id}`}
                        className={cn('group/card absolute p-px', dragging && 'opacity-40')}
                        style={{
                          top: top(item.start) + 1,
                          height,
                          left: `${(lane / lanes) * 100}%`,
                          width: `${100 / lanes}%`,
                        }}
                        onPointerDown={(e) => {
                          startDrag(e, item, 'move');
                        }}
                        onClickCapture={(e) => {
                          if (suppressClick.current) {
                            suppressClick.current = false;
                            e.stopPropagation();
                            e.preventDefault();
                          }
                        }}
                      >
                        <ItemCard item={item} height={height} onOpen={onOpen} />
                        {draggable ? (
                          <div
                            aria-hidden
                            className="absolute inset-x-1 bottom-0 h-1.5 cursor-ns-resize rounded-xs group-hover/card:bg-ink/10"
                            onPointerDown={(e) => {
                              startDrag(e, item, 'resize');
                            }}
                          />
                        ) : null}
                      </div>
                    );
                  })}

                  {overflow.map((bucket) => (
                    <div
                      key={`${bucket.start}-${bucket.end}`}
                      className="absolute p-px"
                      style={{
                        top: top(bucket.start) + 1,
                        height: Math.max((bucket.end - bucket.start) * pxPerMin - 2, 18),
                        left: `${((maxLanes - 1) / maxLanes) * 100}%`,
                        width: `${100 / maxLanes}%`,
                      }}
                    >
                      <Popover>
                        <PopoverTrigger
                          aria-label={t('more', { count: bucket.items.length })}
                          className="flex h-full w-full cursor-pointer items-start justify-center rounded-sm border border-hairline bg-canvas pt-0.5 text-caption text-ink-muted hover:shadow-hover"
                        >
                          +{bucket.items.length}
                        </PopoverTrigger>
                        <PopoverContent className="flex max-h-80 w-64 flex-col gap-1 overflow-y-auto p-2">
                          {bucket.items.map((item) => (
                            <div key={`${item.kind}-${item.id}`} className="h-12">
                              <ItemCard item={item} height={48} onOpen={onOpen} />
                            </div>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}

                  {/* Призрак переносимой записи: тень «поднято» (design-system: тень = интерактивность) */}
                  {drag?.active && drag.columnKey === column.key ? (
                    <div
                      className="pointer-events-none absolute inset-x-1 z-20 flex flex-col rounded-sm border-l-4 border-l-accent bg-canvas px-1.5 py-1 shadow-raised"
                      style={{ top: top(drag.start) + 1, height: Math.max((drag.end - drag.start) * pxPerMin - 2, 18) }}
                    >
                      <span className="text-caption text-accent">
                        {formatMinutes(drag.start)}–{formatMinutes(drag.end)}
                      </span>
                    </div>
                  ) : null}

                  {isNowColumn ? (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-danger"
                      style={{ top: top(now.minute) }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
