#!/usr/bin/env node
/**
 * MyFinanceOS Deterministic Release Intelligence Engine
 *
 * Zero-touch "Push to GitHub" pipeline (`npm run release:ship` / --ship):
 *   1.  Inspect working tree & auto-stage project changes (git add -A)
 *   2.  Resolve release boundary (git describe --tags --match "v*.*.*")
 *   3.  Idempotency pre-check (exact UP_TO_DATE output on clean trees)
 *   4.  Multi-signal extraction (commits, paths, diffs, AST exports,
 *       routes, config, migrations, auth, product areas, work items)
 *   5.  Deterministic scoring: SIS, RMS, intensity, SemVer, minor jump
 *   6.  Breaking-change safety gate (verified evidence only; suspected
 *       changes BLOCK the release for human confirmation)
 *   7.  Changelog & manifest generation (evidence-backed only)
 *   8.  Atomic whole-project version synchronization
 *   9.  Pre-commit quality checks (npm run release:check)
 *   10. Atomic git commit: chore(release): vX.Y.Z [skip-release-hook]
 *   11. Annotated git tag with intensity & RMS
 *   12. Remote push (git push origin <branch> --follow-tags)
 *   13. Status verification & release scorecard
 *
 * The AI/model NEVER chooses the version: every progression is computed
 * from deterministic code signals via scripts/release/{signals,scoring}.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  runGit,
  isGitAvailable,
  getCurrentBranch,
  isDetachedHead,
  getLatestTag,
  hasGitTag,
  hasRemoteTag,
  getLatestRemoteTag,
  checkRemoteState,
  createGitTag,
  backupFiles,
  restoreFiles,
  compareSemVerTags
} from './release/git.mjs';
import { acquireReleaseLock, releaseLock } from './release/lock.mjs';
import { detectReleaseBoundary } from './release/boundary.mjs';
import { classifyRelease } from './release/classifier.mjs';
import { scoreRelease, getReleaseLabel, getScoringSummaryLine } from './release/scoring.mjs';
import { extractReleaseSignals } from './release/signals.mjs';
import { generateChangelogContent, generateScoringMetrics } from './release/changelog.mjs';
import { loadManifestDocument, recordReleaseManifest, hasReleaseRecord } from './release/manifest.mjs';
import {
  synchronizeRelease,
  validateSynchronization,
  getReleaseArtifactPaths,
  getPackageJsonPaths
} from './release/sync.mjs';
import {
  validateVersionSynchronization,
  validateChangelogIntegrity,
  validateReleaseReadiness
} from './release/validator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..');

// Path constants (canonical data lives in the shared package; the public
// static fallback is served from apps/web/public).
export const VERSION_FILE = path.join(ROOT_DIR, 'packages', 'shared', 'src', 'version.json');
export const CHANGELOG_FILE = path.join(ROOT_DIR, 'packages', 'shared', 'src', 'changelog.json');
export const MANIFEST_FILE = path.join(ROOT_DIR, 'packages', 'shared', 'src', 'release-manifest.json');
export const PUBLIC_CHANGELOG_HTML = path.join(ROOT_DIR, 'apps', 'web', 'public', 'changelog.html');
export const CHANGELOG_MD = path.join(ROOT_DIR, 'CHANGELOG.md');

/**
 * Load version data safely.
 */
export function loadVersionData() {
  if (fs.existsSync(VERSION_FILE)) {
    return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
  }
  return {
    version: '1.0.0',
    releaseDate: new Date().toISOString().split('T')[0],
    releaseType: 'major',
    summary: 'Initial baseline release of MyFinanceOS',
    lastReleaseCommit: ''
  };
}

/**
 * Legacy single-step SemVer bump (manual override paths only; the automated
 * pipeline always goes through the deterministic scoring engine).
 */
