import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { dbService } from './index';

// Mock auth package
const mockAuthSession = vi.hoisted(() => ({
  isAuthenticated: vi.fn().mockReturnValue(true),
  getAccessToken: vi.fn().mockReturnValue('mockToken'),
  getUserProfile: vi.fn().mockReturnValue({ name: 'Admin User' }),
  getUser: vi.fn().mockResolvedValue({ id: 'user_1', email: 'admin@example.com', user_metadata: { full_name: 'Admin User' } }),
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

// Mock the supabase client accessor. The default (no client) mirrors the real
// env where NEXT_PUBLIC_SUPABASE_* is unset; SYNC-01 injects
// a fake client so the consent / plaintext gates in saveCloudDb are exercised
// rather than short-circuiting on a missing client.
const mockUpsert = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn().mockReturnValue({ upsert: mockUpsert }));
const mockGetSupabaseClient = vi.hoisted(() => vi.fn());

vi.mock('./supabaseClient.js', () => ({
  supabase: null,
  getSupabaseClient: mockGetSupabaseClient
}));

describe('Security Remediation Tests', () => {
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
    // Default: no supabase client (like an unconfigured test env). SYNC-01 sets
    // its own return value per test. mockUpsert resets so a resolved value from
    // a previous test can't leak into the next assertion.
    mockGetSupabaseClient.mockReset();
    mockUpsert.mockReset();
    dbService.lock();
    // Cancel pending debounced save / cloud-push timers from prior tests so a
    // stray 1s cloud timer never fires mid-assertion, and reset the sync
    // watermark so tests start from a clean "first boot" state.
    const svc = dbService as any;
    if (svc.cloudSyncTimer) { clearTimeout(svc.cloudSyncTimer); svc.cloudSyncTimer = null; }
    if (svc.localSaveTimer) { clearTimeout(svc.localSaveTimer); svc.localSaveTimer = null; }
    svc.lastSyncedAt = 0;
  });

  afterEach(() => {
    dbService.lock();
  });

  describe('SEC-01: Encryption Fail Closed', () => {
    it('should fail and not save to plaintext if encryption throws an error', async () => {
      await dbService.initializeNewDb('Test User');
      await new Promise(r => setTimeout(r, 400));
      
      const { encryptData } = await import('@financeos/shared');
      vi.mocked(encryptData).mockRejectedValueOnce(new Error('Simulated encryption failure'));
      
      let errorStatus: string | null = null;
      dbService.onSaveErrorStatus((err) => {
        errorStatus = err;
      });

      // trigger save
      await dbService.addAccount({ name: 'Test Account', bankName: 'Bank', accountNumber: '123', ifscCode: 'IFSC', accountType: 'Savings', balance: 100, profileId: 'p1' });
      await new Promise(r => setTimeout(r, 400));
      
      expect(errorStatus).toContain('Authentication failed');
      // local storage should not be updated with plaintext
      // length of calls might be 1 from initializeNewDb, but definitely not 2
      const calls = vi.mocked(globalThis.localStorage.setItem).mock.calls;
      expect(calls.length).toBe(1); // Only from initializeNewDb
    });

    it('should fail and not save to plaintext if PIN is missing but database is encrypted', async () => {
      await dbService.initializeNewDb('Test User');
      await new Promise(r => setTimeout(r, 400));
      
      // Simulate that the database was previously encrypted
      (dbService as any).lastSavedPayload = 'salt:iv:ciphertext';
      
      // Remove the session PIN
      mockAuthSession.getSessionPin.mockReturnValueOnce(null);
      
      let errorStatus: string | null = null;
      dbService.onSaveErrorStatus((err) => {
        errorStatus = err;
      });

      // trigger save
      await dbService.addAccount({ name: 'Test Account 2', bankName: 'Bank', accountNumber: '124', ifscCode: 'IFSC', accountType: 'Savings', balance: 100, profileId: 'p1' });
      await new Promise(r => setTimeout(r, 400));
      
      expect(errorStatus).toContain('Authentication failed');
      
      const calls = vi.mocked(globalThis.localStorage.setItem).mock.calls;
      expect(calls.length).toBe(1); // Only from initializeNewDb, no plaintext save
    });
  });

  describe('AUTH-01: No Default PIN Fallback', () => {
    it('should return needs_pin if payload is encrypted but no PIN is provided', async () => {
      mockAuthSession.getSessionPin.mockReturnValueOnce('');
      vi.mocked(globalThis.localStorage.getItem).mockReturnValueOnce('salt:iv:ciphertext');
      
      const result = await dbService.unlock();
      expect(result).toBe('needs_pin');
    });
    
    it('should fail to unlock if decryption throws an error (PIN retry, not fatal init)', async () => {
      // Authenticated, but decryption of the stored payload fails. unlock() must
      // return false WITHOUT falling through to initializeNewDb — the encrypted
      // data stays intact and the UI shows the PIN screen, not a fresh DB.
      mockAuthSession.getSessionPin.mockReturnValueOnce('wrong_pin');
      vi.mocked(globalThis.localStorage.getItem).mockReturnValueOnce('salt:iv:ciphertext');
      const { decryptData } = await import('@financeos/shared');
      vi.mocked(decryptData).mockRejectedValueOnce(new Error('Wrong PIN'));

      const result = await dbService.unlock();
      expect(result).toBe(false);
    });
  });

  describe('SYNC-01: Cloud Sync Consent + No Plaintext Upload', () => {
    it('saveCloudDb short-circuits when isCloudBackupEnabled is false', async () => {
      await dbService.initializeNewDb('Test User');
      await dbService.updateSettings({ isCloudBackupEnabled: false });
      mockGetSupabaseClient.mockReturnValue({ from: mockFrom });

      await dbService.saveCloudDb('salt:iv:ciphertext');

      // Consent gate fires before any upsert is attempted.
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('saveCloudDb refuses a plaintext payload even with consent on', async () => {
      await dbService.initializeNewDb('Test User');
      mockGetSupabaseClient.mockReturnValue({ from: mockFrom });

      // No ':' delimiter → not an encrypted salt:iv:ciphertext blob. Plaintext
      // financial data must never reach Supabase (CRIT-02).
      await dbService.saveCloudDb('{"profiles":[]}');

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('saveCloudDb pushes an encrypted payload when consented and authenticated', async () => {
      await dbService.initializeNewDb('Test User');
      mockGetSupabaseClient.mockReturnValue({ from: mockFrom });
      mockUpsert.mockResolvedValue({ error: null });

      await dbService.saveCloudDb('salt:iv:ciphertext');

      expect(mockFrom).toHaveBeenCalledWith('user_dbs');
      expect(mockUpsert).toHaveBeenCalled();
      const args = mockUpsert.mock.calls[0][0];
      expect(args.user_id).toBe('user_1');
      expect(args.payload).toBe('salt:iv:ciphertext');
    });
  });

  describe('DATA-01: Enforce Profile Ownership', () => {
    it('should throw an error when mutating an account that belongs to a different profile', async () => {
      // Mock unlock to provide a state with an account owned by 'profile2'
      mockAuthSession.getSessionPin.mockReturnValueOnce('pin');
      vi.mocked(globalThis.localStorage.getItem).mockReturnValueOnce(JSON.stringify({
        schemaVersion: 1,
        settings: {},
        profiles: [{ id: 'profile1', name: 'P1' }, { id: 'profile2', name: 'P2' }],
        accounts: [{ id: 'acc1', profileId: 'profile2', name: 'P2 Account', balance: 100 }],
        transactions: []
      }));
      await dbService.unlock();
      
      dbService.setSessionProfile('profile1');
      
      await expect(dbService.updateAccount('acc1', { name: 'Hacked' })).rejects.toThrow('Authentication failed');
      await expect(dbService.deleteAccount('acc1')).rejects.toThrow('Authentication failed');
    });

    it('should throw an error when adding an account for a different profile', async () => {
      await dbService.initializeNewDb('Test User');
      dbService.setSessionProfile('profile1');
      
      await expect(dbService.addAccount({ name: 'Hacked', bankName: 'B', accountNumber: '1', ifscCode: 'I', accountType: 'Savings', balance: 0, profileId: 'profile2' })).rejects.toThrow('Authentication failed');
    });
  });

  describe('SEC-01: Encrypted Pre-Import Snapshot', () => {
    it('stores encrypted snapshot during import when session PIN is present', async () => {
      mockAuthSession.getSessionPin.mockReturnValue('userSecretPin');
      await dbService.initializeNewDb('Test User');

      const setItemSpy = vi.spyOn(globalThis.localStorage, 'setItem');
      const validDbJson = dbService.getRawDb();

      const success = await dbService.importRawDb(validDbJson);
      expect(success).toBe(true);

      const snapshotCall = setItemSpy.mock.calls.find(call => typeof call[0] === 'string' && call[0].startsWith('pre_import_snapshot_'));
      expect(snapshotCall).toBeDefined();
      // Verify the payload is encrypted ciphertext and not raw JSON containing cleartext profile info
      const storedPayload = snapshotCall![1];
      expect(storedPayload).toContain(':');
      expect(storedPayload.startsWith('{')).toBe(false);
    });
  });

  describe('PERF-01: Batch Transaction Insertion (addTransactions)', () => {
    it('atomically adds multiple transactions, updates balances, applies rules, and notifies subscribers once', async () => {
      await dbService.initializeNewDb('Test User');
      const primaryAcc = await dbService.addAccount({
        name: 'HDFC Savings',
        bankName: 'HDFC Bank',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        accountType: 'Savings',
        balance: 10000,
        profileId: 'p1'
      });
      const initialBalance = primaryAcc.balance;

      // Add automation rule
      await dbService.addAutomationRule({
        profileId: primaryAcc.profileId,
        name: 'Auto Groceries',
        triggerType: 'DescriptionContains',
        matchPattern: 'Supermarket',
        targetCategory: 'Groceries',
        targetTag: 'Food',
        isActive: true
      });

      const subscriberFn = vi.fn();
      const unsubscribe = dbService.subscribe(subscriberFn);
      subscriberFn.mockClear();

      const batchToInsert = [
        {
          accountId: primaryAcc.id,
          profileId: primaryAcc.profileId,
          date: '2026-03-01',
          description: 'Supermarket shopping',
          amount: 500,
          type: 'Expense' as const,
          category: 'Shopping'
        },
        {
          accountId: primaryAcc.id,
          profileId: primaryAcc.profileId,
          date: '2026-03-02',
          description: 'Client payment',
          amount: 2000,
          type: 'Income' as const,
          category: 'Salary'
        }
      ];

      const inserted = await dbService.addTransactions(batchToInsert);
      expect(inserted).toHaveLength(2);
      expect(inserted[0].category).toBe('Groceries'); // Rule matched
      expect(inserted[0].tag).toBe('Food');
      expect(inserted[1].category).toBe('Salary');

      // Balance check: initial - 500 + 2000 = initial + 1500
      const updatedAccounts = dbService.getAccounts();
      const updatedAcc = updatedAccounts.find(a => a.id === primaryAcc.id)!;
      expect(updatedAcc.balance).toBe(initialBalance - 500 + 2000);

      // Subscriber notified
      expect(subscriberFn).toHaveBeenCalledTimes(1);
      unsubscribe();
    });
  });
});

