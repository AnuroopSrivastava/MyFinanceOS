/**
 * Multi-Signal Release Extraction Engine (Signals A–G)
 *
 * Deterministically converts repository boundary evidence (commit logs with
 * per-commit file lists, file paths, git diffs) into structured release
 * signals:
 *
 *  - Distinct, deduplicated work items (bug fixes, features, pages, ...)
 *  - MyFinanceOS product-area mapping (deterministic path matrix)
 *  - Breaking-change evidence with deterministic confidence levels
 *  - Meaningful-commit counting (noise filtered, capped contribution)
 *  - Whitespace-only / ignored-only / empty-diff NONE detection
 *
 * Pure module: no I/O, no randomness, no time-dependence. Identical inputs
 * always produce identical outputs (idempotency guarantee).
 *
 * Line counts are NEVER used as a signal. Commit counts are extracted for
 * the capped RMS dampener only and can never drive classification alone.
 */

// ---------------------------------------------------------------------------
// Product Area Classification Matrix (MyFinanceOS Core Subsystems)
// ---------------------------------------------------------------------------

export const PRODUCT_AREA_MATCHERS = [
  { area: 'Dashboard', matchers: [/DashboardView/, /\/app\/dashboard\//] },
  { area: 'Ledger / Transactions', matchers: [/LedgerView/, /\/app\/ledger\//, /statement-?parser/i, /\.(csv|ofx|qif)$/i, /transaction-?import/i] },
  { area: 'Investments & Wealth', matchers: [/InvestmentsView/, /InvestmentPlanner/, /\/app\/investments?\//, /portfolio/i] },
  { area: 'Tax & Compliance', matchers: [/TaxView/, /\/app\/tax\//, /regime/i, /deduction/i, /\/tax/i] },
  { area: 'Business & Invoicing', matchers: [/BusinessView/, /\/app\/business\//, /invoice/i, /gst/i, /vat/i] },
  { area: 'Cash Flow / Sankey', matchers: [/SankeyView/, /\/app\/sankey\//, /cash-?flow/i] },
  { area: 'Document Vault', matchers: [/DocumentVaultView/, /VaultView/, /\/app\/vault\//, /ocr/i, /receipt/i] },
  { area: 'Calculators / Tools', matchers: [/EMICalculator/, /GoalTracker/, /\/app\/(emi|goals?)\//] },
  { area: 'Reports & Analytics', matchers: [/ReportsView/, /\/app\/reports\//, /p&l/i, /profit-?and-?loss/i] },
  { area: 'AI Financial Assistant', matchers: [/AIChatView/, /\/app\/(ai|assistant|chat)\//, /gemini/i, /agent-?prompt/i] },
  { area: 'Automation / Rules', matchers: [/AutomationView/, /\/app\/automation\//, /auto-?categori/i, /categorization-?rule/i] },
  // Core / Platform / Auth is the platform catch-all: settings, auth hooks,
  // database migrations, shared design tokens, and workspace packages.
  { area: 'Core / Platform / Auth', matchers: [/SettingsView/, /\/app\/settings\//, /supabase/i, /migration/i, /packages\/auth\//, /packages\/database\//, /packages\/ui\//, /packages\/shared\//, /design-?token/i] }
];

/**
 * Resolve the single most-specific product area for a file path.
 * Matchers are ordered specific -> generic; the first hit wins so a file
 * never fans out into ambiguous multiple areas.
 */
export function resolveProductArea(filePath) {
  const norm = String(filePath || '').replace(/\\/g, '/');
  for (const { area, matchers } of PRODUCT_AREA_MATCHERS) {
    if (matchers.some((re) => re.test(norm))) return area;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Work item types: RMS base points and SIS category mapping
// ---------------------------------------------------------------------------

/**
 * RMS base points per distinct work item (Section 2.C.1).
 * 'docs' and 'refactor' carry zero magnitude: pure formatting/refactoring
 * can never inflate release magnitude (Line-Count Exclusion rule).
 */
export const WORK_ITEM_RMS_POINTS = {
  docs: 0,
  refactor: 0,
  bugFix: 3,
  uiImprovement: 3,
  performance: 4,
  reliability: 4,
  a11y: 4,
  security: 4,
  featureEnhancement: 8,
  newFeature: 12,
  newPage: 12,
  newIntegration: 12,
  subsystem: 12,
  crossCutting: 8
};

/**
 * SIS points per change category (Section 2.A). SIS sums the points of
 * every category PRESENT in the release (presence, not count).
 * Breaking categories (60-70) are only reachable through verified evidence.
 */
export const SIS_CATEGORY_POINTS = {
  docs: 0,
  refactor: 2,
  bugFix: 5,
  uiImprovement: 4,
  a11y: 4,
  performance: 5,
  reliability: 5,
  featureEnhancement: 10,
  newFeature: 20,
  newPage: 25,
  newIntegration: 25,
  subsystem: 35,
  breakingApi: 60,
  breakingSchema: 70,
  breakingAuth: 70,
  featureRemoval: 70
};

// Work item type -> SIS category (breaking categories are handled separately
// through verified evidence, never through ordinary work items).
export const WORK_ITEM_SIS_CATEGORY = {
  docs: 'docs',
  refactor: 'refactor',
  bugFix: 'bugFix',
  uiImprovement: 'uiImprovement',
  performance: 'performance',
  reliability: 'reliability',
  a11y: 'a11y',
  security: 'bugFix', // non-breaking security work is corrective by nature
  featureEnhancement: 'featureEnhancement',
  newFeature: 'newFeature',
  newPage: 'newPage',
  newIntegration: 'newIntegration',
  subsystem: 'subsystem',
  crossCutting: 'featureEnhancement' // cross-cutting improvements are enhancements
};

// ---------------------------------------------------------------------------
// Commit message classification patterns (Signal C)
// ---------------------------------------------------------------------------

const RELEASE_COMMIT_RE = /^chore\(release\):/i;
const MERGE_COMMIT_RE = /^(merge|merging|revert|rebasing)\b/i;

const CONVENTIONAL_RE = /^(feat|fix|perf|refactor|style|docs|chore|ci|test|build|a11y|security|improve)(\([a-z0-9/_-]+\))?!?:\s*(.*)$/i;
const NATURAL_FEAT_RE = /^(add|added|create|created|implement|implemented|introduce|introduced|launch|launched|new)\s+/i;
const NATURAL_FIX_RE = /^(fix|fixed|fixes|resolve|resolved|correct|corrected|prevent|prevented|patch|patched|repair)\s+/i;
const NATURAL_PERF_RE = /^(optimi[sz]e[sd]?|speed\s?up|accelerate[sd]?|faster)\s+/i;
const NATURAL_IMPROVE_RE = /^(improve|improved|enhance|enhanced|polish|polished|refine|refined|redesign|redesigned|upgrade|upgraded|rework|reworked)\s+/i;
const NATURAL_REFACTOR_RE = /^(refactor|refactored|restructure|restructured|reformat|reformatted|cleanup|clean up|cleaned up|prettier|lint)\b/i;
const NATURAL_DOCS_RE = /^(document|documented|docs?|readme|comment|comments)\b/i;
const NATURAL_A11Y_RE = /(accessib|a11y|aria-|keyboard navigation|screen reader|focus management|wcag)/i;
const NATURAL_SECURITY_RE = /(security|encrypt|decrypt|hardening|vulnerab|passcode|sanitize|xss|csrf)/i;
const NATURAL_RELIABILITY_RE = /(error handling|retry|retries|fallback|boundary guard|defensive guard|crash guard|resilien)/i;
const NATURAL_INTEGRATION_RE = /(integration|bank parser|statement parser|storage provider|webhook|external api|api client|upi|razorpay)/i;
const ENHANCEMENT_VERB_RE = /(improve|improved|enhance|enhanced|polish|polished|refine|refined|redesign|redesigned|upgrade|upgraded)/i;

// Bare-word noise messages that carry no releasable intent.
const NOISE_MESSAGE_RE = /^(wip+|update|updates|updated|misc|stuff|minor changes?|changes?|change|tmp|temp|tweaks?|asdf|todo|fix typo|typo|commit|\d+)(\.|!)?$/i;

/**
 * Strip a conventional-commit prefix from a subject, keeping the payload.
 */
export function stripConventionalPrefix(message) {
  const m = String(message || '').match(CONVENTIONAL_RE);
  if (m) return { type: m[1].toLowerCase(), breaking: String(message).includes('!'), subject: m[3] || '' };
  return { type: null, breaking: false, subject: String(message || '') };
}

function normalizeSubject(subject) {
  return String(subject || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Count only meaningful commits (release/merge/noise commits excluded).
 * The count feeds the capped RMS dampener; it never classifies by itself.
 */
export function isMeaningfulCommit(commit) {
  const msg = String(commit?.message || '').trim();
  if (!msg || msg.length < 3) return false;
  if (RELEASE_COMMIT_RE.test(msg) || msg.includes('[skip-release-hook]')) return false;
  if (MERGE_COMMIT_RE.test(msg)) return false;
  if (NOISE_MESSAGE_RE.test(msg)) return false;
  return true;
}

/**
 * Classify one commit message into a work item type (or null for context-only
 * commits like chore/ci/test/docs). Deterministic, message-driven only.
 */
export function classifyCommitWorkItemType(message) {
  const msg = String(message || '').trim();
  if (!isMeaningfulCommit({ message: msg })) return null;

  const { type, subject, breaking } = stripConventionalPrefix(msg);

  // Explicit breaking markers are handled by breaking-evidence extraction,
  // never as ordinary work items.
  if (breaking || /breaking change/i.test(msg)) return null;

  const isA11y = type === 'a11y' || NATURAL_A11Y_RE.test(subject) || (!type && NATURAL_A11Y_RE.test(msg));
  const isSecurity = type === 'security' || NATURAL_SECURITY_RE.test(subject) || (!type && NATURAL_SECURITY_RE.test(msg));
  const isReliability = NATURAL_RELIABILITY_RE.test(subject) || (!type && NATURAL_RELIABILITY_RE.test(msg));
  const isIntegration = NATURAL_INTEGRATION_RE.test(subject);

  if (type === 'fix' || (!type && NATURAL_FIX_RE.test(msg))) return 'bugFix';
  if (isA11y) return 'a11y';
  if (isSecurity) return 'security';
  if (type === 'perf' || (!type && NATURAL_PERF_RE.test(msg))) return 'performance';
  if (isReliability) return 'reliability';
  if (type === 'style') return 'uiImprovement';
  if (type === 'refactor' || (!type && NATURAL_REFACTOR_RE.test(msg))) return 'refactor';
  if (type === 'docs' || (!type && NATURAL_DOCS_RE.test(msg))) return 'docs';
  if (type === 'feat' || (!type && NATURAL_FEAT_RE.test(msg))) {
    // Feature commits with pure enhancement verbs improve existing
    // capabilities rather than adding new ones.
    if (ENHANCEMENT_VERB_RE.test(subject)) return 'featureEnhancement';
    if (isIntegration) return 'newIntegration';
    return 'newFeature';
  }
  if (type === 'improve' || (!type && NATURAL_IMPROVE_RE.test(msg))) return 'featureEnhancement';
  if (!type && isIntegration) return 'newIntegration';
  if (type === 'chore' || type === 'ci' || type === 'test' || type === 'build') return null;

  // Unprefixed messages with no recognizable intent are context only.
  return null;
}

// ---------------------------------------------------------------------------
// File classification (Signals B, D, F, G)
// ---------------------------------------------------------------------------

const DOCS_EXTENSIONS = ['.md', '.mdx', '.txt', '.rst'];
const ASSET_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.ico', '.gif', '.webp', '.gz', '.zip', '.log'];
const RELEASE_DATA_FILES = [
  /(^|\/)CHANGELOG\.md$/i,
  /(^|\/)version\.json$/i,
  /(^|\/)changelog\.json$/i,
  /(^|\/)release-manifest\.json$/i,
  /(^|\/)changelog\.html$/i
];
const NON_APPLICATION_PREFIXES = [
  'graphify-out/',
  '.github/',
  '.agents/',
  '.vscode/',
  '.claude/',
  '.codex/',
  '.kiro/',
  '.zcode/',
  '.emergent/',
  '.impeccable/',
  '.preview/',
  'docs/',
  'memory/',
  'e2e/',
  'coverage/',
  'scratch/'
];
const NON_APPLICATION_FILES = ['.gitignore', '.gitattributes', '.gitconfig', 'LICENSE', 'skills-lock.json', 'metadata.json'];

/**
 * Does this changed file represent meaningful application code?
 * Docs, tests, assets, CI, tooling metadata, and release data artifacts
 * are excluded: releases are driven by runtime/product surface only.
 */
export function isApplicationFile(filePath) {
  const norm = String(filePath || '').replace(/\\/g, '/');
  if (!norm) return false;
  if (RELEASE_DATA_FILES.some((re) => re.test(norm))) return false;
  if (NON_APPLICATION_FILES.includes(norm.split('/').pop())) return false;
  if (NON_APPLICATION_PREFIXES.some((p) => norm.startsWith(p) || norm.includes(`/${p}`))) return false;
  if (DOCS_EXTENSIONS.some((ext) => norm.endsWith(ext))) return false;
  if (ASSET_EXTENSIONS.some((ext) => norm.endsWith(ext))) return false;
  if (/\.test\.[a-z]+$/.test(norm) || /\.spec\.[a-z]+$/.test(norm)) return false;
  return true;
}

/**
 * Split changed files into added vs modified using git diff semantics
 * ("new file mode" headers). Purely path-based input; diff optional.
 */
export function partitionAddedFiles(changedFiles = [], diffSnippets = '') {
  const newFileSet = new Set();
  const lines = String(diffSnippets || '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('diff --git ')) continue;
    const m = lines[i].match(/^diff --git a\/(.+) b\/(.+)$/);
    let j = i + 1;
    let isNew = false;
    while (j < lines.length && !lines[j].startsWith('diff --git ')) {
      if (lines[j].startsWith('new file mode')) isNew = true;
      if (lines[j].startsWith('@@')) break;
      j++;
    }
    if (isNew && m) newFileSet.add(m[2].replace(/\\/g, '/'));
  }
  const added = [];
  const modified = [];
  for (const f of changedFiles) {
    const norm = String(f).replace(/\\/g, '/');
    if (newFileSet.has(norm)) added.push(norm);
    else modified.push(norm);
  }
  return { added, modified };
}

function isRoutePage(norm) {
  return /(^|\/)app\/.*\/page\.tsx$/.test(norm) || /(^|\/)app\/page\.tsx$/.test(norm);
}

function isPrimaryView(norm) {
  return /\/components\/[^/]+View\.tsx$/.test(norm) || /\/components\/InvestmentPlanner\//.test(norm);
}

function routeHintFromView(viewFile) {
  return viewFile
    .split('/')
    .pop()
    .replace(/\.tsx$/, '')
    .replace(/View$/, '')
    .toLowerCase();
}

// Generic module names that need a parent directory to stay unambiguous.
const GENERIC_FILE_NAMES = new Set(['index', 'main', 'types', 'constants', 'utils', 'helpers', 'styles', 'lib']);

/**
 * Human-friendly display name for a file path: the basename without
 * extension, disambiguated with its parent directory for generic names.
 * Raw paths never appear in user-facing changelog text.
 */
function fileDisplayName(filePath) {
  const norm = String(filePath).replace(/\\/g, '/');
  const parts = norm.split('/');
  const base = (parts[parts.length - 1] || '').replace(/\.[a-z]+$/i, '');
  if (!base) return norm;
  if (GENERIC_FILE_NAMES.has(base.toLowerCase()) && parts.length > 1) {
    return `${parts[parts.length - 2]}/${base}`;
  }
  return base;
}

/** Display name for a Next.js route page: its path segment before page.tsx. */
function routeDisplayName(filePath) {
  const norm = String(filePath).replace(/\\/g, '/');
  const m = norm.match(/\/app\/(.+)\/page\.[a-z]+$/i);
  return m ? m[1] : fileDisplayName(norm);
}

// ---------------------------------------------------------------------------
// Breaking-change evidence (Signal E) with deterministic confidence
// ---------------------------------------------------------------------------

/**
 * Verified (high-confidence) breaking-change detectors. Any single hit is
 * sufficient evidence for a MAJOR classification.
 */
const VERIFIED_BREAKING_DETECTORS = [
  {
    kind: 'breakingSchema',
    test: ({ diff }) =>
      /drop\s+table/i.test(diff) ||
      /alter\s+table[^;]*drop\s+column/i.test(diff) ||
      /drop\s+column/i.test(diff) ||
      /drop\s+index/i.test(diff)
  },
  {
    kind: 'breakingApi',
    test: ({ diff, changedFiles }) => {
      const removesPublicExport = /^-\s*export\s+(const|function|interface|type|class)\s+/m.test(diff);
      const touchesPublicEntry = (changedFiles || []).some((f) =>
        /packages\/[a-z]+\/src\/index\.[a-z]+$/.test(String(f).replace(/\\/g, '/'))
      );
      return removesPublicExport && touchesPublicEntry;
    }
  },
  {
    // A verified auth break removes a session/claim/token export outright;
    // a removed-and-re-added symbol is only a modification (suspected tier).
    kind: 'breakingAuth',
    test: ({ diff }) => {
      const text = String(diff || '');
      const removed = [...text.matchAll(/^-\s*export\s+(?:const|function|type|interface|class)\s+([A-Za-z0-9_$]*?(?:session|claim|token|auth)[A-Za-z0-9_$]*)/gim)];
      return removed.some((m) => {
        const symbol = m[1].replace(/[$]/g, '\\$');
        return !new RegExp(`^\\+\\s*export\\s+(?:const|function|type|interface|class)\\s+${symbol}\\b`, 'im').test(text);
      });
    }
  },
  {
    kind: 'featureRemoval',
    test: ({ deletedFiles }) =>
      (deletedFiles || []).some((f) => {
        const norm = String(f).replace(/\\/g, '/');
        return isRoutePage(norm) || isPrimaryView(norm);
      })
  }
];

const EXPLICIT_BREAKING_HINT_RE = /(^|\s)(release\s*:\s*major|\[major\]|breaking\s+change\b|breaks?\s+compatibility)/i;

/**
 * Suspected (insufficient-confidence) breaking-change detectors. These
 * trigger the safety gate: the release is BLOCKED pending human confirmation
 * instead of being silently downgraded.
 */
const SUSPECTED_BREAKING_DETECTORS = [
  {
    kind: 'breakingAuth',
    detail: 'Authentication/session contract files changed without an explicit breaking marker',
    test: ({ changedFiles, diff }) =>
      (changedFiles || []).some((f) => /packages\/auth\/src\/(?!.*\.test\.)/.test(String(f).replace(/\\/g, '/'))) &&
      /^[-+].*(sessionSchema|session.*token|invalidateAll|TOKEN_VERSION)/im.test(diff)
  },
  {
    kind: 'breakingSchema',
    detail: 'Database migration introduces restrictive schema constraints',
    test: ({ addedFiles, diff }) =>
      (addedFiles || []).some((f) => /migration/i.test(String(f))) &&
      /^\+.*\b(NOT\s+NULL|RESTRICT|WITHOUT\s+DEFAULT)\b/im.test(diff)
  },
  {
    kind: 'breakingApi',
    detail: 'Public package module removed without explicit breaking marker',
    test: ({ deletedFiles }) =>
      (deletedFiles || []).some((f) => /packages\/[a-z]+\/src\/(?!index)[^/]+\.[a-z]+$/.test(String(f).replace(/\\/g, '/')))
  }
];

/**
 * Extract breaking-change evidence from commit messages, diffs and file lists.
 * Returns { verified: Evidence[], suspected: Evidence[] }.
 * Verified evidence alone authorizes MAJOR; suspected evidence alone blocks.
 */
export function extractBreakingEvidence({ commits = [], diff = '', addedFiles = [], deletedFiles = [], changedFiles = [] } = {}) {
  const messages = commits.map((c) => (typeof c === 'string' ? c : c.message || ''));
  const verified = [];
  const suspected = [];

  // 1. Explicit developer breaking markers (conventional "!" / BREAKING CHANGE footer)
  const conventionalBreaking = messages.some((m) => {
    const { breaking } = stripConventionalPrefix(m);
    return breaking || /breaking\s+change\s*:/i.test(m);
  });
  if (conventionalBreaking) {
    verified.push({ kind: 'breakingApi', confidence: 'high', detail: 'Conventional breaking-change commit prefix (type!: or BREAKING CHANGE footer)' });
  }
  for (const msg of messages) {
    if (EXPLICIT_BREAKING_HINT_RE.test(msg)) {
      verified.push({ kind: 'breakingApi', confidence: 'high', detail: `Explicit breaking-change marker in commit: "${msg}"` });
      break;
    }
  }

  // 2. Diff/file-based verified detectors
  for (const detector of VERIFIED_BREAKING_DETECTORS) {
    if (detector.test({ diff, addedFiles, deletedFiles, changedFiles })) {
      verified.push({ kind: detector.kind, confidence: 'high', detail: `Verified breaking evidence: ${detector.kind}` });
    }
  }

  // 3. Suspected detectors only fire when nothing is verified
  if (verified.length === 0) {
    for (const detector of SUSPECTED_BREAKING_DETECTORS) {
      if (detector.test({ changedFiles, diff, addedFiles, deletedFiles })) {
        suspected.push({ kind: detector.kind, confidence: 'medium', detail: detector.detail });
      }
    }
  }

  return { verified, suspected };
}

// ---------------------------------------------------------------------------
// Work item construction & deduplication
// ---------------------------------------------------------------------------

function createItem(type, subject, area, evidence) {
  return {
    type,
    subject: String(subject || '').trim(),
    area: area || null,
    evidence: evidence || []
  };
}

/**
 * Deduplicate work items deterministically by (type + normalized subject).
 */
export function deduplicateWorkItems(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    if (!item || !Object.prototype.hasOwnProperty.call(WORK_ITEM_RMS_POINTS, item.type)) continue;
    const key = `${item.type}:${normalizeSubject(item.subject)}`;
    if (!key.endsWith(':') && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/**
 * Extract structured release signals from boundary evidence.
 *
 * @param {object} input
 * @param {Array<{sha?:string,author?:string,message:string,files?:string[]}>} input.commits
 * @param {string[]} input.changedFiles   all changed files (range + working tree)
 * @param {string[]} input.addedFiles     newly added files (diff "new file mode" + untracked)
 * @param {string[]} input.deletedFiles    deleted files (diff "deleted file mode")
 * @param {string}   input.diff           full diff snippet text
 * @param {string[]} input.whitespaceOnlyFiles  files whose changes are whitespace-only
 */
export function extractReleaseSignals({
  commits = [],
  changedFiles = [],
  addedFiles = [],
  deletedFiles = [],
  diff = '',
  whitespaceOnlyFiles = []
} = {}) {
  const files = (changedFiles || []).map((f) => String(f).replace(/\\/g, '/')).filter(Boolean);
  const added = (addedFiles || []).map((f) => String(f).replace(/\\/g, '/')).filter(Boolean);
  const deleted = (deletedFiles || []).map((f) => String(f).replace(/\\/g, '/')).filter(Boolean);
  const whitespaceOnly = new Set((whitespaceOnlyFiles || []).map((f) => String(f).replace(/\\/g, '/')));

  // Substantive application files: real runtime surface, non-whitespace-only.
  const applicationFiles = files.filter((f) => isApplicationFile(f) && !whitespaceOnly.has(f));

  const commitRecords = (commits || [])
    .map((c) => (typeof c === 'string' ? { message: c, files: [] } : { ...c, files: c.files || [] }))
    .filter((c) => isMeaningfulCommit(c));
  const meaningfulCommitCount = commitRecords.length;

  const items = [];
  const itemizedFiles = new Set(); // added files already represented as work items

  // --- 1. Commit-driven work items -----------------------------------------
  for (const commit of commitRecords) {
    const type = classifyCommitWorkItemType(commit.message);
    if (!type) continue;
    const { subject } = stripConventionalPrefix(commit.message);
    const commitFiles = (commit.files || []).map((f) => String(f).replace(/\\/g, '/'));
    const area = commitFiles.length > 0 ? resolveProductArea(commitFiles[0]) : null;
    items.push(createItem(type, subject || commit.message, area, [`commit: ${commit.message}`]));
  }

  // --- 2. Added-file-driven work items (independent of commit messages) ----
  const addedAppFiles = added.filter((f) => isApplicationFile(f));
  const newPrimaryViews = addedAppFiles.filter(isPrimaryView);
  const newRoutes = addedAppFiles.filter(isRoutePage);

  // A new core View paired with its own new route is a whole new product
  // subsystem; without a route it is a new user-facing capability.
  for (const view of newPrimaryViews) {
    const hint = routeHintFromView(view);
    const hasRoute = newRoutes.some((r) => r.toLowerCase().includes(hint));
    const area = resolveProductArea(view);
    const display = fileDisplayName(view).replace(/View$/, '');
    items.push(
      createItem(
        hasRoute ? 'subsystem' : 'newFeature',
        hasRoute ? `New product subsystem: ${display}` : `New user-facing component: ${display}`,
        area,
        [`added view${hasRoute ? ' + route' : ''}: ${view}`]
      )
    );
    itemizedFiles.add(view);
  }
  // Standalone new routes (no matching new view) are complete new workflows.
  for (const route of newRoutes) {
    const matchedView = newPrimaryViews.some((v) => route.toLowerCase().includes(routeHintFromView(v)));
    if (matchedView) continue;
    items.push(createItem('newPage', `New route workflow: ${routeDisplayName(route)}`, resolveProductArea(route), [`added route: ${route}`]));
    itemizedFiles.add(route);
  }
  // New integrations / providers (parsers, gateways, API clients).
  for (const file of addedAppFiles) {
    if (itemizedFiles.has(file)) continue;
    if (/parser|provider|webhook|integration|-api|gateway|bank/i.test(file)) {
      items.push(createItem('newIntegration', `New integration/provider: ${fileDisplayName(file)}`, resolveProductArea(file), [`added integration file: ${file}`]));
      itemizedFiles.add(file);
    }
  }

  // --- 3. Cross-cutting system improvements (new shared platform modules) --
  for (const file of addedAppFiles) {
    if (itemizedFiles.has(file)) continue;
    if (/^packages\/[a-z]+\/src\//.test(file) && !/\.test\./.test(file)) {
      items.push(createItem('crossCutting', `New shared platform module: ${fileDisplayName(file)}`, 'Core / Platform / Auth', [`added package module: ${file}`]));
      itemizedFiles.add(file);
    }
  }

  // --- 4. Diff-content additive signals (a11y / perf / reliability) --------
  const addedLines = String(diff || '')
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1));
  if (addedLines.some((l) => /aria-[a-z]+=|role=|tabIndex|focus-visible|sr-only/.test(l))) {
    items.push(createItem('a11y', 'Accessibility attributes and focus management improved', null, ['diff: aria/role/focus additions']));
  }
  if (addedLines.some((l) => /useMemo\(|useCallback\(|React\.memo\(|\.memo\(/.test(l))) {
    items.push(createItem('performance', 'Memoization and render-path optimization', null, ['diff: memoization additions']));
  }
  if (addedLines.some((l) => /^\s*(try\s*\{|catch\s*\()/.test(l))) {
    items.push(createItem('reliability', 'Error handling and boundary guards hardened', null, ['diff: try/catch additions']));
  }

  const workItems = deduplicateWorkItems(items);

  // --- 5. Product areas (from scored work items only) ----------------------
  // Docs/refactor items never register product areas: pure formatting across
  // many subsystems must not inflate magnitude (Line-Count Exclusion rule).
  const areaSet = new Set();
  for (const item of workItems) {
    if (item.type === 'docs' || item.type === 'refactor') continue;
    if (item.area) areaSet.add(item.area);
  }
  const productAreas = Array.from(areaSet);

  // --- 6. Category presence (drives SIS) -----------------------------------
  const categories = new Set();
  for (const item of workItems) {
    const sisCat = WORK_ITEM_SIS_CATEGORY[item.type];
    if (sisCat) categories.add(sisCat);
  }

  // --- 7. Breaking evidence -------------------------------------------------
  const breakingEvidence = extractBreakingEvidence({ commits, diff, addedFiles: added, deletedFiles: deleted, changedFiles: files });

  // --- 8. NONE determination ------------------------------------------------
  // No meaningful application change: empty diff, ignored/docs-only changes,
  // or whitespace-only edits.
  const addedApplicationCount = added.filter(isApplicationFile).length;
  const hasApplicationChange = applicationFiles.length + addedApplicationCount > 0;

  return {
    applicationFiles,
    meaningfulCommitCount,
    workItems,
    productAreas,
    categories: Array.from(categories),
    breakingEvidence,
    hasApplicationChange
  };
}
