import { describe, it, expect } from 'vitest';
import {
  CURRENT_VERSION,
  VERSION_METADATA,
  CHANGELOG_ENTRIES,
  LATEST_CHANGELOG_ENTRY,
  RELEASE_MANIFESTS,
  LATEST_RELEASE_MANIFEST,
  getManifestByVersion,
  getManifestByTag,
  getActiveCategories,
  type ChangelogEntry
} from './index.js';
import { bumpVersion } from '../../../scripts/release.mjs';

describe('Semantic Versioning & Changelog Model Tests', () => {
  it('correctly increments PATCH (1.0.0 -> 1.0.1)', () => {
    expect(bumpVersion('1.0.0', 'patch')).toBe('1.0.1');
    expect(bumpVersion('1.4.2', 'patch')).toBe('1.4.3');
  });

  it('correctly increments MINOR and resets PATCH to 0 (1.0.0 -> 1.1.0)', () => {
    expect(bumpVersion('1.0.0', 'minor')).toBe('1.1.0');
    expect(bumpVersion('1.4.7', 'minor')).toBe('1.5.0');
  });

  it('correctly increments MAJOR and resets MINOR and PATCH to 0 (1.0.0 -> 2.0.0)', () => {
    expect(bumpVersion('1.0.0', 'major')).toBe('2.0.0');
    expect(bumpVersion('1.9.4', 'major')).toBe('2.0.0');
  });

  it('preserves single source of truth consistency', () => {
    expect(CURRENT_VERSION).toBe(VERSION_METADATA.version);
    expect(LATEST_CHANGELOG_ENTRY.version).toBe(CURRENT_VERSION);
    expect(CHANGELOG_ENTRIES.length).toBeGreaterThanOrEqual(1);
    expect(RELEASE_MANIFESTS.length).toBeGreaterThanOrEqual(1);
    expect(LATEST_RELEASE_MANIFEST.version).toBe(CURRENT_VERSION);
    expect(LATEST_RELEASE_MANIFEST.releaseTag).toBe(`v${CURRENT_VERSION}`);
  });

  it('provides structured release manifest lookup by version and tag', () => {
    const manifest = getManifestByVersion('1.0.0');
    expect(manifest).toBeDefined();
    expect(manifest?.schemaVersion).toBe(1);
    expect(manifest?.confidence.level).toBe('high');

    const byTag = getManifestByTag('v1.0.0');
    expect(byTag).toBeDefined();
    expect(byTag?.version).toBe('1.0.0');
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
});
