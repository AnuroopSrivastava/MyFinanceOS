/**
 * CSV Export utility for downloading data as CSV files in browser
 */
export function exportToCSV<T extends Record<string, any>>(filename: string, headers: { label: string; key: keyof T }[], data: T[]) {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Escape special CSV characters
  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(h => escapeCell(h.label)).join(',');
  const rowLines = data.map(item => {
    return headers.map(h => escapeCell(item[h.key])).join(',');
  });

  const csvContent = [headerLine, ...rowLines].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
