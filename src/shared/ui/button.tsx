import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

export const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /** Главное действие экрана: pill + accent */
        primary: 'rounded-pill bg-accent text-on-accent hover:bg-accent-hover',
        /** Второстепенное действие: hairline-граница */
        secondary: 'rounded-sm border border-hairline bg-canvas text-ink hover:bg-canvas-sunken',
        /** Без фона в покое (кнопки тулбара) */
        ghost: 'rounded-sm text-ink hover:bg-canvas-sunken',
        danger: 'rounded-sm bg-danger text-on-accent hover:opacity-90',
        link: 'h-auto px-0 text-accent underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-7 px-3 text-caption',
        md: 'h-9 px-4 text-body',
        /** Icon-button тулбара: круг 36px */
        icon: 'size-9 rounded-pill p-0',
        'icon-sm': 'size-7 rounded-pill p-0',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Отрендерить как дочерний элемент (например, <Link>) */
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, type = 'button', ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...(asChild ? {} : { type })} {...props} />
  );
}

/** Кнопка-иконка. aria-label обязателен — у неё нет видимого текста. */
export function IconButton({
  label,
  variant = 'ghost',
  size = 'icon',
  ...props
}: Omit<ButtonProps, 'aria-label'> & { label: string }) {
  return <Button variant={variant} size={size} aria-label={label} title={label} {...props} />;
}
