---
name: MyFinanceOS
description: Premium 3D Neomorphic local-first personal & business finance suite for India
colors:
  # Neutrals — dark slate base shared across all dark 3D neomorphic themes
  vantablack-slate: "hsl(222, 10%, 8%)"
  slate-1100: "hsl(222, 10%, 11%)"
  slate-900: "hsl(222, 10%, 13%)"
  slate-800: "hsl(222, 10%, 16%)"
  # Text
  glass-white: "hsl(0, 0%, 98%)"
  mist-silver: "hsl(215, 20%, 65%)"
  ash-muted: "hsl(215, 20%, 45%)"
  # Accents — theme-tunable; Frost Cyan is the default theme
  frost-cyan-1: "#06b6d4"
  frost-cyan-2: "#0284c7"
  emerald-vault-1: "#10b981"
  emerald-vault-2: "#059669"
  sovereign-gold-1: "#f59e0b"
  sovereign-gold-2: "#d97706"
  # Light mode accent
  day-blue-1: "#3b82f6"
  day-blue-2: "#2563eb"
  # Semantic
  success: "hsl(150, 60%, 45%)"
  error: "hsl(350, 70%, 55%)"
  warning: "hsl(35, 90%, 55%)"
  border-glass: "hsla(0, 0%, 100%, 0.08)"
  # Asset Classes
  asset-cash: "#06b6d4"
  asset-fd: "#3b82f6"
  asset-stocks: "#10b981"
  asset-mf: "#8b5cf6"
  asset-gold: "#f59e0b"
  asset-retirement: "#ec4899"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.92rem"
  label:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontWeight: 500
    fontSize: "0.85rem"
rounded:
  sm: "10px"
  md: "18px"
  lg: "24px"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.5rem"
  xxl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.frost-cyan-1}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0.65rem 1.25rem"
  button-secondary:
    backgroundColor: "{colors.slate-900}"
    textColor: "{colors.glass-white}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 1.25rem"
  button-danger:
    backgroundColor: "hsla(350, 70%, 55%, 0.12)"
    textColor: "{colors.error}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 1.25rem"
  input:
    backgroundColor: "{colors.slate-1100}"
    textColor: "{colors.glass-white}"
    rounded: "{rounded.sm}"
    padding: "0.7rem 1rem"
  glass-panel:
    backgroundColor: "{colors.slate-900}"
    textColor: "{colors.glass-white}"
    rounded: "{rounded.md}"
  badge:
    rounded: "9999px"
    padding: "0.25rem 0.65rem"
---

# Design System: MyFinanceOS — 3D Neomorphism

## Overview

**Creative North Star: "The Machined Slate Treasury"**

A precision-engineered financial instrument panel sculpted from solid slate. Surfaces are physical, extruded, and tactile: cards rise from the base plate with dual-source lighting (ambient specular highlights on top-left, deep diffuse shadow on bottom-right); controls and data fields are debossed into the slate like milled instrument wells; active buttons compress into physical inset cavities on click.

The aesthetic blends high-precision tactile command-center control with encrypted vault privacy for wealthy Indian users. Density is high, readouts are razor-sharp with tabular figures, and physical depth gives tangible weight to every rupee, tax calculation, and investment portfolio.

**Key Characteristics:**
- Sculpted 3D Neomorphic elevations (convex cards, debossed wells, extruded buttons).
- Dual-light source shadow modeling: soft specular ambient highlight + deep ambient occlusion shadow.
- Tactile button depression physics: buttons visibly push down into debossed inset sockets on `:active`.
- Inset debossed form inputs and data filters with glowing accent inner collars on focus.
- 3D InteractiveCard system with pointer-reactive tilt and dynamic ambient light deflection.
- Display type in Plus Jakarta Sans; body in Inter; tabular numbers for all financial figures.
- Seamless multi-theme parity across Frost Cyan, Emerald Vault, Sovereign Gold, and adaptive Light Mode.

## Colors

The system uses a neutral dark slate plate, one theme accent family, and three semantic states.

