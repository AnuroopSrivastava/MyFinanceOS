/**
 * Characterization Tests — pinned pre-refactor behavior
 *
 * These tests pin the CURRENT behavior of the exact code paths scheduled for
 * refactoring so that any behavioral drift introduced by the refactor is
 * caught immediately. They intentionally assert quirks (NaN pattern skips,
 * unrounded GST halves, XIRR date fallbacks) — do not "fix" these expectations;
 * update them only alongside the corresponding approved alignment change.
 *
 * Covers:
 * 1. Automation rule matching incl. NaN pattern behavior (addTransaction + addTransactions)
 * 2. Balance mutation paths: add / update rollback+reapply / delete rollback, incl. transfers
 * 3. GST: canonical calculateGST vs the inline BusinessView accumulation pattern
 * 4. Net worth summary: FD accrued/matured, cardDebt<0 rule, mfs/mutualfunds alias
 * 5. XIRR: fallback dates for holdings without real date fields; unconverged-return quirk
 * 6. Profile getters default to the session profile
 */
import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import crypto from 'crypto';
import { dbService } from './index';

// Mock auth package
const mockAuthSession = vi.hoisted(() => ({
  isAuthenticated: vi.fn().mockReturnValue(true),
  getAccessToken: vi.fn().mockReturnValue('mockToken'),
  getUserProfile: vi.fn().mockReturnValue({ name: 'Admin User' }),
  getSessionPin: vi.fn().mockReturnValue('mockPin'),
  login: vi.fn(),
  logout: vi.fn()
}));

vi.mock('@financeos/auth', () => ({
  authSession: mockAuthSession,
  default: mockAuthSession
}));

let saltCounter = 5000;
vi.mock('@financeos/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@financeos/shared')>();
  const encode = (s: string) => Buffer.from(s, 'utf8').toString('base64');
  const decode = (s: string) => Buffer.from(s, 'base64').toString('utf8');
  return {
    ...actual,
    encryptData: vi.fn().mockImplementation(async (plainText: string) => `char_salt_${saltCounter++}:mockIv:${encode(plainText)}`),
    decryptData: vi.fn().mockImplementation(async (payload: string) => {
      const parts = payload.split(':');
      if (parts.length !== 3) throw new Error('Invalid payload format');
      return decode(parts[2]);
    }),
    generateSalt: vi.fn().mockImplementation(() => `char_salt_${saltCounter++}`)
  };
});

beforeAll(() => {
  if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto.webcrypto as unknown as Crypto;
  }
});

