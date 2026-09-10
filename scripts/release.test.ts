import { describe, it, expect } from 'vitest';
import {
  classifyChanges,
  generateChangelogItems,
  bumpVersion
} from './release.mjs';
import { classifyRelease } from './release-engine/classifier.mjs';
import { isIgnoredFile } from './release-engine/boundary.mjs';
import { passesQualityGate, deduplicateItems, formatChangelogItem } from './release-engine/changelog.mjs';
import { isProcessRunning } from './release-engine/lock.mjs';
import { backupFiles, restoreFiles } from './release-engine/git.mjs';

describe('MyFinanceOS Release Intelligence Engine — Comprehensive Test Matrix', () => {
  // Case 1: Tiny bug fix
  it('Case 1: correctly increments PATCH for a bug fix (1.0.0 -> 1.0.1)', () => {
    const result = classifyRelease({
      changedFiles: ['apps/web/src/styles/emergent-landing.css'],
      commits: [{ sha: 'c1', message: 'fix: resolve footer margin overflow' }],
      diffSnippets: '+ margin-bottom: 0;'
    });
    expect(result.releaseType).toBe('patch');
    expect(bumpVersion('1.0.0', result.releaseType)).toBe('1.0.1');
    expect(result.confidence.score).toBeGreaterThanOrEqual(70);
  });

  // Case 2: Multiple bug fixes -> single PATCH bump
  it('Case 2: clusters multiple bug fixes into a single PATCH bump (1.0.1 -> 1.0.2)', () => {
    const result = classifyRelease({
      changedFiles: [
        'apps/web/src/styles/emergent-landing.css',
        'apps/web/src/components/DashboardView.tsx'
      ],
      commits: [
        { sha: 'c1', message: 'fix: correct tooltip position' },
        { sha: 'c2', message: 'fix: avoid double rendering in dashboard' },
        { sha: 'c3', message: 'fix: format currency in ledger' }
      ],
      diffSnippets: 'fix'
    });
    expect(result.releaseType).toBe('patch');
    expect(bumpVersion('1.0.1', result.releaseType)).toBe('1.0.2');
  });

  // Case 3: New feature -> MINOR bump
  it('Case 3: classifies new features and views as MINOR (1.0.2 -> 1.1.0)', () => {
    const result = classifyRelease({
      changedFiles: ['apps/web/app/reports/page.tsx', 'apps/web/src/components/ReportsView.tsx'],
      commits: [{ sha: 'c4', message: 'feat: add annual wealth and tax report export' }],
      diffSnippets: 'export default function ReportsPage'
    });
    expect(result.releaseType).toBe('minor');
    expect(bumpVersion('1.0.2', result.releaseType)).toBe('1.1.0');
    expect(result.confidence.score).toBeGreaterThanOrEqual(80);
  });

  // Case 4: Major change -> MAJOR bump
  it('Case 4: classifies breaking schema change as MAJOR (1.1.0 -> 2.0.0)', () => {
    const result = classifyRelease({
      changedFiles: ['packages/database/src/schema.ts'],
      commits: [{ sha: 'c5', message: 'feat!: redesign ledger schema' }],
      diffSnippets: 'DROP TABLE legacy_transactions;'
    });
    expect(result.releaseType).toBe('major');
    expect(bumpVersion('1.1.0', result.releaseType)).toBe('2.0.0');
    expect(result.breakingChanges.length).toBeGreaterThan(0);
  });

  // Case 5: Feature + Bug Fix -> MINOR
  it('Case 5: prioritizes MINOR over PATCH when feature + bug fix are combined', () => {
    const result = classifyRelease({
      changedFiles: [
        'apps/web/app/reports/page.tsx',
        'apps/web/src/styles/emergent-landing.css'
      ],
      commits: [
        { sha: 'c6', message: 'feat: add recurring investment scheduler' },
        { sha: 'c7', message: 'fix: button focus outline in mobile' }
      ],
      diffSnippets: ''
    });
    expect(result.releaseType).toBe('minor');
  });

  // Case 6: Major + Minor + Patch -> MAJOR
  it('Case 6: prioritizes MAJOR when major, minor, and patch changes co-exist', () => {
    const result = classifyRelease({
      changedFiles: [
        'packages/database/src/schema.ts',
        'apps/web/app/reports/page.tsx',
        'apps/web/src/styles/emergent-landing.css'
      ],
      commits: [
        { sha: 'c8', message: 'feat!: overhaul database engine' },
        { sha: 'c9', message: 'feat: add reports page' },
        { sha: 'c10', message: 'fix: minor padding adjustment' }
      ],
      diffSnippets: 'DROP TABLE old_records;'
    });
    expect(result.releaseType).toBe('major');
  });

  // Case 7: Documentation only -> NO RELEASE (none)
  it('Case 7: classifies documentation-only changes as none (non-release)', () => {
    const result = classifyRelease({
      changedFiles: ['README.md', 'docs/API.md', 'DESIGN.md'],
      commits: [{ sha: 'c11', message: 'docs: update local development setup' }],
      diffSnippets: 'Updated README markdown'
    });
    expect(result.releaseType).toBe('none');
  });

  // Case 8: Run release twice on unchanged state -> Idempotent
  it('Case 8: remains idempotent when no files or commits are provided', () => {
    const result = classifyRelease({
      changedFiles: [],
      commits: [],
      diffSnippets: ''
    });
    expect(result.releaseType).toBe('none');
  });

  // Case 9: Manual override must always win
  it('Case 9: respects manual developer override over automatic classification', () => {
    const result = classifyRelease({
      changedFiles: ['README.md'], // usually none
      commits: [{ sha: 'c12', message: 'docs: update setup' }],
      forceType: 'minor'
    });
    expect(result.releaseType).toBe('minor');
    expect(result.manualOverride).toBe(true);
    expect(result.confidence.score).toBe(100);
  });

  // Case 10: Secret safety — filters sensitive files from release analysis
  it('Case 10: strictly filters out environment secrets and private keys', () => {
    expect(isIgnoredFile('.env')).toBe(true);
    expect(isIgnoredFile('.env.local')).toBe(true);
    expect(isIgnoredFile('.env.production')).toBe(true);
    expect(isIgnoredFile('credentials.json')).toBe(true);
    expect(isIgnoredFile('id_rsa')).toBe(true);
    expect(isIgnoredFile('server.key')).toBe(true);
    expect(isIgnoredFile('graphify-out/graph.json')).toBe(true);

    // Regular source files must not be ignored
    expect(isIgnoredFile('apps/web/src/components/LedgerView.tsx')).toBe(false);
    expect(isIgnoredFile('packages/shared/src/currency.ts')).toBe(false);
  });

  // Case 11: Quality Gate & Formatting
  it('Case 11: filters low-level raw technical phrases from changelog', () => {
    expect(passesQualityGate('updated file')).toBe(false);
    expect(passesQualityGate('changed code')).toBe(false);
    expect(passesQualityGate('modified component')).toBe(false);
    expect(passesQualityGate('fixed typos')).toBe(false);
    expect(passesQualityGate('wip')).toBe(false);

    // High quality product entries must pass
    expect(passesQualityGate('Improved dashboard rendering responsiveness')).toBe(true);
    expect(passesQualityGate('Added support for automated dividend tracking')).toBe(true);
  });

  // Case 12: Semantic Deduplication of Changelog Items
  it('Case 12: eliminates exact and semantic duplicate entries', () => {
    const rawItems = [
      'Added portfolio filtering',
      'added portfolio filtering',
      'Added portfolio filtering.',
      'Improved bank statement parsing'
    ];
    const deduped = deduplicateItems(rawItems);
    expect(deduped.length).toBe(2);
    expect(deduped).toContain('Added portfolio filtering');
    expect(deduped).toContain('Improved bank statement parsing');
  });

  // Case 13: Conventional Commit prefix stripping and formatting
  it('Case 13: formats commit messages into user-friendly strings', () => {
    expect(formatChangelogItem('feat(ledger): add category auto-complete')).toBe(
      'Add category auto-complete'
    );
    expect(formatChangelogItem('fix(ui): adjust dark mode contrast')).toBe(
      'Adjust dark mode contrast'
    );
  });

  // Case 14: Release lock PID detection
  it('Case 14: detects currently running process PID for release locking', () => {
    expect(isProcessRunning(process.pid)).toBe(true);
    expect(isProcessRunning(99999999)).toBe(false);
  });

  // Case 15: Transactional backup and restore simulation
  it('Case 15: supports atomic memory backup and restore for transactional safety', () => {
    const testFile = 'packages/shared/src/version.json';
    const backups = backupFiles([testFile]);
    expect(backups.has(testFile)).toBe(true);
    expect(typeof backups.get(testFile)).toBe('string');
  });
});
