/**
 * Tax & Finance Constants — Canonical Shared Module
 *
 * Single source of truth for statutory deduction limits (FY 2026-27) and the
 * planning-assumption defaults used by the Tax view and the AI copilot.
 * Previously these values were duplicated (and drifted) across TaxView.tsx
 * and aiService.ts.
 */

/** Section-wise deduction caps under the Old Regime (FY 2026-27, INR). */
export const TAX_DEDUCTION_LIMITS = {
  /** Sec 80C (PF, ELSS, PPF, life insurance) */
  ded80C: 150000,
  /** Sec 80D (self + family health insurance, non-senior) */
  ded80D: 50000,
  /** Sec 80CCD(1B) (NPS additional) */
  dedNps: 50000,
  /** Sec 24(b) (home-loan interest) */
  dedHomeLoan: 200000,
  /** Standard deduction, Old Regime (salaried) */
  stdDeductionOld: 50000,
  /** Standard deduction, New Regime (salaried) */
  stdDeductionNew: 75000,
} as const;

/**
 * Planning assumptions used by the AI copilot's local engine.
 * Named (not inline) so the assumption set has exactly one owner; values are
 * unchanged from the previous inline literals.
 */
export const AI_ASSUMPTIONS = {
  /** Long-run nominal return assumed for projections. */
  expectedReturnPct: 11,
  /** Long-run inflation assumed for real-value projections. */
  inflationPct: 6,
  /** Safe withdrawal rate for FIRE corpus estimates. */
  swrPct: 3.5,
  /** Fallback monthly expense when the user has no logged expenses. */
  fallbackMonthlyExpense: 50000,
  /** Fallback purchase target when a query names no amount. */
  fallbackPurchaseTarget: 1500000,
  /** Projection horizon for "future value" questions (years). */
  projectionYears: 10,
} as const;

/**
 * "Current month" as a `YYYY-MM` key computed in the **local** timezone.
 * Mirrors what a user sees on their calendar: `2026-09-12 23:30 IST` is
 * September locally even though UTC is already October 1st. Use this for
 * month-scoped aggregation instead of `new Date().toISOString().substring(0,7)`,
 * which buckets by UTC and disagrees with locally rendered month labels.
 */
export function getLocalMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
