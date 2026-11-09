import { aggregate, cellKind, formatCellValue } from './column-types';

describe('cellKind', () => {
  it('сопоставляет FTYPEID с видом ячейки', () => {
    expect(cellKind('1')).toBe('number');
    expect(cellKind('3')).toBe('number');
    expect(cellKind('6')).toBe('date');
    expect(cellKind('7')).toBe('datetime');
    expect(cellKind('9')).toBe('time');
    expect(cellKind('5')).toBe('multiline');
    expect(cellKind('40')).toBe('multiline');
    expect(cellKind('4')).toBe('text');
    expect(cellKind('10')).toBe('text');
  });
});

describe('formatCellValue', () => {
  it('пустое и null значение — пустая строка', () => {
    expect(formatCellValue('4', null, 'ru')).toBe('');
    expect(formatCellValue('4', '  ', 'ru')).toBe('');
  });

  it('число — с разделителем тысяч, подчищает пробелы бэкенда', () => {
    expect(formatCellValue('3', '12345.5', 'ru')).toBe('12 345,5');
    expect(formatCellValue('1', ' 7 ', 'ru')).toBe('7');
  });

  it('нечисловую строку в числовой колонке возвращает как есть', () => {
    expect(formatCellValue('1', 'Да ', 'ru')).toBe('Да');
  });

  it('дату "YYYY-MM-DD" форматирует в dd.MM.yyyy', () => {
    expect(formatCellValue('6', '2025-07-22', 'ru')).toBe('22.07.2025');
  });

  it('дату-время форматирует с часами и минутами', () => {
    expect(formatCellValue('7', '2025-07-22 13:05:00', 'ru')).toBe('22.07.2025 13:05');
  });

  it('невалидную дату возвращает как есть', () => {
    expect(formatCellValue('6', 'бред', 'ru')).toBe('бред');
  });

  it('текст без изменений (кроме trim)', () => {
    expect(formatCellValue('4', '  Привет  ', 'ru')).toBe('Привет');
  });
});

describe('aggregate', () => {
  it('sum считает числа, игнорируя пустые', () => {
    expect(aggregate('2', ['1', '2', '', null, '3.5'])).toBe(6.5);
  });

  it('count считает непустые значения любого типа', () => {
    expect(aggregate('3', ['a', '', 'b', null])).toBe(2);
  });

  it('countUniq считает уникальные непустые значения', () => {
    expect(aggregate('5', ['a', 'a', 'b', ''])).toBe(2);
  });

  it('max/min/avg по числам', () => {
    expect(aggregate('0', ['1', '5', '3'])).toBe(5);
    expect(aggregate('1', ['1', '5', '3'])).toBe(1);
    expect(aggregate('4', ['1', '2', '3'])).toBe(2);
  });

  it('без числовых значений max/min/avg — null', () => {
    expect(aggregate('2', ['a', 'b'])).toBeNull();
  });
});
