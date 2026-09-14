# MyFinanceOS Release Intelligence & Semantic Versioning System

This document outlines the architecture, principles, operational commands, and safety gates of the production-hardened **Release Intelligence System** in MyFinanceOS — built on the deterministic **SIS/RMS scoring engine** for exact, mathematically reproducible version progression.

---

## 1. Core Architecture & Philosophy

The MyFinanceOS release system is built upon five non-negotiable principles:

1. **A Release is an Explicit Atomic Operation, NOT a Git-Push Side Effect**:
   - Automated git commits or file mutations during `git push` (such as in naive pre-push hooks) introduce severe failure modes: recursive hooks, corrupted branch heads, desynchronized remotes, and accidental duplicate releases.
   - In MyFinanceOS, release preparation is an explicit, transactional pipeline executed either directly via developer commands (`npm run release`) or orchestrated by the AI assistant when the developer instructs to "push to github".
   - The pre-push hook serves strictly as a **non-mutating verification gate** (`npm run version:check`) ensuring no desynchronized code reaches remote repositories.

2. **Single Source of Truth & Monorepo Synchronization**:
   - Monorepo metadata lives in `@financeos/shared`:
     - `packages/shared/src/version.json`: Canonical version string, release date, release type, release label, summary, and last release commit SHA.
     - `packages/shared/src/changelog.json`: Append-only, reverse-chronological list of human-facing release notes.
     - `packages/shared/src/release-manifest.json`: Machine-readable, auditable release manifest document (`schemaVersion: 1`, nested `releases[]` array).
   - Any release atomically synchronizes across:
     - All workspace `package.json` files (`root`, `apps/web`, `packages/shared`, `packages/auth`, `packages/database`, `packages/ui`).
     - Root `CHANGELOG.md` and the public static `apps/web/public/changelog.html`.
     - Web UI consumes statically from `@financeos/shared` with zero runtime dependency on git.

3. **Release Boundary Intelligence**:
   - The release engine detects **what has changed since the last release** via `git describe --tags --abbrev=0 --match "v*.*.*"` (latest strict SemVer tag), with deterministic fallbacks (sorted tag list → recorded release commit → repository root commit).
   - Only commits and diffs strictly within `${boundaryRef}..HEAD` (plus staged/working tree/untracked modifications) are evaluated.
   - Running the release engine twice on unchanged states is guaranteed to be a **safe, idempotent no-op** printing exactly `Repository up to date; no release required.` and terminating with status `UP_TO_DATE`.

4. **Deterministic Scoring — No Subjective Selection**:
   - Version determination is NOT based on line counts, file counts, or AI judgment. The engine (`scripts/release/signals.mjs` + `scripts/release/scoring.mjs`) converts repository evidence into two orthogonal scores: **SIS** (semantic impact) and **RMS** (release magnitude).
   - Identical inputs always produce identical SIS, RMS, intensity, classification, proposed version, and changelog content (idempotency guarantee).
   - Suspected-but-unverified breaking changes **BLOCK** the release for human confirmation — they are never silently downgraded.

5. **Two-Axis Versioning: Semantic Impact × Release Magnitude**:
   - **SIS (Semantic Impact Score)** decides the *compatibility class*: PATCH candidate (`< 20`) vs MINOR candidate (`≥ 20`). SIS alone **never** produces MAJOR.
   - **RMS (Release Magnitude Score)** measures *how substantial* the release is, mapping to six intensity bands that may enlarge the MINOR jump (capped at +4).
   - The final version is computed from both axes by the pure `calculateNextVersion()` function (see §4).

---

## 2. Release Intelligence Lifecycle (13-Step Zero-Touch Pipeline)

When the developer instructs "Push to GitHub" (or executes `npm run release:ship`):

