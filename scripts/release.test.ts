import { describe, it, expect } from 'vitest';
import {
  classifyChanges,
  bumpVersion,
  ROOT_DIR,
  PUBLIC_CHANGELOG_HTML
} from './release.mjs';
import {
  classifyRelease,
  partitionAddedFiles,
  detectWhitespaceOnlyFiles,
  extractDeletedFiles
} from './release/classifier.mjs';
import { isIgnoredFile } from './release/boundary.mjs';
import { passesQualityGate, deduplicateItems, formatChangelogItem } from './release/changelog.mjs';
import {
  extractReleaseSignals,
  resolveProductArea,
  classifyCommitWorkItemType,
  isApplicationFile,
  isMeaningfulCommit,
  deduplicateWorkItems
} from './release/signals.mjs';
import {
  computeSIS,
  computeRMS,
  intensityFromRMS,
  productAreaBonus,
  commitCountBonus,
  classifySemVer,
  reEvaluateHighRMSPatch,
  calculateNextVersion,
  getReleaseLabel,
  scoreRelease,
  MAX_MINOR_JUMP,
  MINOR_JUMP_BY_INTENSITY,
  INTENSITY_LEVELS
} from './release/scoring.mjs';
import { isProcessRunning } from './release/lock.mjs';
import { backupFiles, restoreFiles, parseSemVerTag, compareSemVerTags } from './release/git.mjs';
import { validateChangelogIntegrity, validateReleaseReadiness } from './release/validator.mjs';

// Shared diff fixture builder (deterministic, no git state).
function diffFor(files: string[], { added = [] as string[], deleted = [] as string[] } = {}) {
  const parts: string[] = [];
  for (const f of added) {
    parts.push(`diff --git a/${f} b/${f}`, 'new file mode 100644', '--- /dev/null', `+++ b/${f}`, '@@ -0,0 +1,2 @@', '+export function NewThing() {}', '+// new content');
  }
  for (const f of deleted) {
    parts.push(`diff --git a/${f} b/${f}`, 'deleted file mode 100644', `--- a/${f}`, '+++ /dev/null', '@@ -1,2 +0,0 @@', '-export function OldThing() {}', '-// old content');
  }
  for (const f of files) {
    parts.push(`diff --git a/${f} b/${f}`, `--- a/${f}`, `+++ b/${f}`, '@@ -1,3 +1,3 @@', '+const updated = true;');
  }
  return parts.join('\n');
}

function classifyFixture({ changedFiles = [] as string[], added = [] as string[], deleted = [] as string[], commits = [] as string[], diff = null as string | null, previousVersion = '1.1.0' } = {}) {
  const allFiles = Array.from(new Set([...changedFiles, ...added]));
  const diffText = diff ?? diffFor(changedFiles, { added, deleted });
  return classifyRelease({
    changedFiles: allFiles,
    commits: commits.map((m, i) => ({
      message: m,
      sha: 'x',
      files: allFiles.length > 0 ? [allFiles[i % allFiles.length]] : []
    })),
    diffSnippets: diffText,
    previousVersion
  });
}

