/**
 * Financial Calculations Regression Test Suite
 *
 * These tests serve as the ground-truth anchor for all financial formulas used in MyFinanceOS.
 * The formulas under test are imported from the shared production module
 * `./financialCalculations` (single source of truth consumed by the UI components).
 * All expected values have been hand-verified against Indian financial calculation standards.
 *
 * Covers: EMI, SIP FV, FIRE Corpus, Net Worth, GST, Invoice, Indian Income Tax (Old/New Regime), FD Accrual
 */
import { describe, it, expect } from 'vitest';
import {
  calculateEMI,
  calculateSIPFutureValue,
  calculateFIRECorpus,
  calculateNetWorth,
  calculateGST,
  calculateTaxOldRegime,
  calculateTaxNewRegime,
  calculateFdAccruedValue,
  solveXIRR,
  calculateStepUpSIPWealth,
  generateAmortizationSchedule
} from '@financeos/shared';

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITES
// ─────────────────────────────────────────────────────────────────────────────

describe('Financial Calculations — EMI Formula (Reference Vector Regression)', () => {
  it('Reference Vector 1: ₹5L @ 10% pa for 60 months → ₹10,624/mo', () => {
    expect(calculateEMI(500000, 10, 60)).toBe(10624);
  });

  it('Reference Vector 2: ₹30L @ 8.5% pa for 240 months → ₹26,035/mo', () => {
    expect(calculateEMI(3000000, 8.5, 240)).toBe(26035);
  });

  it('Reference Vector 3: ₹10L @ 0% pa for 120 months → ₹8,333/mo (zero-rate)', () => {
    expect(calculateEMI(1000000, 0, 120)).toBe(8333);
  });

  it('Reference Vector 4: ₹0 principal → ₹0 EMI (no loan)', () => {
    expect(calculateEMI(0, 10, 60)).toBe(0);
  });

  it('Reference Vector 5: ₹50L @ 7% pa for 360 months (30-year home loan)', () => {
    // Standard home loan calculation — approx ₹33,277/mo
    const emi = calculateEMI(5000000, 7, 360);
    expect(emi).toBeGreaterThan(33000);
    expect(emi).toBeLessThan(34000);
  });

  it('EMI should decrease as tenure increases (all else equal)', () => {
    const emi10yr = calculateEMI(1000000, 10, 120);
    const emi20yr = calculateEMI(1000000, 10, 240);
    expect(emi10yr).toBeGreaterThan(emi20yr);
  });

  it('EMI should increase as interest rate increases (all else equal)', () => {
    const emi8 = calculateEMI(1000000, 8, 120);
    const emi12 = calculateEMI(1000000, 12, 120);
    expect(emi12).toBeGreaterThan(emi8);
  });

  it('Total repayment should always be >= principal (no negative interest)', () => {
    const emi = calculateEMI(1000000, 8.5, 180);
    expect(emi * 180).toBeGreaterThanOrEqual(1000000);
  });
});

describe('Financial Calculations — SIP Future Value', () => {
  it('Reference Vector 1: SIP ₹25,000/mo @ 12% pa for 20 years', () => {
    // Standard reference: ≈ ₹2,49,84,015
    const fv = calculateSIPFutureValue(25000, 12, 20);
    // Allow ±1% tolerance for rounding
    expect(fv).toBeGreaterThan(24900000);
    expect(fv).toBeLessThan(25100000);
  });

  it('Reference Vector 2: SIP ₹10,000/mo @ 0% for 12 months → ₹1,20,000', () => {
    expect(calculateSIPFutureValue(10000, 0, 1)).toBe(120000);
  });

  it('Reference Vector 3: SIP ₹5,000/mo @ 15% pa for 30 years (aggressive growth)', () => {
    const fv = calculateSIPFutureValue(5000, 15, 30);
    // Should be multiple crores
    expect(fv).toBeGreaterThan(30000000); // >₹3 crore
  });

  it('SIP of ₹0 → ₹0 future value', () => {
    expect(calculateSIPFutureValue(0, 12, 10)).toBe(0);
  });

  it('Higher return rate → higher future value', () => {
    const fv10 = calculateSIPFutureValue(10000, 10, 10);
    const fv15 = calculateSIPFutureValue(10000, 15, 10);
    expect(fv15).toBeGreaterThan(fv10);
  });

  it('Longer duration → higher future value', () => {
    const fv10 = calculateSIPFutureValue(10000, 12, 10);
    const fv20 = calculateSIPFutureValue(10000, 12, 20);
    expect(fv20).toBeGreaterThan(fv10);
  });
});

