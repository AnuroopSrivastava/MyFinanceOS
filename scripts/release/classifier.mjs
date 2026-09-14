/**
 * Multi-Signal Release Classifier — deterministic classification with the
 * breaking-change safety gate.
 *
 * Classification pipeline (strict order, Section 2.E):
 *   1. NONE   — no meaningful application change
 *   2. MAJOR  — verified breaking change with high confidence
 *   3. MINOR  — SIS >= 20 + meaningful user-facing capability
 *   4. PATCH  — otherwise
 *
 * The classifier computes SIS/RMS via the pure scoring engine, never from
 * LOC, file counts, or subjective judgment. Suspected-but-unverified
 * breaking changes BLOCK the release (ambiguity gate).
 */

import {
  extractReleaseSignals,
  partitionAddedFiles
} from './signals.mjs';
import {
  scoreRelease,
  getReleaseLabel,
  computeSIS,
  computeRMS,
  intensityFromRMS,
  classifySemVer,
  reEvaluateHighRMSPatch,
  calculateNextVersion,
  bumpVersion,
  MAX_MINOR_JUMP,
  MINOR_JUMP_BY_INTENSITY,
  INTENSITY_LEVELS,
  INTENSITY_BANDS,
  productAreaBonus,
  commitCountBonus,
  parseSemVer,
  formatSemVer,
  getScoringSummaryLine
} from './scoring.mjs';

/**
 * Extract deleted files from a unified diff ("deleted file mode" headers).
 */
export function extractDeletedFiles(diffSnippets = '') {
  const deleted = new Set();
  const lines = String(diffSnippets || '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('diff --git ')) continue;
    const m = lines[i].match(/^diff --git a\/(.+) b\/(.+)$/);
    let j = i + 1;
    let isDeleted = false;
    while (j < lines.length && !lines[j].startsWith('diff --git ')) {
      if (lines[j].startsWith('deleted file mode')) isDeleted = true;
      if (lines[j].startsWith('@@')) break;
      j++;
    }
    if (isDeleted && m) deleted.add(m[2].replace(/\\/g, '/'));
  }
  return Array.from(deleted);
}

/**
 * Detect whitespace-only file changes from a unified diff. A file is
 * whitespace-only when its removed and added lines are identical after
 * trimming (pure reindentation / blank-line churn): the multiset of trimmed
 * removed lines equals the multiset of trimmed added lines. Files with zero
 * changed lines are NOT whitespace-only (no evidence either way).
 */
export function detectWhitespaceOnlyFiles(diffSnippets = '') {
  const text = String(diffSnippets || '');
  if (!text) return new Set();
  const perFile = new Map(); // file -> { removed: [], added: [], binary: false }
  const lines = text.split('\n');
  let current = null;
  for (const line of lines) {
    const d = line.match(/^diff --git a\/(.+) b\/(.+)$/);
    if (d) {
      current = d[2].replace(/\\/g, '/');
      if (!perFile.has(current)) perFile.set(current, { removed: [], added: [], binary: false });
      continue;
    }
    if (!current) continue;
    if (line.startsWith('@@')) continue;
    if (
      line.startsWith('index ') ||
      line.startsWith('new file mode') ||
      line.startsWith('deleted file mode') ||
      line.startsWith('old mode') ||
      line.startsWith('new mode') ||
      line.startsWith('--- ') ||
      line.startsWith('+++ ')
    ) {
      continue;
    }
    if (line.startsWith('Binary files')) {
      perFile.get(current).binary = true;
      continue;
    }
    if (line.startsWith('\\')) continue; // "\ No newline at end of file"
    if (line.startsWith('+')) {
      perFile.get(current).added.push(line.slice(1).trim());
    } else if (line.startsWith('-')) {
      perFile.get(current).removed.push(line.slice(1).trim());
    }
  }
  const wsOnly = new Set();
  for (const [file, s] of perFile.entries()) {
    if (s.binary) continue;
    if (s.removed.length + s.added.length === 0) continue;
    const removedKey = [...s.removed].sort().join('\u0000');
    const addedKey = [...s.added].sort().join('\u0000');
    if (removedKey === addedKey) wsOnly.add(file);
  }
  return wsOnly;
}

/**
 * Full classification: extract signals from boundary evidence, compute
 * deterministic scores, apply the decision order, and gate breaking changes.
 *
 * Returns a result object:
 *   releaseType: 'none' | 'patch' | 'minor' | 'major'   (null when blocked)
 *   blocked: boolean — suspected breaking change requires human confirmation
 *   scoring: { sis, rms, intensity, semverType, nextVersion, ... }
 */
