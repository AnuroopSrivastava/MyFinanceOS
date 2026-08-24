import { downloadBlob, todayStamp } from '@financeos/shared';

/**
 * CSV Export utility for downloading data as CSV files in browser.
 *
 * Security: Implements OWASP CSV injection prevention.
 * Cells starting with =, +, -, @ are prefixed with a tab character to prevent
 * spreadsheet formula execution when opened in Excel/LibreOffice.
 * Reference: https://owasp.org/www-community/attacks/CSV_Injection
 */
export class CsvExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvExportError';
  }
}

export function exportToCSV<T>(filename: string, headers: { label: string; key: keyof T }[], data: T[]): void {
  if (!data || data.length === 0) {
    // BUG-020 FIX: Replaced alert() with thrown error — callers display to user via toast/modal
    throw new CsvExportError('No data available to export.');
  }

  // BUG-002 FIX: Escape special CSV characters + neutralize CSV/formula injection
  // OWASP recommendation: prefix dangerous leading characters with a tab character to prevent
  // spreadsheet applications from executing user-controlled cell content as formulas.
  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    let str = String(val);

    // Neutralize CSV injection: prefix dangerous leading characters
    // Dangerous prefixes: = (formula), + (formula), - (formula), @ (formula/command)
    // Also neutralize tab/newline/carriage-return prefix tricks
    if (
      str.length > 0 &&
      (str[0] === '=' || str[0] === '+' || str[0] === '-' || str[0] === '@' ||
       str[0] === '\t' || str[0] === '\r' || str[0] === '\n')
    ) {
      str = '\t' + str;
    }

    // Escape double quotes by doubling them, then wrap entire value in quotes
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(h => escapeCell(h.label)).join(',');
  const rowLines = data.map(item => {
    return headers.map(h => escapeCell(item[h.key])).join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel correctly detects encoding (prevents ₹ corruption)
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\n');
  downloadBlob(`${filename}_${todayStamp()}.csv`, new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
}