describe('Financial Calculations — FIRE Corpus (Safe Withdrawal Rate)', () => {
  it('Reference Vector 1: Expenses ₹75,000/mo at SWR=4% → ₹2,25,00,000 corpus', () => {
    expect(calculateFIRECorpus(75000, 4)).toBe(22500000);
  });

  it('Reference Vector 2: Expenses ₹75,000/mo at SWR=3.5% → ₹2,57,14,286 corpus', () => {
    expect(calculateFIRECorpus(75000, 3.5)).toBe(25714286);
  });

  it('Reference Vector 3: Expenses ₹50,000/mo at SWR=4% → ₹1,50,00,000 corpus', () => {
    expect(calculateFIRECorpus(50000, 4)).toBe(15000000);
  });

  it('Lower SWR → larger corpus requirement (conservative FIRE)', () => {
    const corpus4pct = calculateFIRECorpus(100000, 4);
    const corpus3pct = calculateFIRECorpus(100000, 3);
    expect(corpus3pct).toBeGreaterThan(corpus4pct);
  });

  it('Corpus should scale linearly with expenses', () => {
    const corpus1 = calculateFIRECorpus(50000, 4);
    const corpus2 = calculateFIRECorpus(100000, 4);
    expect(corpus2).toBe(corpus1 * 2);
  });

  it('Production behavior: SWR ≤ 0 → corpus 0 (avoids division by zero / Infinity)', () => {
    expect(calculateFIRECorpus(50000, 0)).toBe(0);
    expect(calculateFIRECorpus(50000, -2)).toBe(0);
  });
});

describe('Financial Calculations — Net Worth', () => {
  it('Reference Vector 1: Assets ₹50L − Liabilities ₹15L → Net Worth ₹35L', () => {
    expect(calculateNetWorth(5000000, 1500000)).toBe(3500000);
  });

  it('Net Worth can be negative (over-leveraged)', () => {
    expect(calculateNetWorth(500000, 2000000)).toBe(-1500000);
  });

  it('Zero liabilities → Net Worth = Assets', () => {
    expect(calculateNetWorth(10000000, 0)).toBe(10000000);
  });

  it('Zero assets → Net Worth = −Liabilities', () => {
    expect(calculateNetWorth(0, 500000)).toBe(-500000);
  });
});

describe('Financial Calculations — GST (Indian Indirect Tax)', () => {
  it('Reference Vector 1: Taxable ₹10,000 @ 18% intra-state → CGST ₹900 + SGST ₹900 = Total ₹11,800', () => {
    const result = calculateGST(10000, 18, false);
    expect(result.cgst).toBe(900);
    expect(result.sgst).toBe(900);
    expect(result.igst).toBe(0);
    expect(result.totalTax).toBe(1800);
    expect(result.totalAmount).toBe(11800);
  });

  it('Reference Vector 2: Taxable ₹10,000 @ 18% inter-state → IGST ₹1,800 = Total ₹11,800', () => {
    const result = calculateGST(10000, 18, true);
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.igst).toBe(1800);
    expect(result.totalTax).toBe(1800);
    expect(result.totalAmount).toBe(11800);
  });

  it('GST @ 5% intra-state: Taxable ₹10,000 → CGST ₹250 + SGST ₹250', () => {
    const result = calculateGST(10000, 5, false);
    expect(result.cgst).toBe(250);
    expect(result.sgst).toBe(250);
    expect(result.totalTax).toBe(500);
    expect(result.totalAmount).toBe(10500);
  });

  it('GST @ 28% intra-state: Taxable ₹1,00,000 → CGST ₹14,000 + SGST ₹14,000', () => {
    const result = calculateGST(100000, 28, false);
    expect(result.cgst).toBe(14000);
    expect(result.sgst).toBe(14000);
    expect(result.totalAmount).toBe(128000);
  });

  it('GST on invoice line: Qty=5, Price=₹200, Rate=18% → Line=₹1000, GST=₹180, Total=₹1180', () => {
    const qty = 5;
    const unitPrice = 200;
    const lineAmount = qty * unitPrice;
    const result = calculateGST(lineAmount, 18, false);
    expect(lineAmount).toBe(1000);
    expect(result.totalTax).toBe(180);
    expect(result.totalAmount).toBe(1180);
  });

  it('GST @ 0% → no tax at all', () => {
    const result = calculateGST(50000, 0, false);
    expect(result.totalTax).toBe(0);
    expect(result.totalAmount).toBe(50000);
  });
});

