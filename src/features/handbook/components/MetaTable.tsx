import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  flexRender,
  globalFilteringFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnPinningState,
  type ColumnSizingState,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Pencil, Pin, PinOff, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavItem } from '@/features/navigation';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  ExportDialog,
  IconButton,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import type { ExportColumn } from '@/shared/lib/export';
import { readStorage, writeStorage } from '@/shared/lib/storage';
import { useItemData, useItemMeta, useItemParams, type TableRow } from '../api/table-meta';
import { NS } from '../i18n';
import { buildColumns } from '../model/build-columns';
import { aggregate, cellKind, formatCellValue, SUMMARY_LABEL_KEY, type SummaryType } from '../model/column-types';
import { ParamsForm } from './ParamsForm';
import { RecordEditor } from './RecordEditor';

/** Статично вне компонента — так и рекомендует tableFeatures(). */
const tableFeatureSet = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnPinningFeature,
  columnFacetingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filterFns: { includesString: filterFn_includesString, equalsString: filterFn_equalsString },
});
type AppTableFeatures = typeof tableFeatureSet;

interface TableSettings {
  columnSizing: ColumnSizingState;
  columnPinning: ColumnPinningState;
}

function useTableSettings(itemId: number) {
  const key = `elevn.handbook.table.${itemId}`;
  const [settings, setSettings] = useState<TableSettings>(
    () => readStorage<TableSettings>(key) ?? { columnSizing: {}, columnPinning: { start: [], end: [] } },
  );
  useEffect(() => {
    writeStorage(key, settings);
  }, [key, settings]);
  return [settings, setSettings] as const;
}

/**
 * Движок универсальных таблиц (/info/:itemId). Метаданные колонок и входных параметров —
 * из базы (WAGetItemMeta/WAGetItemParams), данные — из METHODNAME пункта меню.
 *
 * Точка стыка с треком A (дашборды, журнал): `<MetaTable itemId params={{...}} />` — с готовыми
 * params пропускает форму параметров и сразу запрашивает данные.
 */
