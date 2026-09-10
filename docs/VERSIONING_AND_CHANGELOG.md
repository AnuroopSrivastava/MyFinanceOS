# MyFinanceOS Release Intelligence & Semantic Versioning System

This document outlines the architecture, principles, operational commands, and safety gates of the production-hardened **Release Intelligence System** in MyFinanceOS.

---

## 1. Core Architecture & Philosophy

The MyFinanceOS release system is built upon four non-negotiable principles:

1. **A Release is an Explicit Atomic Operation, NOT a Git-Push Side Effect**:
   - Automated git commits or file mutations during `git push` (such as in naive pre-push hooks) introduce severe failure modes: recursive hooks, corrupted branch heads, desynchronized remotes, and accidental duplicate releases.
   - In MyFinanceOS, release preparation is an explicit, transactional pipeline executed either directly via developer commands (`npm run release`) or orchestrated by the AI assistant when the developer instructs to "push to github".
   - The pre-push hook serves strictly as a **non-mutating verification gate** (`npm run version:check`) ensuring no desynchronized code reaches remote repositories.

2. **Single Source of Truth & Monorepo Synchronization**:
   - Monorepo metadata lives in `@financeos/shared`:
     - `packages/shared/src/version.json`: Canonical version string, release date, release type, summary, and last release commit SHA.
     - `packages/shared/src/changelog.json`: Append-only, reverse-chronological list of human-facing release notes.
     - `packages/shared/src/release-manifest.json`: Machine-readable, auditable release manifest records (`schemaVersion: 1`).
   - Any release atomically synchronizes across:
     - All workspace `package.json` files (`root`, `apps/web`, `packages/shared`, `packages/auth`, `packages/database`, `packages/ui`).
     - Web UI consumes statically from `@financeos/shared` with zero runtime dependency on git.

3. **Release Boundary Intelligence**:
   - Instead of analyzing the entire repository history indefinitely, the release engine detects **what has changed since the last release**.
   - The boundary is resolved via the latest semantic git tag (`v*.*.*`), falling back to `lastReleaseCommit` from the manifest.
   - Only commits and diffs strictly within `${boundaryRef}..HEAD` (plus staged/working tree modifications) are evaluated.
   - Running the release engine twice on unchanged states is guaranteed to be a **safe, idempotent no-op** (`No release required`).

4. **Multi-Signal Classification with Confidence Scoring**:
   - Version determination is NOT based on line counts or single file extensions.
   - The engine evaluates multiple orthogonal signals (Git diff semantics, subsystem paths, conventional commit semantics, functional surface impact, breaking-change indicators, feature indicators, and fix indicators).
   - An uncertainty safety rule ensures that low-confidence classifications fail safely rather than creating accidental major or minor releases.

---

## 2. Release Intelligence Lifecycle

```text
Code Changes in Repository
        ↓
Release Boundary Detection (Latest Git tag / Manifest SHA)
        ↓
Multi-Signal Classification (Signals A–G)
        ↓
Confidence Scoring & Safety Gate (High >=80%, Medium 50-79%, Low <50%)
        ↓
Human-Facing Changelog Synthesis & Quality Gate Filter
        ↓
Release Manifest Generation (release-manifest.json)
        ↓
Monorepo Version Synchronization (All package.json files)
        ↓
Transactional Pre-Flight Checks (version:check, changelog:check)
        ↓
Atomic Release Commit [skip-release-hook]
        ↓
Annotated Git Tag (vX.Y.Z)
        ↓
GitHub Push & CI Gate Verification
```

---

## 3. Multi-Signal Classifier (Signals A–G)

The classifier assigns release impact (`MAJOR > MINOR > PATCH > NONE`) using multi-signal evidence fusion:

| Signal | Source | Evaluation Criteria | Impact |
| :--- | :--- | :--- | :--- |
| **Signal A** | Git Diff Semantics | Destructive SQL (`DROP TABLE`, `ALTER TABLE ... DROP COLUMN`), incompatible schema changes, removed public exports in `packages/*/src/index.ts`. | **MAJOR** |
| **Signal B** | File Contexts | New routes in `apps/web/app/**/page.tsx` or new view components `*View.tsx`. Core package additions. Stylesheets (`.css`) and test additions. | **MINOR** (routes/views), **PATCH** (styles/fixes) |
| **Signal C** | Commit Messages | Conventional Commit prefixes (`feat!:`, `BREAKING CHANGE:`, `feat:`, `fix:`, `perf:`, `style:`, `a11y:`, `chore:`, `docs:`). | **MAJOR** (`!:`), **MINOR** (`feat:`), **PATCH** (`fix:`/`perf:`) |
| **Signal D** | Functional Surface | Distinguishes customer-facing workflow modifications from internal maintenance. | Contextual weighting |
| **Signal E** | Breaking Indicators | Explicit breaking criteria verification before elevating to MAJOR. | **MAJOR** |
| **Signal F** | Feature Indicators | Detects new capabilities, entities, and settings. | **MINOR** |
| **Signal G** | Fix Indicators | Detects bug fixes, styling corrections, and stability improvements. | **PATCH** |

