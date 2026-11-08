import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { IconButton } from './button';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const overlayClass = 'fixed inset-0 z-50 bg-ink/40';

export function DialogContent({
  className,
  children,
  title,
  description,
  footer,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { title: ReactNode; description?: ReactNode; footer?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-hairline bg-canvas shadow-raised outline-none',
          className,
        )}
        {...(description ? {} : { 'aria-describedby': undefined })}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
          <div className="flex flex-col gap-1">
            <DialogPrimitive.Title className="text-title">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-subtitle text-ink-muted">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close asChild>
            <IconButton label={t('actions.close')} size="icon-sm">
              <X />
            </IconButton>
          </DialogPrimitive.Close>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-hairline px-5 py-3">{footer}</div> : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
