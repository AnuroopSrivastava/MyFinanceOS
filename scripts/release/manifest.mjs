import fs from 'node:fs';
import path from 'node:path';

export const MANIFEST_SCHEMA_VERSION = 1;

export function getManifestFilePath(rootDir) {
  return path.join(rootDir, 'packages', 'shared', 'src', 'release-manifest.json');
}

/**
 * Load the nested manifest document ({ schemaVersion, releases: [...] }).
 * Handles both the current nested schema and the legacy flat array format
 * (transparently wrapped for backward compatibility during reads).
 */
export function loadManifestDocument(rootDir) {
  const filePath = getManifestFilePath(rootDir);
  if (!fs.existsSync(filePath)) {
    return { $schema: 'https://json-schema.org/draft/2020-12/schema', schemaVersion: MANIFEST_SCHEMA_VERSION, releases: [] };
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return { $schema: 'https://json-schema.org/draft/2020-12/schema', schemaVersion: MANIFEST_SCHEMA_VERSION, releases: [] };
  }
  if (Array.isArray(parsed)) {
    // Legacy flat array: wrap into the nested schema shape.
    return { $schema: 'https://json-schema.org/draft/2020-12/schema', schemaVersion: MANIFEST_SCHEMA_VERSION, releases: parsed };
  }
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.releases)) {
    return parsed;
  }
  return { $schema: 'https://json-schema.org/draft/2020-12/schema', schemaVersion: MANIFEST_SCHEMA_VERSION, releases: [] };
}

/**
 * Back-compat accessor: release list (newest first).
 */
export function loadManifestData(rootDir) {
  return loadManifestDocument(rootDir).releases;
}

/**
 * Validate a single release record against the deterministic schema contract
 * (Section 3). Legacy entries created before the SIS/RMS engine are
 * validated on their legacy fields only.
 */
export function validateReleaseRecord(entry) {
  const errors = [];
  if (!entry.version || !/^\d+\.\d+\.\d+$/.test(entry.version)) errors.push('Missing or invalid version');
  if (!entry.tag || !entry.tag.startsWith('v')) errors.push('Missing or invalid tag');
  if (!entry.timestamp || !/^\d{4}-\d{2}-\d{2}T/.test(entry.timestamp)) errors.push('Missing or invalid timestamp');
  if (!entry.semverType || !['MAJOR', 'MINOR', 'PATCH', 'NONE'].includes(entry.semverType)) {
    errors.push('Invalid semverType');
  }
  if (typeof entry.minorJump !== 'number' || entry.minorJump < 0) errors.push('Invalid minorJump');

  const isLegacyEntry = entry.scoring === undefined;
  if (isLegacyEntry) {
    if (!entry.releaseDate || !/^\d{4}-\d{2}-\d{2}$/.test(entry.releaseDate)) errors.push('Invalid releaseDate (legacy)');
    if (!Array.isArray(entry.categories)) errors.push('categories must be an array (legacy)');
    return errors;
  }

  // Deterministic scoring block (all releases created by the SIS/RMS engine).
  const sc = entry.scoring || {};
  if (typeof sc.sis !== 'number' || sc.sis < 0) errors.push('scoring.sis must be a non-negative number');
  if (typeof sc.rms !== 'number' || sc.rms < 0) errors.push('scoring.rms must be a non-negative number');
  if (
    !sc.intensity ||
    !['TRIVIAL', 'SMALL', 'NORMAL', 'SUBSTANTIAL', 'VERY_SUBSTANTIAL', 'EXCEPTIONAL'].includes(sc.intensity)
  ) {
    errors.push('Invalid scoring.intensity');
  }
  if (!Array.isArray(sc.productAreasAffected)) errors.push('scoring.productAreasAffected must be an array');
  if (!sc.metrics || typeof sc.metrics !== 'object') {
    errors.push('scoring.metrics must be an object');
  } else {
    const metricKeys = ['bugFixes', 'uiImprovements', 'newFeatures', 'newWorkflows', 'integrations', 'commits'];
    for (const k of metricKeys) {
      if (typeof sc.metrics[k] !== 'number' || sc.metrics[k] < 0) {
        errors.push(`scoring.metrics.${k} must be a non-negative number`);
      }
    }
  }

  // Internal consistency: version, previousVersion, tag, semverType, minorJump.
  if (entry.previousVersion && entry.previousVersion !== '0.0.0') {
    const [pmaj, pmin, ppat] = entry.previousVersion.split('.').map((n) => parseInt(n, 10));
    const [maj, min, pat] = entry.version.split('.').map((n) => parseInt(n, 10));
    if (entry.tag !== `v${entry.version}`) errors.push('tag must equal "v" + version');
    if (entry.semverType === 'MAJOR') {
      if (min !== 0 || pat !== 0) errors.push('MAJOR must reset MINOR and PATCH to 0');
      if (maj !== pmaj + 1) errors.push('MAJOR must be previous major + 1');
    } else if (entry.semverType === 'MINOR') {
      if (pat !== 0) errors.push('MINOR must reset PATCH to 0');
      if (min !== pmin + entry.minorJump) errors.push('MINOR version must equal previous minor + minorJump');
      if (entry.minorJump < 1 || entry.minorJump > 4) errors.push('minorJump must be within [1, 4] (hard cap +4)');
    } else if (entry.semverType === 'PATCH') {
      if (entry.minorJump !== 0) errors.push('PATCH must have minorJump 0');
      if (pat !== ppat + 1) errors.push('PATCH must be previous patch + 1');
    }
  }

  // Changelog block.
  if (!entry.changelog || typeof entry.changelog !== 'object') {
    errors.push('Missing changelog block');
  } else {
    if (!entry.changelog.summary || typeof entry.changelog.summary !== 'string') errors.push('changelog.summary missing');
    if (!entry.changelog.categories || typeof entry.changelog.categories !== 'object') {
      errors.push('changelog.categories must be an object');
    } else {
      for (const [cat, items] of Object.entries(entry.changelog.categories)) {
        if (!Array.isArray(items)) errors.push(`changelog.categories.${cat} must be an array`);
      }
    }
  }

  return errors;
}

