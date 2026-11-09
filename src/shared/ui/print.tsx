import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Печать: содержимое рендерится в отдельный корень вне приложения, на экране он скрыт,
 * при печати скрыто всё остальное (см. @media print в styles/index.css). После диалога печати — onDone.
 */
export function PrintPortal({ children, onDone }: { children: ReactNode; onDone: () => void }) {
  useEffect(() => {
    const done = () => {
      onDone();
    };
    window.addEventListener('afterprint', done);
    // Даём браузеру отрисовать содержимое перед вызовом диалога печати.
    const frame = requestAnimationFrame(() => {
      window.print();
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', done);
    };
  }, [onDone]);
  return createPortal(<div className="print-root text-body text-ink">{children}</div>, document.body);
}
