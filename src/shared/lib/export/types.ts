export type ExportFormat = 'xlsx' | 'csv';

export interface ExportColumn {
  id: string;
  caption: string;
}

export interface ExportRequest {
  format: ExportFormat;
  sheetName: string;
  columns: ExportColumn[];
  rows: Record<string, string>[];
}

export type ExportResponse = { ok: true; blob: Blob } | { ok: false; error: string };
