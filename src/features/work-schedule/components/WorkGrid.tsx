import { useVirtualizer } from '@tanstack/react-virtual';
import { format, isToday, isWeekend } from 'date-fns';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { dateLocale } from '@/shared/lib/dates';
import type { DayStatus, WsDoctor, WsStatus } from '../api/ws-api';
import { NS } from '../i18n';
import { type CellRef, cellKey, rectangle } from '../model/selection';
import { shortHours, statusTone } from '../model/status';

const NAME_W = 220;
const DAY_W = 44;
const ROW_H = 36;
const HEADER_H = 44;

function parseIso(date: string) {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Сетка «специалист × день». Строки виртуализированы, шапка и колонка имён закреплены.
 * Выделение: протягивание мышью (прямоугольник), Shift — диапазон от якоря, Ctrl/Cmd — по одной ячейке,
 * клик по имени — вся строка, по дню — весь столбец. С клавиатуры: Tab/Enter по ячейкам.
 */
export function WorkGrid({
  doctors,
  dates,
  days,
  statuses,
  selected,
  onSelect,
}: {
  doctors: WsDoctor[];
  dates: string[];
  days: Map<string, DayStatus>;
  statuses: WsStatus[];
  selected: Map<string, CellRef>;
  onSelect: (cells: CellRef[], mode: 'replace' | 'toggle' | 'add') => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const locale = dateLocale(i18n.language);
  const scrollRef = useRef<HTMLDivElement>(null);
  const anchor = useRef<CellRef | null>(null);
  const dragging = useRef(false);
  const last = useRef<CellRef | null>(null);
  const docIds = doctors.map((d) => d.id);
  const statusName = new Map(statuses.map((s) => [s.id, s.name]));

  // TanStack Virtual несовместим с React Compiler: компилятор пропускает этот компонент (предупреждение линтера).
  const rows = useVirtualizer({
    count: doctors.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_H,
    overscan: 8,
  });

  // Протягивание: ячейку под курсором ищем по data-атрибутам — надёжнее pointerenter при быстром движении.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current || !anchor.current) return;
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-cell-doc]');
      if (!el) return;
      const cell = { docId: Number(el.dataset.cellDoc), date: el.dataset.cellDate ?? '' };
      if (last.current && cellKey(last.current) === cellKey(cell)) return;
      last.current = cell;
      onSelect(rectangle(anchor.current, cell, docIds, dates), 'replace');
    };
    const stop = () => {
      dragging.current = false;
      last.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
  });

  const pointerDown = (e: React.PointerEvent, cell: CellRef) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) {
      onSelect([cell], 'toggle');
      anchor.current = cell;
      return;
    }
    if (e.shiftKey && anchor.current) {
      onSelect(rectangle(anchor.current, cell, docIds, dates), 'replace');
      return;
    }
    anchor.current = cell;
    last.current = cell;
    dragging.current = true;
    onSelect([cell], 'replace');
  };

  const width = NAME_W + dates.length * DAY_W;
  return (
    <div
      ref={scrollRef}
      className="relative h-full overflow-auto rounded-md border border-hairline bg-canvas select-none"
    >
      <div style={{ width, height: HEADER_H + rows.getTotalSize() }} className="relative">
        {/* Шапка: дни месяца */}
        <div className="sticky top-0 z-20 flex border-b border-hairline bg-canvas" style={{ height: HEADER_H }}>
          <div className="sticky left-0 z-10 shrink-0 border-r border-hairline bg-canvas" style={{ width: NAME_W }} />
          {dates.map((date) => {
            const d = parseIso(date);
            return (
              <button
                key={date}
                type="button"
                aria-label={format(d, 'd MMMM', { locale })}
                onClick={(e) => {
                  onSelect(
                    docIds.map((docId) => ({ docId, date })),
                    e.metaKey || e.ctrlKey ? 'add' : 'replace',
                  );
                }}
                className={cn(
                  'flex shrink-0 cursor-pointer flex-col items-center justify-center border-r border-hairline text-micro hover:bg-canvas-sunken',
                  isWeekend(d) ? 'text-ink-faint' : 'text-ink-muted',
                  isToday(d) && 'text-accent',
                )}
                style={{ width: DAY_W }}
              >
                <span className="uppercase">{format(d, 'EEEEEE', { locale })}</span>
                <span className="text-caption">{format(d, 'd')}</span>
              </button>
            );
          })}
        </div>

        {rows.getVirtualItems().map((row) => {
          const doctor = doctors[row.index];
          if (!doctor) return null;
          return (
            <div
              key={doctor.id}
              className="absolute left-0 flex border-b border-hairline"
              style={{ top: HEADER_H + row.start, height: ROW_H, width }}
            >
              <button
                type="button"
                onClick={(e) => {
                  onSelect(
                    dates.map((date) => ({ docId: doctor.id, date })),
                    e.metaKey || e.ctrlKey ? 'add' : 'replace',
                  );
                }}
                className="sticky left-0 z-10 flex shrink-0 cursor-pointer flex-col justify-center border-r border-hairline bg-canvas px-3 text-left hover:bg-canvas-sunken"
                style={{ width: NAME_W }}
                title={doctor.name}
              >
                <span className="truncate text-label">{doctor.name}</span>
                <span className="truncate text-micro text-ink-muted">{doctor.position}</span>
              </button>
              {dates.map((date) => {
                const cell = { docId: doctor.id, date };
                const day = days.get(cellKey(cell));
                const tone = day ? statusTone(day.statusId) : null;
                const label = day ? (tone?.short ? t(`short.${tone.short}`) : shortHours(day.hours)) : '';
                const isSelected = selected.has(cellKey(cell));
                const title = [
                  doctor.name,
                  date.split('-').reverse().join('.'),
                  day ? statusName.get(day.statusId) : null,
                  day?.hours,
                  day?.appointments ? t('appointments', { count: day.appointments }) : null,
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <button
                    key={date}
                    type="button"
                    aria-label={title}
                    aria-pressed={isSelected}
                    title={title}
                    onPointerDown={(e) => {
                      pointerDown(e, cell);
                    }}
                    data-cell-doc={doctor.id}
                    data-cell-date={date}
                    onClick={(e) => {
                      // Клик с клавиатуры (detail = 0) — переключаем ячейку; мышь обрабатывает pointerdown.
                      if (e.detail === 0) onSelect([cell], 'toggle');
                    }}
                    className={cn(
                      'flex shrink-0 cursor-cell items-center justify-center border-r border-hairline text-micro',
                      tone ? [tone.cell, tone.text] : 'bg-canvas',
                      isSelected && 'relative ring-2 ring-accent ring-inset',
                    )}
                    style={{ width: DAY_W }}
                  >
                    <span className="truncate px-0.5">{label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