export function bumpVersion(currentVersion, releaseType) {
  const parts = currentVersion.split('.').map((p) => parseInt(p, 10));
  let [major = 1, minor = 0, patch = 0] = parts;
  switch (releaseType) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
      patch += 1;
      break;
    default:
      return currentVersion;
  }
  return `${major}.${minor}.${patch}`;
}

/**
 * Synchronize package.json versions across the monorepo.
 */
export function syncPackageJsonVersions(newVersion) {
  for (const pkgPath of getPackageJsonPaths(ROOT_DIR)) {
    if (!fs.existsSync(pkgPath)) continue;
    const content = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    content.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
  }
}

/**
 * Back-compat wrapper for legacy tests.
 */
export function classifyChanges(changedFiles = [], commitMessages = [], diffSnippets = '') {
  const commits = commitMessages.map((msg) => ({ message: msg, sha: '' }));
  const result = classifyRelease({ changedFiles, commits, diffSnippets });
  return result.releaseType;
}

const UP_TO_DATE_MESSAGE = 'Repository up to date; no release required.';

/**
 * Print the final release scorecard (Step 13).
 */
function printScorecard(result) {
  const { previousVersion, newVersion, semverType, minorJump, scoring, productAreas, remoteSynced } = result;
  const classification = semverType === 'MINOR' ? `MINOR (+${minorJump})` : semverType;
  console.log(`\n==============================================`);
  console.log(`📋 MyFinanceOS Release Scorecard`);
  console.log(`==============================================`);
  console.log(`Previous Version: v${previousVersion}`);
  console.log(`New Version: v${newVersion}`);
  console.log(`SemVer Classification: ${classification}`);
  console.log(`Release Intensity: ${scoring.intensity} (RMS: ${scoring.rms}, SIS: ${scoring.sis})`);
  console.log(`Product Areas Affected: ${productAreas.length > 0 ? productAreas.join(', ') : '—'}`);
  console.log(`Git Remote Status: ${remoteSynced ? 'Synced & Pushed' : 'Local only (not shipped)'}`);
  console.log(`==============================================\n`);
}

/**
 * Main release execution orchestrator.
 */
