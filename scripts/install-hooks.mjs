#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const HOOKS_DIR = path.join(ROOT_DIR, '.git', 'hooks');
const PRE_PUSH_HOOK_PATH = path.join(HOOKS_DIR, 'pre-push');

/**
 * Non-mutating pre-push hook script.
 * Verifies version synchronization and release health.
 * NEVER mutates files or creates git commits during git push.
 */
const HOOK_SCRIPT = `#!/bin/sh
# MyFinanceOS pre-push verification hook: guards release integrity before push
# Does NOT mutate files or create commits during git push.

# CI and bypass guards
if [ "$FINANCEOS_SKIP_HOOKS" = "1" ] || [ "$CI" = "true" ]; then
  exit 0
fi

# Skip during rebasing or bisecting states
GIT_DIR="\${GIT_DIR:-\$(git rev-parse --git-dir 2>/dev/null)}"
if [ -d "$GIT_DIR/rebase-merge" ] || [ -d "$GIT_DIR/rebase-apply" ]; then
  exit 0
fi

# Verify version synchronization and changelog integrity
node scripts/release.mjs --check-version
STATUS=$?

if [ $STATUS -ne 0 ]; then
  echo ""
  echo "❌ [pre-push] Push rejected: Version synchronization check failed."
  echo "Please ensure all package.json files, version.json, and changelog.json are in sync."
  echo "Run 'npm run version:check' or 'npm run release' to prepare an official release."
  echo ""
  exit 1
fi

exit 0
`;

export function installHooks() {
  if (!fs.existsSync(HOOKS_DIR)) {
    console.log('[hooks] .git/hooks directory not found. Skipping hook installation.');
    return;
  }

  try {
    fs.writeFileSync(PRE_PUSH_HOOK_PATH, HOOK_SCRIPT, { mode: 0o755, encoding: 'utf-8' });
    console.log(`✓ Git pre-push verification hook installed successfully at ${PRE_PUSH_HOOK_PATH}`);
  } catch (err) {
    console.error('[hooks] Failed to install pre-push hook:', err);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('install-hooks.mjs')) {
  installHooks();
}