```text
Step 1:  Inspect Repository State & auto-stage project changes (git add -A)
         ↓
Step 2:  Remote Divergence Guard (halt if remote branch or tags are ahead)
         ↓
Step 3:  Release Boundary Detection (git describe --tags --match "v*.*.*")
         ↓
Step 4:  Multi-Signal Extraction (commits with per-commit file lists, paths, diffs)
         ↓
Step 5:  Deterministic Scoring: SIS, RMS, intensity band, SemVer classification
         ↓
Step 6:  Breaking-Change Safety Gate (verified → MAJOR; suspected → BLOCK)
         ↓
Step 7:  Changelog & Manifest Generation (evidence-backed only, quality gate)
         ↓
Step 8:  Atomic Whole-Project Synchronization (version.json, changelog.json,
         release-manifest.json, package.json files, CHANGELOG.md, static HTML)
         ↓
Step 9:  Pre-Commit Quality Checks (npm run release:check)
         ↓
Step 10: Atomic Release Commit [skip-release-hook] + annotated tag with intensity/RMS
         ↓
Step 11: Remote Push (git push origin <branch> --follow-tags)
         ↓
Step 12: Remote Verification (git ls-remote --tags)
         ↓
Step 13: Status Verification & Release Scorecard
```

---

## 3. Multi-Signal Extraction (`scripts/release/signals.mjs`)

The extraction engine converts boundary evidence into structured, deduplicated signals. Pure module: no I/O, no randomness, no time-dependence.

| Signal | Source | Produces |
| :--- | :--- | :--- |
| **Commit messages** | Conventional Commits (`feat:`, `fix:`, `perf:`, `style:`, `refactor:`, `docs:`, `a11y:`, `security:`) + natural language (`add`, `fixed`, `improved`, `optimize`) | Distinct work items with type + subject |
| **File paths** | Product Area Classification Matrix (12 MyFinanceOS subsystems, first-hit-wins) | Product-area attribution per work item |
| **Added files** | Diff `new file mode` headers + untracked files (`git status --porcelain`) | newFeature / newPage / subsystem / newIntegration / crossCutting items; a new View + its matching route is one **subsystem** item (never double-counted as newPage) |
| **Deleted files** | Diff `deleted file mode` headers | Feature-removal breaking evidence |
| **Diff content** | Unified diff added/removed lines | a11y/perf/reliability items; verified + suspected breaking evidence; whitespace-only detection |
| **Commit volume** | Meaningful-commit count (release/merge/noise commits excluded) | Capped RMS dampener only — never classifies by itself |

### Critical Versioning Laws:
* **Line-Count Exclusion**: Code volume and changed line counts **NEVER** determine the version bump. Pure whitespace/reformatting changes are detected (removed vs added lines identical after trim) and contribute nothing.
* **UI Redesign Law**: Cosmetic visual refinements default to **PATCH**. Substantial user workflow additions qualify as **MINOR**.
* **NONE Detection**: Documentation-only updates, whitespace-only edits, internal-metadata paths, release artifacts, secrets, and empty diffs produce `releaseType: 'none'` with no version bump.
* **Commit Dampening**: 60 micro-commits with one bug fix yield RMS ≤ 7 (commit bonus caps at +4); volume can never dominate magnitude.
* **Work-Item Deduplication**: Items deduplicate by type + normalized subject; docs/refactor items carry 0 RMS base points and never register product areas.

---

## 4. Deterministic Scoring Engine (`scripts/release/scoring.mjs`)

### 4.1 SIS — Semantic Impact Score (presence-based category points)

SIS sums the points of every change category **present** in the release (presence, not count):

| Category | Points | Category | Points |
| :--- | :--- | :--- | :--- |
| docs | 0 | featureEnhancement | 10 |
| refactor | 2 | newFeature | 20 |
| bugFix | 5 | newPage | 25 |
| uiImprovement | 4 | newIntegration | 25 |
| a11y | 4 | subsystem | 35 |
| performance | 5 | breakingApi | 60 (verified only) |
| reliability | 5 | breakingSchema | 70 (verified only) |
| | | breakingAuth | 70 (verified only) |
| | | featureRemoval | 70 (verified only) |

**SIS < 20 → PATCH candidate. SIS ≥ 20 → MINOR candidate (when user-facing capability exists). SIS alone NEVER produces MAJOR.**

### 4.2 RMS — Release Magnitude Score

```
RMS = Σ(work-item base points) + product-area bonus + commit-count dampener
```

**Base Work Item Points**: docs=0, refactor=0, bugFix=3, uiImprovement=3, performance/reliability/a11y/security=4, featureEnhancement=8, newFeature/newPage/newIntegration/subsystem=12, crossCutting=8.

