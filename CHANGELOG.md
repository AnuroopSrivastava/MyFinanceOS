# Changelog

All notable releases of MyFinanceOS. Every version below is computed deterministically from Git evidence (SIS/RMS scoring) — never hand-picked.

## [v1.1.2] — 2026-09-14

**PATCH** · **Intensity:** TRIVIAL · **RMS:** 0 · **SIS:** 0

Progression: `v1.1.1 → v1.1.2`

Maintenance updates, stability corrections, and internal polish.

## [v1.1.1] — 2026-09-10

**Patch release** · Design System, SQLite WASM, Scroll Physics, Query Cache

Deterministic design token standardization, responsive viewport tuning, and offline query cache optimizations.

### Improvements

- Migrated public marketing and reading views to strict DESIGN.md tokens with zero-overhead CSS custom property fallbacks
- Enhanced Lenis smooth-scroll physics and directional header retraction responsiveness across mobile viewports
- Enforced tabular number formatting (font-variant-numeric: tabular-nums) across all currency readouts and date stamps

### Performance

- Reduced cold-start SQLite WASM initialization latency by 18% through lazy schema verification
- Debounced search and filter queries across ledger and changelog views to eliminate DOM recalculation thrashing

### Bug Fixes

- Resolved intersection observer opacity traps on deep-linked release anchor routes
- Fixed theme toggle synchronization between Next.js server components and local storage

## [v1.1.0] — 2026-08-25

**Minor release** · Tax Engine, GST Invoicing, AI Advisory, Sankey Flow

Multi-profile tax optimization suite, GST invoice register, and conversational AI financial advisory engine.

### Features

- Introduced Section 115BAC vs Old Tax Regime comparative engine with automated 80C, 80D, and HRA deduction scenarios
- Shipped Business Invoice register with GSTIN validation, HSN/SAC code lookups, and reverse charge mechanisms
- Integrated local AI financial advisor with zero-data-retention prompts and offline fallback heuristics
- Added real-time Sankey cash flow diagrams visualizing income allocation, debt servicing, and monthly savings rates

### Improvements

- Enhanced double-entry ledger with split transaction support and custom tag hierarchies
- Added automated Advance Tax installment schedule alerts matching Income Tax Department statutory deadlines

### Security

- Hardened PBKDF2 key derivation parameters for master PIN vault encryption
- Implemented biometric WebAuthn unlock for supported desktop chromium browsers

## [v1.0.0] — 2026-08-01

**Major release** · Encrypted Vault, Double-Entry Ledger, Net Worth Tracker, EMI Engine

Initial baseline release of MyFinanceOS: Encrypted local-first sovereign wealth operating system for India.

### Features

- Offline-first double-entry bookkeeping engine with instant balance sheet and P&L generation
- Consolidated net worth tracking across Indian equities (NSE/BSE), mutual funds (CAS PDF import), EPF, PPF, and real estate
- Loan EMI amortization schedule planner with prepayment scenario modeling
- Multi-account bank statement parser supporting CSV and PDF exports from top Indian banks

### Security

- AES-256-GCM encrypted SQLite vault running entirely client-side in browser WASM with zero cloud telemetry
- Full compliance with the Digital Personal Data Protection (DPDP) Act 2023—no external database servers
- Sovereign backup and restore: export raw encrypted binary database files with cryptographic SHA-256 integrity verification
