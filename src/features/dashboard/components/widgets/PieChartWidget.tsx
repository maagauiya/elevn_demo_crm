import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCompact, formatFull, type Slice } from '../../model/parse';
import { ChartTooltip } from './ChartTooltip';
import { Legend } from './Legend';
import { MAX_SERIES, seriesColor } from './palette';

/** Кольцевая диаграмма (тип 4). Больше 8 секторов — хвост сворачивается в «Прочее». Легенда со значениями. */
export function PieChartWidget({
  slices,
  otherLabel,
  compact,
}: {
  slices: Slice[];
  otherLabel: string;
  compact: boolean;
}) {
  const { i18n } = useTranslation();
  const sorted = [...slices].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, MAX_SERIES - 1);
  const tail = sorted.slice(MAX_SERIES - 1);
  const data =
    tail.length > 1 ? [...head, { label: otherLabel, value: tail.reduce((s, x) => s + x.value, 0) }] : sorted;
  const total = data.reduce((s, x) => s + x.value, 0);
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="relative min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.map((slice, i) => ({ ...slice, fill: seriesColor(i) }))}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={data.length > 1 ? 1 : 0}
              stroke="var(--color-canvas)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <span
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center',
            compact ? 'text-caption' : 'text-label',
          )}
        >
          {formatCompact(total, i18n.language)}
        </span>
      </div>
      <div className={cn(compact && 'max-h-24 overflow-y-auto')}>
        <Legend items={data.map((s) => ({ name: s.label, value: formatFull(s.value, i18n.language) }))} />
      </div>
    </div>
  );
}