export function classifyRelease({
  changedFiles = [],
  commits = [],
  diffSnippets = '',
  previousVersion = '1.0.0',
  existingVersions = [],
  forceType = null,
  untrackedFiles = []
} = {}) {
  // Manual override path (developer-specified explicit release level).
  if (forceType && ['major', 'minor', 'patch', 'none'].includes(forceType)) {
    return {
      releaseType: forceType,
      manualOverride: true,
      blocked: false,
      breakingChanges: [],
      reasoning: [`Explicit developer override: ${forceType.toUpperCase()}`],
      scoring: null,
      signals: null,
      releaseLabel: null,
      version: null,
      minorJump: 0
    };
  }

  const { added: diffAddedFiles } = partitionAddedFiles(changedFiles, diffSnippets);
  const whitespaceOnlyFiles = Array.from(detectWhitespaceOnlyFiles(diffSnippets));
  const deletedFiles = extractDeletedFiles(diffSnippets);

  // Untracked files (from `git status --porcelain`) are additions: they never
  // appear in any diff until staged. Explicit input, never inferred from a
  // file's absence in a partial diff.
  const addedFiles = Array.from(
    new Set([
      ...diffAddedFiles,
      ...untrackedFiles.map((f) => String(f).replace(/\\/g, '/')).filter(Boolean)
    ])
  );

  const signals = extractReleaseSignals({
    commits,
    changedFiles,
    addedFiles,
    deletedFiles,
    diff: diffSnippets,
    whitespaceOnlyFiles
  });

  const scoring = scoreRelease({
    signals,
    previousVersion,
    existingVersions
  });

  const typeMap = { NONE: 'none', PATCH: 'patch', MINOR: 'minor', MAJOR: 'major' };

  if (scoring.blocked) {
    return {
      releaseType: null,
      manualOverride: false,
      blocked: true,
      blockReason: scoring.blockReason,
      breakingChanges: signals.breakingEvidence.suspected.map((e) => e.detail),
      reasoning: [scoring.blockReason, 'Release BLOCKED pending human confirmation.'],
      scoring
    };
  }

  const releaseType = typeMap[scoring.semverType];
  const releaseLabel = getReleaseLabel(scoring.semverType, scoring.minorJump);

  const reasoning = [
    `SIS ${scoring.sis} from ${scoring.sisContributions.length} change categories; RMS ${scoring.rms} (${signals.workItems.length} work items worth ${scoring.rmsBreakdown.basePoints} base points + ${scoring.rmsBreakdown.areaBonus} areas + ${scoring.rmsBreakdown.commitBonus} commit dampener).`,
    `Intensity: ${scoring.intensity}. Classification: ${scoring.semverType}${scoring.minorJump > 1 ? ` (minor jump +${scoring.minorJump})` : ''}.`,
    scoring.versionReason
  ];
  if (scoring.reEvaluation) {
    reasoning.push(
      scoring.reEvaluation.remainsPatch
        ? `High-RMS PATCH re-evaluation: corrective/internal work retained at PATCH +1 despite RMS ${scoring.rms}.`
        : `High-RMS re-evaluation: ${scoring.reEvaluation.uncredited.length} uncredited user-facing capabilities promoted to MINOR.`
    );
  }

  return {
    releaseType,
    manualOverride: false,
    blocked: false,
    scoring,
    signals,
    releaseLabel,
    version: scoring.nextVersion,
    minorJump: scoring.minorJump,
    breakingChanges: signals.breakingEvidence.verified.map((e) => e.detail),
    reasoning
  };
}

/**
 * Back-compat wrapper: legacy tests call classifyChanges(files, messages, diff).
 */
export function classifyChanges(changedFiles = [], commitMessages = [], diffSnippets = '') {
  const commits = commitMessages.map((m) => ({ message: m, sha: '' }));
  const result = classifyRelease({ changedFiles, commits, diffSnippets });
  return result.releaseType;
}

// Re-export the pure scoring APIs for direct test access.
export {
  computeSIS,
  computeRMS,
  intensityFromRMS,
  classifySemVer,
  reEvaluateHighRMSPatch,
  calculateNextVersion,
  bumpVersion,
  MAX_MINOR_JUMP,
  MINOR_JUMP_BY_INTENSITY,
  INTENSITY_LEVELS,
  INTENSITY_BANDS,
  productAreaBonus,
  commitCountBonus,
  parseSemVer,
  formatSemVer,
  getReleaseLabel,
  getScoringSummaryLine,
  extractReleaseSignals,
  partitionAddedFiles
};
