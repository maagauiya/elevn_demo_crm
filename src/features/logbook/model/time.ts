/** "10:30" или "10:30:00" → минуты от полуночи. */
export function toMinutes(time: string): number {
  const [h = '0', m = '0'] = time.trim().split(':');
  return Number(h) * 60 + Number(m);
}

/** Минуты от полуночи → "HH:mm". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Дата для бэкенда. Только ISO: Firebird читает «06.07.2025» как 6 июля, а браузер в en-US — как 7 июня. */
export function toApiDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "2025-06-21" → локальная дата (без сдвига часового пояса, в отличие от new Date(iso)). */
export function fromApiDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function snapMinutes(minutes: number, step = 15): number {
  return Math.floor(minutes / step) * step;
}

/**
 * Дата/время из ответа бэкенда: процедуры отдают и «21.06.2025 14:30», и «2025-06-21 14:30».
 * Возвращает ISO-дату и HH:mm.
 */
export function parseBackendDateTime(value: string): { date: string; time: string } | null {
  const text = value.trim();
  const ru = /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(text);
  if (ru) return { date: `${ru[3]}-${ru[2]}-${ru[1]}`, time: `${(ru[4] ?? '00').padStart(2, '0')}:${ru[5] ?? '00'}` };
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/.exec(text);
  if (iso)
    return { date: `${iso[1]}-${iso[2]}-${iso[3]}`, time: `${(iso[4] ?? '00').padStart(2, '0')}:${iso[5] ?? '00'}` };
  return null;
}
