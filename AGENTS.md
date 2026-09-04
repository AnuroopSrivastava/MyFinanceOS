## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Core View Catalog (Whole-Project Scope)
When performing whole-project tasks (styling, theme audits, refactoring, translations, accessibility, security):
- Always include all primary components in `apps/web/src/components/`:
  `DashboardView.tsx`, `LedgerView.tsx`, `InvestmentsView.tsx`, `TaxView.tsx`, `BusinessView.tsx`, `SankeyView.tsx`, `InvestmentPlanner/`, `AutomationView.tsx`, `DocumentVaultView.tsx`, `EMICalculator.tsx`, `GoalTracker.tsx`, `ReportsView.tsx`, `SettingsView.tsx`, `AIChatView.tsx`, `Landing.tsx`, `PrivacyView.tsx`, `TermsView.tsx`.
- Keep Next.js routes (`app/privacy/page.tsx`, `app/terms/page.tsx`) and public static files (`public/privacy.html`, `public/terms.html`) synchronized with core design tokens.

## Browser Preview (Enabled)
- **Proactively** use browser preview to visually verify UI changes after modifying frontend code.
- Use the **Chrome DevTools MCP** tools (`chrome-devtools-mcp`) for browser interaction:
  - `new_page` — open the dev server URL (default `http://localhost:3000`) in a new tab.
  - `navigate_page` — navigate to specific routes to verify changes.
  - `take_screenshot` — capture screenshots for visual verification and share them with the user.
  - `take_snapshot` — capture accessibility-tree snapshots for DOM/content verification.
  - `list_pages` — list currently open browser pages.
  - `evaluate_script` — run JS in the page for interactive checks.
- Alternatively, use `browser_subagent` for multi-step browser workflows (click-through flows, form testing, responsive checks).
- **Workflow**: start the dev server (`npm run dev`) as a background daemon if not already running, then open / navigate / screenshot.
- Share screenshots in artifacts or inline so the user can see the result without switching windows.