### Primary Accents
- **Frost Cyan** (#06b6d4, partner #0284c7): Default cockpit accent. Used for glowing LED pips, active nav bevels, primary extruded buttons, and focus halos.
- **Emerald Vault** (#10b981, partner #059669): Alternate theme accent & semantic positive/saved indicator.
- **Sovereign Gold** (#f59e0b, partner #d97706): Alternate theme accent; wealth-toned, sovereign treasury feel.
- **Day Blue** (#3b82f6, partner #2563eb): Light mode accent for soft clay neomorphic surfaces.

### Neutral Plate
- **Vantablack Slate** (`hsl(222, 10%, 8%)`): Base plate — the foundational canvas floor.
- **Slate Surface** (`hsl(222, 10%, 11%)`): Recessed debossed wells, input fills, dropdown beds.
- **Extruded Slate** (`hsl(222, 10%, 13%)`): Raised convex panel surface.
- **Elevated Slate** (`hsl(222, 10%, 16%)`): Floating tooltips, popovers, and elevated modals.
- **Glass White** (`hsl(0, 0%, 98%)`): Primary text and numeral readouts.
- **Mist Silver** (`hsl(215, 20%, 65%)`): Secondary text, labels, and table headers.
- **Ash Muted** (`hsl(215, 20%, 45%)`): Muted text, disabled states, placeholders.

### Semantic
- **Success** (`hsl(150, 60%, 45%)`): Positive growth, saved status, verified GST.
- **Error** (`hsl(350, 70%, 55%)`): Losses, destructive triggers, validation errors.
- **Warning** (`hsl(35, 90%, 55%)`): Pending states, tax optimization opportunities.

## Elevation & 3D Shadow Vocabulary

### Dark Slate 3D Neomorphism (Default & Dark Themes)
- **Raised SM (`--neo-raised-sm`):** `-3px -3px 8px hsla(222, 15%, 22%, 0.4), 3px 3px 9px hsla(222, 25%, 3%, 0.85)`
- **Raised MD (`--neo-raised-md`):** `-6px -6px 16px hsla(222, 15%, 22%, 0.35), 6px 6px 18px hsla(222, 25%, 2%, 0.9)`
- **Raised LG (`--neo-raised-lg`):** `-10px -10px 26px hsla(222, 15%, 24%, 0.3), 10px 10px 30px hsla(222, 25%, 1%, 0.95)`
- **Inset SM (`--neo-inset-sm`):** `inset 2px 2px 5px hsla(222, 25%, 3%, 0.85), inset -2px -2px 5px hsla(222, 15%, 20%, 0.3)`
- **Inset MD (`--neo-inset-md`):** `inset 3px 3px 8px hsla(222, 25%, 2%, 0.9), inset -3px -3px 8px hsla(222, 15%, 22%, 0.35)`
- **Button Pressed (`--neo-btn-pressed`):** `inset 3px 3px 7px rgba(0, 0, 0, 0.7), inset -2px -2px 5px hsla(222, 15%, 25%, 0.25)`

### Light Mode 3D Neomorphism
- **Raised SM:** `-3px -3px 8px #ffffff, 3px 3px 9px rgba(166, 175, 195, 0.5)`
- **Raised MD:** `-6px -6px 16px #ffffff, 6px 6px 18px rgba(166, 175, 195, 0.6)`
- **Inset SM:** `inset 2px 2px 5px rgba(166, 175, 195, 0.55), inset -2px -2px 5px #ffffff`
- **Inset MD:** `inset 3px 3px 8px rgba(166, 175, 195, 0.65), inset -3px -3px 8px #ffffff`

## Components

### Buttons & Tactile Switches
- **Shape:** 10px rounded pill corners, 0.9rem typography.
- **Resting:** Extruded raised surface with subtle top specular highlight.
- **Hover:** Elevated specular glow (`--shadow-glow`) with deepened drop shadow.
- **Active / Pressed:** Physical depression (`transform: translateY(1px) scale(0.98)` with `--neo-btn-pressed` inset shadow).

### 3D Neomorphic Panels & Cards
- **Structure:** Convex extruded plate (`--neo-raised-md`), 18px border-radius, hairline specular top border (`rgba(255,255,255,0.06)`).
- **InteractiveCard Tilt:** 3D GPU perspective tilt with real-time ambient highlight tracking.

### Inputs, Fields & Search Bars
- **Structure:** Debossed inset well (`--neo-inset-sm`), solid Slate Surface background, 10px radius.
- **Focus:** Inset shadow softens, inner accent border glows with crisp outer halo.

### Navigation & Command Rail
- **Sidebar:** Docked console plate with recessed navigation tracks. Active items sink into a subtle debossed pocket with an illuminated LED accent pip.
- **Mobile Navigation:** Extruded 3D floating dock with tactile pill indicators.

### Tables & Data Grids
- **Header:** Tactile bevel separators, uppercase tabular labels.
- **Rows:** Recessed well container with soft extruded row lift on hover.

## Design Tokens

All theme-able values live as CSS custom properties in `packages/ui/src/styles/global.css`. Components consume tokens via `var(--token)` and never hardcode raw values — this is what keeps theme parity (Frost Cyan / Emerald Vault / Sovereign Gold / Light) intact.

### Surfaces & Elevation
| Token | Purpose |
|---|---|
| `--bg-primary` / `--bg-secondary` / `--bg-panel` | Base plate / debossed well / raised panel |
| `--bg-panel-hover` | Elevated panel hover lift |
| `--neo-raised-sm/md/lg` | Convex extrusion shadows (see Elevation section) |
| `--neo-inset-sm/md` | Debossed well shadows |
| `--neo-btn-pressed` | Button depression inset |
| `--neo-bevel-top` / `--neo-bevel-bottom` | Hairline specular bevels |
| `--neo-convex-grad` / `--neo-inset-grad` | Panel/well gradient fills |

### Borders
| Token | Purpose |
|---|---|
| `--border-color` / `--border-strong` | Standard hairline / emphasized border |
| `--border-subtle` / `--border-faint` | Whisper-thin separators |
| `--border-focus` / `--border-color-glow` | Focus ring + halo |
| `--glass-border` | Translucent glass edge |
| `--overlay-scrim` | Modal/backdrop scrim (replaces raw `rgba(0,0,0,0.6…0.75)`) |

### Text & Typography
| Token | Purpose |
|---|---|
| `--text-primary` / `--text-secondary` / `--text-muted` | Primary / secondary / muted ink |
| `--font-display` | Display face (Plus Jakarta Sans) |
| `--font-body` | Body face (Inter) |
| `--font-2xs` … `--font-2xl` | Type scale (0.7rem → 1.6rem) |
| `--fw-medium` … `--fw-black` | Font weights (500 → 800) |

### Spacing & Radius
| Token | Purpose |
|---|---|
| `--spacing-02` … `--spacing-25` | Spacing scale (0.1rem → 2.5rem) |
| `--radius-xs` / `--radius-sm` / `--radius-md` / `--radius-pill` | 4px / 8px / 16px / 9999px radii |

### Semantic & Status
| Token | Purpose |
|---|---|
| `--success` / `--error` / `--warning` / `--info` | Semantic ink |
| `--success-bg` / `--error-bg` / `--warning-bg` / `--info-bg` | Semantic well fills (replaces raw `rgba(…,0.1)`) |
| `--status-paid-*` / `--status-pending-*` / `--status-overdue-*` / `--status-draft-*` | Invoice/status badge triplets (bg/text/border) |
| `--badge-*` | Tag/flag badge triplets |
| `--surface-tint` / `--surface-tint-strong` / `--surface-faint` | Panel tint washes (replaces raw white/blue low-alpha rgbs) |
| `--color-asset-*` / `--chart-*` / `--color-inflow` / `--color-outflow` / `--color-transfer` | Asset-class & chart series colors |

## Component Library

Shared UI ships from `packages/ui` (aliased `@financeos/ui`). Rules: components own their structure and tokens; views pass data + minimal props; views must NOT re-implement library primitives inline.

- **Button** — tactile extruded press; variants `primary|secondary|danger|ghost|link`; sizes `sm|md|lg`.
- **IconButton** — square tactile button; **`icon` prop is REQUIRED** (children reserved for label text). `label` sets `aria-label`.
- **PanelHeader** — compact in-card title row (icon + display title + optional subtitle + right `action` slot); props `title`, `icon`, `subtitle`, `action`, `tag`.
- **InfoCallout** — semantic alert/callout strip for in-flow status (info/success/warning/error variants).
- **FormActions** — standardized Cancel + Submit footer row for modals/forms; `divided` mode renders the modal-bottom hairline footer. Uses onClick handlers — forms relying on native `type="submit"` validation keep plain buttons.
- **Slider** — debossed range control with label row + readout; `editable` swaps the readout for a number input (`prefix`/`suffix`/`inputWidth`). Use for all calculator-style inputs (EMI, FIRE, planner targets).
- **SearchFilterBar** — search + optional filter chips + trailing `action` slot; used by LedgerView journal toolbar.
- **FormField** — consolidated `.form-group` + `.form-label` + control + hint/error row. Replaces the 150+ hand-rolled form rows; prefer it for all new forms. Props: `label`, `htmlFor`, `required` (error-asterisk), `hint`, `error`.
- **Modal / ConfirmDialog / ConfirmModal + useConfirmModal** — debossed elevated modal with scrim; `ConfirmModal` standardizes the title/message/confirm/cancel/danger pattern.
- **InteractiveCard + useInteractiveCardSystem** — pointer-reactive 3D tilt + ambient light; mount `useInteractiveCardSystem()` once at app root.
- **MetricCard** — KPI readout card with trend line + variant accent.
- **DataTable / DataTableColumn** — token-native table with sortable columns.
- **Badge / StatusBadge** — pill flags; `StatusBadge` maps invoice status → semantic triplet.
- **PinDots / PadBtn / NumberPad** — 4-dot PIN dots, haptic keypad.
- **CurrencyInput / IconInput** — INR-aware amount input; icon-prefixed input.
- **Tabs / SectionHeader / EmptyState / ActionRow** — section scaffolding.
- **TaxRegimeToggle / DeductionCard / OptimizationActionList / TaxExportButton** — tax-suite primitives.
- **ProgressIndicators** — `CircularProgress` / `LinearProgress` for goal tracking.

## Notes & Decisions
- **GoalTracker palette:** `GOAL_COLORS` maps to the `--color-asset-*` tokens plus `--warning`/`--error` so savings goals read as portfolio assets and stay theme-parity. Existing goals storing legacy hexes still render (CSS accepts both).
- **Shared storage/logic keys:** `STORAGE_KEYS` (`dbCache`, `lastSyncedAt`, `theme`) and date/download helpers (`todayStamp`, `downloadBlob`) live in `@financeos/shared` — the single source for the string literals that used to be duplicated across `packages/database`, `packages/ui`, and views.
- **Save worker:** `packages/database/src/saveWorker.ts` is a real module (imports `encryptData` from `@financeos/shared`); `getSaveWorker` instantiates it via `new Worker(new URL('./saveWorker.ts', import.meta.url), { type: 'module' })` so webpack bundles it (the `database` package ships raw TS via `main: ./src/index.ts`).
- **Marketing / public pages (Landing, PrivacyView, TermsView):** these are standalone render targets (SSR/static) and intentionally use inline styles **with CSS-variable fallbacks** (e.g. `var(--badge-cyan-bg, rgba(6,182,212,0.15))`) so they degrade gracefully without the full theme stylesheet. Keep the fallback convention when editing them; do not convert them to bare tokens.
- **Migration sweep:** the deterministic token sweep (`fontSize`/`fontWeight`/spacing/radius/`rgba` scrims) is applied to `apps/web/src` component files. Restored/corrupt files must be re-swept after any text-level repair to normalize string contents back to token form.

## Rules & Directives
- **Render money and rates with tabular numbers (`font-variant-numeric: tabular-nums`).**
- **Honor tactile physical hierarchy:** Base Canvas → Extruded Panels → Debossed Wells → Tactile Raised Controls.
- **Respect `prefers-reduced-motion`:** Collapse 3D tilts and lifts to smooth opacity and border-color transitions.

