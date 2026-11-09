/**
 * Категориальная палитра графиков (design-system.md → «Графики»). Порядок фиксирован:
 * серия N всегда получает слот N; больше 8 серий — сворачиваем в «Прочее».
 */
export const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
] as const;

export const MAX_SERIES = CHART_COLORS.length;

export function seriesColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] ?? CHART_COLORS[0];
}

export const AXIS = {
  stroke: 'var(--color-hairline)',
  tick: { fill: 'var(--color-ink-muted)', fontSize: 10.5 },
} as const;
