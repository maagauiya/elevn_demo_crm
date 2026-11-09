import { formatCompact, parseRating, parseSeries, parseSlices, parseStats, valueKey } from './parse';

describe('разбор виджетов', () => {
  it('серии: JSON-массивы в строках → точки графика', () => {
    const { series, points } = parseSeries([
      { LABEL: '["янв","фев"]', PROCEEDS: '["10","20"]', ITEMCOLOR: '#000', TITLE: 'Выручка: 2024' },
      { LABEL: '["янв","фев"]', PROCEEDS: '["30","40"]', ITEMCOLOR: '#fff', TITLE: 'Выручка: 2025' },
    ]);
    expect(series).toEqual(['Выручка: 2024', 'Выручка: 2025']);
    expect(points).toEqual([
      { label: 'янв', 'Выручка: 2024': 10, 'Выручка: 2025': 30 },
      { label: 'фев', 'Выручка: 2024': 20, 'Выручка: 2025': 40 },
    ]);
  });

  it('находит поле значений, игнорируя служебные', () => {
    expect(valueKey({ LABEL: 'x', DEPSUMMA: '1', ITEMCOLOR: '#000' })).toBe('DEPSUMMA');
  });

  it('сектора, показатели и рейтинг', () => {
    expect(parseSlices([{ LABEL: ' Отдел ', VCOUNTPERC: '12,5', ITEMCOLOR: '#000' }])).toEqual([
      { label: 'Отдел', value: 12.5 },
    ]);
    expect(parseStats([{ LABEL: 'Загрузка', PARAMVALUE: '7%' }])).toEqual([{ label: 'Загрузка', value: '7%' }]);
    expect(
      parseRating([
        { PARAMNAME: 'Б', PARAMVALUE: '5', PARAMORDER: '2' },
        { PARAMNAME: 'А', PARAMVALUE: '9', PARAMORDER: '1' },
      ]).map((r) => r.name),
    ).toEqual(['А', 'Б']);
  });

  it('пустой ответ не ломает разбор', () => {
    expect(parseSeries([])).toEqual({ series: [], points: [] });
    expect(parseSlices([])).toEqual([]);
  });

  it('компактный формат больших чисел', () => {
    expect(formatCompact(169530146)).toMatch(/169,5/);
  });
});
