import type { Row } from '../../model/parse';

/** Медзаписи (тип 11, методы WAMF*): клиент, специалист, дата, тип записи. */
export function RecordListWidget({ rows }: { rows: Row[] }) {
  return (
    <ul className="flex flex-col divide-y divide-hairline">
      {rows.map((row, i) => (
        <li key={row.RECORDID ?? i} className="flex flex-col gap-0.5 py-2">
          <span className="truncate text-label">{row.CLIENTNAME}</span>
          <span className="truncate text-body text-ink-muted">
            {[row.DICTCONSULTTYPENAME, row.DOCTORNAME].filter(Boolean).join(' · ')}
          </span>
          <span className="text-micro text-ink-faint">{row.OPERATIONDATE}</span>
        </li>
      ))}
    </ul>
  );
}
