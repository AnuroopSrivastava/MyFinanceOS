/**
 * Deterministic Release Scoring Engine — SIS / RMS / SemVer classification
 *
 * Implements the exact scoring contract:
 *
 *  - SIS (Semantic Impact Score): presence-based category points; decides
 *    PATCH (<20) vs MINOR (>=20) candidate. SIS alone NEVER produces MAJOR.
 *  - RMS (Release Magnitude Score): work-item base points + product-area
 *    scaling bonus + dampened commit-count bonus. LOC is NEVER a signal.
 *  - Intensity bands: TRIVIAL / SMALL / NORMAL / SUBSTANTIAL /
 *    VERY_SUBSTANTIAL / EXCEPTIONAL (6 bands from RMS).
 *  - SemVer decision order: NONE -> MAJOR -> MINOR -> PATCH (strict order).
 *  - MINOR jump formula: +1/+2/+3/+4 by intensity band, hard-capped at +4.
 *  - High-RMS re-evaluation: SIS<20 + RMS>=35 stays PATCH unless there is
 *    deterministic evidence of uncredited user-facing capability.
 *
 * Pure module: deterministic, idempotent, no I/O, no time, no randomness.
 * The same input signals always produce the same SIS, RMS, intensity,
 * classification, proposed version, and changelog content.
 */

import {
  WORK_ITEM_RMS_POINTS,
  WORK_ITEM_SIS_CATEGORY,
  SIS_CATEGORY_POINTS
} from './signals.mjs';

// ---------------------------------------------------------------------------
// Intensity bands (Section 2.D)
// ---------------------------------------------------------------------------

export const INTENSITY_LEVELS = ['TRIVIAL', 'SMALL', 'NORMAL', 'SUBSTANTIAL', 'VERY_SUBSTANTIAL', 'EXCEPTIONAL'];

export const INTENSITY_BANDS = [
  { level: 'EXCEPTIONAL', min: 80, max: Infinity },
  { level: 'VERY_SUBSTANTIAL', min: 55, max: 79 },
  { level: 'SUBSTANTIAL', min: 35, max: 54 },
  { level: 'NORMAL', min: 20, max: 34 },
  { level: 'SMALL', min: 10, max: 19 },
  { level: 'TRIVIAL', min: 0, max: 9 }
];

/**
 * Product-area scaling bonus (Section 2.C.3).
 * The first product area carries no bonus ("each additional product area
 * after the first: +3"); broader releases earn a super-linear bump.
 */
export const AREA_BONUS = {
  1: 0,
  2: 3,
  3: 6,
  4: 6,
  5: 10,
  6: 10
};
export const AREA_BONUS_7PLUS = 14;

export function productAreaBonus(areaCount) {
  if (areaCount <= 1) return AREA_BONUS[1];
  if (areaCount >= 7) return AREA_BONUS_7PLUS;
  return AREA_BONUS[areaCount] ?? AREA_BONUS[1];
}

/**
 * Dampened commit-count bonus (Section 2.C.4) — logarithmic bands,
 * hard-capped at +4. Commit volume can never dominate RMS.
 */
export function commitCountBonus(meaningfulCommitCount) {
  const n = Math.max(0, Math.floor(meaningfulCommitCount || 0));
  if (n >= 40) return 4;
  if (n >= 20) return 3;
  if (n >= 10) return 2;
  if (n >= 5) return 1;
  return 0;
}

export const MAX_COMMIT_BONUS = 4;

// ---------------------------------------------------------------------------
// Minor jump formula (Section 2.F) — hard cap +4
// ---------------------------------------------------------------------------

export const MAX_MINOR_JUMP = 4;

export const MINOR_JUMP_BY_INTENSITY = {
  TRIVIAL: 1,
  SMALL: 1,
  NORMAL: 1,
  SUBSTANTIAL: 2,
  VERY_SUBSTANTIAL: 3,
  EXCEPTIONAL: 4
};

// ---------------------------------------------------------------------------
// SIS / RMS computation
// ---------------------------------------------------------------------------

/**
 * Compute SIS: sum of the maximum points of every change category present.
 * `breakingCategories` is a set of SIS category keys verified through
 * high-confidence breaking evidence (60/70-point categories).
 */
