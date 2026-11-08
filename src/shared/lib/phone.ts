/** Форматирует российский номер: 79991234567 → +7 999 123-45-67. Остальное возвращает как есть. */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const normalized = digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
  const match = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(normalized);
  if (!match) return raw;
  const [, a, b, c, d] = match;
  return `+7 ${a} ${b}-${c}-${d}`;
}

export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}