describe('MyFinanceOS Deterministic Release Scoring — vitest mirror', () => {
  // =========================================================
  // Section 1: Routine PATCH
  // =========================================================
  it('single bug fix classifies as PATCH +1 (1.1.0 -> 1.1.1)', () => {
    const result = classifyFixture({
      changedFiles: ['apps/web/src/components/LedgerView.tsx'],
      commits: ['fix: resolve date parsing on HDFC CSV statements']
    });
    expect(result.releaseType).toBe('patch');
    expect(result.scoring?.nextVersion).toBe('1.1.1');
    expect(result.scoring?.sis).toBeLessThan(20);
    expect(result.scoring?.semverType).toBe('PATCH');
  });

  it('bugFix category contributes exactly 5 SIS points', () => {
    expect(computeSIS({ categories: ['bugFix'] }).sis).toBe(5);
  });

  it('multiple bug fixes still yield a single PATCH +1 (no multi-step patch)', () => {
    const result = classifyFixture({
      changedFiles: ['apps/web/src/components/LedgerView.tsx', 'apps/web/src/components/DashboardView.tsx'],
      commits: ['fix: correct tooltip position', 'fix: avoid double rendering in dashboard', 'fix: format currency in ledger'],
      previousVersion: '1.1.47'
    });
    expect(result.releaseType).toBe('patch');
    expect(result.scoring?.nextVersion).toBe('1.1.48');
  });

  // =========================================================
  // Section 2–5: Minor jump bands
  // =========================================================
  it('single user feature: MINOR +1 (1.1.0 -> 1.2.0)', () => {
    const result = classifyFixture({
      changedFiles: ['apps/web/src/components/ReportsView.tsx'],
      commits: ['feat: add annual wealth report export']
    });
    expect(result.releaseType).toBe('minor');
    expect(result.scoring?.nextVersion).toBe('1.2.0');
    expect(result.scoring?.minorJump).toBe(1);
  });

  it('multiple features and areas: MINOR +2 (1.1.0 -> 1.3.0)', () => {
    const result = classifyFixture({
      changedFiles: [
        'apps/web/src/components/TaxView.tsx',
        'apps/web/src/components/InvestmentsView.tsx',
        'apps/web/src/components/LedgerView.tsx',
        'apps/web/src/components/ReportsView.tsx'
      ],
      commits: [
        'feat: add automated tax deduction estimator',
        'feat: add multi-asset rebalancing wizard',
        'fix: resolve dividend calculation in portfolio view',
        'perf: optimize transaction filtering',
        'improve: redesign tax slab comparison card'
      ]
    });
    expect(result.releaseType).toBe('minor');
    expect(result.scoring?.intensity).toBe('SUBSTANTIAL');
    expect(result.scoring?.nextVersion).toBe('1.3.0');
    expect(result.scoring?.minorJump).toBe(2);
  });

  it('massive feature milestone: MINOR +4 (1.1.0 -> 1.5.0)', () => {
    const areas = [
      'apps/web/src/components/TaxView.tsx',
      'apps/web/src/components/InvestmentsView.tsx',
      'apps/web/src/components/LedgerView.tsx',
      'apps/web/src/components/DashboardView.tsx',
      'apps/web/src/components/BusinessView.tsx',
      'apps/web/src/components/DocumentVaultView.tsx',
      'apps/web/src/components/SankeyView.tsx',
      'apps/web/src/components/ReportsView.tsx'
    ];
    const result = classifyFixture({
      changedFiles: areas,
      commits: [
        'feat: automated tax filing engine',
        'feat: multi-asset rebalancing wizard',
        'feat: GST invoice compliance suite',
        'feat: OCR receipt intelligence',
        'feat: net worth projection charts',
        'feat: bank statement auto-parser',
        'feat: cash flow anomaly detection',
        'feat: P&L statement generator',
        'feat: goal-linked savings plans',
        'feat: EMI restructuring advisor',
        'feat: document vault encryption upgrade',
        'fix: ledger pagination edge case',
        'perf: dashboard cold-start optimization'
      ]
    });
    expect(result.releaseType).toBe('minor');
    expect(result.scoring?.intensity).toBe('EXCEPTIONAL');
    expect(result.scoring?.rms).toBeGreaterThanOrEqual(80);
    expect(result.scoring?.nextVersion).toBe('1.5.0');
    expect(result.scoring?.minorJump).toBe(4);
  });

  // =========================================================
  // Section 6: Hard cap
  // =========================================================
  it('minor jump strictly caps at +4 regardless of RMS', () => {
    expect(MAX_MINOR_JUMP).toBe(4);
    expect(intensityFromRMS(150)).toBe('EXCEPTIONAL');
    const next = calculateNextVersion({ previousVersion: '1.1.0', semverType: 'MINOR', intensity: 'EXCEPTIONAL' });
    expect(next.nextVersion).toBe('1.5.0');
    expect(next.minorJump).toBe(4);
  });

  it('no intensity level can reach 1.9.0 from 1.1.0 in a single jump', () => {
    for (const level of INTENSITY_LEVELS) {
      const { nextVersion, minorJump } = calculateNextVersion({ previousVersion: '1.1.0', semverType: 'MINOR', intensity: level });
      expect(minorJump).toBeLessThanOrEqual(4);
      expect(nextVersion.startsWith('1.9')).toBe(false);
    }
  });

  // =========================================================
  // Section 7: Breaking MAJOR
  // =========================================================
  it('incompatible schema change: MAJOR with resets (1.5.3 -> 2.0.0)', () => {
    const diff = [
      'diff --git a/packages/database/src/migrations/007.sql b/packages/database/src/migrations/007.sql',
      'new file mode 100644',
      '--- /dev/null',
      '+++ b/packages/database/src/migrations/007.sql',
      '@@ -0,0 +1,3 @@',
      '+ALTER TABLE transactions DROP COLUMN legacy_code;'
    ].join('\n');
    const result = classifyRelease({
      changedFiles: ['packages/database/src/migrations/007.sql'],
      commits: [{ message: 'feat(db): tighten transactions schema', sha: 'x', files: ['packages/database/src/migrations/007.sql'] }],
      diffSnippets: diff,
      previousVersion: '1.5.3'
    });
    expect(result.releaseType).toBe('major');
    expect(result.scoring?.nextVersion).toBe('2.0.0');
    expect(result.scoring?.semverType).toBe('MAJOR');
  });

  it('SIS alone never produces MAJOR (verified breaking evidence required)', () => {
    const cls = classifySemVer({
      hasApplicationChange: true,
      verifiedBreakingCategories: [],
      suspectedBreakingEvidence: [],
      sis: 70,
      workItems: [{ type: 'newFeature', subject: 'x', area: null }]
    });
    expect(cls.type).not.toBe('MAJOR');
    expect(cls.type).toBe('MINOR');
  });

  it('removal of a public feature (deleted route) is verified MAJOR', () => {
    const result = classifyRelease({
      changedFiles: ['apps/web/app/reports/page.tsx'],
      commits: [{ message: 'chore: remove legacy reports page', sha: 'x', files: ['apps/web/app/reports/page.tsx'] }],
      diffSnippets: diffFor([], { deleted: ['apps/web/app/reports/page.tsx'] }),
      previousVersion: '1.5.3'
    });
    expect(result.releaseType).toBe('major');
  });

  // =========================================================
  // Section 8: Commit dampening
  // =========================================================
  it('60 micro-commits + 1 bug fix: commit bonus caps at +4, PATCH +1', () => {
    const microCommits = Array.from({ length: 60 }, (_, i) => `chore: internal tweak ${i}`);
    const result = classifyFixture({
      changedFiles: ['apps/web/src/components/LedgerView.tsx'],
      commits: [...microCommits, 'fix: resolve date parsing on HDFC CSV statements']
    });
    expect(result.releaseType).toBe('patch');
    expect(result.scoring?.rmsBreakdown.commitBonus).toBe(4);
    expect(result.scoring?.nextVersion).toBe('1.1.1');
  });

  it('commit dampener bands: 0/+1/+2/+3/+4 with hard cap', () => {
    expect(commitCountBonus(0)).toBe(0);
    expect(commitCountBonus(4)).toBe(0);
    expect(commitCountBonus(5)).toBe(1);
    expect(commitCountBonus(10)).toBe(2);
    expect(commitCountBonus(20)).toBe(3);
    expect(commitCountBonus(40)).toBe(4);
    expect(commitCountBonus(1000)).toBe(4);
  });

  // =========================================================
  // Section 9: Line-count exclusion
  // =========================================================
  it('10k lines of whitespace refactoring stays PATCH with trivial SIS/RMS', () => {
    const lines: string[] = [
      'diff --git a/apps/web/src/components/LedgerView.tsx b/apps/web/src/components/LedgerView.tsx',
      '--- a/apps/web/src/components/LedgerView.tsx',
      '+++ b/apps/web/src/components/LedgerView.tsx',
      '@@ -1,5000 +1,5000 @@'
    ];
    for (let i = 0; i < 5000; i++) {
      lines.push(`-    const value${i} = compute${i}();`);
      lines.push(`+      const value${i} = compute${i}();`);
    }
    // Only the diffed file is whitespace-only; the untouched modified files
    // keep the change set a real (if trivial) application change => PATCH.
    const result = classifyFixture({
      changedFiles: [
        'apps/web/src/components/LedgerView.tsx',
        'apps/web/src/components/DashboardView.tsx',
        'apps/web/src/components/TaxView.tsx'
      ],
      commits: ['refactor: reformat source files to new prettier config'],
      diff: lines.join('\n')
    });
    expect(result.releaseType).toBe('patch');
    expect(result.scoring?.sis).toBeLessThanOrEqual(2);
    expect(result.scoring?.rms).toBeLessThanOrEqual(2);
  });

  it('whitespace-only file detection recognises pure reindentation', () => {
    const diff = [
      'diff --git a/apps/web/src/components/LedgerView.tsx b/apps/web/src/components/LedgerView.tsx',
      '--- a/apps/web/src/components/LedgerView.tsx',
      '+++ b/apps/web/src/components/LedgerView.tsx',
      '@@ -1,2 +1,2 @@',
      '-  const a = 1;',
      '+    const a = 1;'
    ].join('\n');
    expect(detectWhitespaceOnlyFiles(diff).has('apps/web/src/components/LedgerView.tsx')).toBe(true);
  });

  // =========================================================
  // Section 10: Product area bonus
  // =========================================================
  it('product-area bonus table: 1/2/3/4/5/6/7+', () => {
    expect(productAreaBonus(1)).toBe(0);
    expect(productAreaBonus(2)).toBe(3);
    expect(productAreaBonus(3)).toBe(6);
    expect(productAreaBonus(4)).toBe(6);
    expect(productAreaBonus(5)).toBe(10);
    expect(productAreaBonus(6)).toBe(10);
    expect(productAreaBonus(7)).toBe(14);
    expect(productAreaBonus(12)).toBe(14);
  });

  it('product-area matrix resolves exact MyFinanceOS subsystems', () => {
    expect(resolveProductArea('apps/web/src/components/DashboardView.tsx')).toBe('Dashboard');
    expect(resolveProductArea('apps/web/src/components/LedgerView.tsx')).toBe('Ledger / Transactions');
    expect(resolveProductArea('apps/web/src/components/InvestmentsView.tsx')).toBe('Investments & Wealth');
    expect(resolveProductArea('apps/web/src/components/TaxView.tsx')).toBe('Tax & Compliance');
    expect(resolveProductArea('apps/web/src/components/BusinessView.tsx')).toBe('Business & Invoicing');
    expect(resolveProductArea('apps/web/src/components/SankeyView.tsx')).toBe('Cash Flow / Sankey');
    expect(resolveProductArea('apps/web/src/components/DocumentVaultView.tsx')).toBe('Document Vault');
    expect(resolveProductArea('apps/web/src/components/EMICalculator.tsx')).toBe('Calculators / Tools');
    expect(resolveProductArea('apps/web/src/components/ReportsView.tsx')).toBe('Reports & Analytics');
    expect(resolveProductArea('apps/web/src/components/AIChatView.tsx')).toBe('AI Financial Assistant');
    expect(resolveProductArea('apps/web/src/components/AutomationView.tsx')).toBe('Automation / Rules');
    expect(resolveProductArea('apps/web/src/components/SettingsView.tsx')).toBe('Core / Platform / Auth');
  });

  // =========================================================
  // Section 11: High-RMS PATCH retention
  // =========================================================
  it('corrective work with RMS >= 35 stays PATCH +1', () => {
    const areas = [
      'apps/web/src/components/TaxView.tsx',
      'apps/web/src/components/InvestmentsView.tsx',
      'apps/web/src/components/LedgerView.tsx',
      'apps/web/src/components/DashboardView.tsx',
      'apps/web/src/components/BusinessView.tsx',
      'apps/web/src/components/DocumentVaultView.tsx'
    ];
    const result = classifyFixture({
      changedFiles: areas,
      commits: [
        'fix: null guard in tax calculator',
        'fix: rounding in portfolio totals',
        'fix: ledger pagination edge case',
        'fix: dashboard widget alignment',
        'fix: invoice number generation',
        'fix: vault thumbnail rendering',
        'fix: tax slab boundary condition',
        'fix: dividend reconciliation',
        'fix: CSV import encoding',
        'perf: memoize tax computations',
        'perf: lazy-load vault previews',
        'fix: settings save race condition'
      ]
    });
    expect(result.scoring?.rms).toBeGreaterThanOrEqual(35);
    expect(result.releaseType).toBe('patch');
    expect(result.scoring?.nextVersion).toBe('1.1.1');
    expect(result.scoring?.sis).toBeLessThan(20);
  });

  it('reEvaluateHighRMSPatch promotes only with uncredited user-facing capability', () => {
    expect(
      reEvaluateHighRMSPatch({
        sis: 10,
        rms: 48,
        workItems: [
          { type: 'bugFix', subject: 'fix a', area: null },
          { type: 'performance', subject: 'perf b', area: null }
        ]
      }).remainsPatch
    ).toBe(true);
    expect(
      reEvaluateHighRMSPatch({
        sis: 18,
        rms: 48,
        workItems: [
          { type: 'bugFix', subject: 'fix a', area: null },
          { type: 'featureEnhancement', subject: 'enhanced filtering', area: null }
        ]
      }).remainsPatch
    ).toBe(false);
  });

  // =========================================================
  // Section 12: NONE detection
  // =========================================================
  it('docs-only, ignored-only, and empty inputs produce NONE', () => {
    expect(
      classifyFixture({ changedFiles: ['README.md', 'docs/ARCHITECTURE.md'], commits: ['docs: update architecture notes'] }).releaseType
    ).toBe('none');
    expect(classifyFixture({ changedFiles: ['graphify-out/graph.json', '.vscode/settings.json'], commits: [] }).releaseType).toBe('none');
    expect(classifyFixture({ changedFiles: [], commits: [], diff: '' }).releaseType).toBe('none');
  });

  it('isIgnoredFile excludes secrets, internal metadata, and release artifacts', () => {
    expect(isIgnoredFile('.env.local')).toBe(true);
    expect(isIgnoredFile('credentials.json')).toBe(true);
    expect(isIgnoredFile('id_rsa')).toBe(true);
    expect(isIgnoredFile('graphify-out/graph.json')).toBe(true);
    expect(isIgnoredFile('packages/shared/src/version.json')).toBe(true);
    expect(isIgnoredFile('packages/shared/src/changelog.json')).toBe(true);
    expect(isIgnoredFile('packages/shared/src/release-manifest.json')).toBe(true);
    expect(isIgnoredFile('CHANGELOG.md')).toBe(true);
    expect(isIgnoredFile('apps/web/public/changelog.html')).toBe(true);
    expect(isIgnoredFile('apps/web/src/components/LedgerView.tsx')).toBe(false);
  });

  it('isApplicationFile excludes docs/tests/assets but keeps runtime code', () => {
    expect(isApplicationFile('README.md')).toBe(false);
    expect(isApplicationFile('apps/web/src/components/LedgerView.test.tsx')).toBe(false);
    expect(isApplicationFile('apps/web/public/logo.png')).toBe(false);
    expect(isApplicationFile('e2e/onboarding.spec.ts')).toBe(false);
    expect(isApplicationFile('apps/web/src/components/LedgerView.tsx')).toBe(true);
    expect(isApplicationFile('packages/shared/src/financialCalculations.ts')).toBe(true);
  });

  // =========================================================
  // Section 13: Ambiguity blocking
  // =========================================================
  it('suspected breaking change blocks classification (never silently downgraded)', () => {
    const diff = [
      'diff --git a/packages/auth/src/session.ts b/packages/auth/src/session.ts',
      '--- a/packages/auth/src/session.ts',
      '+++ b/packages/auth/src/session.ts',
      '@@ -1,4 +1,4 @@',
      '-export const TOKEN_VERSION = "1";',
      '+export const TOKEN_VERSION = "2";'
    ].join('\n');
    const result = classifyRelease({
      changedFiles: ['packages/auth/src/session.ts'],
      commits: [{ message: 'feat(auth): rotate session tokens', sha: 'x', files: ['packages/auth/src/session.ts'] }],
      diffSnippets: diff,
      previousVersion: '1.1.0'
    });
    expect(result.blocked).toBe(true);
    expect(result.releaseType).toBeNull();
    expect(result.breakingChanges.length).toBeGreaterThan(0);
  });

  // =========================================================
  // Section 14: Determinism / idempotency
  // =========================================================
  it('identical inputs produce byte-identical scoring output', () => {
    const run = () =>
      JSON.stringify(
        classifyFixture({
          changedFiles: ['apps/web/src/components/TaxView.tsx', 'apps/web/src/components/LedgerView.tsx'],
          commits: ['feat: add tax deduction estimator', 'fix: ledger date parsing', 'perf: faster filtering']
        })
      );
    expect(run()).toBe(run());
  });

  it('collision avoidance skips already-released versions', () => {
    expect(
      calculateNextVersion({
        previousVersion: '1.1.0',
        semverType: 'MINOR',
        intensity: 'NORMAL',
        existingVersions: ['1.2.0']
      }).nextVersion
    ).toBe('1.3.0');
  });

  // =========================================================
  // Section 15: Version math
  // =========================================================
  it('MAJOR resets minor and patch; PATCH is strictly +1', () => {
    expect(calculateNextVersion({ previousVersion: '1.5.3', semverType: 'MAJOR' }).nextVersion).toBe('2.0.0');
    expect(calculateNextVersion({ previousVersion: '2.9.4', semverType: 'MAJOR' }).nextVersion).toBe('3.0.0');
    expect(calculateNextVersion({ previousVersion: '1.1.47', semverType: 'PATCH' }).nextVersion).toBe('1.1.48');
  });

  it('calculateNextVersion rejects invalid inputs', () => {
    expect(() => calculateNextVersion({ previousVersion: 'not.a.version', semverType: 'PATCH' })).toThrow();
    expect(() => calculateNextVersion({ previousVersion: '1.1.0', semverType: 'weird-type' as never })).toThrow();
  });

  it('legacy bumpVersion single-step helpers keep their contract', () => {
    expect(bumpVersion('1.0.0', 'patch')).toBe('1.0.1');
    expect(bumpVersion('1.0.0', 'minor')).toBe('1.1.0');
    expect(bumpVersion('1.9.4', 'major')).toBe('2.0.0');
  });

  // =========================================================
  // Section 16: Changelog quality gate
  // =========================================================
  it('quality gate filters low-information noise', () => {
    expect(passesQualityGate('wip')).toBe(false);
    expect(passesQualityGate('updated file')).toBe(false);
    expect(passesQualityGate('fixed typos')).toBe(false);
    expect(passesQualityGate('Improved dashboard rendering responsiveness')).toBe(true);
    expect(passesQualityGate('Added support for automated dividend tracking')).toBe(true);
  });

  it('formatChangelogItem strips prefixes; deduplicateItems collapses semantic dupes', () => {
    expect(formatChangelogItem('feat(ledger): add category auto-complete')).toBe('Add category auto-complete');
    expect(deduplicateItems(['Added portfolio filtering', 'added portfolio filtering', 'Added portfolio filtering.', 'Improved bank statement parsing']).length).toBe(2);
  });

  // =========================================================
  // Section 17: Work items & dedup
  // =========================================================
  it('commit classification maps conventional and natural language', () => {
    expect(classifyCommitWorkItemType('fix: resolve crash')).toBe('bugFix');
    expect(classifyCommitWorkItemType('feat: add export')).toBe('newFeature');
    expect(classifyCommitWorkItemType('feat: improve filters')).toBe('featureEnhancement');
    expect(classifyCommitWorkItemType('perf: speed up queries')).toBe('performance');
    expect(classifyCommitWorkItemType('chore: bump deps')).toBeNull();
    expect(classifyCommitWorkItemType('fixed rendering bug')).toBe('bugFix');
    expect(classifyCommitWorkItemType('added export wizard')).toBe('newFeature');
    expect(classifyCommitWorkItemType('improved dashboard charts')).toBe('featureEnhancement');
  });

  it('meaningful-commit filter excludes release/merge/noise commits', () => {
    expect(isMeaningfulCommit({ message: 'chore(release): v1.1.1 [skip-release-hook]' })).toBe(false);
    expect(isMeaningfulCommit({ message: 'Merge branch main into feature' })).toBe(false);
    expect(isMeaningfulCommit({ message: 'wip' })).toBe(false);
    expect(isMeaningfulCommit({ message: 'fix: resolve crash' })).toBe(true);
  });

  it('work items deduplicate by type + normalized subject', () => {
    expect(
      deduplicateWorkItems([
        { type: 'bugFix', subject: 'Fix: Resolve crash', area: null },
        { type: 'bugFix', subject: 'fix resolve crash', area: null },
        { type: 'bugFix', subject: 'Fix another crash', area: null }
      ]).length
    ).toBe(2);
  });

  it('new view+route pairs create subsystem items, not double-counted newPage', () => {
    const signals = extractReleaseSignals({
      commits: [{ message: 'feat: add vault', sha: 'x', files: [] }],
      changedFiles: ['apps/web/app/vault/page.tsx', 'apps/web/src/components/VaultView.tsx'],
      addedFiles: ['apps/web/app/vault/page.tsx', 'apps/web/src/components/VaultView.tsx'],
      deletedFiles: [],
      diff: diffFor([], { added: ['apps/web/app/vault/page.tsx', 'apps/web/src/components/VaultView.tsx'] }),
      whitespaceOnlyFiles: []
    });
    const types = signals.workItems.map((i) => i.type);
    expect(types).toContain('subsystem');
    expect(types).not.toContain('newPage');
    expect(signals.productAreas).toContain('Document Vault');
  });

  it('partitionAddedFiles + extractDeletedFiles parse diff headers', () => {
    const diff = [
      'diff --git a/apps/web/app/new/page.tsx b/apps/web/app/new/page.tsx',
      'new file mode 100644',
      '--- /dev/null',
      '+++ b/apps/web/app/new/page.tsx',
      '@@ -0,0 +1 @@',
      '+export default function Page() {}',
      'diff --git a/apps/web/app/old/page.tsx b/apps/web/app/old/page.tsx',
      'deleted file mode 100644',
      '--- a/apps/web/app/old/page.tsx',
      '+++ /dev/null',
      '@@ -1,1 +0,0 @@',
      '-export default function Page() {}'
    ].join('\n');
    const { added, modified } = partitionAddedFiles(['apps/web/app/new/page.tsx', 'apps/web/src/components/LedgerView.tsx'], diff);
    expect(added).toEqual(['apps/web/app/new/page.tsx']);
    expect(modified).toEqual(['apps/web/src/components/LedgerView.tsx']);
    expect(extractDeletedFiles(diff)).toEqual(['apps/web/app/old/page.tsx']);
  });

  // =========================================================
  // Section 18: Labels & back-compat
  // =========================================================
  it('release labels follow jump size and never fake "Major release"', () => {
    expect(getReleaseLabel('MAJOR')).toBe('Major release');
    expect(getReleaseLabel('MINOR', 1)).toBe('Minor release');
    expect(getReleaseLabel('MINOR', 2)).toBe('Substantial release');
    expect(getReleaseLabel('MINOR', 3)).toBe('Major feature release');
    expect(getReleaseLabel('MINOR', 4)).toBe('Milestone release');
    expect(getReleaseLabel('PATCH')).toBe('Patch release');
  });

  it('intensity bands map RMS ranges deterministically', () => {
    expect(intensityFromRMS(0)).toBe('TRIVIAL');
    expect(intensityFromRMS(9)).toBe('TRIVIAL');
    expect(intensityFromRMS(10)).toBe('SMALL');
    expect(intensityFromRMS(20)).toBe('NORMAL');
    expect(intensityFromRMS(35)).toBe('SUBSTANTIAL');
    expect(intensityFromRMS(55)).toBe('VERY_SUBSTANTIAL');
    expect(intensityFromRMS(80)).toBe('EXCEPTIONAL');
    expect(intensityFromRMS(150)).toBe('EXCEPTIONAL');
  });

  it('classifyChanges back-compat wrapper returns the release type', () => {
    expect(classifyChanges(['apps/web/src/components/LedgerView.tsx'], ['fix: resolve crash'], '+const x = 1;')).toBe('patch');
  });

  it('manual override always wins and is recorded', () => {
    const result = classifyRelease({
      changedFiles: ['README.md'],
      commits: [{ message: 'docs: update setup', sha: 'x', files: [] }],
      forceType: 'minor'
    });
    expect(result.releaseType).toBe('minor');
    expect(result.manualOverride).toBe(true);
  });

  // =========================================================
  // Section 19: Infrastructure helpers (git/lock/validators)
  // =========================================================
  it('release lock PID detection works', () => {
    expect(isProcessRunning(process.pid)).toBe(true);
    expect(isProcessRunning(99999999)).toBe(false);
  });

  it('transactional backup and restore round-trips file content', async () => {
    // Use a temp scratch file: never mutate real repo artifacts from tests
    // (parallel workers import them).
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const testFile = path.join(os.tmpdir(), `release-backup-test-${process.pid}.txt`);
    fs.writeFileSync(testFile, 'original-content', 'utf-8');
    try {
      const backups = backupFiles([testFile]);
      expect(backups.has(testFile)).toBe(true);
      fs.writeFileSync(testFile, 'mutated-content', 'utf-8');
      restoreFiles(backups);
      expect(fs.readFileSync(testFile, 'utf-8')).toBe('original-content');
    } finally {
      fs.rmSync(testFile, { force: true });
    }
  });

  it('SemVer tag parsing and numeric comparison', () => {
    expect(parseSemVerTag('v1.0.0')).toEqual({ tag: 'v1.0.0', major: 1, minor: 0, patch: 0 });
    expect(parseSemVerTag('v1.1.10')!.patch).toBe(10);
    expect(parseSemVerTag('v2026-09-10')).toBeNull();
    expect(parseSemVerTag('v1.2.3.4')).toBeNull();
    expect(compareSemVerTags('v1.1.10', 'v1.1.9')).toBeGreaterThan(0);
    expect(compareSemVerTags('v2.0.0', 'v1.9.9')).toBeGreaterThan(0);
  });

  it('nested sensitive file detection (security hardening)', () => {
    expect(isIgnoredFile('apps/web/.env.local')).toBe(true);
    expect(isIgnoredFile('packages/auth/certs/private.key')).toBe(true);
    expect(isIgnoredFile('config/service-account.json')).toBe(true);
    expect(isIgnoredFile('scratch/test.js')).toBe(true);
    expect(isIgnoredFile('coverage/index.html')).toBe(true);
  });

  it('changelog integrity and release readiness validators pass on the real repository', () => {
    const changelogStatus = validateChangelogIntegrity(ROOT_DIR);
    expect(changelogStatus.valid).toBe(true);
    expect(changelogStatus.errors).toEqual([]);

    const readiness = validateReleaseReadiness(ROOT_DIR);
    expect(readiness.ready).toBe(true);
    expect(readiness.issues).toEqual([]);
  });

  it('public changelog HTML artifact exists at the expected path', () => {
    expect(PUBLIC_CHANGELOG_HTML.replace(/\\/g, '/')).toContain('apps/web/public/changelog.html');
  });
});
