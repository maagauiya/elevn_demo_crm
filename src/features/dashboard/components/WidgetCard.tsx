import { useTranslation } from 'react-i18next';
import type { ParamValues } from '@/features/item-params';
import { cn } from '@/shared/lib/cn';
import { EmptyState, ErrorState, Panel, Skeleton } from '@/shared/ui';
import { useWidgetData } from '../api/dashboard-api';
import { NS } from '../i18n';
import { parseRating, parseSeries, parseSlices, parseStats, type Row } from '../model/parse';
import { PieChartWidget } from './widgets/PieChartWidget';
import { RatingWidget } from './widgets/RatingWidget';
import { RecordListWidget } from './widgets/RecordListWidget';
import { SeriesChart } from './widgets/SeriesChart';
import { StatsWidget } from './widgets/StatsWidget';

/** Высота виджета: ITEMHEIGHT в условных единицах старого фронта → px. */
function widgetHeight(units: number): number {
  if (units <= 2) return 260;
  if (units <= 4) return 420;
  return 560;
}

/** Тип виджета (ITEMTYPEID) → визуализация. Типы как в старом DashItem. */
function WidgetBody({ type, rows, wide }: { type: number; rows: Row[]; wide: boolean }) {
  const { t } = useTranslation(NS);
  switch (type) {
    case 2:
      return <SeriesChart data={parseSeries(rows)} kind="line" />;
    case 3:
      return <SeriesChart data={parseSeries(rows)} kind="bar" />;
    case 4:
      return <PieChartWidget slices={parseSlices(rows)} otherLabel={t('other')} compact={!wide} />;
    case 5:
      return <StatsWidget stats={parseStats(rows)} wide={wide} />;
    case 8:
      return <RatingWidget items={parseRating(rows)} />;
    case 11:
      return <RecordListWidget rows={rows} />;
    default:
      return <EmptyState className="py-6" title={t('unknownType', { type })} />;
  }
}

export function WidgetCard({
  type,
  caption,
  method,
  width,
  height,
  params,
  ready,
  className,
}: {
  type: number;
  caption: string;
  method: string;
  width: number;
  height: number;
  params: ParamValues;
  ready: boolean;
  className?: string;
}) {
  const { t } = useTranslation(NS);
  const data = useWidgetData(method, params, ready);
  // Показатели в широком виджете — строка плиток, высота по содержимому.
  const autoHeight = type === 5 && width >= 6;
  const scroll = type === 5 || type === 8 || type === 11;
  return (
    <Panel
      className={cn('flex flex-col gap-3 p-4', className)}
      style={autoHeight ? undefined : { height: widgetHeight(height) }}
    >
      {caption ? <h2 className="text-label">{caption}</h2> : null}
      <div className={cn('min-h-0 flex-1', scroll && 'overflow-y-auto')}>
        {!ready || data.isPending ? (
          <Skeleton className="h-full min-h-16" />
        ) : data.isError ? (
          <ErrorState className="py-4" onRetry={() => void data.refetch()} />
        ) : data.data.length === 0 ? (
          <EmptyState className="py-4" title={t('noData')} />
        ) : (
          <WidgetBody type={type} rows={data.data} wide={width >= 6} />
        )}
      </div>
    </Panel>
  );
}
