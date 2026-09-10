import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';

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
 * Retrieve sorted list of git tags matching pattern (latest first).
 */
export function getGitTags(pattern = 'v*.*.*', cwd = process.cwd()) {
  const output = runGit(`git tag -l "${pattern}" --sort=-creatordate`, '', cwd);
  if (!output) return [];
  return output.split('\n').map((t) => t.trim()).filter(Boolean);
}

/**
 * Get latest semantic tag.
 */
export function getLatestTag(pattern = 'v*.*.*', cwd = process.cwd()) {
  const tags = getGitTags(pattern, cwd);
  return tags.length > 0 ? tags[0] : null;
}

/**
 * Check if a specific git tag exists.
 */
export function hasGitTag(tagName, cwd = process.cwd()) {
  const result = runGit(`git tag -l "${tagName}"`, '', cwd);
  return result === tagName;
}

/**
 * Create an annotated git tag.
 */
export function createGitTag(tagName, message, commitSha = 'HEAD', cwd = process.cwd()) {
  const safeMessage = message.replace(/"/g, '\\"');
  const cmd = `git tag -a "${tagName}" ${commitSha} -m "${safeMessage}"`;
  execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' });
}

/**
 * Check if remote exists and if local branch or tags are out of date.
 */
export function checkRemoteState(cwd = process.cwd()) {
  const remote = runGit('git remote', '', cwd);
  if (!remote) {
    return { hasRemote: false, isAhead: false, isBehind: false, remoteTags: [] };
  }

  const branch = getCurrentBranch(cwd);
  if (!branch) {
    return { hasRemote: true, isAhead: false, isBehind: false, remoteTags: [] };
  }

  // Check remote tracking status
  const upstream = runGit(`git rev-parse --abbrev-ref ${branch}@{upstream}`, '', cwd);
  if (!upstream) {
    return { hasRemote: true, hasUpstream: false, isAhead: false, isBehind: false };
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

  return { hasRemote: true, hasUpstream: true, isAhead: false, isBehind: false };
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
