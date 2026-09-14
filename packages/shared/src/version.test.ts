import { describe, it, expect } from 'vitest';
import {
  CURRENT_VERSION,
  CURRENT_RELEASE_LABEL,
  VERSION_METADATA,
  CHANGELOG_ENTRIES,
  LATEST_CHANGELOG_ENTRY,
  RELEASE_MANIFESTS,
  LATEST_RELEASE_MANIFEST,
  MANIFEST_SCHEMA_VERSION,
  isLegacyManifest,
  getManifestByVersion,
  getManifestByTag,
  getActiveCategories,
  getEntryReleaseLabel,
  type ChangelogEntry
} from './index.js';
import { calculateNextVersion, MAX_MINOR_JUMP } from '../../../scripts/release/scoring.mjs';
import { bumpVersion as bumpLegacy } from '../../../scripts/release.mjs';

describe('Semantic Versioning & Changelog Model Tests', () => {
  it('correctly increments PATCH (1.0.0 -> 1.0.1)', () => {
    expect(bumpLegacy('1.0.0', 'patch')).toBe('1.0.1');
    expect(bumpLegacy('1.4.2', 'patch')).toBe('1.4.3');
  });

  it('correctly increments MINOR and resets PATCH to 0 (1.0.0 -> 1.1.0)', () => {
    expect(bumpLegacy('1.0.0', 'minor')).toBe('1.1.0');
    expect(bumpLegacy('1.4.7', 'minor')).toBe('1.5.0');
  });

  it('correctly increments MAJOR and resets MINOR and PATCH to 0 (1.0.0 -> 2.0.0)', () => {
    expect(bumpLegacy('1.0.0', 'major')).toBe('2.0.0');
    expect(bumpLegacy('1.9.4', 'major')).toBe('2.0.0');
  });

  it('applies intensity-band MINOR jumps with a +4 ceiling', () => {
    expect(
      calculateNextVersion({ previousVersion: '1.1.0', semverType: 'MINOR', intensity: 'NORMAL' }).nextVersion
    ).toBe('1.2.0');
    expect(
      calculateNextVersion({ previousVersion: '1.1.0', semverType: 'MINOR', intensity: 'SUBSTANTIAL' }).nextVersion
    ).toBe('1.3.0');
    expect(
      calculateNextVersion({ previousVersion: '1.1.0', semverType: 'MINOR', intensity: 'VERY_SUBSTANTIAL' }).nextVersion
    ).toBe('1.4.0');
    expect(
      calculateNextVersion({ previousVersion: '1.1.0', semverType: 'MINOR', intensity: 'EXCEPTIONAL' }).nextVersion
    ).toBe('1.5.0');
    expect(MAX_MINOR_JUMP).toBe(4);
  });

  it('never applies intensity to PATCH or MAJOR progressions', () => {
    expect(
      calculateNextVersion({ previousVersion: '1.5.0', semverType: 'PATCH', intensity: 'EXCEPTIONAL' }).nextVersion
    ).toBe('1.5.1');
    expect(
      calculateNextVersion({ previousVersion: '1.5.0', semverType: 'MAJOR', intensity: 'EXCEPTIONAL' }).nextVersion
    ).toBe('2.0.0');
  });

  it('preserves single source of truth consistency', () => {
    expect(CURRENT_VERSION).toBe(VERSION_METADATA.version);
    expect(LATEST_CHANGELOG_ENTRY.version).toBe(CURRENT_VERSION);
    expect(CHANGELOG_ENTRIES.length).toBeGreaterThanOrEqual(1);
    expect(RELEASE_MANIFESTS.length).toBeGreaterThanOrEqual(1);
    expect(LATEST_RELEASE_MANIFEST.version).toBe(CURRENT_VERSION);
    expect(LATEST_RELEASE_MANIFEST.tag ?? LATEST_RELEASE_MANIFEST.releaseTag).toBe(`v${CURRENT_VERSION}`);
  });

  it('exposes the nested manifest document schema version', () => {
    expect(MANIFEST_SCHEMA_VERSION).toBe(1);
    expect(getManifestByVersion('1.0.0')).toBeDefined();
    expect(getManifestByTag('v1.0.0')).toBeDefined();
    expect(getManifestByTag('v1.0.0')?.version).toBe('1.0.0');
  });

  it('contains valid baseline 1.0.0 entry in chronological changelog', () => {
    const baseline = CHANGELOG_ENTRIES[CHANGELOG_ENTRIES.length - 1];
    expect(baseline.version).toBe('1.0.0');
    expect(baseline.releaseType).toBe('major');
    expect(baseline.summary).toContain('Initial baseline release');
    expect(baseline.changes.length).toBeGreaterThan(0);
  });

  it('filters out empty categories with getActiveCategories', () => {
    const mockEntry: ChangelogEntry = {
      version: '1.2.0',
      date: '2026-09-10',
      releaseType: 'minor',
      summary: 'Test summary',
      changes: [
        { category: 'Features', items: ['Feature 1', 'Feature 2'] },
        { category: 'Bug Fixes', items: [] },
        { category: 'Performance', items: ['Speedup'] },
        { category: 'UI/UX', items: [] }
      ]
    };

    const active = getActiveCategories(mockEntry);
    expect(active.length).toBe(2);
    expect(active.map((c) => c.category)).toEqual(['Features', 'Performance']);
  });

  it('labels releases accurately: never "Major release" unless MAJOR actually increased', () => {
    const exceptionalMinor: ChangelogEntry = {
      version: '1.5.0',
      date: '2026-09-11',
      releaseType: 'minor',
      versionJump: { major: 0, minor: 4, patch: 0 },
      summary: 'Milestone upgrade across the platform.',
      changes: []
    };
    expect(getEntryReleaseLabel(exceptionalMinor)).toBe('Milestone release');
    expect(getEntryReleaseLabel(exceptionalMinor)).not.toBe('Major release');

    const substantialMinor: ChangelogEntry = {
      version: '1.4.0',
      date: '2026-09-11',
      releaseType: 'minor',
      versionJump: { major: 0, minor: 3, patch: 0 },
      summary: 'Broad upgrade to tracking and analytics.',
      changes: []
    };
    expect(getEntryReleaseLabel(substantialMinor)).toBe('Major feature release');

    const normalMinor: ChangelogEntry = {
      version: '1.2.0',
      date: '2026-09-11',
      releaseType: 'minor',
      versionJump: { major: 0, minor: 1, patch: 0 },
      summary: 'New features.',
      changes: []
    };
    expect(getEntryReleaseLabel(normalMinor)).toBe('Minor release');

    const explicitLegacy: ChangelogEntry = {
      version: '1.1.0',
      date: '2026-09-10',
      releaseType: 'minor',
      releaseLabel: 'Substantial release',
      summary: 'Legacy labelled release.',
      changes: []
    };
    expect(getEntryReleaseLabel(explicitLegacy)).toBe('Substantial release');
  });

  it('exposes intensity metadata and legacy manifest detection', () => {
    // Current releases predate the SIS/RMS engine => legacy (no scoring block)
    const legacyCount = RELEASE_MANIFESTS.filter((m) => isLegacyManifest(m)).length;
    expect(legacyCount).toBe(RELEASE_MANIFESTS.length);
    expect(typeof CURRENT_RELEASE_LABEL).toBe('string');
    expect(CURRENT_RELEASE_LABEL.toLowerCase()).toContain('release');
    expect(VERSION_METADATA.version).toBe(CURRENT_VERSION);
  });
});
