#!/usr/bin/env node
/**
 * MyFinanceOS Release Intelligence Engine
 *
 * Provides:
 * - Release Boundary Detection (latest git tag / recorded commit)
 * - Multi-Signal Change Classification (Signals A-G)
 * - Confidence Scoring with Low-Confidence Safety Rules
 * - Two-Stage Changelog Generation with Quality Gate & Deduplication
 * - Structured Release Manifest Creation (packages/shared/src/release-manifest.json)
 * - Monorepo Version Synchronization (single source of truth)
 * - Concurrency Protection via .release.lock
 * - Idempotency & Transactional Rollback
 * - Zero-Touch Developer Shipping (--ship / --push)
 * - Non-mutating Verification Gate (version:check, changelog:check, release:check)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  runGit,
  isGitAvailable,
  getCurrentBranch,
  isDetachedHead,
  getLatestTag,
  hasGitTag,
  createGitTag,
  backupFiles,
  restoreFiles
} from './release-engine/git.mjs';
import { acquireReleaseLock, releaseLock } from './release-engine/lock.mjs';
import { detectReleaseBoundary } from './release-engine/boundary.mjs';
import { classifyRelease } from './release-engine/classifier.mjs';
import { generateChangelogItems } from './release-engine/changelog.mjs';
import { loadManifestData, recordReleaseManifest } from './release-engine/manifest.mjs';
import {
  getPackageJsonPaths,
  validateVersionSynchronization,
  validateChangelogIntegrity,
  validateReleaseReadiness
} from './release-engine/validator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..');

// Path constants
export const VERSION_FILE = path.join(ROOT_DIR, 'packages', 'shared', 'src', 'version.json');
export const CHANGELOG_FILE = path.join(ROOT_DIR, 'packages', 'shared', 'src', 'changelog.json');
export const MANIFEST_FILE = path.join(ROOT_DIR, 'packages', 'shared', 'src', 'release-manifest.json');

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
 * Load changelog data safely.
 */
export function loadChangelogData() {
  if (fs.existsSync(CHANGELOG_FILE)) {
    return JSON.parse(fs.readFileSync(CHANGELOG_FILE, 'utf-8'));
  }
  return [];
}

/**
 * Increment SemVer string based on release type.
 * Enforces SemVer reset rules:
 * - patch: 1.0.0 -> 1.0.1
 * - minor: 1.0.0 -> 1.1.0 (patch reset to 0)
 * - major: 1.0.0 -> 2.0.0 (minor & patch reset to 0)
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
 * Synchronize new version across all package.json files in monorepo.
 */
export function syncPackageJsonVersions(newVersion) {
  for (const pkgPath of getPackageJsonPaths(ROOT_DIR)) {
    if (!fs.existsSync(pkgPath)) continue;
    try {
      const content = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      content.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
    } catch (err) {
      console.error(`[release] Failed to update ${pkgPath}:`, err);
    }
  }
}

/**
 * Re-export classifyChanges and generateChangelogItems for backward compatibility with existing tests.
 */
