import { buildNavMenu, type NavRow } from './nav-api';

const row = (patch: Partial<NavRow>): NavRow => ({
  key: 1,
  parentKey: 0,
  itemId: 1,
  type: 1,
  isFolder: false,
  name: 'x',
  icon: null,
  visible: true,
  editable: false,
  methodName: null,
  editorTable: null,
  editMethodName: null,
  inputParams: null,
  defaultButtonId: null,
  ...patch,
});

describe('buildNavMenu', () => {
  it('строит вложенное дерево по WANAVID/NPRECID, а не по RECID', () => {
    const { tree, items } = buildNavMenu([
      row({ key: 10, itemId: 7, type: 0, isFolder: true, name: 'Склад' }),
      row({ key: 11, parentKey: 10, itemId: 2, type: 0, isFolder: true, name: 'Справочники' }),
      // itemId 7 совпадает с RECID папки «Склад» — это нормально
      row({ key: 12, parentKey: 11, itemId: 7, type: 1, name: 'Товары' }),
      row({ key: 13, itemId: 0, type: -1, name: 'Расписание' }),
    ]);
    expect(tree.map((n) => n.name)).toEqual(['Склад', 'Расписание']);
    const sklad = tree[0];
    expect(
      sklad?.kind === 'folder' && sklad.children[0]?.kind === 'folder' && sklad.children[0].children[0]?.name,
    ).toBe('Товары');
    expect(items.map((i) => i.path)).toEqual(['/info/7', '/logbook']);
  });

  it('выкидывает скрытые пункты, неизвестные типы и пустые папки', () => {
    const { tree } = buildNavMenu([
      row({ key: 1, type: 0, isFolder: true, name: 'Пустая' }),
      row({ key: 2, parentKey: 1, name: 'Скрытая', visible: false }),
      row({ key: 3, type: 999, name: 'Неизвестная' }),
      row({ key: 4, type: 6, itemId: 50, name: 'Дашборд' }),
    ]);
    expect(tree.map((n) => n.name)).toEqual(['Дашборд']);
  });
});
