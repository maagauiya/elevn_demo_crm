import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { ItemParamsBar, useItemParamsState } from '@/features/item-params';
import { useNavItem } from '@/features/navigation';
import { cn } from '@/shared/lib/cn';
import { EmptyState, ErrorState, PageHeader, Panel, Skeleton } from '@/shared/ui';
import { useDashContent } from '../api/dashboard-api';
import { WidgetCard } from '../components/WidgetCard';
import { NS } from '../i18n';

/** Ширина виджета из 12 колонок → классы сетки. На планшете узкие виджеты по два в ряд, на телефоне — в столбик. */
const SPAN: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
};

/** Движок дашбордов (тип пункта 6): состав и размеры виджетов — из WAGetDashContent. */
export function DashboardPage() {
  const { t } = useTranslation(NS);
  const itemId = Number(useParams().itemId);
  const { item } = useNavItem(itemId);
  const params = useItemParamsState(itemId);
  const content = useDashContent(itemId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader className="pb-0" title={item?.name ?? ' '} actions={<ItemParamsBar state={params} />} />
      {content.isPending ? (
        <div className="grid gap-3 lg:grid-cols-12">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-64 lg:col-span-4" />
          ))}
        </div>
      ) : content.isError ? (
        <Panel>
          <ErrorState onRetry={() => void content.refetch()} />
        </Panel>
      ) : content.data.length === 0 ? (
        <Panel>
          <EmptyState title={t('noWidgets')} />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
          {content.data.map((widget) => (
            <WidgetCard
              key={widget.id}
              className={cn(SPAN[widget.width], widget.width > 4 && 'md:col-span-2')}
              type={widget.type}
              caption={widget.caption}
              method={widget.method}
              width={widget.width}
              height={widget.height}
              params={params.values}
              ready={params.ready}
            />
          ))}
        </div>
      )}
    </div>
  );
}
