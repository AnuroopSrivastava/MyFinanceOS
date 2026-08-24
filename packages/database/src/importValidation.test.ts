import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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

vi.mock('@financeos/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@financeos/shared')>();
  return {
    ...actual,
    encryptData: vi.fn().mockResolvedValue('mockSalt:mockIv:mockCiphertext'),
    decryptData: vi.fn().mockResolvedValue('{}'),
    generateSalt: vi.fn().mockReturnValue('mock_salt')
  };
});

describe('Import Validation Tests (REC-01)', () => {
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

  const validDb = {
    schemaVersion: 1,
    settings: {
      theme: 'glass-cyan',
      currency: 'INR',
      backupSchedule: 'weekly',
      isCloudBackupEnabled: false
    },
    profiles: [{ id: 'p1', name: 'Admin', role: 'Admin', relationship: 'Self', isNomineeProvided: true }],
    accounts: [{ id: 'a1', profileId: 'p1', name: 'Acc', bankName: 'Bank', accountNumber: '123', ifscCode: 'IFSC', accountType: 'Savings', balance: 100 }],
    transactions: [{ id: 't1', accountId: 'a1', profileId: 'p1', date: '2024-01-01', amount: 10, type: 'Income', category: 'Salary', description: 'desc', status: 'Completed' }],
    budgets: [], fds: [], stocks: [], mutualfunds: [], gold: [], nps: [], pf: [], contacts: [], inventory: [], invoices: [], register: [], auditLogs: [], tdsRecords: [], encryptedDocuments: [], recurringTransactions: []
  };

  it('should successfully import a valid database', async () => {
    const success = await dbService.importRawDb(JSON.stringify(validDb));
    expect(success).toBe(true);
    expect(dbService.getAccounts('p1').length).toBe(1);
  });

  it('should reject import if a profile is malformed', async () => {
    const invalidDb = {
      ...validDb,
      profiles: [{ name: 'Missing ID' }]
    };
    const success = await dbService.importRawDb(JSON.stringify(invalidDb));
    expect(success).toBe(false);
  });

  it('should reject import if an account has an orphaned profileId', async () => {
    const invalidDb = {
      ...validDb,
      accounts: [{ ...validDb.accounts[0], profileId: 'non_existent_profile' }]
    };
    const success = await dbService.importRawDb(JSON.stringify(invalidDb));
    expect(success).toBe(false);
  });

  it('should reject import if a transaction has an orphaned accountId', async () => {
    const invalidDb = {
      ...validDb,
      transactions: [{ ...validDb.transactions[0], accountId: 'non_existent_account' }]
    };
    const success = await dbService.importRawDb(JSON.stringify(invalidDb));
    expect(success).toBe(false);
  });

  it('should abort import if pre-import snapshot fails', async () => {
    await dbService.initializeNewDb('Test User');
    
    // Simulate quota exceeded error in localStorage
    vi.mocked(globalThis.localStorage.setItem).mockImplementation((key, val) => {
      if (key.includes('pre_import_snapshot')) throw new Error('Quota exceeded');
    });

    const success = await dbService.importRawDb(JSON.stringify(validDb));
    expect(success).toBe(false);
  });
});