export function executeRelease(options = {}) {
  const {
    forceType = null,
    manualSummary = null,
    dryRun = false,
    previewOnly = false,
    checkOnly = false,
    checkVersionOnly = false,
    checkChangelogOnly = false,
    isCi = false,
    force = false,
    isShip = false,
    skipChecks = false
  } = options;

  // ------------------------------------------------------------------
  // Non-mutating verification modes
  // ------------------------------------------------------------------
  if (checkVersionOnly) {
    console.log('[release:check] Validating version synchronization...');
    const result = validateVersionSynchronization(ROOT_DIR);
    if (!result.valid) {
      console.error('✗ Version synchronization failed:');
      result.mismatches.forEach((m) => console.error(`  - ${m}`));
      process.exit(1);
    }
    console.log(`✓ All versions synchronized at v${result.canonicalVersion}`);
    return { status: 'valid', version: result.canonicalVersion };
  }

  if (checkChangelogOnly) {
    console.log('[release:check] Validating changelog integrity and quality...');
    const result = validateChangelogIntegrity(ROOT_DIR);
    if (!result.valid) {
      console.error('✗ Changelog integrity checks failed:');
      result.errors.forEach((e) => console.error(`  - ${e}`));
      process.exit(1);
    }
    console.log(`✓ Changelog is valid (${result.totalEntries} releases recorded).`);
    return { status: 'valid', totalEntries: result.totalEntries };
  }

  if (checkOnly) {
    console.log('[release:check] Running comprehensive release readiness check...');
    const readiness = validateReleaseReadiness(ROOT_DIR);
    if (!readiness.ready) {
      console.error('✗ Release readiness check failed with issues:');
      readiness.issues.forEach((i) => console.error(`  - ${i}`));
      process.exit(1);
    }
    console.log(`✓ Release readiness check PASSED. Canonical version: v${readiness.canonicalVersion}`);
    return { status: 'ready', version: readiness.canonicalVersion };
  }

  // ------------------------------------------------------------------
  // Concurrency lock
  // ------------------------------------------------------------------
  const lock = acquireReleaseLock(ROOT_DIR);
  if (!lock.acquired) {
    console.error(`✗ ${lock.reason}`);
    process.exit(1);
  }

  let remoteSynced = false;

  try {
    if (!isGitAvailable(ROOT_DIR)) {
      console.log('[release] Git not available or not inside work tree. Skipping git operations.');
      releaseLock(ROOT_DIR);
      return { status: 'skipped', reason: 'No git repository' };
    }

    if (isDetachedHead(ROOT_DIR)) {
      console.warn('[release] Repository is in a detached HEAD state. Proceeding in dry-run/preview mode.');
    }

    // ----------------------------------------------------------------
    // Remote safety guards (ship mode)
    // ----------------------------------------------------------------
    if (isShip) {
      const remoteStatus = checkRemoteState(ROOT_DIR);
      if (remoteStatus.hasRemote && remoteStatus.isBehind) {
        console.error(`\n❌ [release:safety] Remote branch is ahead by ${remoteStatus.behindCount} commit(s).`);
        console.error(`Please pull or rebase remote changes before releasing: git pull --rebase origin ${getCurrentBranch(ROOT_DIR) || 'main'}\n`);
        releaseLock(ROOT_DIR);
        process.exit(1);
      }
      const latestRemoteTag = getLatestRemoteTag('origin', ROOT_DIR);
      const localTag = getLatestTag('v*', ROOT_DIR);
      if (latestRemoteTag && localTag && compareSemVerTags(latestRemoteTag, localTag) > 0) {
        console.error(`\n❌ [release:safety] Remote is ahead in releases: origin has ${latestRemoteTag}, local latest is ${localTag}.`);
        console.error(`Pull the remote release state before shipping: git fetch origin --tags && git pull --rebase origin ${getCurrentBranch(ROOT_DIR) || 'main'}\n`);
        releaseLock(ROOT_DIR);
        process.exit(1);
      }
    }

    // ----------------------------------------------------------------
    // Step 1: Inspect & auto-stage all project code changes
    // ----------------------------------------------------------------
    if (isShip) {
      console.log('[release:ship] Step 1: Inspecting working tree and auto-staging project changes...');
      runGit('git add -A', '', ROOT_DIR);
    }

    const currentData = loadVersionData();
    const currentVersion = currentData.version;

    // ----------------------------------------------------------------
    // Steps 2–4: Boundary resolution, idempotency pre-check, signal extraction
    // ----------------------------------------------------------------
    console.log('[release] Step 2: Resolving release boundary (latest v*.*.* tag)...');
    const boundary = detectReleaseBoundary({ cwd: ROOT_DIR, versionData: currentData });
    console.log(`  Boundary: ${boundary.boundaryRef} (${boundary.boundarySource})`);

    // ----------------------------------------------------------------
    // Steps 3–5: Idempotency pre-check, signal extraction, scoring
    // ----------------------------------------------------------------
    const existingVersions = new Set([
      ...loadManifestDocument(ROOT_DIR).releases.map((m) => m.version),
      ...(fs.existsSync(CHANGELOG_FILE) ? JSON.parse(fs.readFileSync(CHANGELOG_FILE, 'utf-8')).map((e) => e.version) : [])
    ]);

    console.log('[release] Step 3–5: Idempotency pre-check, multi-signal extraction, deterministic scoring...');
    const classification = classifyRelease({
      changedFiles: boundary.allChangedFiles,
      commits: boundary.commits,
      diffSnippets: boundary.diffSnippets,
      previousVersion: currentVersion,
      existingVersions: Array.from(existingVersions),
      forceType,
      untrackedFiles: boundary.untrackedFiles
    });

    // ----------------------------------------------------------------
    // Step 6: Breaking-change safety gate
    // ----------------------------------------------------------------
    if (classification.blocked && !force) {
      console.error('\n❌ [release:safety] BREAKING-CHANGE AMBIGUITY GATE TRIGGERED');
      console.error('A potentially breaking change was detected, but confidence is insufficient to verify it.');
      console.error('Automated release progression is BLOCKED. Human confirmation is required.');
      console.error('\nDetected (unverified) breaking evidence:');
      classification.breakingChanges.forEach((b) => console.error(`  - ${b}`));
      console.error('\nTo proceed, resolve the ambiguity and re-run, or explicitly confirm with:');
      console.error('  npm run release:major   (verified breaking intent)');
      console.error('  node scripts/release.mjs --ship --force   (explicit override)\n');
      releaseLock(ROOT_DIR);
      process.exit(1);
    }

    const scoring = classification.scoring;
    const releaseType = classification.releaseType; // 'none' | 'patch' | 'minor' | 'major'

    // ----------------------------------------------------------------
    // NONE: no meaningful application change (idempotency)
    // ----------------------------------------------------------------
    if (releaseType === 'none') {
      console.log(`\n==============================================`);
      console.log(`ℹ️  MyFinanceOS Release Intelligence`);
      console.log(`==============================================`);
      console.log(`Release Boundary: ${boundary.boundaryRef}`);
      console.log(`Detected Status:  NO RELEASE REQUIRED (Type: NONE)`);
      console.log(`Current Version:  v${currentVersion}`);
      console.log(`Scoring:          SIS ${scoring.sis}, RMS ${scoring.rms} (${scoring.intensity})`);
      console.log(`Reasoning:        ${classification.reasoning.join(' ')}`);
      console.log(`==============================================\n`);
      console.log(UP_TO_DATE_MESSAGE);

      if (isShip) {
        const branch = getCurrentBranch(ROOT_DIR) || 'main';
        const pushResult = runGit(`git push origin ${branch}`, '', ROOT_DIR);
        if (pushResult) console.log(pushResult);
      }
      releaseLock(ROOT_DIR);
      return { status: 'UP_TO_DATE', version: currentVersion };
    }

    const newVersion = scoring.nextVersion;
    const targetTag = `v${newVersion}`;
    const releaseLabel = getReleaseLabel(scoring.semverType, scoring.minorJump);

    // ----------------------------------------------------------------
    // Step 7: Changelog & manifest generation (evidence-backed only)
    // ----------------------------------------------------------------
    console.log('[release] Step 7: Generating evidence-backed changelog and manifest record...');
    const { categories, summary: generatedSummary } = generateChangelogContent({
      workItems: classification.signals.workItems,
      breakingChanges: classification.breakingChanges,
      productAreas: classification.signals.productAreas
    });
    const summary = manualSummary || generatedSummary;
    const metrics = generateScoringMetrics({
      workItems: classification.signals.workItems,
      meaningfulCommitCount: classification.signals.meaningfulCommitCount
    });

    const headSha = runGit('git rev-parse HEAD', '', ROOT_DIR);
    const releaseRecord = {
      version: newVersion,
      previousVersion: currentVersion,
      tag: targetTag,
      timestamp: new Date().toISOString(),
      semverType: scoring.semverType,
      minorJump: scoring.minorJump,
      scoring: {
        sis: scoring.sis,
        rms: scoring.rms,
        intensity: scoring.intensity,
        productAreasAffected: classification.signals.productAreas,
        metrics
      },
      changelog: {
        summary,
        categories
      },
      releaseLabel
    };

    // ----------------------------------------------------------------
    // Release preview (before any mutation)
    // ----------------------------------------------------------------
    console.log(`\n==============================================`);
    console.log(`🚀 MyFinanceOS Deterministic Release Engine`);
    console.log(`==============================================`);
    console.log(`Release Boundary:  ${boundary.boundaryRef} (${boundary.commits.length} commits, ${boundary.allChangedFiles.length} files)`);
    console.log(`SIS / RMS:         ${scoring.sis} / ${scoring.rms} → ${scoring.intensity}`);
    console.log(`RMS Breakdown:     ${scoring.rmsBreakdown.basePoints} base points (${classification.signals.workItems.length} work items) + ${scoring.rmsBreakdown.areaBonus} product areas + ${scoring.rmsBreakdown.commitBonus} commit dampener`);
    console.log(`Version Evolution: v${currentVersion} → v${newVersion}`);
    console.log(`Classification:    ${getScoringSummaryLine(scoring)}`);
    console.log(`Release Label:     ${releaseLabel}`);
    console.log(`Summary:           ${summary}`);
    if (classification.breakingChanges.length > 0) {
      console.log(`Breaking Changes:  ${classification.breakingChanges.join('; ')}`);
    }
    console.log(`Product Areas:     ${classification.signals.productAreas.join(', ') || '—'}`);
    console.log(`Scoring Reasoning:`);
    classification.reasoning.forEach((r) => console.log(`  • ${r}`));
    console.log(`==============================================\n`);

    if (previewOnly || dryRun) {
      console.log(`[release] Preview/Dry-run completed. Zero files modified. Zero git state changed.`);
      releaseLock(ROOT_DIR);
      return {
        status: 'preview',
        currentVersion,
        nextVersion: newVersion,
        releaseType,
        scoring,
        releaseLabel,
        summary,
        categories
      };
    }

    // ----------------------------------------------------------------
    // Version collision protection (local & remote)
    // ----------------------------------------------------------------
    if (hasGitTag(targetTag, ROOT_DIR)) {
      console.error(`✗ Version collision: Local Git tag "${targetTag}" already exists! Halting.`);
      releaseLock(ROOT_DIR);
      process.exit(1);
    }
    if (hasRemoteTag(targetTag, 'origin', ROOT_DIR)) {
      console.error(`✗ Version collision: Remote Git tag "${targetTag}" already exists on origin! Halting.`);
      releaseLock(ROOT_DIR);
      process.exit(1);
    }
    if (hasReleaseRecord(ROOT_DIR, newVersion)) {
      console.error(`✗ Duplicate prevention: release v${newVersion} already recorded in the manifest.`);
      releaseLock(ROOT_DIR);
      process.exit(1);
    }

    // ----------------------------------------------------------------
    // Step 8: Atomic whole-project synchronization (transactional)
    // ----------------------------------------------------------------
    const trackedFiles = [
      VERSION_FILE,
      CHANGELOG_FILE,
      MANIFEST_FILE,
      PUBLIC_CHANGELOG_HTML,
      CHANGELOG_MD,
      ...getPackageJsonPaths(ROOT_DIR)
    ];
    const backups = backupFiles(trackedFiles);

    try {
      console.log('[release] Step 8: Atomically synchronizing release artifacts...');
      synchronizeRelease(releaseRecord, { rootDir: ROOT_DIR, headSha });

      // ----------------------------------------------------------------
      // Step 9: Pre-commit quality checks
      // ----------------------------------------------------------------
      if (!skipChecks) {
        console.log('[release] Step 9: Running pre-commit validation checks (npm run release:check)...');
        execSync('npm run release:check', { cwd: ROOT_DIR, stdio: 'inherit' });
      }

      const readiness = validateReleaseReadiness(ROOT_DIR);
      if (!readiness.ready) {
        throw new Error(`Validation gate failed post-write: ${readiness.issues.join(', ')}`);
      }

      // ----------------------------------------------------------------
      // Step 10: Atomic git commit
      // ----------------------------------------------------------------
      console.log('[release] Step 10: Creating atomic release commit...');
      runGit('git add -A', '', ROOT_DIR);
      runGit(`git commit -m "chore(release): v${newVersion} [skip-release-hook]"`, '', ROOT_DIR);

      // ----------------------------------------------------------------
      // Step 11: Annotated git tag
      // ----------------------------------------------------------------
      console.log('[release] Step 11: Creating annotated git tag...');
      createGitTag(
        targetTag,
        `Release v${newVersion} (Intensity: ${scoring.intensity}, RMS: ${scoring.rms})`,
        'HEAD',
        ROOT_DIR
      );

      console.log(`\n🎉 Successfully released MyFinanceOS v${newVersion}!`);
      console.log(`Tag: ${targetTag}`);

      // ----------------------------------------------------------------
      // Step 12: Remote push (ship mode)
      // ----------------------------------------------------------------
      if (isShip) {
        const branch = getCurrentBranch(ROOT_DIR) || 'main';
        console.log(`\n[release:ship] Step 12: Pushing release commit and tag to origin/${branch}...`);
        runGit(`git push origin ${branch} --follow-tags`, '', ROOT_DIR);

        // Post-push verification
        const remoteCheck = runGit(`git ls-remote --tags origin ${targetTag}`, '', ROOT_DIR);
        if (remoteCheck && remoteCheck.includes(targetTag)) {
          console.log(`✓ Remote verification confirmed: ${targetTag} is live on GitHub.`);
          remoteSynced = true;
        } else {
          console.warn(`⚠ Could not confirm ${targetTag} on origin; verify manually.`);
        }
      } else {
        console.log(`Push changes to GitHub using:`);
        console.log(`  git push && git push origin ${targetTag}\n`);
      }

      // ----------------------------------------------------------------
      // Step 13: Status verification & release scorecard
      // ----------------------------------------------------------------
      const postStatus = runGit('git status --porcelain', '', ROOT_DIR);
      const tagVerify = hasGitTag(targetTag, ROOT_DIR);
      if (postStatus && postStatus.trim() !== '') {
        console.warn(`⚠ Working tree not fully clean after release:\n${postStatus}`);
      }

      printScorecard({
        previousVersion: currentVersion,
        newVersion,
        semverType: scoring.semverType,
        minorJump: scoring.minorJump,
        scoring,
        productAreas: classification.signals.productAreas,
        remoteSynced
      });

      releaseLock(ROOT_DIR);
      return { status: 'released', version: newVersion, tag: targetTag, scoring, summary };
    } catch (err) {
      console.error('[release] Transaction failed. Rolling back modified files...', err.message || err);
      restoreFiles(backups);
      // Restore any staged-but-uncommitted release state to pre-release.
      runGit('git reset', '', ROOT_DIR);
      releaseLock(ROOT_DIR);
      process.exit(1);
    }
  } catch (error) {
    releaseLock(ROOT_DIR);
    throw error;
  }
}

