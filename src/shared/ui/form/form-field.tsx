import { type ReactElement, cloneElement, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { Label } from '../label';

export interface FieldChromeProps {
  label?: string;
  hint?: string;
  error?: string | undefined;
  required?: boolean;
  className?: string;
}

interface ControlProps {
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/**
 * Обёртка поля: label, контрол, hint или ошибка. Связывает id/aria-* сама —
 * так у всех полей одинаковая доступность и вёрстка.
 */
export function FormField({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldChromeProps & { children: ReactElement<ControlProps> }) {
  const { t } = useTranslation();
  const id = useId();
  const messageId = `${id}-message`;
  // В zod-схемах сообщения — ключи common (например, 'errors.required'); незнакомый текст показываем как есть.
  const message = error ? t(error, { defaultValue: error }) : hint;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </Label>
      ) : null}
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        ...(message ? { 'aria-describedby': messageId } : {}),
      })}
      {message ? (
        <p id={messageId} className={cn('text-micro', error ? 'text-danger' : 'text-ink-muted')}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
