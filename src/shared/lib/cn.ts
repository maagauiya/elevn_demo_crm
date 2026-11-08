import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge должен знать наши кастомные шкалы, иначе text-body и text-ink считаются конфликтом.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['title', 'subtitle', 'label', 'body', 'caption', 'micro'],
      radius: ['xs', 'sm', 'md', 'lg', 'pill'],
      shadow: ['hover', 'raised', 'fab'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
