import { X } from 'lucide-react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { IconButton } from './button';
import { overlayClass } from './dialog';

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

/** Боковая шторка: редактор записи, мобильное меню. */
export function SheetContent({
  className,
  children,
  title,
  side = 'right',
  hideHeader = false,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & {
  title: ReactNode;
  side?: 'left' | 'right';
  hideHeader?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className={overlayClass} />
      <SheetPrimitive.Content
        aria-describedby={undefined}
        className={cn(
          'fixed inset-y-0 z-50 flex w-full max-w-md flex-col border-hairline bg-canvas shadow-raised outline-none',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
          className,
        )}
        {...props}
      >
        {hideHeader ? (
          <SheetPrimitive.Title className="sr-only">{title}</SheetPrimitive.Title>
        ) : (
          <div className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-4">
            <SheetPrimitive.Title className="truncate text-title">{title}</SheetPrimitive.Title>
            <SheetPrimitive.Close asChild>
              <IconButton label={t('actions.close')} size="icon-sm">
                <X />
              </IconButton>
            </SheetPrimitive.Close>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}
