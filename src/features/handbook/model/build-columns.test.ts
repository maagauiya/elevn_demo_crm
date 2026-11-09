import type { ColumnMeta } from '../api/table-meta';
import { buildColumns } from './build-columns';

const col = (patch: Partial<ColumnMeta>): ColumnMeta => ({
  id: 1,
  name: 'NAME',
  caption: 'Название',
  visible: true,
  typeId: '4',
  order: 0,
  filterTypeId: '1',
  groupingLevel: null,
  summaryType: null,
  ...patch,
});

describe('buildColumns', () => {
  it('выкидывает невидимые колонки', () => {
    expect(buildColumns([col({ visible: false })])).toEqual([]);
  });

  it('подставляет ширину по умолчанию по виду ячейки (короткая подпись не расширяет)', () => {
    const [column] = buildColumns([col({ typeId: '3', caption: '№' })]);
    expect(column?.size).toBe(100);
  });

  it('длинная подпись колонки расширяет ширину, чтобы не обрезался заголовок', () => {
    const [column] = buildColumns([col({ typeId: '4', caption: 'Очень длинное название колонки' })]);
    expect(column?.size).toBeGreaterThan(160);
  });

  it('переносит остальные поля без изменений', () => {
    const [column] = buildColumns([col({ summaryType: '2', filterTypeId: '2' })]);
    expect(column).toMatchObject({ id: 'NAME', caption: 'Название', summaryType: '2', filterTypeId: '2' });
  });
});
