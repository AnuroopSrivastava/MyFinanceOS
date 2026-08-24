## Browser Preview Prohibition

- **Never** trigger browser previews, browser subagents, or automated browser testing/screenshots unless explicitly and specifically requested by the user in that prompt.
- Do not use `browser_subagent` or open browser windows for visual verification. Verify code changes through automated unit tests, build commands, lint checks, or manual code review.
