import changelogData from './changelog.json' with { type: 'json' };
import { ReleaseType } from './version.js';

export type ChangeCategory =
  | 'Features'
  | 'Improvements'
  | 'Bug Fixes'
  | 'Performance'
  | 'UI/UX'
  | 'Security'
  | 'Refactoring'
  | 'Breaking Changes'
  | 'Other';

export interface CategorizedChanges {
  category: ChangeCategory;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  releaseType: ReleaseType;
  summary: string;
  changes: CategorizedChanges[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = changelogData as ChangelogEntry[];

export const LATEST_CHANGELOG_ENTRY: ChangelogEntry =
  CHANGELOG_ENTRIES[0] || {
    version: '1.0.0',
    date: '2026-09-10',
    releaseType: 'major',
    summary: 'Initial baseline release of MyFinanceOS',
    changes: []
  };

export function getChangelogByVersion(version: string): ChangelogEntry | undefined {
  return CHANGELOG_ENTRIES.find((entry) => entry.version === version);
}

export function getActiveCategories(entry: ChangelogEntry): CategorizedChanges[] {
  return entry.changes.filter((c) => Array.isArray(c.items) && c.items.length > 0);
}
