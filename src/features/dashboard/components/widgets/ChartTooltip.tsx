import { useTranslation } from 'react-i18next';
import { formatFull } from '../../model/parse';

interface Item {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
}

/** Тултип: значения цветом текста, рядом — цветная метка серии (design-system: текст не красим в цвет серии). */
export function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: Item[];
}) {
  const { i18n } = useTranslation();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-hairline bg-canvas px-2.5 py-2 shadow-raised">
      {label !== undefined ? <p className="pb-1 text-caption text-ink">{label}</p> : null}
      <ul className="flex flex-col gap-0.5">
        {payload.map((item) => (
          <li key={String(item.name)} className="flex items-center gap-2 text-micro text-ink-muted">
            <span className="size-2 shrink-0 rounded-xs" style={{ background: item.color }} />
            <span className="flex-1">{item.name}</span>
            <span className="text-ink">{formatFull(Number(item.value), i18n.language)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
