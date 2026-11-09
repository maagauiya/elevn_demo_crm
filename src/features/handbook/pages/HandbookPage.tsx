import { useParams } from 'react-router';
import { PageHeader, Skeleton } from '@/shared/ui';
import { useNavItem } from '@/features/navigation';
import { MetaTable } from '../components/MetaTable';

/** Движок универсальной таблицы: ~180 разделов (типы пунктов 1, 7, 9, 10). */
export function HandbookPage() {
  const { itemId } = useParams();
  const id = Number(itemId);
  const { item, isPending } = useNavItem(id);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {isPending ? <Skeleton className="h-8 w-48" /> : <PageHeader title={item?.name ?? `#${itemId ?? '?'}`} />}
      <MetaTable itemId={id} />
    </div>
  );
}
