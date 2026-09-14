/**
 * Whole-Project Release Synchronization
 *
 * Atomically writes one release to every synchronized target:
 *
 *   1. packages/shared/src/version.json      (canonical version source)
 *   2. packages/shared/src/changelog.json    (in-app release data)
 *   3. packages/shared/src/release-manifest.json (nested schemaVersion 1 doc)
 *   4. Root CHANGELOG.md                     (categorized Markdown notes)
 *   5. apps/web/public/changelog.html        (static standalone changelog)
 *   6. package.json + apps/web/package.json + workspace packages
 *
 * All writes happen in-memory first; on any validation failure the caller
 * aborts BEFORE any file is touched (transactional safety). Files are only
 * written after every target artifact validates.
 */

import fs from 'node:fs';
import path from 'node:path';

import { loadManifestDocument, recordReleaseManifest, getManifestFilePath } from './manifest.mjs';
import { categoriesToLegacyArray, passesQualityGate } from './changelog.mjs';
import { getReleaseLabel } from './scoring.mjs';

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

export function getReleaseArtifactPaths(rootDir) {
  return {
    versionJson: path.join(rootDir, 'packages', 'shared', 'src', 'version.json'),
    changelogJson: path.join(rootDir, 'packages', 'shared', 'src', 'changelog.json'),
    manifestJson: getManifestFilePath(rootDir),
    changelogMd: path.join(rootDir, 'CHANGELOG.md'),
    publicHtml: path.join(rootDir, 'apps', 'web', 'public', 'changelog.html')
  };
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Render the root CHANGELOG.md entry for one release.
 * Includes version, date, intensity badge, SIS, RMS, SemVer classification,
 * affected product areas, and categorized changes.
 */
export function renderChangelogMarkdown(release, appChangelogEntries) {
  const {
    version,
    timestamp,
    semverType,
    minorJump,
    scoring,
    changelog,
    previousVersion
  } = release;

  const date = String(timestamp).split('T')[0];
  const lines = [];

  lines.push(`# Changelog`);
  lines.push(``);
  lines.push(`All notable releases of MyFinanceOS. Every version below is computed deterministically from Git evidence (SIS/RMS scoring) — never hand-picked.`);
  lines.push(``);

  lines.push(`## [v${version}] — ${date}`);
  lines.push(``);
  lines.push(
    `**${semverType}${semverType === 'MINOR' ? ` (+${minorJump})` : ''}** · **Intensity:** ${scoring.intensity} · **RMS:** ${scoring.rms} · **SIS:** ${scoring.sis}`
  );
  if (previousVersion) {
    lines.push(``);
    lines.push(`Progression: \`v${previousVersion} → v${version}\``);
  }
  if (scoring.productAreasAffected.length > 0) {
    lines.push(``);
    lines.push(`**Product areas affected:** ${scoring.productAreasAffected.join(', ')}`);
  }
  lines.push(``);
  lines.push(changelog.summary);
  lines.push(``);

  const CATEGORY_LABELS = [
    ['breaking', '⚠️ Breaking Changes'],
    ['features', '✨ Features'],
    ['improvements', '💎 Improvements'],
    ['fixes', '🐞 Bug Fixes'],
    ['performance', '⚡ Performance'],
    ['reliability', '🛡️ Reliability'],
    ['ui', '🎨 UI/UX'],
    ['accessibility', '♿ Accessibility'],
    ['security', '🔒 Security']
  ];
  for (const [key, label] of CATEGORY_LABELS) {
    const items = changelog.categories[key] || [];
    if (items.length === 0) continue;
    lines.push(`### ${label}`);
    lines.push(``);
    for (const item of items) {
      lines.push(`- ${item}`);
    }
    lines.push(``);
  }

  // Historical entries from the app changelog data (excluding the new one).
  for (const entry of appChangelogEntries) {
    if (entry.version === version) continue;
    lines.push(`## [v${entry.version}] — ${entry.date}`);
    lines.push(``);
    const label = entry.releaseLabel || getReleaseLabel(String(entry.releaseType).toUpperCase(), entry.versionJump?.minor || 0);
    lines.push(`**${label}**${entry.subsystems?.length ? ` · ${entry.subsystems.join(', ')}` : ''}`);
    lines.push(``);
    lines.push(entry.summary);
    lines.push(``);
    for (const group of entry.changes || []) {
      if (!group.items || group.items.length === 0) continue;
      lines.push(`### ${group.category}`);
      lines.push(``);
      for (const item of group.items) {
        lines.push(`- ${item}`);
      }
      lines.push(``);
    }
  }

  return lines.join('\n').trimEnd() + '\n';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render the static standalone changelog HTML (preserving the existing
 * visual language and design tokens of apps/web/public/changelog.html).
 */
export function renderStaticChangelogHtml(entries, { templateHtml = null } = {}) {
  const latest = entries[0];
  if (!latest) return templateHtml || '';

  const cardsHtml = entries
    .map((entry, index) => {
      const isLatest = index === 0;
      const releaseTypeLabel =
        entry.releaseLabel ||
        (String(entry.releaseType).charAt(0).toUpperCase() + String(entry.releaseType).slice(1) + ' release');
      const tagClass =
        entry.versionJump && entry.versionJump.minor >= 2 && entry.releaseType === 'minor'
          ? 'minor-substantial'
          : entry.releaseType;

      const subsystemsHtml =
        entry.subsystems && entry.subsystems.length > 0
          ? `                <div class="subsystems-row" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
${entry.subsystems.map((s) => `                    <span class="subsystem-pill" style="font-size: 11px; padding: 2px 8px; border-radius: 6px; background: rgba(124, 58, 237, 0.08); border: 1px solid rgba(124, 58, 237, 0.2); font-weight: 600;">${escapeHtml(s)}</span>`).join('\n')}
                </div>`
          : '';

      const intensityHtml =
        entry.releaseIntensity
          ? `                <div class="highlights-row" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;">
                    <span class="highlight-chip" style="font-size: 11.5px; padding: 4px 10px; border-radius: 6px; background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.2);"><strong style="font-size: 10px; text-transform: uppercase;">Intensity:</strong> <span style="font-weight: 700; color: var(--accent-cyan); font-variant-numeric: tabular-nums;">${escapeHtml(entry.releaseIntensity)}</span></span>
${entry.highlights?.map((h) => `                    <span class="highlight-chip" style="font-size: 11.5px; padding: 4px 10px; border-radius: 6px; background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.2);"><strong style="font-size: 10px; text-transform: uppercase;">${escapeHtml(h.label)}:</strong> <span style="font-weight: 700; color: var(--accent-cyan); font-variant-numeric: tabular-nums;">${escapeHtml(h.value)}</span></span>`).join('\n') || ''}
                </div>`
          : '';

      const categoryBlocks = (entry.changes || [])
        .filter((c) => Array.isArray(c.items) && c.items.length > 0)
        .map((group) => {
          const items = group.items
            .map((item) => `                        <li class="bullet-item"><span class="bullet-dot"></span><span>${escapeHtml(item)}</span></li>`)
            .join('\n');
          return `                <div class="category-block">
                    <div class="category-title">
                        <span>${escapeHtml(group.category)}</span>
                    </div>
                    <ul class="bullet-list">
${items}
                    </ul>
                </div>`;
        })
        .join('\n');

      return `            <!-- Release v${entry.version} -->
            <article class="release-card" id="v${entry.version}">
                <div class="card-header">
                    <div class="version-group">
                        <h2 class="version-tag">v${entry.version}</h2>
                        ${isLatest ? '<span class="tag-pill tag-latest">Latest</span>' : ''}
                        <span class="tag-pill tag-${tagClass}">${escapeHtml(releaseTypeLabel)}</span>
                    </div>
                    <time class="date-str">${escapeHtml(entry.date)}</time>
                </div>
${subsystemsHtml}
                <p class="summary-text">${escapeHtml(entry.summary)}</p>
${intensityHtml}
${categoryBlocks}
            </article>`;
    })
    .join('\n\n');

  // When a template is supplied, splice cards + metrics into it; otherwise
  // return a minimal standalone document.
  if (templateHtml) {
    let html = templateHtml;
    const metricsRegex = /<div class="metrics-shelf">[\s\S]*?<\/div>\s*<\/header>/;
    const newMetricsShelf = `<div class="metrics-shelf">
                <div class="metric-item">
                    <span class="metric-label">Current Version</span>
                    <span class="metric-value" style="color: var(--accent-cyan);">v${escapeHtml(latest.version)}</span>
                </div>
                <div class="metric-divider"></div>
                <div class="metric-item">
                    <span class="metric-label">Release Date</span>
                    <span class="metric-value">${escapeHtml(latest.date)}</span>
                </div>
                <div class="metric-divider"></div>
                <div class="metric-item">
                    <span class="metric-label">Recorded Releases</span>
                    <span class="metric-value" style="color: var(--accent-emerald);">${entries.length}</span>
                </div>
            </div>
        </header>`;
    html = html.replace(metricsRegex, newMetricsShelf);

    const mainRegex = /<main class="release-list">[\s\S]*?<\/main>/;
    const newMain = `<main class="release-list">\n${cardsHtml}\n        </main>`;
    html = html.replace(mainRegex, newMain);
    return html;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Changelog &amp; Product Release History - MyFinanceOS</title>
    <style>body{font-family:Inter,system-ui,sans-serif;background:hsl(222,10%,8%);color:hsl(0,0%,98%);margin:0;padding:40px 20px;}</style>
</head>
<body>
<main class="release-list">
${cardsHtml}
</main>
</body>
</html>`;
}

/**
 * Synchronize the complete release state across every target atomically.
 *
 * @param {object} release  The task-schema release record.
 * @param {object} options   { rootDir, headSha }
 */
export function synchronizeRelease(release, { rootDir, headSha = '' } = {}) {
  const paths = getReleaseArtifactPaths(rootDir);

  // ---- 1. Compute every artifact content in memory first (atomicity) ----
  const existingChangelog = fs.existsSync(paths.changelogJson)
    ? JSON.parse(fs.readFileSync(paths.changelogJson, 'utf-8'))
    : [];

  // New in-app changelog entry (legacy-compatible shape consumed by
  // ChangelogView.tsx and changelog/page.tsx via @financeos/shared).
  const legacyChanges = categoriesToLegacyArray(release.changelog.categories);
  if (legacyChanges.length === 0) {
    legacyChanges.push({
      category: release.semverType === 'MINOR' || release.semverType === 'MAJOR' ? 'Features' : 'Improvements',
      items: [release.changelog.summary]
    });
  }
  const newAppEntry = {
    version: release.version,
    date: String(release.timestamp).split('T')[0],
    releaseType: release.semverType.toLowerCase(),
    releaseLabel: release.releaseLabel,
    summary: release.changelog.summary,
    gitTag: release.tag,
    commitHash: headSha ? String(headSha).substring(0, 7) : undefined,
    versionJump: {
      major: semverDiff(release.previousVersion, release.version, 'major'),
      minor: semverDiff(release.previousVersion, release.version, 'minor'),
      patch: semverDiff(release.previousVersion, release.version, 'patch')
    },
    releaseIntensity: release.scoring.intensity,
    subsystems: release.scoring.productAreasAffected,
    changes: legacyChanges
  };

  const updatedChangelog = [newAppEntry, ...existingChangelog.filter((e) => e.version !== release.version)];

  const newVersionJson = {
    version: release.version,
    releaseDate: String(release.timestamp).split('T')[0],
    releaseType: release.semverType.toLowerCase(),
    releaseIntensity: release.scoring.intensity,
    versionJump: newAppEntry.versionJump,
    releaseLabel: release.releaseLabel,
    summary: release.changelog.summary,
    lastReleaseCommit: headSha
  };

  const changelogMd = renderChangelogMarkdown(release, existingChangelog);

  const templateHtml = fs.existsSync(paths.publicHtml) ? fs.readFileSync(paths.publicHtml, 'utf-8') : null;
  const publicHtml = renderStaticChangelogHtml(updatedChangelog, { templateHtml });

  const packageUpdates = getPackageJsonPaths(rootDir)
    .filter((p) => fs.existsSync(p))
    .map((p) => {
      const pkg = JSON.parse(fs.readFileSync(p, 'utf-8'));
      pkg.version = release.version;
      return { path: p, content: JSON.stringify(pkg, null, 2) + '\n' };
    });

  // ---- 2. Validate before writing anything (pre-commit gate safety) ----
  const invalidItems = updatedChangelog[0].changes.flatMap((g) => g.items.filter((i) => !passesQualityGate(i)));
  if (invalidItems.length > 0) {
    throw new Error(`Quality gate rejected changelog items: ${invalidItems.join(' | ')}`);
  }
  if (updatedChangelog.some((e) => e.version === release.version && e !== newAppEntry)) {
    throw new Error(`Duplicate changelog entry detected for v${release.version}`);
  }

  // ---- 3. Commit all writes (single transaction; failures roll back via caller) ----
  writeJson(paths.versionJson, newVersionJson);
  writeJson(paths.changelogJson, updatedChangelog);
  fs.writeFileSync(paths.changelogMd, changelogMd, 'utf-8');
  if (publicHtml) {
    fs.writeFileSync(paths.publicHtml, publicHtml, 'utf-8');
  }
  for (const { path: p, content } of packageUpdates) {
    fs.writeFileSync(p, content, 'utf-8');
  }

  // Manifest write goes through its own validated append (duplicate-safe).
  recordReleaseManifest(rootDir, release);

  return { updatedChangelog, newVersionJson, changelogMd, publicHtml, packageUpdates };
}

function semverDiff(a, b, component) {
  const pa = String(a || '0.0.0').split('.').map((n) => parseInt(n, 10));
  const pb = String(b || '0.0.0').split('.').map((n) => parseInt(n, 10));
  if (component === 'major') return (pb[0] || 0) - (pa[0] || 0);
  if (component === 'minor') return (pb[1] || 0) - (pa[1] || 0);
  return (pb[2] || 0) - (pa[2] || 0);
}

/**
 * Validate synchronization across every artifact: all versions must agree,
 * no duplicates, manifest schema valid, and changelog quality gate satisfied.
 */
export function validateSynchronization(rootDir) {
  const paths = getReleaseArtifactPaths(rootDir);
  const mismatches = [];

  const versionData = fs.existsSync(paths.versionJson)
    ? JSON.parse(fs.readFileSync(paths.versionJson, 'utf-8'))
    : null;
  if (!versionData) {
    return { valid: false, canonicalVersion: null, mismatches: ['version.json does not exist'] };
  }
  const canonicalVersion = versionData.version;

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

  if (fs.existsSync(paths.changelogJson)) {
    try {
      const changelog = JSON.parse(fs.readFileSync(paths.changelogJson, 'utf-8'));
      if (Array.isArray(changelog) && changelog.length > 0) {
        if (changelog[0].version !== canonicalVersion) {
          mismatches.push(`changelog.json: latest version is ${changelog[0].version}, expected ${canonicalVersion}`);
        }
        const seen = new Set();
        for (const e of changelog) {
          if (seen.has(e.version)) mismatches.push(`changelog.json: duplicate entry ${e.version}`);
          seen.add(e.version);
          for (const group of e.changes || []) {
            for (const item of group.items || []) {
              if (!passesQualityGate(item)) mismatches.push(`changelog.json v${e.version}: item failed quality gate: "${item}"`);
            }
          }
        }
      } else {
        mismatches.push('changelog.json is empty or not an array');
      }
    } catch (err) {
      mismatches.push(`changelog.json parse error: ${err.message}`);
    }
  } else {
    mismatches.push('changelog.json not found');
  }

  const manifestDoc = loadManifestDocument(rootDir);
  if (manifestDoc.releases.length > 0) {
    if (manifestDoc.releases[0].version !== canonicalVersion) {
      mismatches.push(
        `release-manifest.json: latest version is ${manifestDoc.releases[0].version}, expected ${canonicalVersion}`
      );
    }
    if (manifestDoc.schemaVersion !== 1) mismatches.push('release-manifest.json: schemaVersion must be 1');
  } else {
    mismatches.push('release-manifest.json: no release records');
  }

  if (fs.existsSync(paths.changelogMd)) {
    const md = fs.readFileSync(paths.changelogMd, 'utf-8');
    if (!md.includes(`## [v${canonicalVersion}]`)) {
      mismatches.push(`CHANGELOG.md: missing entry for v${canonicalVersion}`);
    }
  } else {
    mismatches.push('CHANGELOG.md not found');
  }

  if (fs.existsSync(paths.publicHtml)) {
    const html = fs.readFileSync(paths.publicHtml, 'utf-8');
    if (!html.includes(`id="v${canonicalVersion}"`)) {
      mismatches.push(`apps/web/public/changelog.html: missing release card for v${canonicalVersion}`);
    }
  } else {
    mismatches.push('apps/web/public/changelog.html not found');
  }

  return { valid: mismatches.length === 0, canonicalVersion, mismatches };
}
