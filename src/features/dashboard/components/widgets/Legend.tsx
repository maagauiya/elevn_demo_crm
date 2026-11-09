import { seriesColor } from './palette';

/** Легенда: всегда есть при двух и более сериях — цвет никогда не единственный носитель смысла. */
export function Legend({ items }: { items: { name: string; value?: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {items.map((item, i) => (
        <li key={item.name} className="flex min-w-0 items-center gap-1.5 text-micro text-ink-muted">
          <span className="size-2 shrink-0 rounded-xs" style={{ background: seriesColor(i) }} />
          <span className="truncate">{item.name}</span>
          {item.value ? <span className="text-ink">{item.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}
