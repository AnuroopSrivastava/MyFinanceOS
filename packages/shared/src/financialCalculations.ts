/**
 * Financial Calculations — Canonical Shared Production Module
 *
 * Single source of truth for the financial formulas used across MyFinanceOS
 * (EMI, SIP future value, FIRE corpus, net worth, GST, and Indian income tax).
 */

export interface CashFlow {
  date: Date;
  amount: number;
}

export interface AmortRow {
  month: number;
  openingBalance: number;
  emi: number;
  principal: number;
  interest: number;
  closingBalance: number;
}

/**
 * EMI (Equated Monthly Installment) — Standard reducing-balance formula
 */
export function calculateEMI(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePct <= 0) return Math.round(principal / tenureMonths);
  const r = annualRatePct / 12 / 100;
  const n = tenureMonths;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
}

/**
 * SIP Future Value — Standard mutual fund SIP (annuity-due) formula
 */
export function calculateSIPFutureValue(monthlyAmount: number, annualRatePct: number, years: number): number {
  if (monthlyAmount <= 0 || years <= 0) return 0;
  if (annualRatePct <= 0) return Math.round(monthlyAmount * years * 12);
  const r = annualRatePct / 12 / 100;
  const n = years * 12;
  const fv = monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  return Math.round(fv);
}

/**
 * FIRE Corpus — Safe Withdrawal Rate method
 */
export function calculateFIRECorpus(monthlyExpense: number, swrPct: number): number {
  if (monthlyExpense <= 0 || swrPct <= 0) return 0;
  const annualExpenses = monthlyExpense * 12;
  return Math.round(annualExpenses / (swrPct / 100));
}

/** Net Worth = Total Assets − Total Liabilities */
export function calculateNetWorth(assets: number, liabilities: number): number {
  return assets - liabilities;
}

/**
 * GST Calculation (Indian indirect tax)
 */
export function calculateGST(taxableAmount: number, gstRatePct: number, isInterState: boolean): {
  cgst: number; sgst: number; igst: number; totalTax: number; totalAmount: number;
} {
  if (taxableAmount <= 0 || gstRatePct < 0) {
    return { cgst: 0, sgst: 0, igst: 0, totalTax: 0, totalAmount: 0 };
  }
  const totalTaxAmount = (taxableAmount * gstRatePct) / 100;
  if (isInterState) {
    return { cgst: 0, sgst: 0, igst: Math.round(totalTaxAmount), totalTax: Math.round(totalTaxAmount), totalAmount: Math.round(taxableAmount + totalTaxAmount) };
  }
  const halfTax = Math.round(totalTaxAmount / 2);
  return { cgst: halfTax, sgst: halfTax, igst: 0, totalTax: halfTax * 2, totalAmount: Math.round(taxableAmount + halfTax * 2) };
}

/**
 * Indian Income Tax — Old Regime (FY 2026-27)
 */
export function calculateTaxOldRegime(taxableIncome: number): { tax: number; cess: number; totalTax: number } {
  let tax = 0;
  if (taxableIncome > 1000000) {
    tax += (taxableIncome - 1000000) * 0.30 + 100000 + 12500;
  } else if (taxableIncome > 500000) {
    tax += (taxableIncome - 500000) * 0.20 + 12500;
  } else if (taxableIncome > 250000) {
    tax += (taxableIncome - 250000) * 0.05;
  }
  if (taxableIncome <= 500000) tax = 0; // Sec 87A rebate
  const cess = tax * 0.04;
  return { tax, cess, totalTax: tax + cess };
}

/**
 * FD Accrued Value — Quarterly compounding accrual for fixed deposits.
 */
export function calculateFdAccruedValue(fd: {
  principalAmount: number;
  interestRate: number;
  startDate: string;
  maturityDate?: string;
  maturityAmount?: number;
  isMatured?: boolean;
  interestPayoutType?: string;
  tenureMonths?: number;
}): number {
  const now = new Date();
  const start = new Date(fd.startDate);
  if (now < start || isNaN(start.getTime())) return fd.principalAmount || 0;
  if (fd.isMatured) return fd.maturityAmount ?? fd.principalAmount ?? 0;

  const maturity = fd.maturityDate ? new Date(fd.maturityDate) : null;
  if (maturity && !isNaN(maturity.getTime()) && now >= maturity) {
    return fd.maturityAmount ?? fd.principalAmount ?? 0;
  }

  const quartersElapsed = (now.getTime() - start.getTime()) / (91.25 * 24 * 60 * 60 * 1000);
  const r = (fd.interestRate || 0) / 100;
  const accrued = (fd.principalAmount || 0) * Math.pow(1 + r / 4, Math.max(0, quartersElapsed));
  const roundedAccrued = Math.round(accrued);
  if (typeof fd.maturityAmount === 'number' && !isNaN(fd.maturityAmount)) {
    return Math.min(roundedAccrued, fd.maturityAmount);
  }
  return roundedAccrued;
}

