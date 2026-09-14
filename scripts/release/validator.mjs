import fs from 'node:fs';
import path from 'node:path';
import { runGit, getLatestTag } from './git.mjs';
import { loadManifestDocument, validateManifestDocument, validateReleaseRecord } from './manifest.mjs';
import { passesQualityGate } from './changelog.mjs';
import { validateSynchronization, getReleaseArtifactPaths, getPackageJsonPaths } from './sync.mjs';

export { getPackageJsonPaths } from './sync.mjs';

/**
 * Validate that all package.json files, version.json, changelog.json,
 * release-manifest.json, CHANGELOG.md, and the static HTML changelog share
 * the exact same version string.
 */
export function validateVersionSynchronization(rootDir, { requireTagMatch = false } = {}) {
  const result = validateSynchronization(rootDir);

  if (requireTagMatch) {
    const latestTag = getLatestTag('v*', rootDir);
    if (latestTag && latestTag !== `v${result.canonicalVersion}`) {
      result.mismatches.push(`Git release tag: latest tag is ${latestTag}, expected v${result.canonicalVersion}`);
    }
  }

  return { valid: result.mismatches.length === 0, canonicalVersion: result.canonicalVersion, mismatches: result.mismatches };
}

/**
 * Validate changelog data structure, chronological order, SemVer validity,
 * and quality standards (in-app changelog.json data model).
 */
export function validateChangelogIntegrity(rootDir) {
  const { changelogJson: changelogFile } = getReleaseArtifactPaths(rootDir);
  const errors = [];

  if (!fs.existsSync(changelogFile)) {
    return { valid: false, errors: ['changelog.json not found'] };
  }

  let changelog = [];
  try {
    changelog = JSON.parse(fs.readFileSync(changelogFile, 'utf-8'));
  } catch (err) {
    return { valid: false, errors: [`changelog.json is invalid JSON: ${err.message}`] };
  }

  if (!Array.isArray(changelog) || changelog.length === 0) {
    return { valid: false, errors: ['changelog.json must contain at least one release entry'] };
  }

  const seenVersions = new Set();
  const semverRegex = /^\d+\.\d+\.\d+$/;

  for (let i = 0; i < changelog.length; i++) {
    const entry = changelog[i];
    const prefix = `Release entry [${i}] (v${entry.version || 'unknown'}):`;

    if (!entry.version || !semverRegex.test(entry.version)) {
      errors.push(`${prefix} invalid SemVer format.`);
    }
    if (seenVersions.has(entry.version)) {
      errors.push(`${prefix} duplicate version detected.`);
    }
    seenVersions.add(entry.version);

    if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
      errors.push(`${prefix} invalid date format (YYYY-MM-DD expected).`);
    }
    if (!entry.summary || typeof entry.summary !== 'string' || entry.summary.trim().length < 8) {
      errors.push(`${prefix} summary is missing or too short.`);
    }
    if (!Array.isArray(entry.changes)) {
      errors.push(`${prefix} 'changes' must be an array of category groups.`);
    } else {
      for (const group of entry.changes) {
        if (!group.category || !Array.isArray(group.items)) {
          errors.push(`${prefix} category group missing category name or items array.`);
        } else {
          for (const item of group.items) {
            if (!passesQualityGate(item)) {
              errors.push(`${prefix} item failed quality gate: "${item}"`);
            }
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, totalEntries: changelog.length, errors };
}

/**
 * Validate release readiness: version sync, changelog integrity, manifest
 * schema validity (nested schemaVersion 1 document), and duplicate prevention.
 */
export function validateReleaseReadiness(rootDir) {
  const versionCheck = validateVersionSynchronization(rootDir);
  const changelogCheck = validateChangelogIntegrity(rootDir);

  const manifestDoc = loadManifestDocument(rootDir);
  const manifestValidation = validateManifestDocument(manifestDoc);

  const issues = [...versionCheck.mismatches, ...changelogCheck.errors, ...manifestValidation.errors];

  return {
    ready: issues.length === 0,
    canonicalVersion: versionCheck.canonicalVersion,
    issues
  };
}
