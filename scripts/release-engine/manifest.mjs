import fs from 'node:fs';
import path from 'node:path';

export function getManifestFilePath(rootDir) {
  return path.join(rootDir, 'packages', 'shared', 'src', 'release-manifest.json');
}

/**
 * Load release manifest history.
 */
export function loadManifestData(rootDir) {
  const filePath = getManifestFilePath(rootDir);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Validate a single manifest entry.
 */
export function validateManifestEntry(entry) {
  const errors = [];
  if (!entry.version || typeof entry.version !== 'string') errors.push('Missing or invalid version');
  if (!entry.releaseTag || !entry.releaseTag.startsWith('v')) errors.push('Missing or invalid releaseTag');
  if (!entry.releaseType || !['major', 'minor', 'patch', 'none'].includes(entry.releaseType)) {
    errors.push('Invalid releaseType');
  }
  if (!entry.releaseDate || !/^\d{4}-\d{2}-\d{2}$/.test(entry.releaseDate)) {
    errors.push('Invalid releaseDate format (YYYY-MM-DD expected)');
  }
  if (!entry.summary || typeof entry.summary !== 'string') errors.push('Missing or invalid summary');
  if (!Array.isArray(entry.categories)) errors.push('categories must be an array');
  return errors;
}

/**
 * Append a new release manifest to the start of release-manifest.json.
 */
export function recordReleaseManifest(rootDir, newManifest) {
  const filePath = getManifestFilePath(rootDir);
  const manifests = loadManifestData(rootDir);

  // Prevent duplicate version entries in manifest
  const filtered = manifests.filter((m) => m.version !== newManifest.version);
  filtered.unshift(newManifest);

  fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2) + '\n', 'utf-8');
  return newManifest;
}
