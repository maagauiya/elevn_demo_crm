import { capLanes, layoutColumn } from './layout';
import { cardKindFromStatusId } from './status';
import { parseSubject, splitClientName } from './subject';
import { formatMinutes, fromApiDate, parseBackendDateTime, toApiDate, toMinutes } from './time';

describe('time', () => {
  it('переводит время в минуты и обратно', () => {
    expect(toMinutes('10:30')).toBe(630);
    expect(toMinutes('20:00:00')).toBe(1200);
    expect(formatMinutes(545)).toBe('09:05');
  });
  it('отдаёт бэкенду только ISO-дату без сдвига пояса', () => {
    expect(toApiDate(new Date(2025, 5, 21))).toBe('2025-06-21');
    expect(fromApiDate('2025-06-21')?.getDate()).toBe(21);
    expect(fromApiDate('21.06.2025')).toBeNull();
  });
  it('нормализует даты из ответов бэкенда', () => {
    expect(parseBackendDateTime('21.06.2025 14:30')).toEqual({ date: '2025-06-21', time: '14:30' });
    expect(parseBackendDateTime('2025-06-21 9:05')).toEqual({ date: '2025-06-21', time: '09:05' });
    expect(parseBackendDateTime('мусор')).toBeNull();
  });
});

describe('cardKindFromStatusId', () => {
  it('сводит 9 статусов базы к статусам дизайн-системы', () => {
    expect(cardKindFromStatusId(1)).toBe('pending');
    expect(cardKindFromStatusId(6)).toBe('confirmed');
    expect(cardKindFromStatusId(7)).toBe('blocked');
    expect(cardKindFromStatusId(9)).toBe('done');
    expect(cardKindFromStatusId(42)).toBe('pending');
  });
});

describe('parseSubject / splitClientName', () => {
  it('достаёт услуги и название статуса из APPSUB', () => {
    expect(parseSubject(' Иванова Анна  7001234567 Карта\nЧистка\nОсмотр\nВыполненная услуга\n')).toEqual({
      services: ['Чистка', 'Осмотр'],
      statusName: 'Выполненная услуга',
    });
    expect(parseSubject('Шапка\nОтменённая услуга\n').services).toEqual([]);
  });
  it('отделяет телефон от ФИО', () => {
    expect(splitClientName('Иванова Анна Сергеевна  7001234567')).toEqual({
      name: 'Иванова Анна Сергеевна',
      phone: '7001234567',
    });
    expect(splitClientName('Без телефона')).toEqual({ name: 'Без телефона', phone: null });
  });
});

describe('layoutColumn', () => {
  it('раскладывает пересекающиеся записи по дорожкам', () => {
    const placed = layoutColumn([
      { id: 1, start: 600, end: 660 },
      { id: 2, start: 630, end: 690 },
      { id: 3, start: 700, end: 730 },
    ]);
    const byId = Object.fromEntries(placed.map((p) => [p.item.id, p]));
    expect(byId[1]).toMatchObject({ lane: 0, lanes: 2 });
    expect(byId[2]).toMatchObject({ lane: 1, lanes: 2 });
    expect(byId[3]).toMatchObject({ lane: 0, lanes: 1 });
  });
  it('переиспользует освободившуюся дорожку', () => {
    const placed = layoutColumn([
      { id: 1, start: 600, end: 720 },
      { id: 2, start: 600, end: 630 },
      { id: 3, start: 640, end: 700 },
    ]);
    expect(placed.find((p) => p.item.id === 3)).toMatchObject({ lane: 1, lanes: 2 });
  });
});

describe('capLanes', () => {
  it('прячет лишние дорожки в «+N»', () => {
    const placed = layoutColumn([1, 2, 3, 4, 5].map((id) => ({ id, start: 600, end: 615 })));
    const { visible, overflow } = capLanes(placed, 3);
    expect(visible.map((p) => p.item.id)).toEqual([1, 2]);
    expect(visible[0]?.shownLanes).toBe(3);
    expect(overflow).toHaveLength(1);
    expect(overflow[0]?.items.map((i) => i.id)).toEqual([3, 4, 5]);
  });
  it('не трогает колонки, где всё помещается', () => {
    const placed = layoutColumn([{ id: 1, start: 600, end: 660 }]);
    expect(capLanes(placed, 3).overflow).toEqual([]);
  });
});
