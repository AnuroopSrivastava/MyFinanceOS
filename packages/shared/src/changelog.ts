import changelogData from './changelog.json' with { type: 'json' };
import { ReleaseType, ReleaseIntensity, VersionJump } from './version.js';

export type ChangeCategory =
  | 'Features'
  | 'Improvements'
  | 'Bug Fixes'
  | 'Performance'
  | 'Reliability'
  | 'UI/UX'
  | 'Security'
  | 'Accessibility'
  | 'Refactoring'
  | 'Breaking Changes'
  | 'Other';

export interface CategoryMeta {
  label: ChangeCategory;
  accentToken: string;
  fallbackColor: string;
  iconName: 'Sparkles' | 'CheckCircle2' | 'Bug' | 'Zap' | 'Palette' | 'ShieldCheck' | 'Wrench' | 'LifeBuoy' | 'AlertTriangle' | 'Tag';
}

export const CATEGORY_METADATA: Record<ChangeCategory, CategoryMeta> = {
  Features: { label: 'Features', accentToken: '--accent-gold', fallbackColor: '#fbbf24', iconName: 'Sparkles' },
  Improvements: { label: 'Improvements', accentToken: '--accent-cyan', fallbackColor: '#38bdf8', iconName: 'CheckCircle2' },
  'Bug Fixes': { label: 'Bug Fixes', accentToken: '--accent-emerald', fallbackColor: '#34d399', iconName: 'Bug' },
  Performance: { label: 'Performance', accentToken: '--accent-yellow', fallbackColor: '#facc15', iconName: 'Zap' },
  Reliability: { label: 'Reliability', accentToken: '--accent-teal', fallbackColor: '#2dd4bf', iconName: 'LifeBuoy' },
  'UI/UX': { label: 'UI/UX', accentToken: '--accent-purple', fallbackColor: '#c084fc', iconName: 'Palette' },
  Security: { label: 'Security', accentToken: '--accent-pink', fallbackColor: '#fb7185', iconName: 'ShieldCheck' },
  Accessibility: { label: 'Accessibility', accentToken: '--accent-orange', fallbackColor: '#fb923c', iconName: 'LifeBuoy' },
  Refactoring: { label: 'Refactoring', accentToken: '--accent-indigo', fallbackColor: '#818cf8', iconName: 'Wrench' },
  'Breaking Changes': { label: 'Breaking Changes', accentToken: '--accent-danger', fallbackColor: '#ef4444', iconName: 'AlertTriangle' },
  Other: { label: 'Other', accentToken: '--text-muted', fallbackColor: '#94a3b8', iconName: 'Tag' }
};

export interface CategorizedChanges {
  category: ChangeCategory;
  items: string[];
}

export interface DatabaseMigrationInfo {
  table: string;
  change: string;
  safe: boolean;
}

export interface ReleaseHighlight {
  label: string;
  value: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  releaseType: ReleaseType;
  releaseLabel?: string;
  summary: string;
  changes: CategorizedChanges[];
  diffUrl?: string;
  gitTag?: string;
  commitHash?: string;
  versionJump?: VersionJump;
  releaseIntensity?: ReleaseIntensity;
  subsystems?: string[];
  migrations?: DatabaseMigrationInfo[];
  highlights?: ReleaseHighlight[];
}

/**
 * Public-facing release label for a changelog entry.
 * Never "Major release" unless the SemVer MAJOR component actually increased;
 * larger backwards-compatible releases are labelled "Substantial release",
 * "Major feature release", or "Milestone release" by jump size per the
 * documented release-intensity policy.
 */
export function getEntryReleaseLabel(entry: ChangelogEntry): string {
  if (entry.releaseLabel) return entry.releaseLabel;
  const jump = entry.versionJump;
  if (entry.releaseType === 'major') return 'Major release';
  if (entry.releaseType === 'minor') {
    if (jump && jump.minor >= 4) return 'Milestone release';
    if (jump && jump.minor === 3) return 'Major feature release';
    if (jump && jump.minor === 2) return 'Substantial release';
    return 'Minor release';
  }
  if (entry.releaseType === 'patch') return 'Patch release';
  return 'No release';
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

export interface ReleaseMilestone {
  version: string;
  label: string;
  releaseType: ReleaseType;
  date: string;
}

export function getReleaseMilestones(entries: ChangelogEntry[] = CHANGELOG_ENTRIES): ReleaseMilestone[] {
  return entries.map((entry) => ({
    version: entry.version,
    label: `v${entry.version}`,
    releaseType: entry.releaseType,
    date: entry.date
  }));
}
