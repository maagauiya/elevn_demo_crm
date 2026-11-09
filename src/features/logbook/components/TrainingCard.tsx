import { useTranslation } from 'react-i18next';
import { STATUS_STYLES } from '@/shared/lib/appointment-status';
import { cn } from '@/shared/lib/cn';
import type { Training } from '../api/schemas';
import { NS } from '../i18n';
import { formatMinutes } from '../model/time';

/** Карточка группового занятия: время, название, тренер, вместимость. */
export function TrainingCard({ training, onOpen }: { training: Training; onOpen: () => void }) {
  const { t } = useTranslation(NS);
  const style = training.kind === 'blocked' ? STATUS_STYLES.cancelled : STATUS_STYLES[training.kind];
  const time = `${formatMinutes(training.start)}–${formatMinutes(training.end)}`;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${time}, ${training.title || t('training.title')}`}
      className={cn(
        'flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-sm border-l-4 px-1.5 py-1 text-left transition-shadow hover:shadow-hover',
        style.bg,
        style.stripe,
      )}
    >
      <span className={cn('text-caption', style.fg)}>{time}</span>
      <span className="truncate text-label">{training.title || t('training.title')}</span>
      <span className="truncate text-body text-ink-muted">
        {training.doctorName}
        {training.capacity ? ` · ${t('training.capacity', { count: training.capacity })}` : ''}
      </span>
    </button>
  );
}
