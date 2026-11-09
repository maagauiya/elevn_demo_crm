import { useTranslation } from 'react-i18next';
import { formatFull, type RatingItem } from '../../model/parse';

/** Рейтинг (тип 8): место, имя, значение и полоса относительно лидера. */
export function RatingWidget({ items }: { items: RatingItem[] }) {
  const { i18n } = useTranslation();
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ol className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li key={`${item.name}-${index}`} className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="w-4 shrink-0 text-caption text-ink-faint">{index + 1}</span>
            <span className="flex-1 truncate text-body">{item.name}</span>
            <span className="text-label">{formatFull(item.value, i18n.language)}</span>
          </div>
          <div className="ml-6 h-1.5 rounded-pill bg-canvas-sunken">
            <div className="h-full rounded-pill bg-chart-1" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
