/**
 * MyFinanceOS shared browser utilities.
 * Canonical homes for the download + date-stamp helpers that were
 * re-implemented at every export/backup call site.
 */

/** "Today" as a YYYY-MM-DD stamp in UTC. */
export const todayStamp = (date: Date = new Date()): string =>
  date.toISOString().split('T')[0];

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