/**
 * Indian Income Tax — New Regime (FY 2026-27)
 */
export function calculateTaxNewRegime(grossIncome: number): { taxableIncome: number; tax: number; cess: number; totalTax: number } {
  const stdDeduction = 75000;
  const taxableIncome = Math.max(0, grossIncome - stdDeduction);
  let tax = 0;
  if (taxableIncome > 2400000) {
    tax += (taxableIncome - 2400000) * 0.30 + 100000 + 80000 + 60000 + 40000 + 20000;
  } else if (taxableIncome > 2000000) {
    tax += (taxableIncome - 2000000) * 0.25 + 80000 + 60000 + 40000 + 20000;
  } else if (taxableIncome > 1600000) {
    tax += (taxableIncome - 1600000) * 0.20 + 60000 + 40000 + 20000;
  } else if (taxableIncome > 1200000) {
    tax += (taxableIncome - 1200000) * 0.15 + 40000 + 20000;
  } else if (taxableIncome > 800000) {
    tax += (taxableIncome - 800000) * 0.10 + 20000;
  } else if (taxableIncome > 400000) {
    tax += (taxableIncome - 400000) * 0.05;
  }
  if (taxableIncome <= 1200000) tax = 0; // Sec 87A rebate
  const cess = tax * 0.04;
  return { taxableIncome, tax, cess, totalTax: tax + cess };
}

/**
 * Net Present Value calculation for XIRR
 */
export function calculateNPV(rate: number, cashFlows: CashFlow[]): number {
  if (cashFlows.length === 0) return 0;
  const t0 = cashFlows[0].date.getTime();
  let npv = 0;
  for (const cf of cashFlows) {
    const years = (cf.date.getTime() - t0) / (1000 * 60 * 60 * 24 * 365.25);
    npv += cf.amount / Math.pow(1 + rate, years);
  }
  return npv;
}

/**
 * Cryptographically robust XIRR Bisection Solver
 */
export function solveXIRR(cashFlows: CashFlow[]): number {
  if (cashFlows.length < 2) return 0;

  const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());

  let low = -0.99;
  let high = 2.0;
  let mid = 0;

  for (let i = 0; i < 100; i++) {
    mid = (low + high) / 2;
    const npv = calculateNPV(mid, sorted);
    if (Math.abs(npv) < 1e-4) return mid;

    if (npv > 0) {
      if (sorted[0].amount < 0) low = mid;
      else high = mid;
    } else {
      if (sorted[0].amount < 0) high = mid;
      else low = mid;
    }
  }
  return mid;
}

/**
 * Step-Up SIP Wealth Calculator with annual compounding step-up %
 */
export function calculateStepUpSIPWealth(
  activeCorpus: number,
  monthlySip: number,
  expectedReturnPct: number,
  annualStepUpPct: number,
  months: number
): { totalCorpus: number; totalInvested: number } {
  if (months <= 0 || (monthlySip <= 0 && activeCorpus <= 0)) {
    return { totalCorpus: Math.round(activeCorpus), totalInvested: Math.round(activeCorpus) };
  }
  const r = expectedReturnPct / 100 / 12;
  let totalCorpus = activeCorpus;
  let totalInvested = activeCorpus;
  let currentMonthlySip = monthlySip;

  for (let m = 1; m <= months; m++) {
    totalCorpus = (totalCorpus + currentMonthlySip) * (1 + r);
    totalInvested += currentMonthlySip;

    if (m % 12 === 0) {
      currentMonthlySip *= (1 + annualStepUpPct / 100);
    }
  }

  return { totalCorpus: Math.round(totalCorpus), totalInvested: Math.round(totalInvested) };
}