export function computeSIS({ categories = [], breakingCategories = [] } = {}) {
  const present = new Set([...categories, ...breakingCategories]);
  let sis = 0;
  const contributions = [];
  for (const cat of present) {
    const pts = SIS_CATEGORY_POINTS[cat];
    if (typeof pts === 'number') {
      sis += pts;
      contributions.push({ category: cat, points: pts });
    }
  }
  return { sis, contributions };
}

/**
 * Compute RMS from deduplicated work items + areas + commit count.
 * LOC and raw file counts are never inputs.
 */
export function computeRMS({ workItems = [], productAreas = [], meaningfulCommitCount = 0 } = {}) {
  const basePoints = workItems.reduce((sum, item) => sum + (WORK_ITEM_RMS_POINTS[item.type] || 0), 0);
  const areaBonus = productAreaBonus(productAreas.length);
  const commitBonus = commitCountBonus(meaningfulCommitCount);
  const rms = basePoints + areaBonus + commitBonus;
  return {
    rms,
    basePoints,
    areaBonus,
    commitBonus,
    areaCount: productAreas.length
  };
}

/**
 * Map an RMS to its intensity band (deterministic lookup).
 */
export function intensityFromRMS(rms) {
  const r = Math.max(0, Math.floor(rms || 0));
  for (const band of INTENSITY_BANDS) {
    if (r >= band.min && r <= band.max) return band.level;
  }
  return 'TRIVIAL';
}

// ---------------------------------------------------------------------------
// SemVer parsing & formatting
// ---------------------------------------------------------------------------

const SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)$/;

export function parseSemVer(version) {
  const m = String(version || '').trim().match(SEMVER_RE);
  if (!m) return null;
  return { major: parseInt(m[1], 10), minor: parseInt(m[2], 10), patch: parseInt(m[3], 10) };
}

export function formatSemVer(p) {
  return `${p.major}.${p.minor}.${p.patch}`;
}

function semverGreaterThan(a, b) {
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch > b.patch;
}

/**
 * Legacy single-step bump (manual override paths & tests only).
 */
export function bumpVersion(currentVersion, releaseType) {
  const prev = parseSemVer(currentVersion);
  if (!prev) return currentVersion;
  switch (releaseType) {
    case 'major':
      return formatSemVer({ major: prev.major + 1, minor: 0, patch: 0 });
    case 'minor':
      return formatSemVer({ major: prev.major, minor: prev.minor + 1, patch: 0 });
    case 'patch':
      return formatSemVer({ major: prev.major, minor: prev.minor, patch: prev.patch + 1 });
    default:
      return currentVersion;
  }
}

// ---------------------------------------------------------------------------
// High-RMS PATCH re-evaluation (Section 2.G)
// ---------------------------------------------------------------------------

const USER_FACING_CAPABILITY_TYPES = ['featureEnhancement', 'newFeature', 'newPage', 'newIntegration', 'subsystem'];

/**
 * When SIS < 20 (PATCH semantics) but RMS >= 35, inspect whether the
 * accumulated work contains uncredited user-facing capabilities that
 * genuinely qualify the release as MINOR. Purely corrective/refactoring/
 * internal work stays PATCH +1 regardless of magnitude.
 */
export function reEvaluateHighRMSPatch({ sis, rms, workItems = [] } = {}) {
  if (sis >= 20 || rms < 35) return { remainsPatch: true, uncredited: [] };
  const uncredited = workItems.filter((i) => USER_FACING_CAPABILITY_TYPES.includes(i.type));
  if (uncredited.length > 0) {
    return { remainsPatch: false, uncredited };
  }
  return { remainsPatch: true, uncredited: [] };
}

// ---------------------------------------------------------------------------
// SemVer classification (Section 2.E decision order)
// ---------------------------------------------------------------------------

/**
 * Classify release progression in the exact strict order:
 *   1. NONE   — no meaningful application change
 *   2. MAJOR  — verified breaking change with high confidence
 *   3. MINOR  — SIS >= 20 with meaningful user-facing capability
 *   4. PATCH  — otherwise
 *
 * `blocked` is returned when a breaking change is suspected but unverified
 * (ambiguity gate): the pipeline must halt for human confirmation.
 */
