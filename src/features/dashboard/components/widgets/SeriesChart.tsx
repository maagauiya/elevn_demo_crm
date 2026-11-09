import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompact, type SeriesData } from '../../model/parse';
import { ChartTooltip } from './ChartTooltip';
import { Legend } from './Legend';
import { AXIS, MAX_SERIES, seriesColor } from './palette';

/** Линейный (тип 2) или столбчатый (тип 3) график. Одна ось Y, линии 2px, сетка hairline. */
export function SeriesChart({ data, kind }: { data: SeriesData; kind: 'line' | 'bar' }) {
  const { i18n } = useTranslation();
  const series = data.series.slice(0, MAX_SERIES);
  const yTick = (v: number) => formatCompact(v, i18n.language);
  const common = (
    <>
      <CartesianGrid vertical={false} stroke="var(--color-hairline)" />
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={{ stroke: AXIS.stroke }}
        tick={AXIS.tick}
        interval="preserveStartEnd"
      />
      <YAxis tickLine={false} axisLine={false} tick={AXIS.tick} tickFormatter={yTick} width={64} />
      <Tooltip
        content={<ChartTooltip />}
        cursor={kind === 'bar' ? { fill: 'var(--color-canvas-sunken)' } : { stroke: AXIS.stroke }}
      />
    </>
  );
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {kind === 'line' ? (
            <LineChart data={data.points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              {common}
              {series.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={seriesColor(i)}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: 'var(--color-canvas)', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data.points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barGap={2}>
              {common}
              {series.map((name, i) => (
                <Bar
                  key={name}
                  dataKey={name}
                  fill={seriesColor(i)}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      {series.length > 1 ? <Legend items={series.map((name) => ({ name }))} /> : null}
    </div>
  );
}