export function MetaTable({ itemId, params }: { itemId: number; params?: Record<string, string> }) {
  const { t, i18n } = useTranslation(NS);
  const navItem = useNavItem(itemId);
  const metaQuery = useItemMeta(itemId);
  const paramsQuery = useItemParams(itemId);
  const [appliedParams, setAppliedParams] = useState<Record<string, string> | null>(params ?? null);
  const [settings, setSettings] = useTableSettings(itemId);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [editorState, setEditorState] = useState<{ open: boolean; id: string | undefined }>({
    open: false,
    id: undefined,
  });
  const [exportState, setExportState] = useState<{
    open: boolean;
    columns: ExportColumn[];
    rows: Record<string, string>[];
  }>({ open: false, columns: [], rows: [] });

  const editable = !!navItem.item?.editable && !!navItem.item.editorTable;

  useEffect(() => {
    setAppliedParams(params ?? null);
  }, [itemId, params]);

  // Раздел без входных параметров — открываем сразу, без формы.
  useEffect(() => {
    if (!params && paramsQuery.data?.length === 0) setAppliedParams({});
  }, [params, paramsQuery.data]);

  const dataQuery = useItemData(itemId, navItem.item?.methodName, appliedParams);

  const columnDefs = useMemo(() => buildColumns(metaQuery.data ?? []), [metaQuery.data]);
  const columns = useMemo<ColumnDef<AppTableFeatures, TableRow>[]>(() => {
    const dataColumns: ColumnDef<AppTableFeatures, TableRow>[] = columnDefs.map((col) => ({
      id: col.id,
      accessorFn: (row) => row[col.id] ?? null,
      header: col.caption,
      size: col.size,
      enableColumnFilter: col.filterTypeId !== '0',
      filterFn: col.filterTypeId === '2' ? 'equalsString' : 'includesString',
      meta: {
        typeId: col.typeId,
        filterTypeId: col.filterTypeId,
        summaryType: col.summaryType,
        caption: col.caption,
      },
      cell: (ctx) => {
        const value = formatCellValue(col.typeId, (ctx.getValue() as string | null) ?? null, i18n.language);
        return cellKind(col.typeId) === 'multiline' ? <span className="whitespace-pre-wrap">{value}</span> : value;
      },
    }));
    if (!editable) return dataColumns;
    const actionColumn: ColumnDef<AppTableFeatures, TableRow> = {
      id: '__edit',
      header: '',
      size: 36,
      enableSorting: false,
      enableColumnFilter: false,
      enableResizing: false,
      enablePinning: false,
      cell: (ctx) => (
        <IconButton
          label={t('editor.edit')}
          size="icon-sm"
          onClick={() => setEditorState({ open: true, id: ctx.row.original.ID ?? '' })}
        >
          <Pencil />
        </IconButton>
      ),
    };
    return [actionColumn, ...dataColumns];
  }, [columnDefs, i18n.language, editable, t]);

  const table = useTable({
    features: tableFeatureSet,
    data: dataQuery.data ?? [],
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnPinning: settings.columnPinning,
      columnSizing: settings.columnSizing,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnPinningChange: (updater) =>
      setSettings((prev) => ({
        ...prev,
        columnPinning: typeof updater === 'function' ? updater(prev.columnPinning) : updater,
      })),
    onColumnSizingChange: (updater) =>
      setSettings((prev) => ({
        ...prev,
        columnSizing: typeof updater === 'function' ? updater(prev.columnSizing) : updater,
      })),
    columnResizeMode: 'onChange',
    globalFilterFn: 'includesString',
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  /** Экспортирует то, что сейчас видно: видимые колонки (без действий), после фильтров/сортировки. */
  const openExport = () => {
    const dataColumns = columnDefs.map((c) => ({ id: c.id, caption: c.caption }));
    const dataRows = rows.map((r) =>
      Object.fromEntries(
        columnDefs.map((c) => [c.id, formatCellValue(c.typeId, (r.original[c.id] as string | null) ?? null, i18n.language)]),
      ),
    );
    setExportState({ open: true, columns: dataColumns, rows: dataRows });
  };

  if (metaQuery.isPending || paramsQuery.isPending) return <Skeleton className="h-96" />;
  if (metaQuery.isError)
    return <ErrorState description={metaQuery.error.message} onRetry={() => metaQuery.refetch()} />;
  if (paramsQuery.isError)
    return <ErrorState description={paramsQuery.error.message} onRetry={() => paramsQuery.refetch()} />;

  const summaryColumns = columnDefs.filter((col) => col.summaryType);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {!params && paramsQuery.data.length > 0 ? (
        <ParamsForm fields={paramsQuery.data} onApply={setAppliedParams} />
      ) : null}

      {appliedParams === null ? null : dataQuery.isPending ? (
        <Skeleton className="h-96" />
      ) : dataQuery.isError ? (
        <ErrorState description={dataQuery.error.message} onRetry={() => dataQuery.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-faint" />
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={t('table.search')}
                className="pl-8"
              />
            </div>
            {editable ? (
              <Button variant="secondary" onClick={() => setEditorState({ open: true, id: undefined })}>
                <Plus className="size-4" />
                {t('editor.add')}
              </Button>
            ) : null}
            <Button variant="secondary" onClick={openExport}>
              <Download className="size-4" />
              {t('export.button', { ns: 'common' })}
            </Button>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto rounded-md border border-hairline">
            {/*
              Div+flex, не <table>: виртуализация кладёт строки тела как absolute-позиционированные
              блоки вне нормального потока, а нативный table-layout считает ширины колонок по
              собственному алгоритму — шапка и тело расходятся. flex с жёсткими пиксельными
              ширинами (flexShrink/flexGrow: 0) гарантирует, что шапка, фильтры, тело и итоги
              используют одни и те же числа из table.getTotalSize()/column.getSize().
            */}
            <div role="table" style={{ width: table.getTotalSize(), minWidth: '100%' }} className="text-body">
              <div role="rowgroup" className="sticky top-0 z-10 bg-canvas-sunken">
                {table.getHeaderGroups().map((headerGroup) => (
                  <div role="row" key={headerGroup.id} className="flex border-b border-hairline">
                    {headerGroup.headers.map((header) => {
                      const pinned = header.column.getIsPinned();
                      return (
                        <div
                          role="columnheader"
                          key={header.id}
                          className={cn(
                            'relative shrink-0 grow-0 px-2 py-2 text-left text-label',
                            pinned && 'sticky z-20 bg-canvas-sunken',
                          )}
                          style={{
                            width: header.getSize(),
                            left: pinned === 'start' ? header.getStart('start') : undefined,
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-1 truncate text-left"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <span className="truncate">{String(header.column.columnDef.header)}</span>
                              {header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="size-3.5" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="size-3.5" />
                              ) : (
                                <ChevronsUpDown className="size-3.5 text-ink-faint" />
                              )}
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="rounded-xs p-0.5 hover:bg-canvas">
                                {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5 text-ink-faint" />}
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onSelect={() => header.column.pin(pinned ? false : 'start')}>
                                  {pinned ? t('table.unpin') : t('table.pin')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {header.column.getCanResize() ? (
                            <div
                              role="slider"
                              aria-orientation="vertical"
                              aria-label={t('table.resizeColumn')}
                              aria-valuenow={header.getSize()}
                              tabIndex={0}
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              onKeyDown={(e) => {
                                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                                const delta = e.key === 'ArrowRight' ? 10 : -10;
                                setSettings((prev) => ({
                                  ...prev,
                                  columnSizing: { ...prev.columnSizing, [header.column.id]: header.getSize() + delta },
                                }));
                              }}
                              className="absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none hover:bg-accent"
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div role="row" className="flex border-b border-hairline">
                  {table.getFlatHeaders().map((header) => {
                    const def = columnDefs.find((c) => c.id === header.column.id);
                    const pinned = header.column.getIsPinned();
                    return (
                      <div
                        role="columnheader"
                        key={header.id}
                        className={cn('shrink-0 grow-0 p-1', pinned && 'sticky z-20 bg-canvas-sunken')}
                        style={{
                          width: header.getSize(),
                          left: pinned === 'start' ? header.getStart('start') : undefined,
                        }}
                      >
                        {!def || !header.column.getCanFilter() ? null : def.filterTypeId === '1' ? (
                          <Input
                            value={(header.column.getFilterValue() as string | undefined) ?? ''}
                            onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                            placeholder={t('table.filter')}
                            className="h-7 text-caption"
                          />
                        ) : (
                          <ColumnSelectFilter column={header.column} placeholder={t('table.filter')} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div role="rowgroup" style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  if (!row) return null;
                  return (
                    <div
                      role="row"
                      key={row.id}
                      className="flex border-b border-hairline"
                      style={{ position: 'absolute', top: virtualRow.start, width: '100%' }}
                    >
                      {[...row.getStartVisibleCells(), ...row.getCenterVisibleCells(), ...row.getEndVisibleCells()].map(
                        (cell) => {
                          const pinned = cell.column.getIsPinned();
                          return (
                            <div
                              role="cell"
                              key={cell.id}
                              className={cn('shrink-0 grow-0 truncate px-2 py-1.5', pinned && 'sticky z-10 bg-canvas')}
                              style={{
                                width: cell.column.getSize(),
                                left: pinned === 'start' ? cell.column.getStart('start') : undefined,
                              }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          );
                        },
                      )}
                    </div>
                  );
                })}
              </div>
              {summaryColumns.length > 0 ? (
                <div role="rowgroup" className="sticky bottom-0 bg-canvas-sunken">
                  <div role="row" className="flex border-t border-hairline">
                    {table.getFlatHeaders().map((header) => {
                      const def = columnDefs.find((c) => c.id === header.column.id);
                      const value =
                        def?.summaryType &&
                        aggregate(
                          def.summaryType,
                          table.getFilteredRowModel().rows.map((r) => r.getValue<string | null>(header.column.id)),
                        );
                      return (
                        <div
                          role="cell"
                          key={header.id}
                          className="shrink-0 grow-0 px-2 py-1.5 text-caption"
                          style={{ width: header.getSize() }}
                        >
                          {def?.summaryType && value !== null && value !== undefined ? (
                            <>
                              <span className="text-ink-muted">
                                {t(SUMMARY_LABEL_KEY[def.summaryType as SummaryType])}:{' '}
                              </span>
                              {formatCellValue(
                                def.typeId === '6' || def.typeId === '7' ? '4' : def.typeId,
                                String(value),
                                i18n.language,
                              )}
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}

      {editable && navItem.item?.editorTable ? (
        <RecordEditor
          open={editorState.open}
          onOpenChange={(open) => setEditorState((prev) => ({ ...prev, open }))}
          editorTable={navItem.item.editorTable}
          editMethodName={navItem.item.editMethodName ?? 'WAEditTable'}
          id={editorState.id}
          title={editorState.id ? t('editor.editTitle') : t('editor.addTitle')}
        />
      ) : null}

      <ExportDialog
        open={exportState.open}
        onOpenChange={(open) => setExportState((prev) => ({ ...prev, open }))}
        title={navItem.item?.name ?? String(itemId)}
        fileName={navItem.item?.name ?? `table-${itemId}`}
        sheetName={navItem.item?.name ?? 'Export'}
        columns={exportState.columns}
        rows={exportState.rows}
      />
    </div>
  );
}

function ColumnSelectFilter({
  column,
  placeholder,
}: {
  column: {
    getFacetedUniqueValues: () => Map<unknown, number>;
    getFilterValue: () => unknown;
    setFilterValue: (v: unknown) => void;
  };
  placeholder: string;
}) {
  const options = useMemo(
    () => [...column.getFacetedUniqueValues().keys()].filter((v): v is string => !!v).sort(),
    [column],
  );
  return (
    <Select
      value={(column.getFilterValue() as string | undefined) ?? ''}
      onValueChange={(v) => column.setFilterValue(v || undefined)}
    >
      <SelectTrigger className="h-7 text-caption">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((value) => (
          <SelectItem key={value} value={value}>
            {value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
