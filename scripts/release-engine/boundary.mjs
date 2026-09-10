import { runGit, getLatestTag } from './git.mjs';

// Sensitive patterns to strictly exclude from release analysis
const SENSITIVE_FILE_PATTERNS = [
  /^\.env(\..+)?$/,
  /credentials/i,
  /\.pem$/i,
  /\.key$/i,
  /id_rsa/i,
  /service-account.*\.json$/i,
  /secrets/i
];

// Internal non-release paths
const INTERNAL_METADATA_PATHS = [
  'graphify-out/',
  '.github/',
  '.vscode/',
  '.release.lock',
  '.preview/',
  'trace.json.gz',
  'posthog-self-driving-report.md'
];

/**
 * Check if a file should be ignored from release boundary calculations.
 */
export function isIgnoredFile(filePath) {
  const norm = filePath.replace(/\\/g, '/');

  // Check secrets
  for (const pattern of SENSITIVE_FILE_PATTERNS) {
    if (pattern.test(norm)) return true;
  }

  // Check internal metadata
  for (const internalPath of INTERNAL_METADATA_PATHS) {
    if (norm.startsWith(internalPath) || norm.includes(`/${internalPath}`)) return true;
  }

  // Check version/changelog/manifest itself (prevent loops)
  if (
    norm.includes('version.json') ||
    norm.includes('changelog.json') ||
    norm.includes('release-manifest.json')
  ) {
    return true;
  }

  // Ignore git attributes / ignore
  if (norm === '.gitignore' || norm === '.gitattributes') return true;

  return false;
}

/**
 * Detect release boundary and gather commit and diff information since the last release.
 */
export function detectReleaseBoundary({ cwd = process.cwd(), versionData = null } = {}) {
  // 1. Identify latest release tag
  const latestTag = getLatestTag('v*.*.*', cwd);
  const recordedCommit = versionData?.lastReleaseCommit;

  let boundaryRef = null;

  // Prefer verified git tag
  if (latestTag) {
    boundaryRef = latestTag;
  } else if (recordedCommit && runGit(`git cat-file -e ${recordedCommit}^{commit} 2>/dev/null && echo "valid"`, '', cwd) === 'valid') {
    boundaryRef = recordedCommit;
  } else {
    // If neither tag nor commit exists, find the first commit in the repository
    const firstCommit = runGit('git rev-list --max-parents=0 HEAD', '', cwd);
    boundaryRef = firstCommit || 'HEAD~1';
  }

  // 2. Fetch commit log since boundary
  const range = `${boundaryRef}..HEAD`;
  const rawLog = runGit(`git log ${range} --pretty=format:"%h%x09%an%x09%s"`, '', cwd);

  const commits = rawLog
    ? rawLog
        .split('\n')
        .map((line) => {
          const parts = line.split('\t');
          if (parts.length >= 3) {
            return {
              sha: parts[0].trim(),
              author: parts[1].trim(),
              message: parts.slice(2).join('\t').trim()
            };
          }
          return null;
        })
        .filter(Boolean)
    : [];

  // Filter out release commits from re-triggering releases
  const releasableCommits = commits.filter(
    (c) => !c.message.startsWith('chore(release):') && !c.message.includes('[skip-release-hook]')
  );

  // 3. Changed files in git range
  const rawDiffFiles = runGit(`git diff --name-only ${range}`, '', cwd);
  const rangeChangedFiles = rawDiffFiles ? rawDiffFiles.split('\n').map((f) => f.trim()).filter(Boolean) : [];

  // 4. Staged and uncommitted working tree changes
  const rawStatus = runGit('git status --porcelain', '', cwd);
  const stagedFiles = [];
  const unstagedFiles = [];
  const untrackedFiles = [];

  if (rawStatus) {
    for (const line of rawStatus.split('\n')) {
      const indexCode = line[0];
      const workTreeCode = line[1];
      const file = line.slice(3).trim();

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

  // Combine all changed files, filtering out secrets and noise
  const allChangedFiles = Array.from(
    new Set([...rangeChangedFiles, ...stagedFiles, ...unstagedFiles, ...untrackedFiles])
  ).filter((f) => !isIgnoredFile(f));

  // 5. Gather diff snippets for semantic analysis
  const diffSnippets = runGit(`git diff ${range}`, '', cwd);

  const isClean = stagedFiles.length === 0 && unstagedFiles.length === 0 && untrackedFiles.length === 0;

  return {
    boundaryRef,
    latestTag,
    recordedCommit,
    commits: releasableCommits,
    allChangedFiles,
    stagedFiles: stagedFiles.filter((f) => !isIgnoredFile(f)),
    unstagedFiles: unstagedFiles.filter((f) => !isIgnoredFile(f)),
    untrackedFiles: untrackedFiles.filter((f) => !isIgnoredFile(f)),
    diffSnippets,
    isClean
  };
}
