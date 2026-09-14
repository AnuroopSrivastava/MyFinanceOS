import { runGit, getLatestTag, isGitCommit } from './git.mjs';

// Sensitive patterns to strictly exclude from release analysis
const SENSITIVE_FILE_PATTERNS = [
  /(^|\/)\.env(\..+)?$/i,
  /credentials/i,
  /\.pem$/i,
  /\.key$/i,
  /\.pfx$/i,
  /\.p12$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /service-account.*\.json$/i,
  /secrets?/i,
  /token/i,
  /auth_token/i,
  /\.cert$/i,
  /\.crt$/i
];

// Internal non-release paths
const INTERNAL_METADATA_PATHS = [
  'graphify-out/',
  '.github/',
  '.vscode/',
  '.agents/',
  '.claude/',
  '.codex/',
  '.kiro/',
  '.zcode/',
  '.emergent/',
  '.impeccable/',
  '.preview/',
  '.release.lock',
  'trace.json.gz',
  'posthog-self-driving-report.md',
  'scratch/',
  'coverage/',
  'playwright-report/',
  '.temp/',
  '.tmp/'
];

// Release-generated artifacts: never count as release-boundary input
// (prevents the release pipeline from re-triggering itself).
const RELEASE_ARTIFACT_RE = [
  /(^|\/)CHANGELOG\.md$/i,
  /(^|\/)version\.json$/i,
  /(^|\/)changelog\.json$/i,
  /(^|\/)release-manifest\.json$/i,
  /(^|\/)changelog\.html$/i
];

/**
 * Check if a file should be ignored from release boundary calculations.
 */
export function isIgnoredFile(filePath) {
  const norm = String(filePath || '').replace(/\\/g, '/');

  for (const pattern of SENSITIVE_FILE_PATTERNS) {
    if (pattern.test(norm)) return true;
  }
  for (const internalPath of INTERNAL_METADATA_PATHS) {
    if (norm.startsWith(internalPath) || norm.includes(`/${internalPath}`)) return true;
  }
  // Legacy root-location guard kept for safety alongside the shared-package copy.
  if (RELEASE_ARTIFACT_RE.some((re) => re.test(norm))) return true;

  if (norm === '.gitignore' || norm === '.gitattributes' || norm === '.gitconfig') return true;

  return false;
}

/**
 * Resolve the release boundary deterministically:
 *   1. `git describe --tags --abbrev=0 --match "v*.*.*"` (latest SemVer tag)
 *   2. Fallback: sorted SemVer tag list
 *   3. Fallback: recorded release commit from version.json (when valid)
 *   4. Fallback: repository root commit (`git rev-list --max-parents=0 HEAD`)
 */
export function resolveReleaseBoundaryRef({ cwd = process.cwd(), versionData = null } = {}) {
  // 1. Latest SemVer tag via git describe (strict match pattern).
  const described = runGit('git describe --tags --abbrev=0 --match "v*.*.*"', '', cwd);
  if (described && /^v\d+\.\d+\.\d+$/.test(described)) {
    return { ref: described, source: 'git-describe' };
  }

  // 2. Fallback to sorted tag list (identical result when describe is usable).
  const latestTag = getLatestTag('v*', cwd);
  if (latestTag) {
    return { ref: latestTag, source: 'tag-list' };
  }

  // 3. Recorded release commit.
  const recordedCommit = versionData?.lastReleaseCommit;
  if (recordedCommit && isGitCommit(recordedCommit, cwd)) {
    return { ref: recordedCommit, source: 'recorded-commit' };
  }

  // 4. Repository root commit.
  const firstCommit = runGit('git rev-list --max-parents=0 HEAD', '', cwd);
  if (firstCommit) {
    return { ref: firstCommit, source: 'root-commit' };
  }

  return { ref: 'HEAD~1', source: 'fallback' };
}

/**
 * Detect release boundary and gather commit and diff information since the
 * last release, including staged/unstaged working-tree changes.
 */
export function detectReleaseBoundary({ cwd = process.cwd(), versionData = null } = {}) {
  const { ref: boundaryRef, source: boundarySource } = resolveReleaseBoundaryRef({ cwd, versionData });
  const latestTag = /^v\d+\.\d+\.\d+$/.test(boundaryRef) ? boundaryRef : getLatestTag('v*', cwd);

  const range = `${boundaryRef}..HEAD`;

  // 1. Commit log since boundary, with per-commit file lists for product-area
  //    attribution (subject line + --name-only files).
  const rawLog = runGit(`git log ${range} --no-merges --pretty=format:"%h%x09%an%x09%s" --name-only`, '', cwd);
  const commits = [];
  if (rawLog) {
    let current = null;
    for (const line of rawLog.split('\n')) {
      if (/^[0-9a-f]{7,40}\t/.test(line)) {
        const parts = line.split('\t');
        current = {
          sha: parts[0].trim(),
          author: parts[1].trim(),
          message: parts.slice(2).join('\t').trim(),
          files: []
        };
        commits.push(current);
      } else if (current && line.trim()) {
        current.files.push(line.trim().replace(/\\/g, '/'));
      }
    }
  }

  // Filter out release automation commits from re-triggering releases.
  const releasableCommits = commits.filter(
    (c) => !c.message.startsWith('chore(release):') && !c.message.includes('[skip-release-hook]')
  );

  // 2. Changed files in the tag range.
  const rawDiffFiles = runGit(`git diff --name-only ${range}`, '', cwd);
  const rangeChangedFiles = rawDiffFiles ? rawDiffFiles.split('\n').map((f) => f.trim()).filter(Boolean) : [];

  // 3. Staged and uncommitted working tree changes.
  const rawStatus = runGit('git status --porcelain', '', cwd);
  const stagedFiles = [];
  const unstagedFiles = [];
  const untrackedFiles = [];

  if (rawStatus) {
    for (const line of rawStatus.split('\n')) {
      const indexCode = line[0];
      const workTreeCode = line[1];
      const file = line.slice(2).trim();

      if (indexCode === '?' && workTreeCode === '?') {
        untrackedFiles.push(file);
      } else {
        if (indexCode && indexCode !== ' ' && indexCode !== '?') {
          stagedFiles.push(file);
        }
        if (workTreeCode && workTreeCode !== ' ' && workTreeCode !== '?') {
          unstagedFiles.push(file);
        }
      }
    }
  }

  // Combine all changed files, filtering out secrets, noise, and release artifacts.
  const allChangedFiles = Array.from(
    new Set([...rangeChangedFiles, ...stagedFiles, ...unstagedFiles, ...untrackedFiles])
  ).filter((f) => !isIgnoredFile(f));

  // 4. Diff snippets for semantic analysis: range diff + staged + working tree.
  const rangeDiff = runGit(`git diff ${range}`, '', cwd);
  const stagedDiff = runGit('git diff --cached', '', cwd);
  const workingTreeDiff = runGit('git diff', '', cwd);
  const diffSnippets = [rangeDiff, stagedDiff, workingTreeDiff].filter(Boolean).join('\n');

  const isClean = stagedFiles.length === 0 && unstagedFiles.length === 0 && untrackedFiles.length === 0;

  return {
    boundaryRef,
    boundarySource,
    latestTag,
    recordedCommit: versionData?.lastReleaseCommit || null,
    commits: releasableCommits,
    allChangedFiles,
    stagedFiles: stagedFiles.filter((f) => !isIgnoredFile(f)),
    unstagedFiles: unstagedFiles.filter((f) => !isIgnoredFile(f)),
    untrackedFiles: untrackedFiles.filter((f) => !isIgnoredFile(f)),
    diffSnippets,
    isClean
  };
}
