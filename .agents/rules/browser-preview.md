## Browser Preview (Enabled)

- **Proactively** use browser preview to visually verify UI changes after modifying frontend code.
- Use the **Chrome DevTools MCP** (`chrome-devtools-mcp`) tools:
  - `list_pages` — list open pages to get active `pageId`.
  - `navigate_page` — `{ pageId: 1, url: "http://localhost:3000" }`
  - `take_screenshot` — `{ pageId: 1, filePath: "preview.png" }`
  - `take_snapshot` — accessibility/DOM tree snapshot.
  - `evaluate_script` — run JS in page for interactive tests.
- Alternatively use `browser_subagent` for multi-step browser workflows (click-throughs, form testing, responsive checks).
- **CLI Fallback**: `node scripts/screenshot.mjs http://localhost:3000 preview.png`
- **Workflow**: ensure dev server (`npm run dev` → `http://localhost:3000`) is running as a background daemon, then navigate and screenshot.
- Share screenshots in artifacts or inline so the user sees the result without switching windows.
