import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';

export const SEMVER_TAG_REGEX = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/**
 * Run a git command safely and return trimmed stdout.
 */
export function runGit(cmd, defaultValue = '', cwd = process.cwd()) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    return defaultValue;
  }
}

/**
 * Check if a Git commit SHA exists and is valid.
 */
export function isGitCommit(sha, cwd = process.cwd()) {
  if (!sha || typeof sha !== 'string' || !/^[0-9a-f]{7,40}$/i.test(sha.trim())) {
    return false;
  }
  try {
    const res = spawnSync('git', ['cat-file', '-e', `${sha.trim()}^{commit}`], { cwd });
    return res.status === 0;
  } catch {
    return false;
  }
}

/**
 * Check if current working directory is inside a valid git work tree.
 */
export function isGitAvailable(cwd = process.cwd()) {
  const result = runGit('git rev-parse --is-inside-work-tree', '', cwd);
  return result === 'true';
}

/**
 * Get current branch name. Returns null if detached.
 */
export function getCurrentBranch(cwd = process.cwd()) {
  return runGit('git symbolic-ref --short -q HEAD', null, cwd);
}

/**
 * Check if repository is in a detached HEAD state.
 */
export function isDetachedHead(cwd = process.cwd()) {
  return !getCurrentBranch(cwd);
}

/**
 * Parse SemVer tag into structured numeric components.
 */
export function parseSemVerTag(tag) {
  if (!tag || typeof tag !== 'string') return null;
  const match = tag.trim().match(SEMVER_TAG_REGEX);
  if (!match) return null;
  return {
    tag: tag.trim(),
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

/**
 * Compare two SemVer tags numerically.
 * Returns positive if tagA > tagB, negative if tagA < tagB, 0 if equal.
 */
export function compareSemVerTags(tagA, tagB) {
  const a = parseSemVerTag(tagA);
  const b = parseSemVerTag(tagB);
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;

  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

/**
 * Retrieve sorted list of valid semantic git tags (latest first).
 * Strictly filters out non-SemVer tags (e.g. deployment tags, dates).
 */
export function getGitTags(pattern = 'v*', cwd = process.cwd()) {
  const output = runGit('git tag -l', '', cwd);
  if (!output) return [];
  const rawTags = output.split('\n').map((t) => t.trim()).filter(Boolean);
  const semverTags = rawTags.filter((t) => SEMVER_TAG_REGEX.test(t));
  semverTags.sort((a, b) => compareSemVerTags(b, a)); // Descending
  return semverTags;
}

/**
 * Get latest valid semantic release tag.
 */
export function getLatestTag(pattern = 'v*', cwd = process.cwd()) {
  const tags = getGitTags(pattern, cwd);
  return tags.length > 0 ? tags[0] : null;
}

/**
 * Check if a specific git tag exists locally.
 */
export function hasGitTag(tagName, cwd = process.cwd()) {
  const result = runGit(`git tag -l "${tagName}"`, '', cwd);
  return result === tagName;
}

/**
 * Check if a specific git tag exists on a remote repository.
 */
export function hasRemoteTag(tagName, remoteName = 'origin', cwd = process.cwd()) {
  try {
    const res = spawnSync('git', ['ls-remote', '--tags', remoteName, `refs/tags/${tagName}`], {
      cwd,
      encoding: 'utf-8'
    });
    if (res.status === 0 && res.stdout) {
      return res.stdout.includes(`refs/tags/${tagName}`);
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Retrieve the latest valid SemVer tag that exists on the remote repository.
 * Used to detect when the remote is ahead in releases (e.g. remote has v1.5.0
 * while local is at v1.4.0) so the engine can stop and reconcile instead of
 * blindly calculating another release.
 */
export function getLatestRemoteTag(remoteName = 'origin', cwd = process.cwd()) {
  try {
    const res = spawnSync('git', ['ls-remote', '--tags', remoteName], {
      cwd,
      encoding: 'utf-8'
    });
    if (res.status !== 0 || !res.stdout) return null;
    const tags = res.stdout
      .split('\n')
      .map((line) => {
        const ref = line.split('\t')[1] || '';
        const m = ref.match(/^refs\/tags\/(.+)$/);
        return m ? m[1].replace(/\^\{\}$/, '') : null;
      })
      .filter((t) => t && SEMVER_TAG_REGEX.test(t));
    if (tags.length === 0) return null;
    tags.sort((a, b) => compareSemVerTags(b, a)); // descending
    return tags[0];
  } catch {
    return null;
  }
}

/**
 * Create an annotated git tag safely without shell injection risks.
 */
export function createGitTag(tagName, message, commitSha = 'HEAD', cwd = process.cwd()) {
  const res = spawnSync('git', ['tag', '-a', tagName, commitSha, '-m', message], {
    cwd,
    encoding: 'utf-8'
  });
  if (res.status !== 0) {
    throw new Error(`Failed to create git tag ${tagName}: ${res.stderr || res.stdout}`);
  }
}

/**
 * Check if remote exists and if local branch is ahead/behind remote.
 */
export function checkRemoteState(cwd = process.cwd()) {
  const remote = runGit('git remote', '', cwd);
  if (!remote) {
    return { hasRemote: false, hasUpstream: false, isAhead: false, isBehind: false, aheadCount: 0, behindCount: 0 };
  }

  const branch = getCurrentBranch(cwd);
  if (!branch) {
    return { hasRemote: true, hasUpstream: false, isAhead: false, isBehind: false, aheadCount: 0, behindCount: 0 };
  }

  const upstream = runGit(`git rev-parse --abbrev-ref ${branch}@{upstream}`, '', cwd);
  if (!upstream) {
    return { hasRemote: true, hasUpstream: false, isAhead: false, isBehind: false, aheadCount: 0, behindCount: 0 };
  }

  const counts = runGit(`git rev-list --left-right --count ${branch}...${upstream}`, '', cwd);
  if (counts) {
    const [ahead = 0, behind = 0] = counts.split(/\s+/).map((n) => parseInt(n, 10));
    return {
      hasRemote: true,
      hasUpstream: true,
      isAhead: ahead > 0,
      isBehind: behind > 0,
      aheadCount: ahead,
      behindCount: behind
    };
  }

  return { hasRemote: true, hasUpstream: true, isAhead: false, isBehind: false, aheadCount: 0, behindCount: 0 };
}

/**
 * Backup list of files into memory for atomic transaction rollback.
 */
export function backupFiles(filePaths) {
  const backups = new Map();
  for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
      backups.set(filePath, fs.readFileSync(filePath, 'utf-8'));
    } else {
      backups.set(filePath, null); // Did not exist previously
    }
  }
  return backups;
}

/**
 * Restore backed up files.
 */
export function restoreFiles(backups) {
  for (const [filePath, content] of backups.entries()) {
    try {
      if (content === null) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else {
        fs.writeFileSync(filePath, content, 'utf-8');
      }
    } catch (err) {
      console.error(`[git:restore] Failed restoring ${filePath}:`, err);
    }
  }
}
