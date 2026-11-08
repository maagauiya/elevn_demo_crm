import {
  ArrowLeftRight,
  BadgePercent,
  CalendarClock,
  CalendarDays,
  ChartLine,
  Circle,
  Clock,
  Download,
  FileText,
  Filter,
  Folder,
  Handshake,
  Heart,
  Home,
  Info,
  LayoutGrid,
  type LucideIcon,
  MessageSquare,
  Settings,
  ShoppingCart,
  Stethoscope,
  Upload,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';

/**
 * Имя файла иконки из WAGetNav (RECICON) → lucide. Оригинальные svg лежат на внешнем домене —
 * их не грузим (приватность, брендинг, лишняя зависимость). Новая иконка в базе → добавь сюда.
 */
const ICONS: Record<string, LucideIcon> = {
  'document.svg': FileText,
  'chart.svg': ChartLine,
  'settings.svg': Settings,
  'folder.svg': Folder,
  'discount.svg': BadgePercent,
  'masters.svg': UserRound,
  'home.svg': Home,
  'time.svg': Clock,
  'calendar.svg': CalendarDays,
  'wallet.svg': Wallet,
  'cabinet_calendar.svg': CalendarClock,
  'clients.svg': Users,
  'category.svg': LayoutGrid,
  'loyalty.svg': Heart,
  'message.svg': MessageSquare,
  'stethoscope.svg': Stethoscope,
  'deal.svg': Handshake,
  'info.svg': Info,
  'buy.svg': ShoppingCart,
  'download.svg': Download,
  'upload.svg': Upload,
  'swap.svg': ArrowLeftRight,
  'filter2.svg': Filter,
};

export function NavIcon({ name }: { name: string | null }) {
  const Icon = (name ? ICONS[name] : undefined) ?? Circle;
  return <Icon className="size-4 shrink-0" aria-hidden />;
}
