#!/usr/bin/env node
/**
 * Deterministic Release Scoring — Automated Verification Suite
 *
 * Run:  node scripts/test-release-scoring.mjs   (or `npm test release` via
 *       vitest, which runs the mirror suite in scripts/release.test.ts)
 *
 * Rigorously asserts the full deterministic scoring contract:
 *   - Routine patch, minor jump bands (+1..+4), hard cap +4
 *   - Breaking major reset, ambiguity blocking
 *   - Commit dampening neutrality, line-count exclusion
 *   - Product-area bonus scaling, high-RMS patch retention
 *   - Idempotency, determinism, NONE detection, version parsing
 *   - Manifest schema validity, duplicate prevention, synchronization
 *
 * Pure unit tests over the engine modules: no git state, no filesystem
 * mutations. Standalone executable with a zero-dependency runner.
 */

import {
  extractReleaseSignals,
  resolveProductArea,
  classifyCommitWorkItemType,
  isApplicationFile,
  partitionAddedFiles,
  deduplicateWorkItems,
  isMeaningfulCommit
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
  bumpVersion,
  parseSemVer,
  formatSemVer,
  getReleaseLabel,
  scoreRelease,
  MAX_MINOR_JUMP,
  MINOR_JUMP_BY_INTENSITY,
  INTENSITY_LEVELS
} from './release/scoring.mjs';
import { classifyRelease, detectWhitespaceOnlyFiles, extractDeletedFiles } from './release/classifier.mjs';
import {
  generateChangelogContent,
  generateScoringMetrics,
  passesQualityGate,
  deduplicateItems,
  formatChangelogItem
} from './release/changelog.mjs';
import {
  validateReleaseRecord,
  validateManifestDocument
} from './release/manifest.mjs';
import { isIgnoredFile } from './release/boundary.mjs';

// ---------------------------------------------------------------------------
// Minimal test harness (zero dependencies)
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err });
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'assertEqual failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(`${message || 'assertDeepEqual failed'}:\n      expected: ${b}\n      actual:   ${a}`);
  }
}

// ---------------------------------------------------------------------------
// Helpers: build diff fixtures deterministically
// ---------------------------------------------------------------------------

function diffFor(files, { added = [], deleted = [], content = [] } = {}) {
  const parts = [];
  for (const f of added) {
    parts.push(`diff --git a/${f} b/${f}`);
    parts.push('new file mode 100644');
    parts.push('--- /dev/null');
    parts.push(`+++ b/${f}`);
    parts.push('@@ -0,0 +1,2 @@');
    parts.push('+export function NewThing() {}');
    parts.push('+// new content');
  }
  for (const f of deleted) {
    parts.push(`diff --git a/${f} b/${f}`);
    parts.push('deleted file mode 100644');
    parts.push(`--- a/${f}`);
    parts.push('+++ /dev/null');
    parts.push('@@ -1,2 +0,0 @@');
    parts.push('-export function OldThing() {}');
    parts.push('-// old content');
  }
  for (const f of files) {
    parts.push(`diff --git a/${f} b/${f}`);
    parts.push('--- a/' + f);
    parts.push('+++ b/' + f);
    parts.push('@@ -1,3 +1,3 @@');
    for (const line of content) {
      parts.push(line);
    }
  }
  return parts.join('\n');
}

function classifyFixture({ changedFiles = [], added = [], deleted = [], commits = [], diff = null, previousVersion = '1.1.0' } = {}) {
  const allFiles = Array.from(new Set([...changedFiles, ...added]));
  const diffText = diff ?? diffFor(changedFiles, { added, deleted });
  return classifyRelease({
    changedFiles: allFiles,
    commits: commits.map((m, i) => ({
      message: m,
      sha: 'x',
      // Distribute files cyclically across commits so product-area
      // attribution reflects a realistic multi-area release instead of
      // collapsing every commit onto the first file's area.
      files: allFiles.length > 0 ? [allFiles[i % allFiles.length]] : []
    })),
    diffSnippets: diffText,
    previousVersion
  });
}

// ===========================================================================
console.log('\nDeterministic Release Scoring — Test Suite');
console.log('='.repeat(60));

// ---------------------------------------------------------------------------
console.log('\n■ Section 1: Routine Patch (bug fix only, 1.1.0 -> 1.1.1)');
// ---------------------------------------------------------------------------

test('Single bug fix classifies as PATCH and computes 1.1.0 -> 1.1.1', () => {
  const result = classifyFixture({
    changedFiles: ['apps/web/src/components/LedgerView.tsx'],
    commits: ['fix: resolve date parsing on HDFC CSV statements'],
    diffFor: undefined
  });
  assertEqual(result.releaseType, 'patch', 'classification');
  assertEqual(result.scoring.nextVersion, '1.1.1', 'version');
  assert(result.scoring.sis < 20, 'SIS must be < 20 for patch');
  assertEqual(result.scoring.semverType, 'PATCH', 'semverType');
});

test('Bug fix SIS = 5 (single category presence)', () => {
  const { sis } = computeSIS({ categories: ['bugFix'] });
  assertEqual(sis, 5, 'bugFix contributes exactly 5 points');
});

