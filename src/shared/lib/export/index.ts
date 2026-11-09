import type { ExportColumn, ExportFormat, ExportRequest, ExportResponse } from './types';

export type { ExportColumn, ExportFormat };

/** Запускает воркер сборки CSV/XLSX, скачивает результат через временную ссылку. */
export function exportRows({
  format,
  fileName,
  sheetName,
  columns,
  rows,
}: {
  format: ExportFormat;
  fileName: string;
  sheetName: string;
  columns: ExportColumn[];
  rows: Record<string, string>[];
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<ExportResponse>) => {
      worker.terminate();
      if (!event.data.ok) {
        reject(new Error(event.data.error));
        return;
      }
      const url = URL.createObjectURL(event.data.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${format}`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      resolve();
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message));
    };
    const request: ExportRequest = { format, sheetName, columns, rows };
    worker.postMessage(request);
  });
}
