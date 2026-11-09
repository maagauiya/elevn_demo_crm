import { Download } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportRows, type ExportColumn, type ExportFormat } from '@/shared/lib/export';
import { Button } from './button';
import { Dialog, DialogContent } from './dialog';
import { SegmentControl } from './segment-control';
import { toast } from './toaster';

const PREVIEW_ROWS = 10;

/**
 * Диалог экспорта таблицы: превью первых строк + выбор формата (Excel/CSV), сборка файла —
 * в воркере (shared/lib/export), не в UI-потоке. Переиспользуемый — не только для handbook:
 * любая фича с таблицей передаёт свои columns/rows.
 */
export function ExportDialog({
  open,
  onOpenChange,
  title,
  fileName,
  sheetName = 'Export',
  columns,
  rows,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fileName: string;
  sheetName?: string;
  columns: ExportColumn[];
  rows: Record<string, string>[];
}) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const previewRows = rows.slice(0, PREVIEW_ROWS);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportRows({ format, fileName, sheetName, columns, rows });
      toast.success(t('export.success'));
      onOpenChange(false);
    } catch (error) {
      toast.error(t('export.error'), { description: error instanceof Error ? error.message : undefined });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={t('export.title')}
        description={t('export.description')}
        className="max-w-3xl"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <SegmentControl
              value={format}
              onChange={setFormat}
              label={t('export.format')}
              options={[
                { value: 'xlsx', label: t('export.formatExcel') },
                { value: 'csv', label: t('export.formatCsv') },
              ]}
            />
            <Button onClick={() => void handleExport()} disabled={isExporting || rows.length === 0}>
              <Download className="size-4" />
              {isExporting ? t('export.downloading') : t('export.download')}
            </Button>
          </div>
        }
      >
        {rows.length === 0 ? (
          <p className="text-body text-ink-muted">{t('export.empty')}</p>
        ) : (
          <>
            {/* Лист A4 альбомный (297×210мм) на сером фоне — как в диалоге печати браузера. */}
            <div className="flex justify-center rounded-md bg-canvas-sunken p-6">
              <div className="aspect-[297/210] w-full max-w-[640px] overflow-hidden rounded-xs bg-canvas p-5 shadow-raised">
                <div className="flex h-full flex-col">
                  <p className="mb-2 shrink-0 truncate text-label">{title}</p>
                  <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full border-collapse text-caption">
                      <thead className="sticky top-0 bg-canvas">
                        <tr>
                          {columns.map((col) => (
                            <th
                              key={col.id}
                              className="truncate border-b border-hairline px-1.5 py-1 text-left font-semibold"
                            >
                              {col.caption}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, index) => (
                          <tr key={index}>
                            {columns.map((col) => (
                              <td key={col.id} className="truncate border-b border-hairline px-1.5 py-1">
                                {row[col.id] ?? ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-micro text-ink-muted">
              {rows.length > PREVIEW_ROWS
                ? t('export.previewNote', { count: PREVIEW_ROWS, total: rows.length })
                : t('export.rowsCount', { count: rows.length })}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