/**
 * Loan Amortization Schedule Generator with optional prepayment
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRatePct: number,
  tenureMonths: number,
  prepayment: number = 0,
  prepaymentMonth: number = 12
): AmortRow[] {
  if (principal <= 0 || tenureMonths <= 0) return [];
  const rows: AmortRow[] = [];
  const emi = calculateEMI(principal, annualRatePct, tenureMonths);
  const monthlyRate = annualRatePct / 12 / 100;
  let balance = principal;

  for (let m = 1; m <= tenureMonths && balance > 0; m++) {
    let currentPrepayment = 0;
    const openingBalance = balance;
    
    if (prepayment > 0 && m === prepaymentMonth) {
      currentPrepayment = Math.min(prepayment, balance);
    }

    const interestForMonth = Math.round(balance * monthlyRate);
    let principalForMonth = Math.min(balance, emi - interestForMonth) + currentPrepayment;

    if (principalForMonth > balance) {
      principalForMonth = balance;
    }

    balance = Math.max(0, balance - principalForMonth);

    rows.push({
      month: m,
      openingBalance,
      emi: emi + currentPrepayment,
      principal: principalForMonth,
      interest: interestForMonth,
      closingBalance: balance
    });
  }

  return rows;
}

export interface NetWorthSummaryInputs {
  accounts?: Array<{ accountType: string; balance: number }>;
  stocks?: Array<{ quantity: number; currentPrice: number }>;
  mfs?: Array<{ units: number; currentNav: number }>;
  mutualfunds?: Array<{ units: number; currentNav: number }>;
  gold?: Array<{ quantityGrams: number; currentPrice: number }>;
  nps?: Array<{ balance: number }>;
  pf?: Array<{ balance: number }>;
  fds?: Array<{
    principalAmount: number;
    interestRate?: number;
    startDate?: string;
    maturityDate?: string;
    maturityAmount?: number;
    isMatured?: boolean;
    interestPayoutType?: string;
    tenureMonths?: number;
  }>;
}

export interface NetWorthSummaryResult {
  stockValue: number;
  mfValue: number;
  goldValue: number;
  npsValue: number;
  pfValue: number;
  fdValue: number;
  totalInvestments: number;
  bankBalances: number;
  totalAssets: number;
  loanDebt: number;
  cardDebt: number;
  totalLiabilities: number;
  netWorth: number;
}

/**
 * Canonical Net Worth & Multi-Asset Portfolio Aggregator
 * Computes consolidated holdings, liquid assets, debt liabilities, and net worth
 * across personal bank accounts and investment assets.
 */
export function calculateNetWorthSummary(inputs: NetWorthSummaryInputs): NetWorthSummaryResult {
  const stockValue = (inputs.stocks || []).reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
  const mfList = inputs.mfs || inputs.mutualfunds || [];
  const mfValue = mfList.reduce((sum, m) => sum + (m.units * m.currentNav), 0);
  const goldValue = (inputs.gold || []).reduce((sum, g) => sum + (g.quantityGrams * g.currentPrice), 0);
  const npsValue = (inputs.nps || []).reduce((sum, n) => sum + (n.balance || 0), 0);
  const pfValue = (inputs.pf || []).reduce((sum, p) => sum + (p.balance || 0), 0);
  const fdValue = (inputs.fds || [])
    .filter(f => !f.isMatured)
    .reduce((sum, f) => {
      if (f.startDate && typeof f.interestRate === 'number') {
        return sum + calculateFdAccruedValue(f as any);
      }
      return sum + (f.principalAmount || 0);
    }, 0);

  const totalInvestments = stockValue + mfValue + goldValue + npsValue + pfValue + fdValue;

  const bankBalances = (inputs.accounts || [])
    .filter(a => a.accountType !== 'Loan' && a.accountType !== 'CreditCard')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalAssets = totalInvestments + bankBalances;

  const loanDebt = (inputs.accounts || [])
    .filter(a => a.accountType === 'Loan')
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const cardDebt = (inputs.accounts || [])
    .filter(a => a.accountType === 'CreditCard' && a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const totalLiabilities = loanDebt + cardDebt;
  const netWorth = totalAssets - totalLiabilities;

  return {
    stockValue,
    mfValue,
    goldValue,
    npsValue,
    pfValue,
    fdValue,
    totalInvestments,
    bankBalances,
    totalAssets,
    loanDebt,
    cardDebt,
    totalLiabilities,
    netWorth,
  };
}

