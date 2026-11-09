/// <reference lib="webworker" />
/**
 * Сборка CSV/XLSX в отдельном потоке — таблицы могут быть на десятки тысяч строк
 * (например, «Клиенты»), exceljs не должен блокировать интерфейс.
 */
import ExcelJS from 'exceljs';
import type { ExportColumn, ExportRequest, ExportResponse } from './types';

function escapeCsvCell(value: string): string {
  return /[",;\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCsv(columns: ExportColumn[], rows: Record<string, string>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.caption)).join(';');
  const body = rows.map((row) => columns.map((c) => escapeCsvCell(row[c.id] ?? '')).join(';')).join('\n');
  return `${header}\n${body}`;
}

async function toXlsx(sheetName: string, columns: ExportColumn[], rows: Record<string, string>[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31) || 'Export');
  sheet.columns = columns.map((c) => ({ header: c.caption, key: c.id, width: Math.max(12, c.caption.length + 2) }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) sheet.addRow(row);
  return workbook.xlsx.writeBuffer();
}

self.onmessage = (event: MessageEvent<ExportRequest>) => {
  const { format, sheetName, columns, rows } = event.data;
  void (async () => {
    try {
      const response: ExportResponse =
        format === 'csv'
          ? { ok: true, blob: new Blob([toCsv(columns, rows)], { type: 'text/csv;charset=utf-8' }) }
          : {
              ok: true,
              blob: new Blob([await toXlsx(sheetName, columns, rows)], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              }),
            };
      self.postMessage(response);
    } catch (error) {
      self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) } satisfies ExportResponse);
    }
  })();
};
