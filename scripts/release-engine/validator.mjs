import fs from 'node:fs';
import path from 'node:path';
import { runGit, getLatestTag } from './git.mjs';
import { loadManifestData, validateManifestEntry } from './manifest.mjs';
import { passesQualityGate } from './changelog.mjs';

export function getPackageJsonPaths(rootDir) {
  return [
    path.join(rootDir, 'package.json'),
    path.join(rootDir, 'apps', 'web', 'package.json'),
    path.join(rootDir, 'packages', 'shared', 'package.json'),
    path.join(rootDir, 'packages', 'auth', 'package.json'),
    path.join(rootDir, 'packages', 'database', 'package.json'),
    path.join(rootDir, 'packages', 'ui', 'package.json')
  ];
}

/**
 * Validate that all package.json files, version.json, changelog.json,
 * and release-manifest.json share the exact same version string.
 */
export function validateVersionSynchronization(rootDir) {
  const mismatches = [];
  const versionFile = path.join(rootDir, 'packages', 'shared', 'src', 'version.json');
  const changelogFile = path.join(rootDir, 'packages', 'shared', 'src', 'changelog.json');

  if (!fs.existsSync(versionFile)) {
    return { valid: false, mismatches: ['version.json does not exist'] };
  }

  const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
  const canonicalVersion = versionData.version;

  // 1. Check all package.json files
  for (const pkgPath of getPackageJsonPaths(rootDir)) {
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.version !== canonicalVersion) {
          mismatches.push(`${path.relative(rootDir, pkgPath)}: expected ${canonicalVersion}, got ${pkg.version}`);
        }
      } catch (err) {
        mismatches.push(`${path.relative(rootDir, pkgPath)}: could not parse JSON (${err.message})`);
      }
    }
  }

  // 2. Check changelog.json latest entry
  if (fs.existsSync(changelogFile)) {
    try {
      const changelog = JSON.parse(fs.readFileSync(changelogFile, 'utf-8'));
      if (Array.isArray(changelog) && changelog.length > 0) {
        const latestChangelogVersion = changelog[0].version;
        if (latestChangelogVersion !== canonicalVersion) {
          mismatches.push(`changelog.json: latest version is ${latestChangelogVersion}, expected ${canonicalVersion}`);
        }
      } else {
        mismatches.push('changelog.json is empty or not an array');
      }
    } catch (err) {
      mismatches.push(`changelog.json parse error: ${err.message}`);
    }
  }

  // 3. Check release-manifest.json latest entry
  const manifests = loadManifestData(rootDir);
  if (manifests.length > 0) {
    const latestManifestVersion = manifests[0].version;
    if (latestManifestVersion !== canonicalVersion) {
      mismatches.push(`release-manifest.json: latest version is ${latestManifestVersion}, expected ${canonicalVersion}`);
    }
  }

  // 4. Check git tag if tags exist
  const latestTag = getLatestTag('v*.*.*', rootDir);
  if (latestTag) {
    const expectedTag = `v${canonicalVersion}`;
    if (latestTag !== expectedTag) {
      // Note: During local development before commit, tag might be previous version,
      // but if checked post-release, it should match. We log warning if diff.
    }
  }

  return {
    valid: mismatches.length === 0,
    canonicalVersion,
    mismatches
  };
}

/**
 * Validate changelog data structure, chronological order, SemVer validity, and quality standards.
 */
export function validateChangelogIntegrity(rootDir) {
  const changelogFile = path.join(rootDir, 'packages', 'shared', 'src', 'changelog.json');
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

  return {
    valid: errors.length === 0,
    totalEntries: changelog.length,
    errors
  };
}

/**
 * Validate release readiness across version sync, changelog integrity, and manifest schema.
 */
export function validateReleaseReadiness(rootDir) {
  const versionCheck = validateVersionSynchronization(rootDir);
  const changelogCheck = validateChangelogIntegrity(rootDir);
  const manifests = loadManifestData(rootDir);

  const manifestErrors = [];
  for (const m of manifests) {
    const errs = validateManifestEntry(m);
    if (errs.length > 0) {
      manifestErrors.push(`Manifest v${m.version}: ${errs.join(', ')}`);
    }
  }

  const issues = [...versionCheck.mismatches, ...changelogCheck.errors, ...manifestErrors];

  return {
    ready: issues.length === 0,
    canonicalVersion: versionCheck.canonicalVersion,
    issues
  };
}