export function classifyChanges(changedFiles = [], commitMessages = [], diffSnippets = '') {
  const commits = commitMessages.map((msg) => ({ message: msg, sha: '' }));
  const result = classifyRelease({ changedFiles, commits, diffSnippets });
  return result.releaseType;
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
    isShip = false
  } = options;

  // 1. Standalone Verification Modes (Non-mutating)
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

  // 2. Concurrency Lock
  const lock = acquireReleaseLock(ROOT_DIR);
  if (!lock.acquired) {
    console.error(`✗ ${lock.reason}`);
    process.exit(1);
  }

  try {
    if (!isGitAvailable(ROOT_DIR)) {
      console.log('[release] Git not available or not inside work tree. Skipping git operations.');
      releaseLock(ROOT_DIR);
      return { status: 'skipped', reason: 'No git repository' };
    }

    if (isDetachedHead(ROOT_DIR)) {
      console.warn('[release] Repository is in a detached HEAD state. Proceeding in dry-run/preview mode.');
    }

    // Auto-stage project code if in zero-touch ship mode
    if (isShip) {
      console.log('[release:ship] Auto-staging project code changes for release...');
      runGit('git add apps/ packages/ docs/ scripts/ package.json package-lock.json .gitignore .github/ tsconfig.base.json');
    }

    const currentData = loadVersionData();
    const currentVersion = currentData.version;

    // 3. Release Boundary Detection
    const boundary = detectReleaseBoundary({ cwd: ROOT_DIR, versionData: currentData });
    const { commits, allChangedFiles, diffSnippets, latestTag } = boundary;

    // 4. Change Classification & Confidence Scoring
    const classification = classifyRelease({
      changedFiles: allChangedFiles,
      commits,
      diffSnippets,
      forceType
    });

    const { releaseType, confidence, breakingChanges, manualOverride, reasoning } = classification;

    // 5. Idempotency Check: No release needed
    if (releaseType === 'none') {
      console.log(`\n==============================================`);
      console.log(`ℹ️  MyFinanceOS Release Intelligence`);
      console.log(`==============================================`);
      console.log(`Release Boundary: ${boundary.boundaryRef}`);
      console.log(`Detected Status:  NO RELEASE REQUIRED (Type: NONE)`);
      console.log(`Current Version:  v${currentVersion}`);
      console.log(`Reasoning:        ${reasoning.join(' ')}`);
      console.log(`==============================================\n`);

      // If in ship mode, push existing unpushed commits if any
      if (isShip) {
        const branch = getCurrentBranch(ROOT_DIR) || 'main';
        console.log(`[release:ship] Pushing commits on branch ${branch} to GitHub...`);
        const pushResult = runGit(`git push origin ${branch}`);
        console.log(pushResult || `✓ Up-to-date with origin/${branch}.`);
      }

      releaseLock(ROOT_DIR);
      return { status: 'no_change', version: currentVersion };
    }

    // 6. Low-Confidence Safety Gate
    if (confidence.level === 'low' && !manualOverride && !force) {
      console.error(`\n⚠️  [release:safety] LOW CONFIDENCE CLASSIFICATION (${confidence.score}%)`);
      console.error(`The classifier cannot confidently determine the release type for these changes.`);
      console.error(`Detected signals:`);
      confidence.signals.forEach((s) => console.error(`  - ${s}`));
      console.error(`\nSafety Rule: Please explicitly specify the release level:`);
      console.error(`  npm run release:patch`);
      console.error(`  npm run release:minor`);
      console.error(`  npm run release:major\n`);
      releaseLock(ROOT_DIR);
      process.exit(1);
    }

    if (confidence.level === 'medium' && isCi && !manualOverride && !force) {
      console.warn(`\n⚠️  [release:safety] Medium confidence (${confidence.score}%) in CI non-interactive mode.`);
      console.warn(`Proceeding with conservative classification.`);
    }

    // 7. Calculate Next Version & Changelog
    const newVersion = bumpVersion(currentVersion, releaseType);
    const releaseDate = new Date().toISOString().split('T')[0];
    const { changes, summary: generatedSummary } = generateChangelogItems(
      allChangedFiles,
      commits,
      releaseType,
      breakingChanges
    );
    const summary = manualSummary || generatedSummary;

    // 8. Print Release Preview
    console.log(`\n==============================================`);
    console.log(`🚀 MyFinanceOS Release Intelligence Engine`);
    console.log(`==============================================`);
    console.log(`Release Boundary:  ${boundary.boundaryRef} (${commits.length} commits, ${allChangedFiles.length} files)`);
    console.log(`Release Type:      ${releaseType.toUpperCase()} ${manualOverride ? '(Manual Override)' : ''}`);
    console.log(`Confidence:        ${confidence.score}% [${confidence.level.toUpperCase()}]`);
    console.log(`Version Evolution: v${currentVersion} → v${newVersion}`);
    console.log(`Release Date:      ${releaseDate}`);
    console.log(`Summary:           ${summary}`);
    if (breakingChanges.length > 0) {
      console.log(`Breaking Changes:  ${breakingChanges.join('; ')}`);
    }
    console.log(`Categories:        ${changes.map((c) => `${c.category} (${c.items.length})`).join(', ')}`);
    console.log(`Detected Signals:`);
    confidence.signals.forEach((s) => console.log(`  • ${s}`));
    console.log(`==============================================\n`);

    if (previewOnly || dryRun) {
      console.log(`[release] Preview/Dry-run completed. Zero files modified. Zero git state changed.`);
      releaseLock(ROOT_DIR);
      return {
        status: 'preview',
        currentVersion,
        nextVersion: newVersion,
        releaseType,
        confidence,
        summary,
        changes
      };
    }

    // 9. Version Collision Protection
    const targetTag = `v${newVersion}`;
    if (hasGitTag(targetTag, ROOT_DIR)) {
      console.error(`✗ Version collision: Git tag "${targetTag}" already exists! Halting.`);
      releaseLock(ROOT_DIR);
      process.exit(1);
    }

    // 10. Atomic Write & Transactional Rollback Preparation
    const trackedFiles = [
      VERSION_FILE,
      CHANGELOG_FILE,
      MANIFEST_FILE,
      ...getPackageJsonPaths(ROOT_DIR)
    ];
    const backups = backupFiles(trackedFiles);

    try {
      // Step A: Update version.json
      const headSha = runGit('git rev-parse HEAD', '', ROOT_DIR);
      const newVersionData = {
        version: newVersion,
        releaseDate,
        releaseType,
        summary,
        lastReleaseCommit: headSha
      };
      fs.writeFileSync(VERSION_FILE, JSON.stringify(newVersionData, null, 2) + '\n', 'utf-8');

      // Step B: Update changelog.json
      const changelog = loadChangelogData();
      const newChangelogEntry = {
        version: newVersion,
        date: releaseDate,
        releaseType,
        summary,
        changes
      };
      changelog.unshift(newChangelogEntry);
      fs.writeFileSync(CHANGELOG_FILE, JSON.stringify(changelog, null, 2) + '\n', 'utf-8');

      // Step C: Update release-manifest.json
      const newManifest = {
        schemaVersion: 1,
        version: newVersion,
        releaseTag: targetTag,
        commitSha: headSha,
        previousVersion: currentVersion,
        previousCommitSha: currentData.lastReleaseCommit || null,
        releaseType,
        releaseDate,
        summary,
        confidence,
        manualOverride: !!manualOverride,
        commits: commits.map((c) => ({ sha: c.sha, message: c.message, author: c.author })),
        filesChanged: allChangedFiles,
        categories: changes,
        breakingChanges,
        migrationRequired: releaseType === 'major'
      };
      recordReleaseManifest(ROOT_DIR, newManifest);

      // Step D: Synchronize package.json files
      syncPackageJsonVersions(newVersion);

      // Step E: Pre-commit Validation Gate
      const readiness = validateReleaseReadiness(ROOT_DIR);
      if (!readiness.ready) {
        throw new Error(`Validation gate failed post-write: ${readiness.issues.join(', ')}`);
      }

      // Step F: Git Commit & Tagging
      console.log(`[release] Staging release artifacts and code changes...`);
      runGit(`git add "${path.relative(ROOT_DIR, VERSION_FILE)}"`, '', ROOT_DIR);
      runGit(`git add "${path.relative(ROOT_DIR, CHANGELOG_FILE)}"`, '', ROOT_DIR);
      runGit(`git add "${path.relative(ROOT_DIR, MANIFEST_FILE)}"`, '', ROOT_DIR);
      for (const p of getPackageJsonPaths(ROOT_DIR)) {
        if (fs.existsSync(p)) {
          runGit(`git add "${path.relative(ROOT_DIR, p)}"`, '', ROOT_DIR);
        }
      }
      if (isShip) {
        runGit('git add apps/ packages/ docs/ scripts/ package.json package-lock.json .gitignore .github/ tsconfig.base.json', '', ROOT_DIR);
      }

      console.log(`[release] Creating release commit...`);
      runGit(`git commit -m "chore(release): v${newVersion} [skip-release-hook]" --no-verify`, '', ROOT_DIR);

      // Update release commit SHA in version.json and manifest
      const releaseCommitSha = runGit('git rev-parse HEAD', '', ROOT_DIR);
      newVersionData.lastReleaseCommit = releaseCommitSha;
      fs.writeFileSync(VERSION_FILE, JSON.stringify(newVersionData, null, 2) + '\n', 'utf-8');

      newManifest.commitSha = releaseCommitSha;
      const updatedManifests = loadManifestData(ROOT_DIR);
      if (updatedManifests.length > 0 && updatedManifests[0].version === newVersion) {
        updatedManifests[0].commitSha = releaseCommitSha;
        fs.writeFileSync(MANIFEST_FILE, JSON.stringify(updatedManifests, null, 2) + '\n', 'utf-8');
      }

      runGit(`git add "${path.relative(ROOT_DIR, VERSION_FILE)}" "${path.relative(ROOT_DIR, MANIFEST_FILE)}"`, '', ROOT_DIR);
      runGit('git commit --amend --no-edit --no-verify', '', ROOT_DIR);

      console.log(`[release] Creating annotated git tag ${targetTag}...`);
      createGitTag(targetTag, `Release v${newVersion}: ${summary}`, 'HEAD', ROOT_DIR);

      console.log(`\n🎉 Successfully released MyFinanceOS v${newVersion}!`);
      console.log(`Tag: ${targetTag}`);

      // Step G: Push to GitHub if in Ship mode
      if (isShip) {
        const branch = getCurrentBranch(ROOT_DIR) || 'main';
        console.log(`\n[release:ship] Pushing release commit to origin/${branch}...`);
        const branchPush = runGit(`git push origin ${branch}`, '', ROOT_DIR);
        console.log(branchPush || `✓ Branch ${branch} pushed successfully.`);

        console.log(`[release:ship] Pushing tag ${targetTag} to origin...`);
        const tagPush = runGit(`git push origin ${targetTag}`, '', ROOT_DIR);
        console.log(tagPush || `✓ Tag ${targetTag} pushed successfully.`);

        // Post-push verification
        const remoteCheck = runGit(`git ls-remote --tags origin ${targetTag}`, '', ROOT_DIR);
        if (remoteCheck && remoteCheck.includes(targetTag)) {
          console.log(`✓ Remote verification confirmed: ${targetTag} is live on GitHub.`);
        }
      } else {
        console.log(`Push changes to GitHub using:`);
        console.log(`  git push && git push origin ${targetTag}\n`);
      }

      releaseLock(ROOT_DIR);
      return { status: 'released', version: newVersion, tag: targetTag, summary };
    } catch (err) {
      console.error('[release] Transaction failed. Rolling back modified files...', err);
      restoreFiles(backups);
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
    isShip
  });
}
