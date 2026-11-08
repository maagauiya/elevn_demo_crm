import { formatPhone } from './phone';

describe('formatPhone', () => {
  it('форматирует номер с 7', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67');
  });
  it('заменяет ведущую 8 на 7', () => {
    expect(formatPhone('8 (999) 123-45-67')).toBe('+7 999 123-45-67');
  });
  it('не трогает нераспознанные номера', () => {
    expect(formatPhone('12345')).toBe('12345');
  });
});