**Product Area Bonus**: 1 area=+0, 2=+3, 3–4=+6, 5–6=+10, 7+=+14.

**Dampened Commit Bonus**: 5–9 commits=+1, 10–19=+2, 20–39=+3, 40+=+4 (hard cap +4).

**LOC is NEVER a signal.** Line counts never enter the formula.

### 4.3 Intensity Bands (six levels)

| Band | RMS range | MINOR jump |
| :--- | :--- | :--- |
| `TRIVIAL` | 0–9 | +1 |
| `SMALL` | 10–19 | +1 |
| `NORMAL` | 20–34 | +1 |
| `SUBSTANTIAL` | 35–54 | +2 |
| `VERY_SUBSTANTIAL` | 55–79 | +3 |
| `EXCEPTIONAL` | 80+ | +4 |

### 4.4 SemVer Decision Order (strict)

```
1. NONE   — no meaningful application change (docs/whitespace/ignored-only/empty)
2. MAJOR  — verified breaking change with high confidence ONLY
3. BLOCK  — suspected but unverified breaking change (human confirmation required)
4. MINOR  — SIS ≥ 20 AND a user-facing capability exists
5. PATCH  — otherwise
```

**High-RMS PATCH Re-Evaluation**: when SIS < 20 but RMS ≥ 35, the engine inspects the work items for uncredited user-facing capabilities (`featureEnhancement`, `newFeature`, `newPage`, `newIntegration`, `subsystem`). Purely corrective/refactoring/internal work stays **PATCH +1** regardless of magnitude — a 12-fix batch across 6 areas never manufactures a MINOR.

### 4.5 Version-Jump Rules (`calculateNextVersion`)

| SemVer Type | Progression | Example |
| :--- | :--- | :--- |
| `PATCH` | patch +1 strictly (intensity **never** inflates PATCH) | `1.1.47 → 1.1.48` |
| `MINOR` | minor + jump(intensity band), patch=0 | `1.1.0 → 1.3.0` (+2) |
| `MAJOR` | major +1, minor=0, patch=0 | `1.5.3 → 2.0.0` |
| `NONE` | unchanged | `1.1.0 → 1.1.0` |

**Hard bounds**: a single release may never exceed **MINOR +4** (`MAX_MINOR_JUMP = 4`, enforced by manifest validation). Collision avoidance: if the computed version is already used (changelog, manifest, or git tag), the calculator advances to the next free slot of the same type and records which versions were skipped because they were **already released** — never overwriting, never fabricating history.

**A larger MINOR jump does NOT mean the skipped versions existed**: `1.1.0 → 1.4.0` means *the next actual release was 1.4.0 because the deterministic intensity band (VERY_SUBSTANTIAL) justified MINOR +3*. The changelog contains only real releases.

### 4.6 Breaking-Change Safety Gate

| Evidence tier | Detectors | Outcome |
| :--- | :--- | :--- |
| **Verified** (high confidence) | Destructive SQL (`DROP TABLE/COLUMN/INDEX`), removed public exports in `packages/*/src/index.*`, outright auth export removals, deleted routes/views, conventional `!` markers | **MAJOR** |
| **Suspected** (medium confidence) | Auth session changes without explicit markers, restrictive migrations, deleted package modules | **BLOCK** the release; print the evidence; require human confirmation (`--force` or explicit `release:major`) |

The gate never silently downgrades: a suspected breaking change halts the pipeline with a non-zero exit code rather than risk an incorrect MINOR/PATCH.

### 4.7 Release Labels

`getReleaseLabel(semverType, minorJump)`: MAJOR → "Major release"; MINOR +4 → "Milestone release"; MINOR +3 → "Major feature release"; MINOR +2 → "Substantial release"; MINOR +1 → "Minor release"; PATCH → "Patch release". **"Major release" is reserved exclusively for SemVer MAJOR progressions.**

---

## 5. Release Manifest Schema (`release-manifest.json`)

