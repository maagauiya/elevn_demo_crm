import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { dateLocale } from '@/shared/lib/dates';
import { IconButton } from './button';

/**
 * Мини-календарь (design-system.md): выбранный день — pill-заливка accent,
 * сегодня — accent-текст без заливки. Неделя начинается с понедельника.
 */
export function MiniCalendar({
  value,
  onChange,
  className,
}: {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}) {
  const { i18n } = useTranslation();
  const locale = dateLocale(i18n.language);
  const [month, setMonth] = useState(() => startOfMonth(value));
  // Выбрали день в другом месяце (кнопками «вперёд/назад» в тулбаре) — показываем его месяц.
  const [shownFor, setShownFor] = useState(value);
  if (!isSameDay(shownFor, value)) {
    setShownFor(value);
    if (!isSameMonth(value, month)) setMonth(startOfMonth(value));
  }

  const gridStart = startOfWeek(month, { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weekdays = days.slice(0, 7).map((d) => format(d, 'EEEEEE', { locale }));

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-label capitalize">{format(month, 'LLLL yyyy', { locale })}</span>
        <div className="flex">
          <IconButton
            label={format(subMonths(month, 1), 'LLLL', { locale })}
            size="icon-sm"
            onClick={() => {
              setMonth(subMonths(month, 1));
            }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            label={format(addMonths(month, 1), 'LLLL', { locale })}
            size="icon-sm"
            onClick={() => {
              setMonth(addMonths(month, 1));
            }}
          >
            <ChevronRight />
          </IconButton>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center" role="grid">
        {weekdays.map((d) => (
          <span key={d} className="py-1 text-micro text-ink-faint uppercase">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const selected = isSameDay(day, value);
          return (
            <button
              key={day.toISOString()}
              type="button"
              aria-pressed={selected}
              aria-label={format(day, 'd MMMM yyyy', { locale })}
              onClick={() => {
                onChange(day);
              }}
              className={cn(
                'mx-auto flex size-7 cursor-pointer items-center justify-center rounded-pill text-caption transition-colors',
                isSameMonth(day, month) ? 'text-ink' : 'text-ink-faint',
                !selected && 'hover:bg-canvas-sunken',
                isToday(day) && !selected && 'text-accent',
                selected && 'bg-accent text-on-accent',
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
