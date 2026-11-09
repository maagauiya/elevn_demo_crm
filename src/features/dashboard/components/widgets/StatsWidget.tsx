import { useTranslation } from 'react-i18next';
import { formatFull, type Stat } from '../../model/parse';

/** Чистое число форматируем с разрядами; «12%» и текст оставляем как есть. */
function display(value: string, lang: string): string {
  return /^-?\d+([.,]\d+)?$/.test(value) ? formatFull(Number(value.replace(',', '.')), lang) : value;
}

/** Показатели (тип 5). В широком виджете — строка плиток, в узком — подпись над значением. */
export function StatsWidget({ stats, wide }: { stats: Stat[]; wide: boolean }) {
  const { i18n } = useTranslation();
  if (wide) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 rounded-sm bg-canvas-sunken px-3 py-2">
            <span className="text-micro text-ink-muted">{stat.label}</span>
            <span className="truncate text-title">{display(stat.value, i18n.language)}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <dl className="flex flex-col divide-y divide-hairline">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-0.5 py-1.5">
          <dt className="text-micro text-ink-muted">{stat.label}</dt>
          <dd className="truncate text-label" title={stat.value}>
            {display(stat.value, i18n.language)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
