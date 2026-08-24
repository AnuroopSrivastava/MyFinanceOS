# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Indian high-net-worth individuals, freelancers, and small business owners who manage both personal and business finances. They need one system for money across assets, tax, and invoicing, and they distrust vendor-held financial data. Secondary audience: privacy-minded users who want local-first control. Product is being built for others to use (freelance/startup), not solo-internal only.

## Product Purpose

MyFinanceOS is a premium, local-first personal and business finance suite for the Indian financial landscape. Success means an Indian user can run their entire money life — net worth, investments, FIRE planning, tax optimization (Old vs New regime, 80C/HRA/80D), business bookkeeping and GST invoicing — from one encrypted, offline-capable app they trust.

## Positioning

Three claims a neighboring finance app could not truthfully copy:
- **Local-first**: the browser/device is the source of truth; data lives on the user's machine first, with opt-in end-to-end-encrypted cloud sync.
- **India tax depth**: Old vs New regime comparison, 80C/HRA/80D/80CCD(1B), GST invoicing with CGST/SGST/IGST — engineered for the Indian system, not a global generic layer.
- **Premium experience**: glassmorphism UI, 60fps motion, keyboard-driven navigation — finance software that feels crafted, not utilitarian.

## Operating Context

- Default flow: set a Security PIN → derive master key → encrypted local vault; works fully offline with no account.
- Opt-in cloud sync: Google OAuth via Supabase, only ciphertext uploads, PIN never leaves the device.
- Cross-tab sync via BroadcastChannel with encrypted payload protection.
- Users interact with: Dashboard, Ledger, Reports, Sankey cash flow, Investments, Tax Optimizer, FIRE/Goal planner, EMI calculator, Document Vault, AI assistant, Automation, Business ledger (dual-entry, GST invoices, P&L).
- Themes: Glass Cyan (default), Glass Emerald, Glass Gold, Light Mode; persisted locally, synced across tabs.

## Capabilities and Constraints

- AES-256-GCM authenticated encryption; PBKDF2-SHA256 ~100k iterations for key derivation; Argon2id for PIN hashing; fresh salt+IV per encryption.
- Data in browser localStorage as `salt:iv:ciphertext`; Supabase stores an encrypted replica only.
- Assets tracked: Indian equities, mutual funds, FDs, gold, real estate, US stocks, crypto.
- Tax engine scoped to FY 2024-25 / AY 2025-26.
- Monorepo: `apps/web` (Next.js 16 + React 19, Tailwind, Framer Motion, Recharts), `apps/desktop` (Electron wrapper), packages `@financeos/ui`, `@financeos/auth`, `@financeos/database`, `@financeos/shared`.
- Runs fully in local-only mode with zero env vars; cloud features disable gracefully without them.
- **Undecided**: which README feature claims are fully shipped vs aspirational at pre-release; exact target devices/form factors; commercial pricing or licensing direction (MIT-licensed code today).

## Brand Commitments

- Name: MyFinanceOS; tagline "Premium Local-First Finance Suite for India".
- Existing logo asset (`logo.png`) and README visual identity.
- Identity commitments from repo evidence: encrypted/secure, India-specific, premium glassmorphism.

## Evidence on Hand

- README.md: feature set, architecture, security model, theme gallery.
- apps/web, apps/desktop, packages/* source.
- Existing UI: 4 themes, glassmorphism tokens, Framer Motion animations.
- Security/encryption test suites referenced (Vitest, 160+ tests incl. security & encryption).
- No customer testimonials, case studies, or press — do not fabricate.

## Product Principles

1. **Local-first is non-negotiable**: the device owns the data; cloud is an optional encrypted replica, never the source of truth.
2. **Privacy is the product**: encryption is real and verifiable, not a badge; the PIN never leaves the device.
3. **India depth over global breadth**: tax, GST, and financial rules are engineered for India first.
4. **Premium craft**: the experience quality is a differentiator, not garnish.
5. **Trust through transparency**: open-source, honest about what is local vs cloud.

## Accessibility & Inclusion

No product-specific accessibility standard confirmed yet. App must remain usable across desktop and mobile web; PIN entry, keyboard navigation, and high-contrast light theme exist.