/**
 * Validate the whole manifest document: nested schema, schemaVersion 1,
 * every release record, duplicate prevention, and ordering consistency.
 */
export function validateManifestDocument(doc) {
  const errors = [];
  if (!doc || typeof doc !== 'object') return { valid: false, errors: ['Manifest is not an object'] };
  if (doc.schemaVersion !== MANIFEST_SCHEMA_VERSION) errors.push(`schemaVersion must be ${MANIFEST_SCHEMA_VERSION}`);
  if (!Array.isArray(doc.releases)) return { valid: false, errors: [...errors, 'releases must be an array'] };

  const seen = new Set();
  doc.releases.forEach((entry, i) => {
    const entryErrors = validateReleaseRecord(entry);
    for (const e of entryErrors) errors.push(`releases[${i}] (v${entry.version || 'unknown'}): ${e}`);
    if (entry.version && seen.has(entry.version)) {
      errors.push(`releases[${i}]: duplicate version ${entry.version}`);
    }
    seen.add(entry.version);
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Append a new release record (newest first) to the manifest, preserving all
 * existing releases and schemaVersion 1. Duplicate versions are rejected.
 */
export function recordReleaseManifest(rootDir, newRelease) {
  const filePath = getManifestFilePath(rootDir);
  const doc = loadManifestDocument(rootDir);

  if (doc.releases.some((r) => r.version === newRelease.version)) {
    throw new Error(`Duplicate release prevented: v${newRelease.version} already recorded in the manifest.`);
  }

  const releases = [newRelease, ...doc.releases];
  const updated = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    releases
  };

  const validation = validateManifestDocument(updated);
  if (!validation.valid) {
    throw new Error(`Manifest validation failed before write: ${validation.errors.join('; ')}`);
  }

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
  return newRelease;
}

/**
 * Check whether a release for a given version already exists.
 */
export function hasReleaseRecord(rootDir, version) {
  return loadManifestDocument(rootDir).releases.some((r) => r.version === version);
}
