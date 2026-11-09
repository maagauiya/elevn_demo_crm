/**
 * Номер из события АТС → формат, в котором номера хранятся в базе (10 цифр без кода страны).
 * Как Phone.phoneToCorrect старого фронта (+7…, 7… из 11+ цифр), но 8 срезаем у любого 11-значного
 * номера: старый фронт делал это только для 88…/89…, и казахстанские 8 707… не находились в базе.
 */
export function normalizeAtsPhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+7')) return digits.slice(2);
  if (digits.startsWith('7') && digits.length >= 11) return digits.slice(1);
  if (digits.startsWith('8') && digits.length === 11) return digits.slice(1);
  return digits.replace(/\D/g, '');
}

/** Дата для WAATSOnCallEnd: "YYYY-MM-DD HH:mm:ss" по unix-времени события (секунды). */
export function serverDateTime(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