### Critical Versioning Laws:
* **Rule 74 (Line Count Law)**: Code volume and changed line counts **NEVER** determine the version bump.
* **Rule 75 (UI Redesign Law)**: Cosmetic visual refinements default to **PATCH**. Substantial user workflow additions qualify as **MINOR**.
* **Rule 76 (Performance Law)**: Performance optimizations default to **PATCH** unless introducing a new architectural capability.
* **Rule 14 (First-Class 'None')**: Pure documentation updates, CI workflow edits, and test additions produce `releaseType: 'none'` with no version bump.

---

## 4. Confidence Scoring & Safety Thresholds

Every automatic classification produces a confidence score from `0%` to `100%`:
* **High Confidence (≥ 80%)**: Automatic release permitted. Clear alignment between diffs, commit messages, and file contexts.
* **Medium Confidence (50% – 79%)**: In interactive mode, preview is displayed with confirmation. In non-interactive/CI mode, conservative progression applies.
* **Low Confidence (< 50%)**: Automatic release is blocked. Requires explicit developer override (`--patch`, `--minor`, or `--major`).

---

## 5. Release Manifest Schema (`release-manifest.json`)

Every release is permanently recorded in `packages/shared/src/release-manifest.json`:

```json
{
  "schemaVersion": 1,
  "version": "1.1.0",
  "releaseTag": "v1.1.0",
  "commitSha": "a1b2c3d...",
  "previousVersion": "1.0.0",
  "previousCommitSha": "882a27a...",
  "releaseType": "minor",
  "releaseDate": "2026-09-10",
  "summary": "Enhanced portfolio analytics and annual wealth report exports.",
  "confidence": {
    "score": 92,
    "level": "high",
    "signals": ["Signal B/F: New user-facing Next.js page route", "Signal C: Feature conventional commit"]
  },
  "manualOverride": false,
  "commits": [
    { "sha": "a1b2c3d", "message": "feat: annual wealth report export", "author": "Developer" }
  ],
  "filesChanged": ["apps/web/app/reports/page.tsx"],
  "categories": [
    {
      "category": "Features",
      "items": ["Annual wealth report export"]
    }
  ],
  "breakingChanges": [],
  "migrationRequired": false
}
```

---

## 6. Developer Commands

### Everyday Operations

```bash
# Preview the upcoming release without modifying any files or git state
npm run release:preview

# Run automated release (evaluates boundary, classifies changes, validates, commits, and tags)
npm run release

# Explicit manual overrides (overrides classifier with 100% confidence)
npm run release:patch
npm run release:minor
npm run release:major
npm run release:none

# Custom release summary
npm run release:patch -- --summary="Fixed responsive ledger table alignment"

# Dry run simulation
npm run release -- --dry-run
```

### Verification & Health Checks

```bash
# Check that all package.json files, version.json, changelog.json, and manifests match
npm run version:check

# Validate changelog schema, reverse-chronological order, and quality standards
npm run changelog:check

# Unified release readiness check (runs version sync, changelog integrity, and boundary checks)
npm run release:check
```

---

## 7. Zero-Friction Assistant Workflow ("Push to GitHub")

When working with Antigravity / AI Assistant:
1. Make code changes normally.
2. Simply tell the assistant: **"Push to GitHub"**.
3. The assistant automatically:
   - Evaluates changes since the last release tag (`vX.Y.Z`).
   - Runs `npm run release` (generating manifest, changelog, version synchronization, release commit, and git tag).
   - Validates the build and test suite (`npm run lint && npm test`).
   - Executes `git push origin main --follow-tags`.

---

## 8. Rollback Protocol

If a release must be rolled back:
1. **Identify the Defective Tag and Commit**:
   ```bash
   git log -1 v1.1.0
   ```
2. **Revert Deployment State**:
   Deploy the previous stable git tag (e.g. `v1.0.0`) in Vercel or your hosting provider.
3. **Rollback in Git History**:
   - If unpushed: `git reset --hard HEAD~1 && git tag -d v1.1.0`
   - If already pushed: Create a standard forward fix `v1.1.1` that reverts the defective code changes.
4. **Never Erase Historical Releases**:
   Changelog and release manifests are append-only audit records. Rolling back is a deployment action, not a rewriting of history.