describe('Characterization — Automation Rule Matching', () => {
  beforeEach(async () => {
    mockAuthSession.isAuthenticated.mockReturnValue(true);
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    });
    vi.clearAllMocks();
    dbService.lock();
    await dbService.initializeNewDb('Characterization Admin');
  });

  afterEach(() => {
    dbService.lock();
  });

  it('DescriptionContains rule recategorizes a matching transaction (single add)', async () => {
    const account = await dbService.addAccount({
      profileId: 'p1', name: 'Main', bankName: 'SBI', accountNumber: '1',
      ifscCode: 'SBIN0001', accountType: 'Savings', balance: 0
    });
    await dbService.addAutomationRule({
      profileId: 'p1', name: 'swiggy rule', triggerType: 'DescriptionContains',
      matchPattern: 'swiggy', targetCategory: 'Food Delivery', isActive: true
    } as any);

    const tx = await dbService.addTransaction({
      profileId: 'p1', accountId: account.id, date: '2026-01-01',
      description: 'Swiggy order #123', amount: 500, type: 'Expense', category: 'Other'
    });

    expect(tx.category).toBe('Food Delivery');
  });

  it('rules are scoped: a rule owned by another profile does not fire', async () => {
    await dbService.addProfile({ name: 'Second', role: 'Member', relationship: 'Spouse' });
    const p2 = dbService.getProfiles().find(p => p.id !== 'p1')!;

    const account = await dbService.addAccount({
      profileId: 'p1', name: 'Main', bankName: 'SBI', accountNumber: '1',
      ifscCode: 'SBIN0001', accountType: 'Savings', balance: 0
    });

    // Create p2's rule from p2's session (cross-profile mutation via the p1
    // session now throws — ownership guard).
    dbService.setSessionProfile(p2.id);
    await dbService.addAutomationRule({
      profileId: p2.id, name: 'p2 rule', triggerType: 'DescriptionContains',
      matchPattern: 'swiggy', targetCategory: 'Food Delivery', isActive: true
    } as any);
    dbService.setSessionProfile('p1');

    const tx = await dbService.addTransaction({
      profileId: 'p1', accountId: account.id, date: '2026-01-01',
      description: 'Swiggy order', amount: 500, type: 'Expense', category: 'Other'
    });

    // Cross-profile rule must not recategorize p1's transaction
    expect(tx.category).toBe('Other');
  });

  it('AmountOver rule with non-numeric pattern is silently skipped (NaN quirk, pinned)', async () => {
    const account = await dbService.addAccount({
      profileId: 'p1', name: 'Main', bankName: 'SBI', accountNumber: '1',
      ifscCode: 'SBIN0001', accountType: 'Savings', balance: 0
    });
    await dbService.addAutomationRule({
      profileId: 'p1', name: 'bad rule', triggerType: 'AmountOver',
      matchPattern: 'not-a-number', targetCategory: 'Big Spend', isActive: true
    } as any);

    const tx = await dbService.addTransaction({
      profileId: 'p1', accountId: account.id, date: '2026-01-01',
      description: 'Rent', amount: 50000, type: 'Expense', category: 'Other'
    });

    // parseFloat('not-a-number') → NaN; 50000 >= NaN is false → category untouched
    expect(tx.category).toBe('Other');
  });

  it('AmountOver rule with valid threshold recategorizes (single add)', async () => {
    const account = await dbService.addAccount({
      profileId: 'p1', name: 'Main', bankName: 'SBI', accountNumber: '1',
      ifscCode: 'SBIN0001', accountType: 'Savings', balance: 0
    });
    await dbService.addAutomationRule({
      profileId: 'p1', name: 'big spend', triggerType: 'AmountOver',
      matchPattern: '10000', targetCategory: 'Big Spend', isActive: true
    } as any);

    const tx = await dbService.addTransaction({
      profileId: 'p1', accountId: account.id, date: '2026-01-01',
      description: 'Rent', amount: 50000, type: 'Expense', category: 'Other'
    });

    expect(tx.category).toBe('Big Spend');
  });

  it('inactive rules never fire', async () => {
    const account = await dbService.addAccount({
      profileId: 'p1', name: 'Main', bankName: 'SBI', accountNumber: '1',
      ifscCode: 'SBIN0001', accountType: 'Savings', balance: 0
    });
    await dbService.addAutomationRule({
      profileId: 'p1', name: 'off', triggerType: 'DescriptionContains',
      matchPattern: 'swiggy', targetCategory: 'Food Delivery', isActive: false
    } as any);

    const tx = await dbService.addTransaction({
      profileId: 'p1', accountId: account.id, date: '2026-01-01',
      description: 'Swiggy order', amount: 500, type: 'Expense', category: 'Other'
    });

    expect(tx.category).toBe('Other');
  });

  it('batch add (addTransactions) applies the same rule behavior as single add', async () => {
    const account = await dbService.addAccount({
      profileId: 'p1', name: 'Main', bankName: 'SBI', accountNumber: '1',
      ifscCode: 'SBIN0001', accountType: 'Savings', balance: 0
    });
    await dbService.addAutomationRule({
      profileId: 'p1', name: 'swiggy', triggerType: 'DescriptionContains',
      matchPattern: 'swiggy', targetCategory: 'Food Delivery', isActive: true
    } as any);

    const result = await dbService.addTransactions([
      { profileId: 'p1', accountId: account.id, date: '2026-01-01', description: 'Swiggy A', amount: 300, type: 'Expense', category: 'Other' },
      { profileId: 'p1', accountId: account.id, date: '2026-01-02', description: 'Zomato B', amount: 400, type: 'Expense', category: 'Other' }
    ]);

    expect(result.map(t => t.category)).toEqual(['Food Delivery', 'Other']);
  });
});

