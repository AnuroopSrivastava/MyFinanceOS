/**
 * Profile-Ownership Guard Tests (Phase 2c)
 *
 * Verifies that every domain mutator enforces the same cross-profile
 * boundary that addAccount has always enforced: a mutator called while
 * profile A is the session profile must throw when handed (or pointed at)
 * profile B's data. Getter behavior and same-profile mutations are
 * unchanged.
 */
import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import crypto from 'crypto';
import { dbService } from './index';

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

let saltCounter = 9000;
vi.mock('@financeos/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@financeos/shared')>();
  const encode = (s: string) => Buffer.from(s, 'utf8').toString('base64');
  const decode = (s: string) => Buffer.from(s, 'base64').toString('utf8');
  return {
    ...actual,
    encryptData: vi.fn().mockImplementation(async (plainText: string) => `own_salt_${saltCounter++}:mockIv:${encode(plainText)}`),
    decryptData: vi.fn().mockImplementation(async (payload: string) => {
      const parts = payload.split(':');
      if (parts.length !== 3) throw new Error('Invalid payload format');
      return decode(parts[2]);
    }),
    generateSalt: vi.fn().mockImplementation(() => `own_salt_${saltCounter++}`)
  };
});

beforeAll(() => {
  if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto.webcrypto as unknown as Crypto;
  }
});

describe('DatabaseService — Profile-Ownership Guards', () => {
  let p2: string;

  beforeEach(async () => {
    mockAuthSession.isAuthenticated.mockReturnValue(true);
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
      writable: true
    });
    vi.clearAllMocks();
    dbService.lock();
    await dbService.initializeNewDb('Guard Admin');
    await dbService.addProfile({ name: 'Second', role: 'Member', relationship: 'Spouse' });
    p2 = dbService.getProfiles().find(p => p.id !== 'p1')!.id;
    dbService.setSessionProfile('p1');
  });

  afterEach(() => {
    dbService.lock();
  });

  it('cross-profile adds throw for every holding type', async () => {
    await expect(dbService.addTransaction({ profileId: p2, accountId: 'x', date: '2026-01-01', description: 'd', amount: 1, type: 'Expense', category: 'c' })).rejects.toThrow('Authentication failed');
    await expect(dbService.addBudget({ profileId: p2, category: 'c', limitAmount: 100, spentAmount: 0, month: '2026-01' } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addFD({ profileId: p2, bankName: 'SBI', principalAmount: 100, interestRate: 7, startDate: '2026-01-01', isMatured: false } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addStock({ profileId: p2, symbol: 'TCS', name: 'TCS', quantity: 1, averagePrice: 100, currentPrice: 100 } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addMutualFund({ profileId: p2, schemeName: 'S', units: 1, averageNav: 100, currentNav: 100 } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addGold({ profileId: p2, quantityGrams: 1, purchasePrice: 100, currentPrice: 100 } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addNPS({ profileId: p2, schemeName: 'N', balance: 100 } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addPF({ profileId: p2, fundName: 'EPF', balance: 100 } as any)).rejects.toThrow('Authentication failed');
  });

  it('cross-profile adds throw for business/automation/goal types', async () => {
    await expect(dbService.addContact({ profileId: p2, name: 'V', type: 'Vendor' } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addInventoryItem({ profileId: p2, name: 'I', quantity: 1, purchasePrice: 10, salesPrice: 20, gstRate: 18 } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addRegisterEntry({ profileId: p2, date: '2026-01-01', type: 'Sales', refNumber: 'R1', partyName: 'P', taxableAmount: 100, cgst: 0, sgst: 0, igst: 0, totalAmount: 100, gstRate: 18 } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addTDSRecord({ profileId: p2, deductorName: 'D', tanOfDeductor: 'T', amountPaid: 100, taxDeducted: 10, date: '2026-01-01' } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addRecurringTransaction({ profileId: p2, name: 'RT', amount: 100, type: 'Expense', category: 'c', frequency: 'Monthly', nextDueDate: '2026-01-01', isActive: true } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addGoal({ profileId: p2, name: 'G', targetAmount: 100, savedAmount: 0, deadline: '2027-01-01', priority: 'high' } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addAutomationRule({ profileId: p2, name: 'AR', triggerType: 'CategoryMatch', matchPattern: 'x', targetCategory: 'y', isActive: true } as any)).rejects.toThrow('Authentication failed');
    await expect(dbService.addEncryptedDocument({ profileId: p2, name: 'doc', documentType: 'PAN', fileSizeFormatted: '1 MB', uploadDate: '2026-01-01', ocrSummary: 's' } as any)).rejects.toThrow('Authentication failed');
  });

  it('cross-profile addTransactions throws before any row is written (fail-fast)', async () => {
    await expect(dbService.addTransactions([
      { profileId: 'p1', accountId: 'x', date: '2026-01-01', description: 'ok', amount: 1, type: 'Expense', category: 'c' },
      { profileId: p2, accountId: 'x', date: '2026-01-01', description: 'bad', amount: 1, type: 'Expense', category: 'c' },
    ])).rejects.toThrow('Authentication failed');
    expect(dbService.getTransactions().length).toBe(0);
  });

  it('update/delete on records owned by the other profile throw; same-profile records still work', async () => {
    const tx = await dbService.addTransaction({ profileId: 'p1', accountId: 'x', date: '2026-01-01', description: 'd', amount: 1, type: 'Expense', category: 'c' });
    await expect(dbService.updateTransaction(tx.id, { amount: 2 })).resolves.toBeUndefined();
    await expect(dbService.deleteTransaction(tx.id)).resolves.toBeUndefined();

    // p2's own tx, added under p2 session, then targeted from p1 session
    dbService.setSessionProfile(p2);
    const p2tx = await dbService.addTransaction({ profileId: p2, accountId: 'x', date: '2026-01-01', description: 'p2', amount: 1, type: 'Expense', category: 'c' });
    dbService.setSessionProfile('p1');
    await expect(dbService.updateTransaction(p2tx.id, { amount: 2 })).rejects.toThrow('Authentication failed');
    await expect(dbService.deleteTransaction(p2tx.id)).rejects.toThrow('Authentication failed');
    // p2's data is untouched
    dbService.setSessionProfile(p2);
    expect(dbService.getTransactions().find(t => t.id === p2tx.id)!.amount).toBe(1);
  });

  it('addInvoice guards before any register/inventory side effect', async () => {
    const before = dbService.getRegister().length;
    await expect(dbService.addInvoice({
      profileId: p2, invoiceNumber: 'INV-1', date: '2026-01-01', dueDate: '2026-01-15',
      customerId: 'c1', customerName: 'X', items: [], subtotal: 0, cgstTotal: 0, sgstTotal: 0, igstTotal: 0, grandTotal: 0, status: 'Draft'
    } as any)).rejects.toThrow('Authentication failed');
    expect(dbService.getRegister().length).toBe(before);
  });
});
