import fs from 'node:fs';
import path from 'node:path';

const LOCK_FILE_NAME = '.release.lock';
const STALE_LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function getLockFilePath(rootDir) {
  return path.join(rootDir, LOCK_FILE_NAME);
}

/**
 * Check if a process with the given PID is currently active.
 */
export function isProcessRunning(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM'; // Running, but no permission to signal
  }
}

/**
 * Attempt to acquire release lock to prevent concurrent release executions.
 */
export function acquireReleaseLock(rootDir) {
  const lockPath = getLockFilePath(rootDir);

  if (fs.existsSync(lockPath)) {
    try {
      const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
      const now = Date.now();
      const lockTime = new Date(lockData.createdAt || 0).getTime();
      const isStale = now - lockTime > STALE_LOCK_TIMEOUT_MS;
      const processAlive = isProcessRunning(lockData.pid);

      if (!processAlive || isStale) {
        // Stale or dead process lock — safe to recover
        console.warn(`[lock] Recovering stale/inactive release lock (PID ${lockData.pid}).`);
        fs.unlinkSync(lockPath);
      } else {
        return {
          acquired: false,
          reason: `Release lock active: another release is running under PID ${lockData.pid} (started at ${lockData.createdAt}).`
        };
      }
    } catch {
      // Corrupted lock file — safe to remove
      try {
        fs.unlinkSync(lockPath);
      } catch {}
    }
  }

  const payload = {
    pid: process.pid,
    createdAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(lockPath, JSON.stringify(payload, null, 2), { flag: 'wx' });
    
    // Register auto-cleanup handlers
    const cleanup = () => {
      try {
        if (fs.existsSync(lockPath)) {
          fs.unlinkSync(lockPath);
        }
      } catch {}
    };

    process.once('exit', cleanup);
    process.once('SIGINT', () => {
      cleanup();
      process.exit(130);
    });
    process.once('SIGTERM', () => {
      cleanup();
      process.exit(143);
    });

    return { acquired: true, lockPath };
  } catch (err) {
    return {
      acquired: false,
      reason: `Could not acquire release lock: ${err.message}`
    };
  }
}

/**
 * Explicitly release the lock.
 */
export function releaseLock(rootDir) {
  const lockPath = getLockFilePath(rootDir);
  try {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
    return true;
  } catch {
    return false;
  }
}
