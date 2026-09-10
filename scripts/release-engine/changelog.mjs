/**
 * Two-Stage Changelog Generator with Quality Gate & Semantic Deduplication
 */

// Subsystem user-friendly dictionary for mapping file paths to product terms
const SUBSYSTEM_MAP = [
  { match: 'DashboardView', name: 'Mission Control dashboard' },
  { match: 'LedgerView', name: 'Banking & Ledger transactions' },
  { match: 'InvestmentsView', name: 'Portfolio & investment analytics' },
  { match: 'TaxView', name: 'Tax & GST calculation engine' },
  { match: 'BusinessView', name: 'Business invoice and register workflows' },
  { match: 'SankeyView', name: 'Cash flow visualizer' },
  { match: 'AIChatView', name: 'AI financial advisor' },
  { match: 'Landing', name: 'Landing page and navigation' },
  { match: 'skiper30', name: 'Parallax animation gallery' },
  { match: 'packages/database', name: 'Encrypted SQLite local vault' },
  { match: 'packages/auth', name: 'Authentication & session security' },
  { match: 'packages/ui', name: 'UI design components' },
  { match: 'GoalTracker', name: 'Savings & financial goals tracker' },
  { match: 'EMICalculator', name: 'Loan EMI calculator' },
  { match: 'DocumentVaultView', name: 'Encrypted document vault' },
  { match: 'AutomationView', name: 'Automated rules engine' }
];

// Low-level technical phrases rejected by Quality Gate
const REJECT_PATTERNS = [
  /^updated?\s+(files?|code|imports?|dependencies)$/i,
  /^changed?\s+(code|implementation|files?)$/i,
  /^modified?\s+(components?|functions?|files?)$/i,
  /^refactored?\s+(functions?|files?|implementation)$/i,
  /^fix(ed)?\s+typos?$/i,
  /^wip$/i,
  /^misc\s+updates?$/i,
  /^minor\s+changes?$/i
];

/**
 * Quality Gate check: returns true if entry meets human-readable standards.
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
 * Clean and format human-facing changelog string.
 */
export function formatChangelogItem(rawText) {
  // Strip conventional commit prefix e.g. "feat(ledger): add filter" -> "add filter"
  let cleaned = rawText
    .replace(/^(feat|fix|perf|style|refactor|docs|chore|ci|a11y)(\([a-z0-9-_]+\))?!?:?\s*/i, '')
    .trim();

  if (!cleaned) return '';

  // Capitalize first letter
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  // Remove trailing period if present, then we consistently let callers format
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
    const normalized = item.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(item);
    }
  }

  return result;
}

/**
 * Generate structured categorized changelog entries and release summary.
 */
