import { docDateLists, rectangle, timeList } from './selection';
import { shortHours, statusTone } from './status';

describe('график работы', () => {
  it('часы из подсказки — коротко', () => {
    expect(shortHours(' 10:00-23:00')).toBe('10–23');
    expect(shortHours('10:30-14:00, 15:00-19:00')).toBe('10:30–14, 15–19');
    expect(shortHours('')).toBe('');
  });

  it('у каждого статуса есть тон, у неизвестного — нейтральный', () => {
    expect(statusTone(1).cell).toBe('bg-status-done-bg');
    expect(statusTone(6).text).toBe('text-danger');
    expect(statusTone(99).cell).toBe('bg-canvas-sunken');
  });

  it('выделение прямоугольником по строкам и дням', () => {
    const cells = rectangle(
      { docId: 2, date: '2025-06-03' },
      { docId: 1, date: '2025-06-02' },
      [1, 2, 3],
      ['2025-06-01', '2025-06-02', '2025-06-03'],
    );
    expect(cells).toHaveLength(4);
    expect(cells[0]).toEqual({ docId: 1, date: '2025-06-02' });
  });

  it('DocDateList и TimeList в формате бэкенда', () => {
    expect(
      docDateLists([
        { docId: 2, date: '2025-06-02' },
        { docId: 1, date: '2025-06-01' },
      ]),
    ).toEqual(['1,2025-06-01;2,2025-06-02;']);
    expect(
      docDateLists(
        Array.from({ length: 3 }, (_, i) => ({ docId: i, date: '2025-06-01' })),
        2,
      ),
    ).toHaveLength(2);
    expect(timeList([{ from: '10:00', to: '14:00' }])).toBe('10:00:00-14:00:00');
  });
});