// CLI Argument Parser
const args = process.argv.slice(2);
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('release.mjs')) {
  let forceType = null;
  let checkOnly = false;
  let checkVersionOnly = false;
  let checkChangelogOnly = false;
  let previewOnly = false;
  let dryRun = false;
  let isCi = false;
  let force = false;
  let isShip = false;
  let skipChecks = false;
  let manualSummary = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--patch') forceType = 'patch';
    else if (arg === '--minor') forceType = 'minor';
    else if (arg === '--major') forceType = 'major';
    else if (arg === '--none') forceType = 'none';
    else if (arg === '--preview') previewOnly = true;
    else if (arg === '--dry-run') dryRun = true;
    else if (arg === '--ship' || arg === '--push') isShip = true;
    else if (arg === '--check') checkOnly = true;
    else if (arg === '--check-version') checkVersionOnly = true;
    else if (arg === '--check-changelog') checkChangelogOnly = true;
    else if (arg === '--ci') isCi = true;
    else if (arg === '--force') force = true;
    else if (arg === '--skip-checks') skipChecks = true;
    else if (arg.startsWith('--summary=')) manualSummary = arg.split('=')[1];
  }

  executeRelease({
    forceType,
    manualSummary,
    dryRun,
    previewOnly,
    checkOnly,
    checkVersionOnly,
    checkChangelogOnly,
    isCi,
    force,
    isShip,
    skipChecks
  });
}