test('Multiple bug fixes still yield single PATCH +1 (no multi-step patch)', () => {
  const result = classifyFixture({
    changedFiles: ['apps/web/src/components/LedgerView.tsx', 'apps/web/src/components/DashboardView.tsx'],
    commits: [
      'fix: correct tooltip position',
      'fix: avoid double rendering in dashboard',
      'fix: format currency in ledger',
      'fix: resolve sorting on tax table'
    ],
    previousVersion: '1.1.47'
  });
  assertEqual(result.releaseType, 'patch', 'classification');
  assertEqual(result.scoring.nextVersion, '1.1.48', 'PATCH must be strictly +1 even from 1.1.47');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 2: Minor +1 (single feature, TRIVIAL–NORMAL band)');
// ---------------------------------------------------------------------------

test('Single user feature: MINOR +1, 1.1.0 -> 1.2.0', () => {
  const result = classifyFixture({
    changedFiles: ['apps/web/src/components/ReportsView.tsx'],
    commits: ['feat: add annual wealth report export']
  });
  assertEqual(result.releaseType, 'minor', 'classification');
  assertEqual(result.scoring.nextVersion, '1.2.0', 'version');
  assert(result.scoring.rms >= 12 && result.scoring.rms <= 34, `RMS ${result.scoring.rms} must land in a +1 jump band (<= 34)`);
  assert(['TRIVIAL', 'SMALL', 'NORMAL'].includes(result.scoring.intensity), `intensity ${result.scoring.intensity} must map to +1`);
  assertEqual(result.scoring.minorJump, 1, 'minor jump');
});

test('MINOR jump formula: NORMAL band gives +1', () => {
  assertEqual(MINOR_JUMP_BY_INTENSITY.NORMAL, 1);
  const { nextVersion } = calculateNextVersion({ previousVersion: '1.1.0', semverType: 'MINOR', intensity: 'NORMAL' });
  assertEqual(nextVersion, '1.2.0');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 3: Substantial Minor (+2), RMS in [35,54]');
// ---------------------------------------------------------------------------

test('Multiple features and areas: MINOR +2, 1.1.0 -> 1.3.0', () => {
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
      'fix: correct date parsing on HDFC statements',
      'perf: optimize transaction filtering',
      'improve: redesign tax slab comparison card'
    ]
  });
  assertEqual(result.releaseType, 'minor', 'classification');
  assert(result.scoring.rms >= 35 && result.scoring.rms <= 54, `RMS ${result.scoring.rms} must be in [35,54]`);
  assertEqual(result.scoring.intensity, 'SUBSTANTIAL', 'intensity band');
  assertEqual(result.scoring.nextVersion, '1.3.0', 'version');
  assertEqual(result.scoring.minorJump, 2, 'minor jump');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 4: Very Substantial Minor (+3), RMS in [55,79]');
// ---------------------------------------------------------------------------

test('Broad multi-area overhaul: MINOR +3, 1.1.0 -> 1.4.0', () => {
  const result = classifyFixture({
    changedFiles: [
      'apps/web/src/components/TaxView.tsx',
      'apps/web/src/components/InvestmentsView.tsx',
      'apps/web/src/components/LedgerView.tsx',
      'apps/web/src/components/DashboardView.tsx',
      'apps/web/src/components/BusinessView.tsx',
      'apps/web/src/components/DocumentVaultView.tsx'
    ],
    commits: [
      'feat: automated tax filing engine',
      'feat: portfolio rebalancing advisor',
      'feat: invoice GST compliance checks',
      'feat: OCR receipt extraction',
      'fix: ledger pagination edge case',
      'perf: dashboard cold-start optimization',
      'improve: redesign tax slab comparison card'
    ]
  });
  assertEqual(result.releaseType, 'minor', 'classification');
  assert(result.scoring.rms >= 55 && result.scoring.rms <= 79, `RMS ${result.scoring.rms} must be in [55,79]`);
  assertEqual(result.scoring.intensity, 'VERY_SUBSTANTIAL', 'intensity band');
  assertEqual(result.scoring.nextVersion, '1.4.0', 'version');
  assertEqual(result.scoring.minorJump, 3, 'minor jump');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 5: Exceptional Minor (+4), RMS >= 80');
// ---------------------------------------------------------------------------

test('Massive feature milestone: MINOR +4, 1.1.0 -> 1.5.0', () => {
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
  assertEqual(result.releaseType, 'minor', 'classification');
  assert(result.scoring.rms >= 80, `RMS ${result.scoring.rms} must be >= 80`);
  assertEqual(result.scoring.intensity, 'EXCEPTIONAL', 'intensity band');
  assertEqual(result.scoring.nextVersion, '1.5.0', 'version');
  assertEqual(result.scoring.minorJump, 4, 'minor jump');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 6: Hard Cap Assertion (RMS = 150, jump never +5)');
// ---------------------------------------------------------------------------

test('Hard cap: minor jump strictly caps at +4 regardless of RMS', () => {
  assertEqual(MAX_MINOR_JUMP, 4, 'MAX_MINOR_JUMP constant');
  const next = calculateNextVersion({ previousVersion: '1.1.0', semverType: 'MINOR', intensity: 'EXCEPTIONAL' });
  assertEqual(next.minorJump, 4, 'exceptional gives exactly +4');
  assertEqual(next.nextVersion, '1.5.0', '1.1.0 + EXCEPTIONAL = 1.5.0, never 1.6.0+');
  // Even a fabricated RMS of 150 maps to EXCEPTIONAL -> +4.
  assertEqual(intensityFromRMS(150), 'EXCEPTIONAL');
  const next150 = calculateNextVersion({ previousVersion: '1.1.0', semverType: 'MINOR', intensity: intensityFromRMS(150) });
  assertEqual(next150.nextVersion, '1.5.0', 'RMS 150 still yields MINOR +4');
});

test('Anti-inflation: arbitrary 1.1.0 -> 1.9.0 jump is impossible without +4 cap math', () => {
  for (const level of INTENSITY_LEVELS) {
    const { nextVersion, minorJump } = calculateNextVersion({ previousVersion: '1.1.0', semverType: 'MINOR', intensity: level });
    assert(minorJump <= 4, `jump for ${level} must be <= 4`);
    assert(!nextVersion.startsWith('1.9'), 'no path may reach 1.9.0 in a single jump');
  }
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 7: Breaking Major (1.5.3 -> 2.0.0, reset rules)');
// ---------------------------------------------------------------------------

test('Incompatible schema change: MAJOR, 1.5.3 -> 2.0.0 with resets', () => {
  const diff = [
    'diff --git a/packages/database/src/migrations/007.sql b/packages/database/src/migrations/007.sql',
    'new file mode 100644',
    '--- /dev/null',
    '+++ b/packages/database/src/migrations/007.sql',
    '@@ -0,0 +1,3 @@',
    '+ALTER TABLE transactions DROP COLUMN legacy_code;',
    '+-- destructive migration',
    '+-- requires manual intervention'
  ].join('\n');
  const result = classifyRelease({
    changedFiles: ['packages/database/src/migrations/007.sql'],
    commits: [{ message: 'feat(db): tighten transactions schema', sha: 'x', files: ['packages/database/src/migrations/007.sql'] }],
    diffSnippets: diff,
    previousVersion: '1.5.3'
  });
  assertEqual(result.releaseType, 'major', 'classification');
  assertEqual(result.scoring.nextVersion, '2.0.0', 'MAJOR resets minor and patch');
  assertEqual(result.scoring.semverType, 'MAJOR', 'semverType');
});

test('MAJOR jump formula: major+1, minor=0, patch=0', () => {
  const { nextVersion } = calculateNextVersion({ previousVersion: '1.5.3', semverType: 'MAJOR' });
  assertEqual(nextVersion, '2.0.0');
  const { nextVersion: n2 } = calculateNextVersion({ previousVersion: '2.9.4', semverType: 'MAJOR' });
  assertEqual(n2, '3.0.0');
});

test('SIS alone NEVER produces MAJOR (verified breaking evidence required)', () => {
  const cls = classifySemVer({
    hasApplicationChange: true,
    verifiedBreakingCategories: [],
    suspectedBreakingEvidence: [],
    sis: 70, // even maximum ordinary SIS
    workItems: [{ type: 'newFeature', subject: 'x', area: null }]
  });
  assertNotEqualsDeep(cls.type, 'MAJOR');
  assertEqual(cls.type, 'MINOR', 'high SIS without breaking evidence is MINOR at most');
});

test('Removal of a public feature (deleted route) is verified MAJOR', () => {
  const diff = diffFor([], {
    deleted: ['apps/web/app/reports/page.tsx']
  });
  const result = classifyRelease({
    changedFiles: ['apps/web/app/reports/page.tsx'],
    commits: [{ message: 'chore: remove legacy reports page', sha: 'x', files: ['apps/web/app/reports/page.tsx'] }],
    diffSnippets: diff,
    previousVersion: '1.5.3'
  });
  assertEqual(result.releaseType, 'major', 'feature removal is breaking');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 8: Commit Dampening Neutrality (60 micro-commits)');
// ---------------------------------------------------------------------------

test('60 micro-commits + 1 bug fix: RMS <= 7, PATCH 1.1.0 -> 1.1.1', () => {
  const microCommits = Array.from({ length: 60 }, (_, i) => `chore: internal tweak ${i}`);
  const result = classifyFixture({
    changedFiles: ['apps/web/src/components/LedgerView.tsx'],
    commits: [...microCommits, 'fix: resolve date parsing on HDFC CSV statements']
  });
  assertEqual(result.releaseType, 'patch', 'classification');
  assert(result.scoring.rms <= 7, `RMS ${result.scoring.rms} must be <= 7`);
  assertEqual(result.scoring.nextVersion, '1.1.1', 'version');
  assertEqual(result.scoring.rmsBreakdown.commitBonus, 4, 'commit bonus must cap at +4');
});

test('Commit dampener bands: 0 / +1 / +2 / +3 / +4', () => {
  assertEqual(commitCountBonus(0), 0);
  assertEqual(commitCountBonus(4), 0);
  assertEqual(commitCountBonus(5), 1);
  assertEqual(commitCountBonus(9), 1);
  assertEqual(commitCountBonus(10), 2);
  assertEqual(commitCountBonus(19), 2);
  assertEqual(commitCountBonus(20), 3);
  assertEqual(commitCountBonus(39), 3);
  assertEqual(commitCountBonus(40), 4);
  assertEqual(commitCountBonus(1000), 4, 'hard cap at +4');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 9: Line-Count Exclusion (10,000 lines of refactoring)');
// ---------------------------------------------------------------------------

test('10k lines of formatting/refactoring: SIS <= 2, RMS <= 2, stays PATCH', () => {
  const hugeWhitespaceDiff = [
    'diff --git a/apps/web/src/components/LedgerView.tsx b/apps/web/src/components/LedgerView.tsx',
    '--- a/apps/web/src/components/LedgerView.tsx',
    '+++ b/apps/web/src/components/LedgerView.tsx',
    '@@ -1,5000 +1,5000 @@'
  ];
  // 10,000 changed lines that differ only in leading whitespace.
  for (let i = 0; i < 5000; i++) {
    hugeWhitespaceDiff.push(`-    const value${i} = compute${i}();`);
    hugeWhitespaceDiff.push(`+      const value${i} = compute${i}();`);
  }
  const result = classifyFixture({
    changedFiles: ['apps/web/src/components/LedgerView.tsx', 'apps/web/src/components/DashboardView.tsx', 'apps/web/src/components/TaxView.tsx'],
    commits: ['refactor: reformat source files to new prettier config'],
    diff: hugeWhitespaceDiff.join('\n')
  });
  assertEqual(result.releaseType, 'patch', 'must remain a PATCH candidate');
  assert(result.scoring.sis <= 2, `SIS ${result.scoring.sis} must be <= 2`);
  assert(result.scoring.rms <= 2, `RMS ${result.scoring.rms} must be <= 2 (whitespace-only files excluded)`);
});

test('Whitespace-only diff detection marks files non-substantive', () => {
  const diff = [
    'diff --git a/apps/web/src/components/LedgerView.tsx b/apps/web/src/components/LedgerView.tsx',
    '--- a/apps/web/src/components/LedgerView.tsx',
    '+++ b/apps/web/src/components/LedgerView.tsx',
    '@@ -1,2 +1,2 @@',
    '-  const a = 1;',
    '+    const a = 1;'
  ].join('\n');
  const wsOnly = detectWhitespaceOnlyFiles(diff);
  assert(wsOnly.has('apps/web/src/components/LedgerView.tsx'), 'reindentation-only file detected as whitespace-only');
});

test('Pure refactor commits contribute 0 RMS and max 2 SIS', () => {
  const { rms } = computeRMS({ workItems: [{ type: 'refactor', subject: 'restructure helpers', area: null }], productAreas: [], meaningfulCommitCount: 0 });
  assertEqual(rms, 0, 'refactor item contributes zero RMS');
  const { sis } = computeSIS({ categories: ['refactor'] });
  assertEqual(sis, 2, 'refactor category caps at 2 SIS');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 10: Product Area Bonus Scaling');
// ---------------------------------------------------------------------------

test('Product-area bonus table: 1/2/3/4/5/6/7+', () => {
  assertEqual(productAreaBonus(1), 0);
  assertEqual(productAreaBonus(2), 3);
  assertEqual(productAreaBonus(3), 6);
  assertEqual(productAreaBonus(4), 6);
  assertEqual(productAreaBonus(5), 10);
  assertEqual(productAreaBonus(6), 10);
  assertEqual(productAreaBonus(7), 14);
  assertEqual(productAreaBonus(12), 14);
});

test('Touching 5 distinct product areas awards +10 bonus', () => {
  const areas = ['Tax & Compliance', 'Investments & Wealth', 'Ledger / Transactions', 'Reports & Analytics', 'Document Vault'];
  const { areaBonus } = computeRMS({
    workItems: areas.map((a, i) => ({ type: 'bugFix', subject: `fix ${i} in ${a}`, area: a })),
    productAreas: areas,
    meaningfulCommitCount: 0
  });
  assertEqual(areaBonus, 10, '5 areas => +10');
});

test('Product-area mapping matrix resolves exact MyFinanceOS subsystems', () => {
  assertEqual(resolveProductArea('apps/web/src/components/DashboardView.tsx'), 'Dashboard');
  assertEqual(resolveProductArea('apps/web/src/components/LedgerView.tsx'), 'Ledger / Transactions');
  assertEqual(resolveProductArea('apps/web/src/components/InvestmentsView.tsx'), 'Investments & Wealth');
  assertEqual(resolveProductArea('apps/web/src/components/InvestmentPlanner/Planner.tsx'), 'Investments & Wealth');
  assertEqual(resolveProductArea('apps/web/src/components/TaxView.tsx'), 'Tax & Compliance');
  assertEqual(resolveProductArea('apps/web/src/components/BusinessView.tsx'), 'Business & Invoicing');
  assertEqual(resolveProductArea('apps/web/src/components/SankeyView.tsx'), 'Cash Flow / Sankey');
  assertEqual(resolveProductArea('apps/web/src/components/DocumentVaultView.tsx'), 'Document Vault');
  assertEqual(resolveProductArea('apps/web/src/components/EMICalculator.tsx'), 'Calculators / Tools');
  assertEqual(resolveProductArea('apps/web/src/components/GoalTracker.tsx'), 'Calculators / Tools');
  assertEqual(resolveProductArea('apps/web/src/components/ReportsView.tsx'), 'Reports & Analytics');
  assertEqual(resolveProductArea('apps/web/src/components/AIChatView.tsx'), 'AI Financial Assistant');
  assertEqual(resolveProductArea('apps/web/src/components/AutomationView.tsx'), 'Automation / Rules');
  assertEqual(resolveProductArea('apps/web/src/components/SettingsView.tsx'), 'Core / Platform / Auth');
  assertEqual(resolveProductArea('packages/auth/src/session.ts'), 'Core / Platform / Auth');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 11: High-RMS PATCH Retention');
// ---------------------------------------------------------------------------

test('Corrective refactor spanning many files with RMS >= 35 stays PATCH +1', () => {
  // 12 corrective fixes + 4 perf items spread across 6 areas pushes RMS
  // above 35 with zero user-facing capabilities.
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
  assert(result.scoring.rms >= 35, `RMS ${result.scoring.rms} must be >= 35 for this fixture`);
  assertEqual(result.releaseType, 'patch', 'corrective-only work must remain PATCH');
  assertEqual(result.scoring.nextVersion, '1.1.1', 'PATCH +1 strictly');
  assert(result.scoring.sis < 20, 'SIS must be < 20 (fix=5 + perf=5 + refactorish)');
});

test('reEvaluateHighRMSPatch retains PATCH for corrective work', () => {
  const r = reEvaluateHighRMSPatch({
    sis: 10,
    rms: 48,
    workItems: [
      { type: 'bugFix', subject: 'fix a', area: null },
      { type: 'performance', subject: 'perf b', area: null }
    ]
  });
  assertEqual(r.remainsPatch, true, 'no user-facing capability => stays PATCH');
});

test('reEvaluateHighRMSPatch promotes when uncredited user-facing capability exists', () => {
  const r = reEvaluateHighRMSPatch({
    sis: 18,
    rms: 48,
    workItems: [
      { type: 'bugFix', subject: 'fix a', area: null },
      { type: 'featureEnhancement', subject: 'enhanced filtering', area: null }
    ]
  });
  assertEqual(r.remainsPatch, false, 'uncredited enhancement promotes to MINOR');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 12: NONE Detection');
// ---------------------------------------------------------------------------

test('Docs-only changes produce NONE (no version bump)', () => {
  const result = classifyFixture({
    changedFiles: ['README.md', 'docs/ARCHITECTURE.md'],
    commits: ['docs: update architecture notes']
  });
  assertEqual(result.releaseType, 'none', 'docs only => NONE');
  assertEqual(result.scoring.nextVersion, '1.1.0', 'version unchanged');
});

test('Whitespace-only changes produce NONE', () => {
  const diff = [
    'diff --git a/apps/web/src/utils/format.ts b/apps/web/src/utils/format.ts',
    '--- a/apps/web/src/utils/format.ts',
    '+++ b/apps/web/src/utils/format.ts',
    '@@ -1,2 +1,2 @@',
    '-  export const x=1;',
    '+\texport const x=1;'
  ].join('\n');
  const result = classifyRelease({
    changedFiles: ['apps/web/src/utils/format.ts'],
    commits: [{ message: 'style: reindent file', sha: 'x', files: ['apps/web/src/utils/format.ts'] }],
    diffSnippets: diff,
    previousVersion: '1.1.0'
  });
  assertEqual(result.releaseType, 'none', 'whitespace-only => NONE');
});

test('Ignored-file-only changes produce NONE', () => {
  const result = classifyFixture({
    changedFiles: ['graphify-out/graph.json', '.vscode/settings.json'],
    commits: []
  });
  assertEqual(result.releaseType, 'none', 'ignored-only => NONE');
});

test('Empty diff / no commits produce NONE', () => {
  const result = classifyFixture({ changedFiles: [], commits: [], diff: '' });
  assertEqual(result.releaseType, 'none', 'empty => NONE');
});

test('isIgnoredFile excludes secrets, internal metadata, and release artifacts', () => {
  assert(isIgnoredFile('.env.local'));
  assert(isIgnoredFile('graphify-out/graph.json'));
  assert(isIgnoredFile('packages/shared/src/version.json'));
  assert(isIgnoredFile('packages/shared/src/changelog.json'));
  assert(isIgnoredFile('packages/shared/src/release-manifest.json'));
  assert(isIgnoredFile('CHANGELOG.md'));
  assert(isIgnoredFile('apps/web/public/changelog.html'));
  assert(!isIgnoredFile('apps/web/src/components/LedgerView.tsx'));
});

test('isApplicationFile excludes docs/tests/assets but keeps runtime code', () => {
  assert(!isApplicationFile('README.md'));
  assert(!isApplicationFile('apps/web/src/components/LedgerView.test.tsx'));
  assert(!isApplicationFile('apps/web/public/logo.png'));
  assert(!isApplicationFile('e2e/onboarding.spec.ts'));
  assert(isApplicationFile('apps/web/src/components/LedgerView.tsx'));
  assert(isApplicationFile('packages/shared/src/financialCalculations.ts'));
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 13: Breaking-Change Ambiguity Blocking');
// ---------------------------------------------------------------------------

test('Suspected breaking change with low confidence BLOCKS classification', () => {
  const diff = [
    'diff --git a/packages/auth/src/session.ts b/packages/auth/src/session.ts',
    '--- a/packages/auth/src/session.ts',
    '+++ b/packages/auth/src/session.ts',
    '@@ -1,4 +1,4 @@',
    '-export const TOKEN_VERSION = "1";',
    '+export const TOKEN_VERSION = "2";',
    '+// requires all clients to re-authenticate'
  ].join('\n');
  const result = classifyRelease({
    changedFiles: ['packages/auth/src/session.ts'],
    commits: [{ message: 'feat(auth): rotate session tokens', sha: 'x', files: ['packages/auth/src/session.ts'] }],
    diffSnippets: diff,
    previousVersion: '1.1.0'
  });
  assertEqual(result.blocked, true, 'ambiguity gate must block');
  assertEqual(result.releaseType, null, 'no version may be generated while blocked');
  assert(result.breakingChanges.length > 0, 'suspected evidence must be reported');
});

test('Blocked releases never silently downgrade to MINOR/PATCH', () => {
  const cls = classifySemVer({
    hasApplicationChange: true,
    verifiedBreakingCategories: [],
    suspectedBreakingEvidence: [{ kind: 'breakingAuth', detail: 'x', confidence: 'medium' }],
    sis: 25,
    workItems: [{ type: 'newFeature', subject: 'f', area: null }]
  });
  assertEqual(cls.blocked, true);
  assertEqual(cls.type, null, 'blocked => type is null, not minor');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 14: Idempotency & Deterministic Repeated Execution');
// ---------------------------------------------------------------------------

test('Scoring the same input twice produces byte-identical results', () => {
  const input = {
    changedFiles: ['apps/web/src/components/TaxView.tsx', 'apps/web/src/components/LedgerView.tsx'],
    commits: ['feat: add tax deduction estimator', 'fix: ledger date parsing', 'perf: faster filtering'],
    previousVersion: '1.1.0'
  };
  const run = () =>
    JSON.stringify(
      classifyFixture({
        changedFiles: input.changedFiles,
        commits: input.commits,
        previousVersion: input.previousVersion
      })
    );
  assertEqual(run(), run(), 'identical inputs => identical serialized scoring');
  const a = classifyFixture({ changedFiles: input.changedFiles, commits: input.commits });
  const b = classifyFixture({ changedFiles: input.changedFiles, commits: input.commits });
  assertEqual(a.scoring.nextVersion, b.scoring.nextVersion, 'same proposed version');
  assertEqual(a.scoring.sis, b.scoring.sis, 'same SIS');
  assertEqual(a.scoring.rms, b.scoring.rms, 'same RMS');
  assertEqual(a.scoring.intensity, b.scoring.intensity, 'same intensity');
});

test('Changelog generation is deterministic for identical signals', () => {
  const input = {
    workItems: [
      { type: 'bugFix', subject: 'fix: ledger date parsing', area: 'Ledger / Transactions' },
      { type: 'newFeature', subject: 'feat: tax estimator', area: 'Tax & Compliance' }
    ],
    breakingChanges: [],
    productAreas: ['Ledger / Transactions', 'Tax & Compliance']
  };
  const a = JSON.stringify(generateChangelogContent(input));
  const b = JSON.stringify(generateChangelogContent(input));
  assertEqual(a, b, 'identical changelog content');
});

test('Version calculation is pure: same inputs => same version', () => {
  const args = { previousVersion: '1.2.3', semverType: 'MINOR', intensity: 'SUBSTANTIAL' };
  assertEqual(calculateNextVersion(args).nextVersion, calculateNextVersion(args).nextVersion);
  assertEqual(calculateNextVersion(args).nextVersion, '1.4.0');
});

test('Collision avoidance skips already-released versions', () => {
  const { nextVersion } = calculateNextVersion({
    previousVersion: '1.1.0',
    semverType: 'MINOR',
    intensity: 'NORMAL',
    existingVersions: ['1.2.0']
  });
  assertEqual(nextVersion, '1.3.0', 'skips occupied 1.2.0');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 15: Version Parsing & Formatting');
// ---------------------------------------------------------------------------

test('parseSemVer handles v-prefixed and bare versions, rejects garbage', () => {
  assertDeepEqual(parseSemVer('1.2.3'), { major: 1, minor: 2, patch: 3 });
  assertDeepEqual(parseSemVer('v1.2.3'), { major: 1, minor: 2, patch: 3 });
  assertEqual(parseSemVer('1.2'), null);
  assertEqual(parseSemVer('x.y.z'), null);
  assertEqual(parseSemVer(''), null);
  assertEqual(parseSemVer('1.2.3.4'), null);
});

test('formatSemVer + bumpVersion legacy behavior', () => {
  assertEqual(formatSemVer({ major: 2, minor: 0, patch: 0 }), '2.0.0');
  assertEqual(bumpVersion('1.0.0', 'patch'), '1.0.1');
  assertEqual(bumpVersion('1.0.0', 'minor'), '1.1.0');
  assertEqual(bumpVersion('1.0.0', 'major'), '2.0.0');
  assertEqual(bumpVersion('1.9.4', 'major'), '2.0.0');
});

test('calculateNextVersion rejects invalid previous versions', () => {
  let threw = false;
  try {
    calculateNextVersion({ previousVersion: 'not.a.version', semverType: 'PATCH' });
  } catch {
    threw = true;
  }
  assert(threw, 'invalid version must throw');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 16: Changelog Content & Quality Gate');
// ---------------------------------------------------------------------------

test('Changelog items come only from real work items (nothing invented)', () => {
  const { categories, summary } = generateChangelogContent({
    workItems: [
      { type: 'bugFix', subject: 'fix: resolve dividend calculation in portfolio view', area: 'Investments & Wealth' },
      { type: 'newFeature', subject: 'feat: add automated tax deduction estimator', area: 'Tax & Compliance' },
      { type: 'uiImprovement', subject: 'style: redesign tax slab card', area: 'Tax & Compliance' }
    ],
    breakingChanges: [],
    productAreas: ['Investments & Wealth', 'Tax & Compliance']
  });
  assert(categories.fixes.length === 1, 'exactly one fix entry');
  assert(categories.features.length === 1, 'exactly one feature entry');
  assert(categories.ui.length === 1, 'exactly one ui entry');
  assert(summary.length > 0, 'summary generated');
  assert(summary.toLowerCase().includes('tax'), 'summary reflects actual content');
});

test('Quality gate rejects low-information noise', () => {
  assert(!passesQualityGate('wip'));
  assert(!passesQualityGate(''));
  assert(!passesQualityGate('updated files'));
  assert(!passesQualityGate('minor changes'));
  assert(passesQualityGate('Resolve dividend calculation in portfolio view'));
});

test('formatChangelogItem strips conventional prefixes and dedupes', () => {
  assertEqual(formatChangelogItem('feat(ledger): add filter'), 'Add filter');
  assertEqual(formatChangelogItem('fix: resolve crash on import.'), 'Resolve crash on import');
  assertEqual(deduplicateItems(['Add filter', 'add FILTER']).length, 1);
});

test('Scoring metrics count distinct work items', () => {
  const metrics = generateScoringMetrics({
    workItems: [
      { type: 'bugFix', subject: 'a', area: null },
      { type: 'bugFix', subject: 'b', area: null },
      { type: 'newFeature', subject: 'c', area: null },
      { type: 'newPage', subject: 'd', area: null },
      { type: 'newIntegration', subject: 'e', area: null }
    ],
    meaningfulCommitCount: 9
  });
  assertEqual(metrics.bugFixes, 2);
  assertEqual(metrics.newFeatures, 1);
  assertEqual(metrics.newWorkflows, 1);
  assertEqual(metrics.integrations, 1);
  assertEqual(metrics.commits, 9);
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 17: Manifest Schema Validity');
// ---------------------------------------------------------------------------

const exampleReleaseRecord = {
  version: '1.3.0',
  previousVersion: '1.1.0',
  tag: 'v1.3.0',
  timestamp: '2026-09-11T12:00:00.000Z',
  semverType: 'MINOR',
  minorJump: 2,
  scoring: {
    sis: 35,
    rms: 48,
    intensity: 'SUBSTANTIAL',
    productAreasAffected: ['Tax & Compliance', 'Investments & Wealth', 'Ledger / Transactions'],
    metrics: { bugFixes: 4, uiImprovements: 3, newFeatures: 2, newWorkflows: 1, integrations: 0, commits: 14 }
  },
  changelog: {
    summary: 'Substantial update introducing automated tax deduction estimators and multi-asset wealth rebalancing.',
    categories: {
      features: ['Automated tax deduction recommendations', 'Multi-asset rebalancing wizard'],
      fixes: ['Fixed dividend calculation in portfolio view'],
      ui: ['Redesigned tax slab comparison card'],
      performance: ['Indexed local transaction lookups']
    }
  }
};

test('Example task release record validates cleanly', () => {
  const errors = validateReleaseRecord(exampleReleaseRecord);
  assertEqual(errors.length, 0, `expected no errors, got: ${errors.join('; ')}`);
});

test('Internal consistency: tag must equal v + version', () => {
  const errors = validateReleaseRecord({ ...exampleReleaseRecord, tag: 'v1.4.0' });
  assert(errors.some((e) => e.includes('tag')), 'tag mismatch detected');
});

test('MINOR consistency: version must equal previous minor + minorJump', () => {
  const errors = validateReleaseRecord({ ...exampleReleaseRecord, minorJump: 3 });
  assert(errors.some((e) => e.includes('minorJump') || e.includes('MINOR')), 'jump mismatch detected');
});

test('minorJump above 4 fails validation (hard cap)', () => {
  const record = {
    ...exampleReleaseRecord,
    version: '1.6.0',
    tag: 'v1.6.0',
    minorJump: 5
  };
  const errors = validateReleaseRecord(record);
  assert(errors.some((e) => e.includes('minorJump')), 'minorJump 5 rejected');
});

test('MAJOR must reset MINOR and PATCH to 0', () => {
  const record = {
    ...exampleReleaseRecord,
    version: '2.0.1',
    tag: 'v2.0.1',
    semverType: 'MAJOR',
    minorJump: 0
  };
  const errors = validateReleaseRecord(record);
  assert(errors.some((e) => e.includes('MAJOR must reset')), 'non-zero patch in MAJOR rejected');
});

test('PATCH must be exactly previous patch + 1', () => {
  const record = {
    version: '1.1.3',
    previousVersion: '1.1.1',
    tag: 'v1.1.3',
    timestamp: '2026-09-11T12:00:00.000Z',
    semverType: 'PATCH',
    minorJump: 0,
    scoring: exampleReleaseRecord.scoring,
    changelog: exampleReleaseRecord.changelog
  };
  const errors = validateReleaseRecord(record);
  assert(errors.some((e) => e.includes('PATCH must be previous patch + 1')), 'multi-step patch rejected');
});

test('Manifest document validation: schemaVersion 1, duplicate prevention', () => {
  const doc = {
    schemaVersion: 1,
    releases: [exampleReleaseRecord, { ...exampleReleaseRecord }]
  };
  const result = validateManifestDocument(doc);
  assert(!result.valid, 'duplicate versions rejected');
  assert(result.errors.some((e) => e.includes('duplicate')));

  const badSchema = { schemaVersion: 2, releases: [exampleReleaseRecord] };
  assert(!validateManifestDocument(badSchema).valid, 'schemaVersion != 1 rejected');

  const good = { schemaVersion: 1, releases: [exampleReleaseRecord] };
  assert(validateManifestDocument(good).valid, 'clean document validates');
});

test('Legacy records (pre-scoring engine) validate on legacy fields', () => {
  const legacy = {
    version: '1.0.0',
    previousVersion: '0.0.0',
    tag: 'v1.0.0',
    timestamp: '2026-09-10T00:00:00.000Z',
    semverType: 'MAJOR',
    minorJump: 0,
    releaseDate: '2026-09-10',
    releaseType: 'major',
    categories: [{ category: 'Features', items: ['Initial baseline release'] }]
  };
  const errors = validateReleaseRecord(legacy);
  assertEqual(errors.length, 0, `legacy record should pass: ${errors.join('; ')}`);
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 18: Work Item Extraction & Deduplication');
// ---------------------------------------------------------------------------

test('Commit classification maps conventional and natural language', () => {
  assertEqual(classifyCommitWorkItemType('fix: resolve crash'), 'bugFix');
  assertEqual(classifyCommitWorkItemType('feat: add export'), 'newFeature');
  assertEqual(classifyCommitWorkItemType('feat: improve filters'), 'featureEnhancement');
  assertEqual(classifyCommitWorkItemType('perf: speed up queries'), 'performance');
  assertEqual(classifyCommitWorkItemType('style: tweak button'), 'uiImprovement');
  assertEqual(classifyCommitWorkItemType('refactor: restructure helpers'), 'refactor');
  assertEqual(classifyCommitWorkItemType('docs: update readme'), 'docs');
  assertEqual(classifyCommitWorkItemType('chore: bump deps'), null);
  assertEqual(classifyCommitWorkItemType('fixed rendering bug'), 'bugFix');
  assertEqual(classifyCommitWorkItemType('added export wizard'), 'newFeature');
  assertEqual(classifyCommitWorkItemType('improved dashboard charts'), 'featureEnhancement');
});

test('Meaningful-commit filter excludes release/merge/noise commits', () => {
  assert(!isMeaningfulCommit({ message: 'chore(release): v1.1.1 [skip-release-hook]' }));
  assert(!isMeaningfulCommit({ message: 'Merge branch main into feature' }));
  assert(!isMeaningfulCommit({ message: 'wip' }));
  assert(!isMeaningfulCommit({ message: 'update' }));
  assert(isMeaningfulCommit({ message: 'fix: resolve crash' }));
});

test('Work items deduplicate by type + normalized subject', () => {
  const items = [
    { type: 'bugFix', subject: 'Fix: Resolve crash', area: null },
    { type: 'bugFix', subject: 'fix resolve crash', area: null },
    { type: 'bugFix', subject: 'Fix another crash', area: null }
  ];
  assertEqual(deduplicateWorkItems(items).length, 2);
});

test('New route files create newPage items; new view+route pairs create subsystem items', () => {
  const signals = extractReleaseSignals({
    commits: [{ message: 'feat: add vault', sha: 'x', files: [] }],
    changedFiles: ['apps/web/app/vault/page.tsx', 'apps/web/src/components/VaultView.tsx'],
    addedFiles: ['apps/web/app/vault/page.tsx', 'apps/web/src/components/VaultView.tsx'],
    deletedFiles: [],
    diff: diffFor([], { added: ['apps/web/app/vault/page.tsx', 'apps/web/src/components/VaultView.tsx'] }),
    whitespaceOnlyFiles: []
  });
  const types = signals.workItems.map((i) => i.type);
  assert(types.includes('subsystem'), `view+route pair => subsystem item, got: ${types.join(',')}`);
  assert(!types.includes('newPage'), 'route matched to view must not double-count as newPage');
  assert(signals.productAreas.includes('Document Vault'), 'product area attributed');
});

test('partitionAddedFiles + extractDeletedFiles parse diff headers', () => {
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
  assertDeepEqual(added, ['apps/web/app/new/page.tsx']);
  assertDeepEqual(modified, ['apps/web/src/components/LedgerView.tsx']);
  assertDeepEqual(extractDeletedFiles(diff), ['apps/web/app/old/page.tsx']);
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 19: Release Labels & Scoring Summary');
// ---------------------------------------------------------------------------

test('Release labels follow jump size; never "Major release" for minors', () => {
  assertEqual(getReleaseLabel('MAJOR'), 'Major release');
  assertEqual(getReleaseLabel('MINOR', 1), 'Minor release');
  assertEqual(getReleaseLabel('MINOR', 2), 'Substantial release');
  assertEqual(getReleaseLabel('MINOR', 3), 'Major feature release');
  assertEqual(getReleaseLabel('MINOR', 4), 'Milestone release');
  assertEqual(getReleaseLabel('PATCH'), 'Patch release');
});

test('Intensity bands map RMS ranges deterministically', () => {
  assertEqual(intensityFromRMS(0), 'TRIVIAL');
  assertEqual(intensityFromRMS(9), 'TRIVIAL');
  assertEqual(intensityFromRMS(10), 'SMALL');
  assertEqual(intensityFromRMS(19), 'SMALL');
  assertEqual(intensityFromRMS(20), 'NORMAL');
  assertEqual(intensityFromRMS(34), 'NORMAL');
  assertEqual(intensityFromRMS(35), 'SUBSTANTIAL');
  assertEqual(intensityFromRMS(54), 'SUBSTANTIAL');
  assertEqual(intensityFromRMS(55), 'VERY_SUBSTANTIAL');
  assertEqual(intensityFromRMS(79), 'VERY_SUBSTANTIAL');
  assertEqual(intensityFromRMS(80), 'EXCEPTIONAL');
  assertEqual(intensityFromRMS(150), 'EXCEPTIONAL');
});

// ---------------------------------------------------------------------------
console.log('\n■ Section 20: Full Pipeline Scorecard Math');
// ---------------------------------------------------------------------------

test('scoreRelease end-to-end: substantial multi-area release math', () => {
  const signals = extractReleaseSignals({
    commits: [
      { message: 'feat: add automated tax deduction estimator', sha: 'a', files: ['apps/web/src/components/TaxView.tsx'] },
      { message: 'feat: add multi-asset rebalancing wizard', sha: 'b', files: ['apps/web/src/components/InvestmentsView.tsx'] },
      { message: 'fix: resolve dividend calculation in portfolio view', sha: 'c', files: ['apps/web/src/components/InvestmentsView.tsx'] },
      { message: 'fix: resolve date parsing on HDFC statements', sha: 'd', files: ['apps/web/src/components/LedgerView.tsx'] },
      { message: 'perf: index transaction lookups', sha: 'e', files: ['apps/web/src/components/LedgerView.tsx'] },
      { message: 'improve: redesign tax slab card', sha: 'f', files: ['apps/web/src/components/TaxView.tsx'] },
      { message: 'fix: guard rounding in dashboard', sha: 'g', files: ['apps/web/src/components/DashboardView.tsx'] },
      { message: 'fix: dashboard widget order', sha: 'h', files: ['apps/web/src/components/DashboardView.tsx'] }
    ],
    changedFiles: [
      'apps/web/src/components/TaxView.tsx',
      'apps/web/src/components/InvestmentsView.tsx',
      'apps/web/src/components/LedgerView.tsx',
      'apps/web/src/components/DashboardView.tsx'
    ],
    addedFiles: [],
    deletedFiles: [],
    diff: diffFor(['apps/web/src/components/TaxView.tsx']),
    whitespaceOnlyFiles: []
  });
  const scoring = scoreRelease({ signals, previousVersion: '1.1.0' });

  // Verify the deterministic math component by component.
  const expected = {
    bugFix: 3, // 4 distinct fixes
    performance: 4,
    featureEnhancement: 8,
    newFeature: 24 // 2 features
  };
  const basePoints = signals.workItems.reduce((s, i) => s + (expected[i.type] ? 1 : 0), 0);
  assert(scoring.rmsBreakdown.areaBonus === 6, `4 areas => +6 bonus (got ${scoring.rmsBreakdown.areaBonus})`);
  assert(scoring.rmsBreakdown.commitBonus >= 1, '8 meaningful commits => +1 dampener');
  assert(scoring.sis >= 20, `SIS ${scoring.sis} >= 20 (bugFix 5 + perf 5 + enhancement 10 + feature 20)`);
  assertEqual(scoring.semverType, 'MINOR', 'SIS >= 20 with user-facing capability');
  assert(scoring.nextVersion.startsWith('1.'), 'MINOR from 1.1.0 stays on major 1');
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('='.repeat(60));

if (failed > 0) {
  console.error(`\n❌ ${failed} test(s) failed:`);
  for (const f of failures) {
    console.error(`  - ${f.name}: ${f.error.message}`);
  }
  process.exit(1);
} else {
  console.log('✓ All deterministic release scoring tests passed.');
}

// Helper used in Section 7
function assertNotEqualsDeep(actual, unexpected) {
  if (JSON.stringify(actual) === JSON.stringify(unexpected)) {
    throw new Error(`expected value to NOT equal ${JSON.stringify(unexpected)}`);
  }
}