describe('Financial Calculations — Indian Income Tax (Old Regime)', () => {
  it('Reference Vector 1: Taxable ₹10,50,000 → correct old regime tax with cess', () => {
    // ₹2.5L-₹5L: 5% = ₹12,500
    // ₹5L-₹10L: 20% = ₹1,00,000
    // ₹10L-₹10.5L: 30% = ₹15,000
    // Total tax: ₹1,27,500; cess: ₹5,100; Total: ₹1,32,600
    const result = calculateTaxOldRegime(1050000);
    expect(result.tax).toBe(127500);
    expect(result.cess).toBe(5100);
    expect(result.totalTax).toBe(132600);
  });

  it('Income below ₹2.5L → zero tax', () => {
    const result = calculateTaxOldRegime(200000);
    expect(result.tax).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it('Income ₹2.5L exactly → zero tax (at slab boundary)', () => {
    const result = calculateTaxOldRegime(250000);
    expect(result.tax).toBe(0);
  });

  it('Income ₹5L exactly → zero tax (Sec 87A rebate boundary)', () => {
    // Production TaxView applies the Sec 87A rebate: taxable income ≤ ₹5L → tax = 0
    const result = calculateTaxOldRegime(500000);
    expect(result.tax).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it('Income just above ₹5L → tax kicks in after the rebate boundary', () => {
    // ₹5L-₹5.01L: 20% = ₹200 + slab floor ₹12,500 = ₹12,700; cess 4% = ₹508
    const result = calculateTaxOldRegime(501000);
    expect(result.tax).toBe(12700);
    expect(result.cess).toBe(508);
    expect(result.totalTax).toBe(13208);
  });

  it('Tax should be monotonically increasing with income', () => {
    const t1 = calculateTaxOldRegime(600000).totalTax;
    const t2 = calculateTaxOldRegime(800000).totalTax;
    const t3 = calculateTaxOldRegime(1200000).totalTax;
    expect(t2).toBeGreaterThan(t1);
    expect(t3).toBeGreaterThan(t2);
  });
});

describe('Financial Calculations — Indian Income Tax (New Regime FY 2026-27)', () => {
  it('Gross ₹12L: StdDed ₹75K → Taxable ₹11.25L, fully covered by Sec 87A rebate → ₹0 tax', () => {
    // Production TaxView applies the Sec 87A rebate (taxable ≤ ₹12L → tax = 0).
    // Before rebate: 4-8L 5% = ₹20,000 + 8-11.25L 10% = ₹32,500.
    const result = calculateTaxNewRegime(1200000);
    expect(result.taxableIncome).toBe(1125000);
    expect(result.tax).toBe(0);
    expect(result.cess).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it('Gross ₹7L (₹6.25L taxable) → within rebate region → ₹0 tax', () => {
    const result = calculateTaxNewRegime(700000);
    expect(result.taxableIncome).toBe(625000);
    expect(result.totalTax).toBe(0);
  });

  it('Gross ₹12.75L → taxable exactly ₹12L → rebate boundary still wipes tax', () => {
    const result = calculateTaxNewRegime(1275000);
    expect(result.taxableIncome).toBe(1200000);
    expect(result.totalTax).toBe(0);
  });

  it('Gross ₹16L: Taxable ₹15.25L → correct FY 2026-27 slab tax with cess', () => {
    // 4-8L: 5% = ₹20,000 | 8-12L: 10% = ₹40,000 | 12-15.25L: 15% = ₹48,750
    // Total tax: ₹1,08,750; cess 4% = ₹4,350; Total: ₹1,13,100
    const result = calculateTaxNewRegime(1600000);
    expect(result.taxableIncome).toBe(1525000);
    expect(result.tax).toBe(108750);
    expect(result.cess).toBe(4350);
    expect(result.totalTax).toBe(113100);
  });

  it('Gross ₹30L: Taxable ₹29.25L → all seven slabs exercised', () => {
    // 4-8L: 20,000 | 8-12L: 40,000 | 12-16L: 60,000 | 16-20L: 80,000 | 20-24L: 1,00,000
    // 24-29.25L: 30% = ₹1,57,500 → tax ₹4,57,500; cess ₹18,300; total ₹4,75,800
    const result = calculateTaxNewRegime(3000000);
    expect(result.taxableIncome).toBe(2925000);
    expect(result.tax).toBe(457500);
    expect(result.cess).toBe(18300);
    expect(result.totalTax).toBe(475800);
  });

  it('New regime tax < old regime tax for income with minimal deductions', () => {
    // High income, no deductions → new regime should be better
    const newTax = calculateTaxNewRegime(2000000).totalTax;
    const oldTax = calculateTaxOldRegime(2000000 - 50000).totalTax; // only std ded in old regime
    expect(newTax).toBe(192400);
    expect(newTax).toBeLessThan(oldTax);
  });
});

describe('Financial Calculations — FD Accrued Value', () => {
  it('Before start date → returns principal amount', () => {
    // We simulate a future-start FD — should return principal unchanged
    const futureFD = {
      id: 'fd1',
      profileId: 'p1',
      bankName: 'SBI',
      principalAmount: 100000,
      interestRate: 7.5,
      startDate: '2030-01-01', // future
      maturityDate: '2031-01-01',
      maturityAmount: 107500,
      isMatured: false,
      interestPayoutType: 'On Maturity' as const,
      tenureMonths: 12
    };
    // The function uses `new Date()` internally, so if startDate is far future, should return principal
    const accrued = calculateFdAccruedValue(futureFD);
    expect(accrued).toBe(futureFD.principalAmount);
  });

  it('After maturity date → returns maturity amount (capped)', () => {
    const maturedFD = {
      id: 'fd2',
      profileId: 'p1',
      bankName: 'HDFC',
      principalAmount: 200000,
      interestRate: 7.25,
      startDate: '2020-01-01', // far past
      maturityDate: '2021-01-01', // past
      maturityAmount: 214500,
      isMatured: true,
      interestPayoutType: 'On Maturity' as const,
      tenureMonths: 12
    };
    const accrued = calculateFdAccruedValue(maturedFD);
    expect(accrued).toBe(maturedFD.maturityAmount);
  });

  it('Midway through FD → accrued value between principal and maturity', () => {
    // FD that started Jan 2024 and matures Jan 2027 (3 years) — we are in 2026
    const activeFD = {
      id: 'fd3',
      profileId: 'p1',
      bankName: 'Axis',
      principalAmount: 500000,
      interestRate: 7.0,
      startDate: '2024-01-01',
      maturityDate: '2027-01-01',
      maturityAmount: 608750, // approximate
      isMatured: false,
      interestPayoutType: 'On Maturity' as const,
      tenureMonths: 36
    };
    const accrued = calculateFdAccruedValue(activeFD);
    expect(accrued).toBeGreaterThan(activeFD.principalAmount);
    expect(accrued).toBeLessThanOrEqual(activeFD.maturityAmount);
  });

  it('FD accrued value uses quarterly compounding formula', () => {
    // P=₹1L, R=8%pa, after exactly 1 quarter
    // A = 1,00,000 × (1 + 0.08/4)^1 = 1,00,000 × 1.02 = ₹1,02,000
    // Accrued should be approximately this
    const quarterlyFD = {
      id: 'fd4',
      profileId: 'p1',
      bankName: 'ICICI',
      principalAmount: 100000,
      interestRate: 8.0,
      startDate: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 91 days ago
      maturityDate: new Date(Date.now() + 274 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // future
      maturityAmount: 140000,
      isMatured: false,
      interestPayoutType: 'On Maturity' as const,
      tenureMonths: 12
    };
    const accrued = calculateFdAccruedValue(quarterlyFD);
    // After ~1 quarter at 8% quarterly compounding: ~₹1,02,000
    expect(accrued).toBeGreaterThan(100000);
    expect(accrued).toBeLessThan(105000); // shouldn't have compounded more than a quarter's worth
  });
});

describe('Financial Calculations — XIRR Solver Engine', () => {
  it('solves XIRR correctly for standard multi-year cash flows', () => {
    const cashFlows = [
      { date: new Date('2023-01-01'), amount: -100000 },
      { date: new Date('2024-01-01'), amount: -50000 },
      { date: new Date('2025-01-01'), amount: 180000 }
    ];
    const xirr = solveXIRR(cashFlows);
    expect(xirr).toBeGreaterThan(0.08); // > 8%
    expect(xirr).toBeLessThan(0.20); // < 20%
  });

  it('returns 0 for single cash flow or empty array', () => {
    expect(solveXIRR([])).toBe(0);
    expect(solveXIRR([{ date: new Date(), amount: 100 }])).toBe(0);
  });
});

describe('Financial Calculations — Step-Up SIP Calculator', () => {
  it('calculates step-up compounding wealth correctly over 10 years', () => {
    const res = calculateStepUpSIPWealth(100000, 25000, 12, 10, 120);
    expect(res.totalCorpus).toBeGreaterThan(res.totalInvested);
    expect(res.totalInvested).toBeGreaterThan(3000000);
  });

  it('handles zero months or zero SIP gracefully', () => {
    const res = calculateStepUpSIPWealth(50000, 0, 12, 10, 0);
    expect(res.totalCorpus).toBe(50000);
    expect(res.totalInvested).toBe(50000);
  });
});

describe('Financial Calculations — Loan Amortization Schedule', () => {
  it('generates full monthly amortization schedule with balance converging to 0', () => {
    const schedule = generateAmortizationSchedule(500000, 10, 60);
    expect(schedule.length).toBe(60);
    expect(schedule[0].openingBalance).toBe(500000);
    expect(schedule[59].closingBalance).toBe(0);
  });

  it('applies prepayment correctly reducing subsequent interest and balance', () => {
    const scheduleWithPrepayment = generateAmortizationSchedule(500000, 10, 60, 100000, 12);
    expect(scheduleWithPrepayment[11].principal).toBeGreaterThan(100000);
    expect(scheduleWithPrepayment[scheduleWithPrepayment.length - 1].closingBalance).toBe(0);
  });
});

