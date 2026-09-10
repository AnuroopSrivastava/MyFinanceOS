/**
 * Multi-Signal Release Classifier & Confidence Scoring Engine
 *
 * Implements:
 * - Signal A: Git diff semantics (destructive SQL, schema changes, breaking exports)
 * - Signal B: Changed file types & subsystem contexts
 * - Signal C: Commit messages (Conventional Commits, BREAKING CHANGE footers)
 * - Signal D: Functional surface impact (User-facing vs developer-only)
 * - Signal E: Breaking change indicators
 * - Signal F: Feature indicators
 * - Signal G: Fix indicators
 *
 * Strict Rules:
 * - Line count NEVER determines version level (Rule 74)
 * - Volume of code != Release level (Rule 73)
 * - Performance improvements default to PATCH (Rule 76)
 * - Cosmetic UI changes default to PATCH (Rule 75)
 * - "NONE" is a first-class state for non-runtime changes (Rule 14)
 */

export function classifyRelease({
  changedFiles = [],
  commits = [],
  diffSnippets = '',
  forceType = null
}) {
  // 1. Check for manual override
  if (forceType && ['major', 'minor', 'patch', 'none'].includes(forceType)) {
    return {
      releaseType: forceType,
      confidence: {
        score: 100,
        level: 'high',
        signals: [`Manual developer override requested: ${forceType.toUpperCase()}`]
      },
      manualOverride: true,
      breakingChanges: [],
      reasoning: [`Explicit override flag '--${forceType}' was supplied by developer.`]
    };
  }

  const commitMessages = commits.map((c) => (typeof c === 'string' ? c : c.message || ''));
  const signals = [];
  const breakingChanges = [];
  const featureSignals = [];
  const fixSignals = [];
  const maintenanceSignals = [];

  let highestType = 'none';
  const priority = { major: 3, minor: 2, patch: 1, none: 0 };
  const elevateTo = (type, reason) => {
    if (priority[type] > priority[highestType]) {
      highestType = type;
    }
    signals.push(reason);
  };

  // -------------------------------------------------------------
  // Signal A & E: Git Diff Semantics & Breaking Change Analysis
  // -------------------------------------------------------------
  const diffLower = diffSnippets.toLowerCase();
  
  // Destructive Database Operations
  const isDestructiveSql =
    /drop\s+table/i.test(diffSnippets) ||
    /alter\s+table.*drop\s+column/i.test(diffSnippets) ||
    /drop\s+index/i.test(diffSnippets);

  if (isDestructiveSql) {
    breakingChanges.push('Destructive database schema change detected (DROP TABLE / DROP COLUMN).');
    elevateTo('major', 'Signal A/E: Destructive schema migration detected in database DDL.');
  }

  // Breaking Public API Removals
  if (
    diffSnippets.includes('-export const') ||
    diffSnippets.includes('-export function') ||
    diffSnippets.includes('-export interface') ||
    diffSnippets.includes('-export type')
  ) {
    const isPublicPackage = changedFiles.some(
      (f) => f.includes('packages/shared/src/index.ts') || f.includes('packages/database/src/index.ts')
    );
    if (isPublicPackage) {
      breakingChanges.push('Removed public API exports detected in core shared/database packages.');
      elevateTo('major', 'Signal A/E: Core package public interface removal detected.');
    }
  }

  // -------------------------------------------------------------
  // Signal C: Commit Messages (Conventional Commits & Keywords)
  // -------------------------------------------------------------
  for (const msg of commitMessages) {
    const lower = msg.toLowerCase().trim();

    // Breaking commit patterns: feat!: ..., fix!: ..., or BREAKING CHANGE:
    if (/^[a-z]+(\([a-z0-9-_]+\))?!:/.test(lower) || lower.includes('breaking change:')) {
      breakingChanges.push(`Commit indicates breaking change: "${msg}"`);
      elevateTo('major', `Signal C: Breaking conventional commit prefix "${msg}"`);
      break;
    }

    // Features
    if (lower.startsWith('feat:') || lower.startsWith('feat(')) {
      featureSignals.push(`Feature commit: ${msg}`);
      elevateTo('minor', `Signal C: Feature conventional commit "${msg}"`);
    }

    // Fixes & Optimizations
    else if (
      lower.startsWith('fix:') || lower.startsWith('fix(') ||
      lower.startsWith('perf:') || lower.startsWith('perf(') ||
      lower.startsWith('style:') || lower.startsWith('style(') ||
      lower.startsWith('refactor:') || lower.startsWith('refactor(') ||
      lower.startsWith('a11y:')
    ) {
      fixSignals.push(`Fix/patch commit: ${msg}`);
      elevateTo('patch', `Signal C: Fix/patch conventional commit "${msg}"`);
    }

    // Maintenance / Docs only
    else if (
      lower.startsWith('docs:') || lower.startsWith('test:') ||
      lower.startsWith('ci:') || lower.startsWith('chore:')
    ) {
      maintenanceSignals.push(`Maintenance commit: ${msg}`);
    }
  }

  // -------------------------------------------------------------
  // Signal B, D, F, G: Changed Files & Functional Surface Impact
  // -------------------------------------------------------------
  const nonReleaseExtensions = ['.md', '.txt', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.gz', '.log'];
  const meaningfulChanges = changedFiles.filter((file) => {
    const norm = file.replace(/\\/g, '/');
    if (norm.startsWith('graphify-out/') || norm.startsWith('.github/') || norm.startsWith('.vscode/')) return false;
    if (norm === '.gitignore' || norm === '.gitattributes') return false;
    if (nonReleaseExtensions.some((ext) => norm.endsWith(ext))) return false;
    return true;
  });

  // If literally zero meaningful runtime code files changed and commit messages were non-release
  if (meaningfulChanges.length === 0 && highestType === 'none') {
    return {
      releaseType: 'none',
      confidence: {
        score: 95,
        level: 'high',
        signals: ['Only documentation, tests, or CI configuration changed. No release required.']
      },
      manualOverride: false,
      breakingChanges: [],
      reasoning: ['No runtime application code or functional surface changes detected.']
    };
  }

  for (const file of meaningfulChanges) {
    const norm = file.replace(/\\/g, '/');

    // New user-facing route or page
    if (norm.startsWith('apps/web/app/') && norm.endsWith('/page.tsx')) {
      featureSignals.push(`User-facing route: ${norm}`);
      elevateTo('minor', `Signal B/F: New or updated user-facing Next.js page route (${norm})`);
    }

    // Primary View components (Dashboard, Investments, Tax, etc.)
    else if (norm.startsWith('apps/web/src/components/') && norm.endsWith('View.tsx')) {
      const hasFeatureCommit = commitMessages.some((m) => m.toLowerCase().startsWith('feat'));
      if (hasFeatureCommit || commitMessages.length === 0) {
        featureSignals.push(`Primary view component: ${norm}`);
        elevateTo('minor', `Signal B/D: Primary product view updated (${norm})`);
      } else {
        fixSignals.push(`Primary view maintenance: ${norm}`);
        elevateTo('patch', `Signal B/G: Primary product view fix or polish (${norm})`);
      }
    }

    // Shared packages logic additions
    else if (norm.startsWith('packages/') && norm.includes('/src/') && !norm.includes('.test.')) {
      const hasFeatureCommit = commitMessages.some((m) => m.toLowerCase().startsWith('feat'));
      if (hasFeatureCommit || commitMessages.length === 0) {
        elevateTo('minor', `Signal B: Core package logic updated in ${norm}`);
      } else if (highestType === 'none') {
        elevateTo('patch', `Signal B: Core package maintenance in ${norm}`);
      }
    }

    // Styling & CSS tweaks -> PATCH
    else if (norm.includes('styles/') || norm.endsWith('.css')) {
      fixSignals.push(`Style correction: ${norm}`);
      elevateTo('patch', `Signal B/G: CSS stylesheet or visual token refinement (${norm})`);
    }

    // Test additions accompanying code -> PATCH
    else if (norm.includes('.test.')) {
      if (highestType === 'none') {
        elevateTo('patch', `Signal B: Test coverage expanded (${norm})`);
      }
    } else {
      if (highestType === 'none') {
        elevateTo('patch', `Signal B: General codebase update (${norm})`);
      }
    }
  }

  // If nothing triggered an elevation
  if (highestType === 'none') {
    return {
      releaseType: 'none',
      confidence: {
        score: 90,
        level: 'high',
        signals: ['No functional or releaseable changes identified.']
      },
      manualOverride: false,
      breakingChanges: [],
      reasoning: ['All changed files and commits map to non-release maintenance.']
    };
  }

  // -------------------------------------------------------------
  // Confidence Score Calculation (0 - 100%)
  // -------------------------------------------------------------
  let score = 50; // baseline

  if (highestType === 'major') {
    if (breakingChanges.length > 0 && isDestructiveSql) score += 40;
    else if (breakingChanges.length > 0) score += 35;
    if (commitMessages.some((m) => m.toLowerCase().includes('breaking') || /^[a-z]+(\([a-z0-9-_]+\))?!:/.test(m))) score += 15;
  } else if (highestType === 'minor') {
    if (featureSignals.length > 0) score += 30;
    if (meaningfulChanges.some((f) => f.includes('page.tsx') || f.includes('View.tsx'))) score += 15;
    if (commitMessages.some((m) => m.toLowerCase().startsWith('feat'))) score += 10;
  } else if (highestType === 'patch') {
    if (fixSignals.length > 0) score += 30;
    if (commitMessages.some((m) => m.toLowerCase().startsWith('fix') || m.toLowerCase().startsWith('perf'))) score += 15;
    if (meaningfulChanges.some((f) => f.endsWith('.css') || f.includes('.test.'))) score += 10;
  }

  score = Math.min(100, Math.max(10, score));

  let level = 'medium';
  if (score >= 80) level = 'high';
  else if (score < 50) level = 'low';

  return {
    releaseType: highestType,
    confidence: {
      score,
      level,
      signals: Array.from(new Set(signals)).slice(0, 5)
    },
    manualOverride: false,
    breakingChanges,
    reasoning: [
      `Assigned ${highestType.toUpperCase()} based on ${signals.length} detected signals.`,
      `Confidence: ${score}% (${level.toUpperCase()}).`
    ]
  };
}