describe('Characterization — Balance Mutation Paths', () => {
  beforeEach(async () => {
    mockAuthSession.isAuthenticated.mockReturnValue(true);
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    });
    vi.clearAllMocks();
    dbService.lock();
    await dbService.initializeNewDb('Balance Admin');
  });

  afterEach(() => {
    dbService.lock();
  });

  const addAccount = async (name: string, balance: number) => dbService.addAccount({
    profileId: 'p1', name, bankName: 'SBI', accountNumber: '1',
    ifscCode: 'SBIN0001', accountType: 'Savings', balance
  });

  it('add: income credits, expense debits, transfer moves between accounts', async () => {
    const from = await addAccount('From', 10000);
    const to = await addAccount('To', 5000);

    await dbService.addTransaction({ profileId: 'p1', accountId: from.id, date: '2026-01-01', description: 'Salary', amount: 5000, type: 'Income', category: 'Salary' });
    expect(dbService.getAccounts().find(a => a.id === from.id)!.balance).toBe(15000);

    await dbService.addTransaction({ profileId: 'p1', accountId: from.id, date: '2026-01-02', description: 'Food', amount: 2000, type: 'Expense', category: 'Food' });
    expect(dbService.getAccounts().find(a => a.id === from.id)!.balance).toBe(13000);

    await dbService.addTransaction({ profileId: 'p1', accountId: from.id, refAccountId: to.id, date: '2026-01-03', description: 'Transfer', amount: 1000, type: 'Transfer', category: 'Transfer' });
    expect(dbService.getAccounts().find(a => a.id === from.id)!.balance).toBe(12000);
    expect(dbService.getAccounts().find(a => a.id === to.id)!.balance).toBe(6000);
  });

  it('update: rollback old then apply new, including account switch and type switch', async () => {
    const from = await addAccount('From', 10000);
    const to = await addAccount('To', 5000);

    const tx = await dbService.addTransaction({ profileId: 'p1', accountId: from.id, date: '2026-01-01', description: 'Food', amount: 2000, type: 'Expense', category: 'Food' });
    await dbService.updateTransaction(tx.id, { amount: 3000 });
    // rollback +2000, apply -3000 → 10000 - 3000
    expect(dbService.getAccounts().find(a => a.id === from.id)!.balance).toBe(7000);

    await dbService.updateTransaction(tx.id, { accountId: to.id, type: 'Income', amount: 3000 });
    // rollback on `from` (+3000 expense → 10000), apply on `to` as income (+3000 → 8000)
    expect(dbService.getAccounts().find(a => a.id === from.id)!.balance).toBe(10000);
    expect(dbService.getAccounts().find(a => a.id === to.id)!.balance).toBe(8000);
  });

  it('delete: rollbacks balance for all three tx types including transfer ref', async () => {
    const from = await addAccount('From', 10000);
    const to = await addAccount('To', 5000);

    const income = await dbService.addTransaction({ profileId: 'p1', accountId: from.id, date: '2026-01-01', description: 'Salary', amount: 5000, type: 'Income', category: 'Salary' });
    await dbService.deleteTransaction(income.id);
    expect(dbService.getAccounts().find(a => a.id === from.id)!.balance).toBe(10000);

    const transfer = await dbService.addTransaction({ profileId: 'p1', accountId: from.id, refAccountId: to.id, date: '2026-01-02', description: 'Move', amount: 1000, type: 'Transfer', category: 'Transfer' });
    await dbService.deleteTransaction(transfer.id);
    expect(dbService.getAccounts().find(a => a.id === from.id)!.balance).toBe(10000);
    expect(dbService.getAccounts().find(a => a.id === to.id)!.balance).toBe(5000);
  });
});

describe('Characterization — GST canonical vs inline', () => {
  it('canonical calculateGST: intra-state splits with rupee-rounded halves; inter-state IGST', async () => {
    const { calculateGST } = await import('@financeos/shared') as any;
    const intra = calculateGST(10000, 18, false);
    expect(intra.cgst).toBe(900);
    expect(intra.sgst).toBe(900);
    expect(intra.totalTax).toBe(1800);
    expect(intra.totalAmount).toBe(11800);

    const inter = calculateGST(10000, 18, true);
    expect(inter.cgst).toBe(0);
    expect(inter.igst).toBe(1800);
    expect(inter.totalTax).toBe(1800);
    expect(inter.totalAmount).toBe(11800);
  });

  it('inline BusinessView pattern accumulates unrounded float halves (pinned divergence)', () => {
    // Exact reproduction of BusinessView.handleCreateInvoice line-item math
    const lineItems = [
      { rate: 333.33, qty: 3, gstRate: 18 },
      { rate: 125.5, qty: 2, gstRate: 18 },
    ];
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    for (const { rate, qty, gstRate } of lineItems) {
      const amount = rate * qty;
      const tax = amount * (gstRate / 100);
      subtotal += amount;
      cgst += tax / 2;
      sgst += tax / 2;
    }
    // These are float-accumulated, NOT rounded — the divergence the refactor closes
    expect(subtotal).toBeCloseTo(1250.99, 10);
    expect(cgst).toBeCloseTo(112.5891, 6);
    expect(sgst).toBeCloseTo(112.5891, 6);
    expect(igst).toBe(0);
  });
});

