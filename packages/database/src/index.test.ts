import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import crypto from 'crypto';
import { dbService } from './index';
import { authSession } from '@financeos/auth';
import { faker } from '@faker-js/faker';

// Mock auth package
const mockAuthSession = vi.hoisted(() => ({
  isAuthenticated: vi.fn().mockReturnValue(true),
  getAccessToken: vi.fn().mockReturnValue('mockToken'),
  getUserProfile: vi.fn().mockReturnValue({ name: 'Admin User' }),
  login: vi.fn(),
  logout: vi.fn()
}));

vi.mock('@financeos/auth', () => ({
  authSession: mockAuthSession,
  default: mockAuthSession
}));

let saltCounter = 0;
// Mock shared crypto utils
vi.mock('@financeos/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@financeos/shared')>();
  return {
    ...actual,
    encrypt: vi.fn().mockResolvedValue({ ciphertext: 'mockCipher', iv: 'mockIv' }),
    decrypt: vi.fn().mockResolvedValue('{}'),
    generateSalt: vi.fn().mockImplementation(() => `salt_${saltCounter++}`)
  };
});

beforeAll(() => {
  if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto.webcrypto as any;
  }
});

describe('DatabaseService - Comprehensive Tests', () => {
  beforeEach(() => {
    mockAuthSession.isAuthenticated.mockReturnValue(true);
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    });
    vi.clearAllMocks();
    dbService.lock();
  });

  afterEach(() => {
    dbService.lock();
  });

  describe('Initialization & State', () => {
    it('should correctly report uninitialized when localStorage is empty and unauthenticated', () => {
      mockAuthSession.isAuthenticated.mockReturnValue(false);
      expect(dbService.isInitialized()).toBe(false);
    });

    it('should report initialized when cache exists in localStorage', () => {
      vi.mocked(globalThis.localStorage.getItem).mockReturnValueOnce(JSON.stringify({ settings: {}, profiles: [] }));
      expect(dbService.isInitialized()).toBe(true);
    });

    it('should initialize new db securely and save to storage', async () => {
      await dbService.initializeNewDb('Admin User');
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('financeos_db_cache', expect.any(String));
      
      const profiles = dbService.getProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('Admin User');
      
      const logs = dbService.getAuditLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('SETUP');
    });
  });

  describe('Authentication & Sync', () => {
    it('should reject unlock if user is not authenticated', async () => {
      mockAuthSession.isAuthenticated.mockReturnValue(false);
      const success = await dbService.unlock();
      expect(success).toBe(false);
    });

    it('should unlock and load db payload from localStorage', async () => {
      mockAuthSession.isAuthenticated.mockReturnValue(true);
      vi.mocked(globalThis.localStorage.getItem).mockImplementation((key) => {
        if (key === 'financeos_db_cache') {
          return JSON.stringify({
            settings: { theme: 'dark' },
            profiles: [{ id: 'p1', name: 'Test' }],
            accounts: [], transactions: [], auditLogs: [],
            budgets: [], fds: [], stocks: [], mutualfunds: [], gold: [], nps: [], pf: [],
            contacts: [], inventory: [], invoices: [], register: [], tdsRecords: []
          });
        }
        return null;
      });

      const success = await dbService.unlock();
      expect(success).toBe(true);
      expect(dbService.getSettings().theme).toBe('dark');
    });
  });

  describe('Data Operations (CRUD)', () => {
    beforeEach(async () => {
      mockAuthSession.isAuthenticated.mockReturnValue(true);
      await dbService.initializeNewDb('Test Admin');
    });

    it('should add, update, and delete accounts', async () => {
      const account = await dbService.addAccount({
        profileId: 'p1',
        name: 'HDFC Checking',
        bankName: 'HDFC',
        accountNumber: '1234',
        ifscCode: 'HDFC001',
        accountType: 'Savings',
        balance: 1000
      });

      expect(account.id).toBeDefined();
      expect(dbService.getAccounts()).toHaveLength(1);

      await dbService.updateAccount(account.id, { balance: 2000 });
      expect(dbService.getAccounts()[0].balance).toBe(2000);

      await dbService.deleteAccount(account.id);
      expect(dbService.getAccounts()).toHaveLength(0);
    });

    it('should correctly process transactions and update account balances', async () => {
      const account = await dbService.addAccount({
        profileId: 'p1', name: 'Main', bankName: 'SBI', accountNumber: '1', ifscCode: 'S', accountType: 'Savings', balance: 5000
      });

      // Income transaction
      const tx1 = await dbService.addTransaction({
        profileId: 'p1', accountId: account.id, date: '2023-01-01', description: 'Salary', amount: 2000, type: 'Income', category: 'Salary'
      });
      expect(dbService.getAccounts()[0].balance).toBe(7000);

      // Expense transaction
      const tx2 = await dbService.addTransaction({
        profileId: 'p1', accountId: account.id, date: '2023-01-02', description: 'Groceries', amount: 500, type: 'Expense', category: 'Food'
      });
      expect(dbService.getAccounts()[0].balance).toBe(6500);

      // Delete expense should revert balance
      await dbService.deleteTransaction(tx2.id);
      expect(dbService.getAccounts()[0].balance).toBe(7000);
      
      // Delete income should revert balance
      await dbService.deleteTransaction(tx1.id);
      expect(dbService.getAccounts()[0].balance).toBe(5000);
    });

    it('should generate deep randomized data stress tests', async () => {
      // Create 100 accounts
      for(let i=0; i<100; i++) {
         await dbService.addAccount({
            profileId: 'p1',
            name: faker.finance.accountName(),
            bankName: faker.company.name(),
            accountNumber: faker.finance.accountNumber(),
            ifscCode: 'IFSC1234',
            accountType: 'Savings',
            balance: parseFloat(faker.finance.amount())
         });
      }
      expect(dbService.getAccounts()).toHaveLength(100);

      const accountId = dbService.getAccounts()[0].id;

      // Add 1000 transactions
      for(let i=0; i<1000; i++) {
        await dbService.addTransaction({
            profileId: 'p1',
            accountId,
            date: faker.date.recent().toISOString().split('T')[0],
            description: faker.finance.transactionDescription(),
            amount: parseFloat(faker.finance.amount()),
            type: Math.random() > 0.5 ? 'Income' : 'Expense',
            category: 'Test'
        });
      }
      
      expect(dbService.getTransactions()).toHaveLength(1000);
      
      // Verify audit logs get truncated at 500
      const logs = dbService.getAuditLogs();
      expect(logs.length).toBeLessThanOrEqual(500);
    }, 20000);

    it('should correctly handle profile deletion cascading', async () => {
      const profile = await dbService.addProfile({ name: 'User 2', role: 'Member', isNomineeProvided: false });
      
      const account = await dbService.addAccount({
        profileId: profile.id, name: 'Main', bankName: 'SBI', accountNumber: '1', ifscCode: 'S', accountType: 'Savings', balance: 5000
      });

      await dbService.addTransaction({
        profileId: profile.id, accountId: account.id, date: '2023-01-01', description: 'Salary', amount: 2000, type: 'Income', category: 'Salary'
      });

      expect(dbService.getAccounts()).toHaveLength(1);
      expect(dbService.getTransactions()).toHaveLength(1);

      // Deleting profile should cascade
      await dbService.deleteProfile(profile.id);

      expect(dbService.getAccounts()).toHaveLength(0);
      expect(dbService.getTransactions()).toHaveLength(0);
    });
  });
});
