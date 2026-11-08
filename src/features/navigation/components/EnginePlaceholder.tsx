import { useParams } from 'react-router';
import { PlaceholderPage, Skeleton } from '@/shared/ui';
import { useNavItem } from '../api/nav-api';

/**
 * Заглушка экрана-движка (/info/:itemId, /chart/:itemId, …): показывает, какой пункт меню открыт
 * и из какого метода он берёт данные. Удаляется, когда владелец трека делает движок.
 */
export function EnginePlaceholder({ track, source }: { track: 'A' | 'B'; source: string }) {
  const { itemId } = useParams();
  const { item, isPending } = useNavItem(itemId ? Number(itemId) : undefined);
  if (isPending) return <Skeleton className="h-40" />;
  const details = item
    ? `${source} · пункт ${item.itemId}, тип ${item.type}${item.methodName ? `, метод ${item.methodName}` : ''}`
    : source;
  return <PlaceholderPage title={item?.name ?? `#${itemId ?? '?'}`} track={track} source={details} />;
}