Every release is permanently recorded in the nested document at `packages/shared/src/release-manifest.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "schemaVersion": 1,
  "releases": [
    {
      "version": "1.3.0",
      "previousVersion": "1.1.0",
      "tag": "v1.3.0",
      "timestamp": "2026-09-11T12:00:00.000Z",
      "semverType": "MINOR",
      "minorJump": 2,
      "scoring": {
        "sis": 35,
        "rms": 48,
        "intensity": "SUBSTANTIAL",
        "productAreasAffected": ["Tax & Compliance", "Investments & Wealth", "Ledger / Transactions"],
        "metrics": { "bugFixes": 4, "uiImprovements": 3, "newFeatures": 2, "newWorkflows": 1, "integrations": 0, "commits": 14 }
      },
      "changelog": {
        "summary": "Substantial update introducing automated tax deduction estimators and multi-asset wealth rebalancing.",
        "categories": {
          "features": ["Automated tax deduction recommendations", "Multi-asset rebalancing wizard"],
          "fixes": ["Fixed dividend calculation in portfolio view"],
          "ui": ["Redesigned tax slab comparison card"],
          "performance": ["Indexed local transaction lookups"]
        }
      },
      "releaseLabel": "Substantial release"
    }
  ]
}
```

Internal consistency is validated on every write: `tag === 'v' + version`; MINOR records satisfy `version = previous.minor + minorJump` with `minorJump ∈ [1,4]`; MAJOR records reset minor/patch to 0; PATCH records are exactly previous patch + 1. Legacy pre-scoring records (no `scoring` block) validate on their legacy fields. Duplicates are rejected; history is never rewritten.

---

## 6. Developer Commands

### Everyday Operations (Zero-Touch via "Push to GitHub")

```bash
# Preview the upcoming release without modifying any files or git state
npm run release:preview

# Ship full release pipeline (auto-stages, scores, gates, commits, tags, pushes, verifies)
npm run release:ship

# Admin automated release (local only, prepares commit and tag without pushing)
npm run release

# Deterministic scoring test suite (60 exact-math assertions)
npm run release:test-scoring

# Explicit manual overrides (explicit developer intent beats the classifier)
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

# Unified release readiness check (version sync, changelog integrity, manifest schema)
npm run release:check
```

---

## 7. Zero-Touch Workflow ("Push to GitHub")

The standard developer experience requires zero manual versioning effort:
1. Make code changes.
2. Tell the coding agent: **"Push to GitHub"**.
3. The release pipeline (`npm run release:ship`) autonomously executes:
   - Inspects repository state and auto-stages project changes (`git add -A`).
   - Resolves the release boundary (latest strict `vX.Y.Z` tag).
   - Idempotency pre-check: a clean tree prints exactly `Repository up to date; no release required.` and terminates with status `UP_TO_DATE`.
   - Extracts multi-signal evidence and computes deterministic SIS/RMS/intensity/classification.
   - Applies the breaking-change safety gate (verified → MAJOR; suspected → BLOCK).
   - Synthesizes the human-facing changelog (evidence-backed items only, quality-gated).
   - Atomically synchronizes all release artifacts (workspace `package.json` files, shared records, `CHANGELOG.md`, static HTML).
   - Runs pre-commit checks (`npm run release:check`).
   - Creates the atomic release commit `chore(release): vX.Y.Z [skip-release-hook]` and the annotated tag `Release vX.Y.Z (Intensity: <BAND>, RMS: <N>)`.
   - Pushes commit and tag (`git push origin <branch> --follow-tags`) and verifies the remote tag.
   - Prints the final release scorecard.

### Version Progression Reference

```text
1.1.0 → 1.1.1     routine fix (PATCH)
1.1.1 → 1.2.0     normal feature release (MINOR +1, NORMAL)
1.2.0 → 1.2.1     routine fix (PATCH)
1.2.1 → 1.4.0     substantial backwards-compatible release (MINOR +3, VERY_SUBSTANTIAL)
1.4.0 → 1.4.1     routine fix (PATCH)
1.4.1 → 1.5.0     exceptional milestone (MINOR +4, EXCEPTIONAL — hard cap)
1.5.0 → 2.0.0     breaking release (MAJOR, verified evidence)
```

This sequence is illustrative. Every actual version is calculated from real repository changes by the deterministic SIS/RMS engine — never hardcoded, never subjectively selected.

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
