/**
 * Deterministic Changelog Generator with Quality Gate & Deduplication
 *
 * Converts extracted work items (signals.mjs) into human-facing changelog
 * content. Only real, evidence-backed changes are emitted — never invented
 * features, fixes, or improvements. Category keys follow the task contract
 * (features / fixes / ui / performance / improvements / accessibility /
 * security / reliability / breaking).
 */

// Quality Gate: reject low-information technical noise.
const REJECT_PATTERNS = [
  /^(updated?|changed?|modified?)\s+(files?|code|imports?|dependencies|components?|functions?)$/i,
  /^refactored?\s+(functions?|files?|implementation|code)$/i,
  /^fix(ed)?\s+typos?$/i,
  /^wip$/i,
  /^misc(ellaneous)?\s+updates?$/i,
  /^minor\s+changes?$/i,
  /^(tweak|tweaks)$/i
];

/**
 * Quality Gate check: entry must meet human-readable standards.
 */
export function passesQualityGate(item) {
  if (!item || typeof item !== 'string') return false;
  const trimmed = item.trim();
  if (trimmed.length < 5) return false;
  for (const pattern of REJECT_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }
  return true;
}

/**
 * Strip a conventional-commit prefix: "feat(ledger): add filter" -> "add filter".
 */
export function formatChangelogItem(rawText) {
  let cleaned = String(rawText || '')
    .replace(/^(feat|fix|perf|style|refactor|docs|chore|ci|a11y|security|build|test)(\([a-z0-9-_/]+\))?!?:?\s*/i, '')
    .replace(/^breaking\s+change\s*:?/i, '')
    .trim();
  if (!cleaned) return '';
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  cleaned = cleaned.replace(/\.$/, '');
  return cleaned;
}

/**
 * Deduplicate items by normalizing whitespace and casing.
 */
export function deduplicateItems(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const normalized = String(item).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(item);
    }
  }
  return result;
}

// Work item type -> changelog category key.
const WORK_ITEM_CATEGORY = {
  bugFix: 'fixes',
  uiImprovement: 'ui',
  performance: 'performance',
  reliability: 'reliability',
  a11y: 'accessibility',
  security: 'security',
  featureEnhancement: 'improvements',
  newFeature: 'features',
  newPage: 'features',
  newIntegration: 'features',
  subsystem: 'features',
  crossCutting: 'improvements',
  refactor: null, // internal refactoring is not user-facing changelog content
  docs: null
};

// Human-facing verb templates per work item type when the subject is a file path.
const FILE_ITEM_LABELS = {
  newPage: (f) => `New workflow: ${f}`,
  newFeature: (f) => `New capability: ${f}`,
  subsystem: (f) => `New product subsystem: ${f}`,
  newIntegration: (f) => `New integration: ${f}`,
  crossCutting: (f) => `Platform upgrade: ${f}`
};

/**
 * Convert one work item into a changelog line (deterministic).
 */
function itemToLine(item) {
  const formatted = formatChangelogItem(item.subject);
  if (passesQualityGate(formatted)) return formatted;
  const template = FILE_ITEM_LABELS[item.type];
  if (template) {
    const fallback = template(item.subject);
    if (passesQualityGate(fallback)) return fallback;
  }
  return null;
}

/**
 * Generate the categorized changelog content and release summary from the
 * extracted work items and breaking evidence.
 *
 * Returns { categories, summary } where categories is an object of
 * category-key -> item[] (task contract shape).
 */
export function generateChangelogContent({ workItems = [], breakingChanges = [], productAreas = [] } = {}) {
  const buckets = {
    breaking: new Set(),
    features: new Set(),
    improvements: new Set(),
    fixes: new Set(),
    performance: new Set(),
    reliability: new Set(),
    ui: new Set(),
    accessibility: new Set(),
    security: new Set()
  };

  for (const detail of breakingChanges) {
    const line = formatChangelogItem(String(detail).replace(/^Verified breaking evidence:\s*/i, ''));
    if (line && passesQualityGate(line)) buckets.breaking.add(line);
  }

  for (const item of workItems) {
    const category = WORK_ITEM_CATEGORY[item.type];
    if (!category) continue;
    const line = itemToLine(item);
    if (line) buckets[category].add(line);
  }

  const categories = {};
  for (const [key, set] of Object.entries(buckets)) {
    const items = deduplicateItems(Array.from(set).filter(passesQualityGate));
    if (items.length > 0) categories[key] = items;
  }

  // Deterministic summary: leading category content in priority order.
  const features = categories.features || [];
  const fixes = categories.fixes || [];
  const improvements = categories.improvements || [];
  const breaking = categories.breaking || [];

  let summary;
  if (breaking.length > 0) {
    summary = `Breaking release: ${breaking[0]}`;
  } else if (features.length > 0 && fixes.length > 0) {
    summary = `${features[0]}. Also includes fixes for ${lowerFirst(fixes[0])}.`;
  } else if (features.length > 0) {
    summary = features.slice(0, 2).join('; ') + '.';
  } else if (fixes.length > 0) {
    summary = fixes.slice(0, 2).join('; ') + '.';
  } else if (improvements.length > 0) {
    summary = improvements.slice(0, 2).join('; ') + '.';
  } else if (productAreas.length > 0) {
    summary = `Maintenance and reliability updates across ${productAreas.slice(0, 3).join(', ')}.`;
  } else {
    summary = 'Maintenance updates, stability corrections, and internal polish.';
  }
  if (summary.length > 180) summary = summary.substring(0, 177) + '...';

  return { categories, summary };
}

function lowerFirst(s) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/**
 * Generate the metrics block for the manifest scoring record.
 */
export function generateScoringMetrics({ workItems = [], meaningfulCommitCount = 0 } = {}) {
  const count = (type) => workItems.filter((i) => i.type === type).length;
  return {
    bugFixes: count('bugFix'),
    uiImprovements: count('uiImprovement'),
    newFeatures: count('newFeature') + count('subsystem'),
    newWorkflows: count('newPage'),
    integrations: count('newIntegration'),
    commits: meaningfulCommitCount
  };
}

/**
 * Legacy-compatible category array (category -> items) used by the in-app
 * changelog.json data model and static HTML generation.
 */
export function categoriesToLegacyArray(categories = {}) {
  const ORDER = [
    ['breaking', 'Breaking Changes'],
    ['features', 'Features'],
    ['improvements', 'Improvements'],
    ['fixes', 'Bug Fixes'],
    ['performance', 'Performance'],
    ['reliability', 'Reliability'],
    ['ui', 'UI/UX'],
    ['accessibility', 'Accessibility'],
    ['security', 'Security']
  ];
  const out = [];
  for (const [key, label] of ORDER) {
    if (Array.isArray(categories[key]) && categories[key].length > 0) {
      out.push({ category: label, items: categories[key] });
    }
  }
  return out;
}
