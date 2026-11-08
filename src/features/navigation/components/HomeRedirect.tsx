import { Navigate } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { Skeleton } from '@/shared/ui';
import { useNavMenu } from '../api/nav-api';

/** Стартовый экран — пункт DEFNAVITEMID из ответа логина, иначе первый пункт меню. */
export function HomeRedirect() {
  const user = useCurrentUser();
  const menu = useNavMenu();
  if (menu.isPending) return <Skeleton className="h-40" />;
  const items = menu.data?.items ?? [];
  const target = items.find((i) => String(i.itemId) === user.defaultNavItemId) ?? items[0];
  return <Navigate to={target?.path ?? '/logbook'} replace />;
}