describe('Characterization — Net Worth Summary', () => {
  it('uses FD accrued value, excludes matured FDs, ignores positive card balances, accepts both mfs/mutualfunds keys', async () => {
    const { calculateNetWorthSummary, calculateFdAccruedValue } = await import('@financeos/shared') as any;

    const accounts = [
      { accountType: 'Savings', balance: 100000 },
      { accountType: 'Loan', balance: -400000 },
      { accountType: 'CreditCard', balance: 5000 },      // positive card: ignored as liability
      { accountType: 'CreditCard', balance: -2000 },    // negative card: counted as debt
    ];
    const fds = [
      { principalAmount: 100000, interestRate: 7, startDate: '2024-01-01', isMatured: false },
      { principalAmount: 50000, interestRate: 8, startDate: '2023-01-01', isMatured: true, maturityAmount: 55000 }, // excluded
    ];
    const mfs = [{ units: 100, currentNav: 250 }];

    const out = calculateNetWorthSummary({ accounts, fds, mfs, stocks: [], gold: [], nps: [], pf: [] } as any);

    expect(out.fdValue).toBe(calculateFdAccruedValue(fds[0]));
    expect(out.bankBalances).toBe(100000);
    expect(out.loanDebt).toBe(400000);
    expect(out.cardDebt).toBe(2000);
    expect(out.totalLiabilities).toBe(402000);

    // alias: mutualfunds key produces the same mfValue as mfs key
    const viaAlias = calculateNetWorthSummary({ accounts: [], fds: [], mutualfunds: mfs } as any);
    expect(viaAlias.mfValue).toBe(out.mfValue);
    expect(out.mfValue).toBe(25000);
  });
});

describe('Characterization — XIRR fallback behavior', () => {
  it('solveXIRR returns null when the bracket has no sign change (post-alignment pinned behavior)', async () => {
    const { solveXIRR } = await import('@financeos/shared') as any;
    // Pathological cash flows designed to leave NPV same-signed across the bracket
    const flows = [
      { date: new Date('2020-01-01'), amount: -100 },
      { date: new Date('2021-01-01'), amount: 10000 },
      { date: new Date('2022-01-01'), amount: -10000 },
      { date: new Date('2023-01-01'), amount: 10000 },
    ];
    // Updated alongside approved alignment #4: the solver no longer returns a
    // plausible-looking unconverged midpoint; it reports not-computable.
    expect(solveXIRR(flows)).toBeNull();
  });

  it('converges for a simple growth case', async () => {
    const { solveXIRR } = await import('@financeos/shared') as any;
    const flows = [
      { date: new Date('2024-01-01'), amount: -100000 },
      { date: new Date('2025-01-01'), amount: 115000 },
    ];
    const r = solveXIRR(flows);
    expect(r).not.toBeNull();
    if (r !== null) {
      expect(r).toBeGreaterThan(0.14);
      expect(r).toBeLessThan(0.16);
    }
  });
});

describe('Characterization — session-profile getters', () => {
  it('getTransactions/getAccounts with no args return session profile data only', async () => {
    mockAuthSession.isAuthenticated.mockReturnValue(true);
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
      writable: true
    });
    dbService.lock();
    await dbService.initializeNewDb('Session Admin');
    await dbService.addProfile({ name: 'Second', role: 'Member', relationship: 'Spouse' });
    const p2 = dbService.getProfiles().find(p => p.id !== 'p1')!;
    dbService.setSessionProfile('p1');

    const a1 = await dbService.addAccount({ profileId: 'p1', name: 'A1', bankName: 'SBI', accountNumber: '1', ifscCode: 'SBIN0001', accountType: 'Savings', balance: 100 });

    // Existing guard (accounts only, pre-refactor): cross-profile add throws
    await expect(dbService.addAccount({ profileId: p2.id, name: 'A2', bankName: 'SBI', accountNumber: '2', ifscCode: 'SBIN0001', accountType: 'Savings', balance: 200 }))
      .rejects.toThrow('Authentication failed');

    // Add p2's account with p2 as the session profile (the sanctioned path)
    dbService.setSessionProfile(p2.id);
    await dbService.addAccount({ profileId: p2.id, name: 'A2', bankName: 'SBI', accountNumber: '2', ifscCode: 'SBIN0001', accountType: 'Savings', balance: 200 });
    dbService.setSessionProfile('p1');

    await dbService.addTransaction({ profileId: 'p1', accountId: a1.id, date: '2026-01-01', description: 'T1', amount: 10, type: 'Expense', category: 'Food' });

    expect(dbService.getAccounts().map(a => a.name)).toEqual(['A1']);
    expect(dbService.getTransactions().map(t => t.description)).toEqual(['T1']);

    dbService.setSessionProfile(p2.id);
    expect(dbService.getAccounts().map(a => a.name)).toEqual(['A2']);
    expect(dbService.getTransactions().length).toBe(0);
    dbService.lock();
  });
});
