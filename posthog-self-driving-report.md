# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured for the web application. Session Replay and Error Tracking were already enabled; Support was enabled during this setup. Health checks, Error Tracking, Support tickets, and GitHub Issues now feed the Self-driving inbox.

Fresh scouts and Replay Vision monitors begin being picked up within about 30 minutes. Findings will appear in the [Self-driving inbox](https://us.posthog.com/project/601459/inbox) as they accumulate.

## AI data processing

Approved by the wizard’s organization-level gate before this setup ran.

## GitHub

GitHub Issues was **connected during this setup** through the existing GitHub App integration. The warehouse source syncs only the `issues` table, which is the table consumed by the responder; additional GitHub tables can be enabled later in the data warehouse UI if needed.

## Products enabled

| Product | Status | Notes |
|---|---|---|
| Session Replay | Already enabled | Recent web recordings exist. Browser initialization does not disable recording. |
| Error Tracking | Already enabled | Browser initialization explicitly enables exception capture. |
| Support (Conversations) | Enabled during this setup | Tickets will arrive only after an inbound email, inbox, or Slack channel is connected in PostHog. |

## Signal sources

| Signal source | Action | Result |
|---|---|---|
| `health_checks` / `health_issue` | Enabled | New responder created. |
| `error_tracking` / `issue_created` | Enabled | New responder created. |
| `error_tracking` / `issue_reopened` | Enabled | New responder created. |
| `error_tracking` / `issue_spiking` | Enabled | New responder created. |
| `conversations` / `ticket` | Enabled | New responder created; remains idle until a support channel is connected. |
| `github` / `issue` | Enabled | New responder created after the GitHub Issues warehouse source was connected. |
| `signals_scout` / `cross_source_issue` | No row created | Enabled by default; no opt-out row existed. |
| `session_replay` / `session_analysis_cluster` | Skipped | Retired responder; replay coverage is provided by Replay Vision scanners. |
| `replay_vision` | No row created | Each scanner is self-authorizing through `emits_signals: true`. |

## Connected tools

| Tool | Status | Details |
|---|---|---|
| GitHub Issues | Connected by this setup | Warehouse source `01a086b4-c704-0000-c2ea-e9a6dcda522b`; first sync started. The GitHub Issues responder is enabled. |

All other connected-tool options were not selected and no responders were enabled for them.

## Scout troop

**Run budget:** 100 maximum runs/day; 0 used today; 100 remaining at configuration time.

> Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.

| Scout | Status | Reason |
|---|---|---|
| `signals-scout-general` | Enabled | Cross-product coverage and correlations. |
| `signals-scout-web-analytics` | Enabled | Web frontend and replay activity establish web traffic as a relevant surface. |
| `signals-scout-product-analytics` | Enabled | The application captures core product-flow activity. |
| `signals-scout-data-warehouse` | Enabled | Watches the new GitHub Issues source for freshness and sync failures. |
| `signals-scout-health-checks` | Enabled | Prioritizes actionable instrumentation and setup health issues. |
| `signals-scout-ai-observability` | Disabled | No LLM observability evidence was found. |
| `signals-scout-anomaly-detection` | Disabled | The selected generalist and focused specialists keep the fresh troop selective. |
| `signals-scout-apm` | Disabled | No distributed tracing or APM evidence was found. |
| `signals-scout-conversations` | Disabled | No inbound support channel is connected yet. |
| `signals-scout-csp-violations` | Disabled | A CSP header exists, but no PostHog CSP reporting evidence was found. |
| `signals-scout-customer-analytics` | Disabled | No account/group analytics evidence was found. |
| `signals-scout-data-pipelines` | Disabled | No CDP destinations, batch exports, or Hog flows were found. |
| `signals-scout-error-tracking` | Disabled | Covered by the native Error Tracking responder, avoiding duplicate findings. |
| `signals-scout-experiments` | Disabled | No active experiment evidence was found. |
| `signals-scout-feature-flags` | Disabled | No active flag-use evidence was found. |
| `signals-scout-inbox-validation` | Disabled | Fresh setup has no resolved reports to validate yet. |
| `signals-scout-insight-alerts` | Disabled | No configured insight-alert evidence was found. |
| `signals-scout-logs` | Disabled | No active logs evidence was found. |
| `signals-scout-mcp-tool-calls` | Disabled | No relevant MCP telemetry use was established from repository evidence. |
| `signals-scout-observability-gaps` | Disabled | The troop is intentionally limited to the highest-confidence coverage. |
| `signals-scout-replay-vision` | Disabled | New scanner observations need time to accumulate; replay defects are routed by the scanners directly. |
| `signals-scout-revenue-analytics` | Disabled | No payment SDK or revenue-data evidence was found. |
| `signals-scout-session-replay` | Disabled | Covered by the Replay Vision scanners, avoiding duplicate findings. |
| `signals-scout-skills-store` | Disabled | No skill-store hygiene surface was established. |
| `signals-scout-surveys` | Disabled | No surveys exist. |
| `signals-scout-tasks` | Disabled | No task-product usage evidence was found. |
| `signals-scout-web-vitals` | Disabled | No web-vitals capture evidence was found. |

## Custom scouts

No custom scouts were created. Two domain-specific candidates were proposed and declined:

- **Vault access reliability** — would monitor whether lock-to-unlock journeys degrade. It is watchable from the vault lifecycle event set, but was not added without approval.
- **Financial-data entry health** — would monitor sharp drops across ledger, account, import, and investment entry activity. It is watchable from the core entry event set, but was not added without approval.

Error bursts and replay analysis were ruled out as custom surfaces because native Error Tracking and Replay Vision scanners already own those routes. If a future custom scout becomes noisy, set `emit: false` on its configuration in PostHog to keep it in dry-run mode.

## Replay Vision scanners

A scanner is an LLM that watches individual session recordings on a schedule and pushes what it finds to the inbox. Replay Vision is the only component in this setup that spends Replay Vision quota. Findings arrive at half weight and require independent corroboration before they are promoted into a report.

| Brief | Status | Query scope | Sampling | Estimate |
|---|---|---|---|---|
| Breakage monitor: **MyFinanceOS vault and finance flow breakage** | Created | URL-scoped to the application root, which contains the vault-unlock and finance-management completion flows | 0.5 | 0 monthly observations; 0 estimated monthly credits at creation, based on currently available history |
| Frustration monitor: **MyFinanceOS financial workflow frustration** | Created | `$rageclick` only, with no URL filter, to isolate visible interaction frustration | 1.0 | 0 monthly observations; 0 estimated monthly credits at creation, based on currently available history |

The two scanner queries follow separate axes: the breakage monitor scopes by location, while the frustration monitor scopes solely by rage-click behavior. The in-product scanner-sizing guide was unavailable, so the organization-wide Replay Vision quota was not separately verified; the create responses returned zero estimated monthly credits at current volume.

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so the enabled Support responder can receive tickets.
- [ ] Review the two declined custom-scout ideas after enough production activity exists to establish stable baselines.
- [ ] If Replay Vision usage increases, review the organization-wide Replay Vision quota and each scanner’s estimate in PostHog.

## What happens next

The scout coordinator picks up fresh configurations within about 30 minutes. Scout runs draw from the verified 100-run daily budget, group related findings into reports, and send actionable reports to the [Self-driving inbox](https://us.posthog.com/project/601459/inbox), where they can start coding tasks.

## Repository files

Created: `posthog-self-driving-report.md`.

No application source files were modified; existing browser PostHog initialization already preserves Session Replay and Error Tracking defaults.
