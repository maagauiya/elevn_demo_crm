import { ToggleGroup } from 'radix-ui';
import { cn } from '@/shared/lib/cn';

export interface SegmentOption<V extends string> {
  value: V;
  label: string;
}

/**
 * Сегмент-контрол тулбара («По специалистам / По кабинетам»): pill-контейнер,
 * активный таб — белая подложка + тень hover-уровня.
 */
export function SegmentControl<V extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: V;
  onChange: (value: V) => void;
  options: readonly SegmentOption<V>[];
  /** Подпись для скринридера */
  label: string;
  className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      aria-label={label}
      onValueChange={(next) => {
        // Radix отдаёт '' при повторном клике по активному — сегмент всегда должен быть выбран.
        if (next) onChange(next as V);
      }}
      className={cn('inline-flex items-center gap-0.5 rounded-pill bg-canvas-sunken p-0.5', className)}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className="h-7 cursor-pointer rounded-pill px-3 text-caption text-ink-muted transition-colors hover:text-ink data-[state=on]:bg-canvas data-[state=on]:text-ink data-[state=on]:shadow-hover"
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
