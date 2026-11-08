import { Toaster as Sonner, toast } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'rounded-md border border-hairline bg-canvas text-body text-ink shadow-raised',
          description: 'text-ink-muted',
          error: 'text-danger',
        },
      }}
    />
  );
}

export { toast };