export function generateChangelogItems(
  changedFiles = [],
  commits = [],
  releaseType = 'patch',
  breakingChanges = []
) {
  const categories = {
    'Breaking Changes': new Set(),
    Features: new Set(),
    Improvements: new Set(),
    'Bug Fixes': new Set(),
    Performance: new Set(),
    Security: new Set(),
    'UI/UX': new Set(),
    Accessibility: new Set(),
    'Developer Experience': new Set(),
    Refactoring: new Set(),
    Other: new Set()
  };

  // 1. Add any explicit breaking changes detected
  for (const bc of breakingChanges) {
    if (passesQualityGate(bc)) {
      categories['Breaking Changes'].add(bc);
    }
  }

  // 2. Process commit messages (Stage 1 -> Stage 2)
  const commitMessages = commits.map((c) => (typeof c === 'string' ? c : c.message || ''));
  for (const msg of commitMessages) {
    const lower = msg.toLowerCase();
    const formatted = formatChangelogItem(msg);

    if (!passesQualityGate(formatted)) continue;
    if (lower.includes('[skip-release-hook]') || lower.startsWith('chore(release):')) continue;

    if (lower.includes('breaking') || lower.includes('!:')) {
      categories['Breaking Changes'].add(formatted);
    } else if (lower.startsWith('feat')) {
      categories['Features'].add(formatted);
    } else if (lower.startsWith('fix')) {
      categories['Bug Fixes'].add(formatted);
    } else if (lower.startsWith('perf')) {
      categories['Performance'].add(formatted);
    } else if (lower.startsWith('style')) {
      categories['UI/UX'].add(formatted);
    } else if (lower.startsWith('a11y')) {
      categories['Accessibility'].add(formatted);
    } else if (lower.startsWith('refactor')) {
      categories['Refactoring'].add(formatted);
    } else if (lower.includes('security') || lower.includes('encrypt') || lower.includes('auth')) {
      categories['Security'].add(formatted);
    } else if (lower.startsWith('ci') || lower.startsWith('chore') || lower.startsWith('test')) {
      categories['Developer Experience'].add(formatted);
    } else {
      categories['Improvements'].add(formatted);
    }
  }

  // 3. Process changed file paths to supplement entries if commits were sparse
  for (const file of changedFiles) {
    const norm = file.replace(/\\/g, '/');
    const matchedSubsystem = SUBSYSTEM_MAP.find((s) => norm.includes(s.match));
    if (!matchedSubsystem) continue;

    const subName = matchedSubsystem.name;

    if (norm.includes('fix') || norm.includes('bug')) {
      categories['Bug Fixes'].add(`Resolved issues in ${subName}`);
    } else if (norm.endsWith('.css') || norm.includes('styles/')) {
      categories['UI/UX'].add(`Refined design styling and layout for ${subName}`);
    } else if (norm.includes('/page.tsx') || norm.includes('View.tsx')) {
      if (releaseType === 'minor' || releaseType === 'major') {
        categories['Features'].add(`Enhanced ${subName} capabilities and user experience`);
      } else {
        categories['Improvements'].add(`Improved ${subName} responsiveness and interactions`);
      }
    }
  }

  // 4. Assemble sorted categorized array
  const orderedCategoryNames = [
    'Breaking Changes',
    'Features',
    'Improvements',
    'Bug Fixes',
    'Performance',
    'Security',
    'UI/UX',
    'Accessibility',
    'Developer Experience',
    'Refactoring',
    'Other'
  ];

  const changes = [];
  for (const catName of orderedCategoryNames) {
    const rawItems = Array.from(categories[catName] || []);
    const validItems = deduplicateItems(rawItems.filter(passesQualityGate));
    if (validItems.length > 0) {
      changes.push({ category: catName, items: validItems });
    }
  }

  // Fallback defaults if everything was filtered
  if (changes.length === 0) {
    if (releaseType === 'major') {
      changes.push({
        category: 'Breaking Changes',
        items: ['Major architecture updates and product enhancements']
      });
    } else if (releaseType === 'minor') {
      changes.push({
        category: 'Features',
        items: ['New capabilities, route additions, and user experience improvements']
      });
    } else if (releaseType === 'patch') {
      changes.push({
        category: 'Improvements',
        items: ['Maintenance updates, styling corrections, and performance optimizations']
      });
    }
  }

  // 5. Generate concise, human-friendly release summary
  let summary = '';
  const features = categories['Features'] ? Array.from(categories['Features']) : [];
  const fixes = categories['Bug Fixes'] ? Array.from(categories['Bug Fixes']) : [];
  const improvements = categories['Improvements'] ? Array.from(categories['Improvements']) : [];
  const breaking = categories['Breaking Changes'] ? Array.from(categories['Breaking Changes']) : [];

  if (breaking.length > 0) {
    summary = `Major release: ${breaking[0]}.`;
  } else if (features.length > 0 && fixes.length > 0) {
    summary = `${features[0]}. Also includes fixes for ${fixes[0].toLowerCase()}.`;
  } else if (features.length > 0) {
    summary = features.slice(0, 2).join('; ') + '.';
  } else if (fixes.length > 0) {
    summary = fixes.slice(0, 2).join('; ') + '.';
  } else if (improvements.length > 0) {
    summary = improvements.slice(0, 2).join('; ') + '.';
  } else {
    summary =
      releaseType === 'major'
        ? 'Major architecture updates and foundational improvements.'
        : releaseType === 'minor'
        ? 'New features and user experience enhancements.'
        : 'Performance improvements, bug fixes, and polish.';
  }

  if (summary.length > 180) {
    summary = summary.substring(0, 177) + '...';
  }

  return { changes, summary };
}