export function classifySemVer({
  hasApplicationChange,
  verifiedBreakingCategories = [],
  suspectedBreakingEvidence = [],
  sis,
  workItems = []
} = {}) {
  // 1. NONE: no meaningful application change.
  if (!hasApplicationChange) {
    return { type: 'NONE', blocked: false, reason: 'No meaningful application change detected (docs/whitespace/ignored-only/empty diff).' };
  }

  // 2. MAJOR: verified breaking change with high confidence only.
  if (verifiedBreakingCategories.length > 0) {
    return { type: 'MAJOR', blocked: false, reason: `Verified breaking-change evidence: ${verifiedBreakingCategories.join(', ')}` };
  }

  // Ambiguity gate: suspected but unverified breaking change blocks release.
  if (suspectedBreakingEvidence.length > 0) {
    return {
      type: null,
      blocked: true,
      reason: `Suspected breaking change requires human confirmation: ${suspectedBreakingEvidence
        .map((e) => e.detail)
        .join('; ')}`
    };
  }

  // 3. MINOR: SIS >= 20 and meaningful user-facing capability exists.
  const hasUserFacingCapability = workItems.some((i) => USER_FACING_CAPABILITY_TYPES.includes(i.type));
  if (sis >= 20 && hasUserFacingCapability) {
    return { type: 'MINOR', blocked: false, reason: `SIS ${sis} >= 20 with meaningful user-facing capability.` };
  }

  // 4. PATCH: otherwise.
  return { type: 'PATCH', blocked: false, reason: `SIS ${sis} < 20 (or no user-facing capability); conservative PATCH +1.` };
}

// ---------------------------------------------------------------------------
// Next-version calculation (Sections 2.E–2.H)
// ---------------------------------------------------------------------------

/**
 * Compute the next deterministic version.
 *
 * NONE  -> unchanged
 * MAJOR -> major+1, minor=0, patch=0
 * MINOR -> minor + jump(intensity band), patch=0, jump capped at +4
 * PATCH -> patch +1 strictly
 *
 * Collision avoidance advances to the next free slot of the same type when
 * the computed version is already used (existing tags/changelog/manifest).
 */
export function calculateNextVersion({
  previousVersion,
  semverType,
  intensity = 'NORMAL',
  existingVersions = []
} = {}) {
  const prev = parseSemVer(previousVersion);
  if (!prev) {
    throw new Error(`Invalid previous version: "${previousVersion}" (expected strict SemVer)`);
  }

  if (semverType === 'NONE') {
    return {
      nextVersion: formatSemVer(prev),
      minorJump: 0,
      changed: false,
      reason: 'No release required; version unchanged.'
    };
  }

  const used = new Set(
    (existingVersions || [])
      .filter(Boolean)
      .map((v) => String(v).trim())
      .flatMap((v) => [v, v.replace(/^v/, '')])
  );
  const isUsed = (v) => used.has(v) || used.has(`v${v}`);

  let candidate;
  let minorJump = 0;
  let reason;

  if (semverType === 'MAJOR') {
    candidate = { major: prev.major + 1, minor: 0, patch: 0 };
    reason = 'Breaking changes verified; MAJOR progression resets MINOR and PATCH.';
  } else if (semverType === 'MINOR') {
    minorJump = MINOR_JUMP_BY_INTENSITY[intensity] ?? MINOR_JUMP_BY_INTENSITY.NORMAL;
    if (!Number.isInteger(minorJump) || minorJump < 1) minorJump = 1;
    if (minorJump > MAX_MINOR_JUMP) minorJump = MAX_MINOR_JUMP; // hard cap +4
    candidate = { major: prev.major, minor: prev.minor + minorJump, patch: 0 };
    reason = `MINOR +${minorJump} (${intensity} intensity band, RMS-driven jump formula).`;
  } else if (semverType === 'PATCH') {
    candidate = { major: prev.major, minor: prev.minor, patch: prev.patch + 1 };
    reason = 'Conservative PATCH +1 (intensity never inflates PATCH).';
  } else {
    throw new Error(`Unknown SemVer type: "${semverType}"`);
  }

  // Collision avoidance within the same progression type.
  const skipped = [];
  let guard = 0;
  while (isUsed(formatSemVer(candidate)) && guard < 50) {
    skipped.push(formatSemVer(candidate));
    if (semverType === 'MAJOR') candidate.major += 1;
    else if (semverType === 'MINOR') candidate.minor += 1;
    else candidate.patch += 1;
    guard += 1;
  }
  if (!semverGreaterThan(candidate, prev)) {
    throw new Error(`Computed version ${formatSemVer(candidate)} is not greater than previous ${previousVersion}.`);
  }

  return {
    nextVersion: formatSemVer(candidate),
    minorJump,
    changed: true,
    reason: skipped.length > 0 ? `${reason} Skipped already-released: ${skipped.join(', ')}.` : reason
  };
}

