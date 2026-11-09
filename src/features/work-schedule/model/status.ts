/**
 * Статусы дня в графике работы (WATTGetStatusList) → тон и текст ячейки.
 * Таблица — docs/design-system.md → «Статусы графика работы». Цвета с сервера (CNAME) не используем.
 */
export interface StatusTone {
  cell: string;
  text: string;
  /** Ключ сокращения в locales (для статусов без часов) */
  short: 'off' | 'vacation' | 'sick' | 'dayOff' | 'absent' | null;
}

const TONES: Record<number, StatusTone> = {
  1: { cell: 'bg-status-done-bg', text: 'text-status-done-fg', short: null },
  7: { cell: 'bg-status-pending-bg', text: 'text-status-pending-fg', short: null },
  2: { cell: 'bg-canvas', text: 'text-ink-faint', short: 'off' },
  3: { cell: 'bg-status-confirmed-bg', text: 'text-status-confirmed-fg', short: 'vacation' },
  5: { cell: 'bg-status-in-progress-bg', text: 'text-status-in-progress-fg', short: 'sick' },
  4: { cell: 'bg-status-cancelled-bg', text: 'text-status-cancelled-fg', short: 'dayOff' },
  6: { cell: 'bg-danger-tint', text: 'text-danger', short: 'absent' },
};

const UNKNOWN: StatusTone = { cell: 'bg-canvas-sunken', text: 'text-ink-muted', short: null };

export function statusTone(statusId: number): StatusTone {
  return TONES[statusId] ?? UNKNOWN;
}

/** " 10:00-23:00" или "10:00-14:00, 15:00-19:00" → "10–23" / "10–14, 15–19". */
export function shortHours(tooltip: string): string {
  return tooltip
    .split(',')
    .map((range) => range.trim())
    .filter(Boolean)
    .map((range) =>
      range
        .split('-')
        .map((t) => {
          const [h = '', m = '00'] = t.trim().split(':');
          return m === '00' ? String(Number(h)) : `${Number(h)}:${m}`;
        })
        .join('–'),
    )
    .join(', ');
}
