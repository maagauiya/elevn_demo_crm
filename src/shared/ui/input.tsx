import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

export const inputClass =
  'h-9 w-full min-w-0 rounded-sm border border-hairline bg-canvas-sunken px-3 text-body text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-accent focus-visible:bg-canvas focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger';

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return <input type={type} className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(inputClass, 'h-auto min-h-20 py-2', className)} {...props} />;
}