// ---------------------------------------------------------------------------
// Top-level scoring pipeline (pure)
// ---------------------------------------------------------------------------

/**
 * Full deterministic scoring: signals -> SIS/RMS/intensity/classification/
 * next version. All inputs are structured signals (see signals.mjs); no I/O.
 */
export function scoreRelease({
  signals,
  previousVersion,
  existingVersions = []
} = {}) {
  if (!signals) throw new Error('scoreRelease requires extracted signals');

  const breakingCategories = signals.breakingEvidence.verified.map((e) => {
    // Map evidence kinds back to SIS categories.
    switch (e.kind) {
      case 'breakingSchema':
        return 'breakingSchema';
      case 'breakingAuth':
        return 'breakingAuth';
      case 'featureRemoval':
        return 'featureRemoval';
      default:
        return 'breakingApi';
    }
  });

  const { sis, contributions } = computeSIS({
    categories: signals.categories,
    breakingCategories
  });
  const rmsResult = computeRMS({
    workItems: signals.workItems,
    productAreas: signals.productAreas,
    meaningfulCommitCount: signals.meaningfulCommitCount
  });
  const intensity = intensityFromRMS(rmsResult.rms);

  const classification = classifySemVer({
    hasApplicationChange: signals.hasApplicationChange,
    verifiedBreakingCategories: breakingCategories,
    suspectedBreakingEvidence: signals.breakingEvidence.suspected,
    sis,
    workItems: signals.workItems
  });

  if (classification.blocked) {
    return {
      blocked: true,
      blockReason: classification.reason,
      sis,
      rms: rmsResult.rms,
      rmsBreakdown: rmsResult,
      intensity,
      semverType: null,
      nextVersion: null,
      minorJump: 0,
      sisContributions: contributions,
      reEvaluation: null
    };
  }

  // High-RMS re-evaluation for PATCH-semantics sets (Section 2.G).
  let effectiveType = classification.type;
  let reEvaluation = null;
  if (effectiveType === 'PATCH' && rmsResult.rms >= 35) {
    reEvaluation = reEvaluateHighRMSPatch({ sis, rms: rmsResult.rms, workItems: signals.workItems });
    if (!reEvaluation.remainsPatch) {
      effectiveType = 'MINOR';
    }
  }

  const next = calculateNextVersion({
    previousVersion,
    semverType: effectiveType,
    intensity,
    existingVersions
  });

  return {
    blocked: false,
    sis,
    rms: rmsResult.rms,
    rmsBreakdown: rmsResult,
    intensity,
    semverType: effectiveType,
    nextVersion: next.nextVersion,
    minorJump: next.minorJump,
    versionReason: next.reason,
    sisContributions: contributions,
    reEvaluation
  };
}

// ---------------------------------------------------------------------------
// Release label (public-facing changelog naming)
// ---------------------------------------------------------------------------

/**
 * Public-facing release label; never "Major release" unless SemVer MAJOR
 * actually increased. Larger backwards-compatible minors are labelled by
 * their jump size.
 */
export function getReleaseLabel(semverType, minorJump = 0) {
  if (semverType === 'MAJOR') return 'Major release';
  if (semverType === 'MINOR') {
    if (minorJump >= 4) return 'Milestone release';
    if (minorJump === 3) return 'Major feature release';
    if (minorJump === 2) return 'Substantial release';
    return 'Minor release';
  }
  if (semverType === 'PATCH') return 'Patch release';
  return 'No release';
}

/**
 * Human-facing summary of the deterministic metrics line.
 */
export function getScoringSummaryLine(scoring) {
  if (!scoring || scoring.semverType === 'NONE') return 'No release required.';
  return `${scoring.semverType}${scoring.semverType === 'MINOR' ? ` (+${scoring.minorJump})` : ''} — ${scoring.intensity} (RMS: ${scoring.rms}, SIS: ${scoring.sis})`;
}
