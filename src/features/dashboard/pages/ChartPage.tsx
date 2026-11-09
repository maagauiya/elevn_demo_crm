import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { ItemParamsBar, useItemParamsState } from '@/features/item-params';
import { useNavItem } from '@/features/navigation';
import { EmptyState, PageHeader, Panel, Skeleton } from '@/shared/ui';
import { WidgetCard } from '../components/WidgetCard';
import { NS } from '../i18n';

/** Отдельный график из меню (типы 2, 3, 4, 5, 8, 11): тот же виджет, что в дашборде, на всю ширину. */
export function ChartPage() {
  const { t } = useTranslation(NS);
  const itemId = Number(useParams().itemId);
  const { item, isPending } = useNavItem(itemId);
  const params = useItemParamsState(itemId);

  if (isPending) return <Skeleton className="h-96" />;
  if (!item?.methodName) {
    return (
      <Panel>
        <EmptyState title={t('notFound')} />
      </Panel>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <PageHeader className="pb-0" title={item.name} actions={<ItemParamsBar state={params} />} />
      <WidgetCard
        type={item.type}
        caption=""
        method={item.methodName}
        width={12}
        height={8}
        params={params.values}
        ready={params.ready}
      />
    </div>
  );
}
