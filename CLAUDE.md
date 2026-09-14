## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Core View Catalog (Whole-Project Scope)
When performing whole-project tasks (styling, theme audits, refactoring, translations, accessibility, security):
- Always include all primary components in `apps/web/src/components/`:
  `DashboardView.tsx`, `LedgerView.tsx`, `InvestmentsView.tsx`, `TaxView.tsx`, `BusinessView.tsx`, `SankeyView.tsx`, `InvestmentPlanner/`, `AutomationView.tsx`, `DocumentVaultView.tsx`, `EMICalculator.tsx`, `GoalTracker.tsx`, `ReportsView.tsx`, `SettingsView.tsx`, `AIChatView.tsx`, `Landing.tsx`, `PrivacyView.tsx`, `TermsView.tsx`, `ChangelogView.tsx`.
- Keep Next.js routes (`app/privacy/page.tsx`, `app/terms/page.tsx`, `app/changelog/page.tsx`) and public static files (`public/privacy.html`, `public/terms.html`, `public/changelog.html`) synchronized with core design tokens.

## Browser Preview (Enabled)
- **Proactively** use browser preview to visually verify UI changes after modifying frontend code.
- **Workflow**:
  1. Ensure dev server is running on `http://localhost:3000` (run `npm run dev` in the background).
  2. Use Chrome DevTools MCP tools or Playwright CLI:
     - **MCP Tools** (`chrome-devtools-mcp` via `.mcp.json`):
       - `list_pages` — lists open pages with their `pageId`.
       - `navigate_page` — `{ pageId: <id>, url: "http://localhost:3000/<route>" }`
       - `take_screenshot` — `{ pageId: <id>, filePath: "preview_<feature>.png" }`
       - `take_snapshot` — DOM / accessibility-tree snapshot for inspection.
       - `evaluate_script` — evaluate JavaScript on the page for interactive states.
     - **CLI Fallback**:
       - `node scripts/screenshot.mjs http://localhost:3000 preview.png`
  3. Inspect or embed the screenshot to confirm UI rendering before presenting changes.

## Release Intelligence & "Push to GitHub" Protocol
When the user asks to **"Push to GitHub"** (or says "push", "ship it", "release and push"):
- Execute: `npm run release:ship` (or `node scripts/release.mjs --ship`).
- This autonomously runs the full release intelligence pipeline:
  1. Inspects repository state & auto-stages project code changes (`git add -A`).
  2. Resolves release boundary against latest git tag (`git describe --tags --match "v*.*.*"`).
  3. Idempotency pre-check: clean trees print exactly `Repository up to date; no release required.` and terminate with status `UP_TO_DATE`.
  4. Extracts multi-signal evidence (commits with per-commit file lists, paths, diffs, untracked files) via `scripts/release/signals.mjs`.
  5. Computes deterministic scores: SIS (semantic impact, presence-based category points) and RMS (release magnitude: work-item points + product-area bonus + dampened commit bonus; LOC is never a signal) via `scripts/release/scoring.mjs`. RMS maps to intensity bands TRIVIAL/SMALL/NORMAL/SUBSTANTIAL/VERY_SUBSTANTIAL/EXCEPTIONAL.
  6. Classifies SemVer in strict order NONE → MAJOR (verified breaking only) → BLOCK (suspected breaking, human confirmation required, never silently downgraded) → MINOR (SIS ≥ 20 + user-facing capability) → PATCH. The MINOR jump is band-driven: +1/+2/+3/+4 (hard cap +4); PATCH is never inflated; high-RMS corrective work stays PATCH.
  7. Synthesizes human-facing categorized changelog & product summary via the quality gate (evidence-backed items only).
  8. Updates structured machine-readable `packages/shared/src/release-manifest.json` (nested `schemaVersion: 1` document) and synchronizes `CHANGELOG.md` + static `apps/web/public/changelog.html`.
  9. Synchronizes canonical version across all workspace `package.json` files and shared metadata.
  10. Runs pre-commit validation checks (`release:check`).
  11. Creates atomic release commit: `chore(release): vX.Y.Z [skip-release-hook]` and annotated tag `Release vX.Y.Z (Intensity: <BAND>, RMS: <N>)`.
  12. Pushes release commit and git tag to GitHub `origin` (`--follow-tags`), then verifies remote branch and tag status.
  13. Enforces idempotency: repeated executions without changes do not create duplicate releases.
- Never manually pick a version number: the deterministic engine computes it. The scoring contract is verified by `npm run release:test-scoring` (60 exact-math assertions) and documented in `docs/VERSIONING_AND_CHANGELOG.md`.
