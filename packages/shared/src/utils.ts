/**
 * MyFinanceOS shared browser utilities.
 * Canonical homes for the download + date-stamp helpers that were
 * re-implemented at every export/backup call site.
 */

/** "Today" as a YYYY-MM-DD stamp in UTC. */
export const todayStamp = (date: Date = new Date()): string =>
  date.toISOString().split('T')[0];

/**
 * Parses a `YYYY-MM-DD` string as local midnight. The default
 * `new Date('YYYY-MM-DD')` treats it as UTC, which shifts the instant by the
 * timezone offset and disagrees with locally rendered calendar dates — use
 * this whenever a stored date-only field is compared against local "now"
 * (deadlines, month bucketing).
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date(dateStr); // fall back to native parsing for non-ISO shapes
  }
  return new Date(y, m - 1, d);
};

/**
 * Triggers a browser download for a Blob with the given filename.
 * No-op in non-browser environments (SSR, workers, tests).
 */
export const downloadBlob = (filename: string, blob: Blob): void => {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** LocalStorage keys shared across packages (database cache, sync, theme). */
export const STORAGE_KEYS = {
  dbCache: 'financeos_db_cache',
  lastSyncedAt: 'financeos_last_synced_at',
  theme: 'financeos-theme',
} as const;