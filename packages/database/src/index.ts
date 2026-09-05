import { getSupabaseClient } from './supabaseClient.js';
import { authSession } from '@financeos/auth';
import { generateSalt, STORAGE_KEYS } from '@financeos/shared';

import {
  UserProfile, BankAccount, Transaction, Budget, FixedDeposit,
  StockHolding, MutualFundHolding, GoldHolding, NPSHolding,
  ProvidentFundHolding, VendorCustomer, InventoryItem, BusinessInvoice,
  BusinessRegisterEntry, AuditLog, SystemSettings, RecurringTransaction,
  TDSSummary, InvestmentPlan, SavingsGoal, TaxViewInputs, EMICalculatorInputs,
  BusinessDrafts, FireCalculatorInputs, AIChatMessage, EncryptedDocument,
  AutomationRule,
  encryptData, decryptData
} from '@financeos/shared';

// --- Web Worker for Database Serialization and Encryption ---
let saveWorkerInstance: Worker | null = null;
let saveMsgId = 0;
const saveResolvers = new Map<number, { resolve: (val: string) => void, reject: (err: Error) => void }>();

const getSaveWorker = (): Worker | null => {
  if (typeof window === 'undefined' || !window.Worker) return null;
  if (saveWorkerInstance) return saveWorkerInstance;

  saveWorkerInstance = new Worker(new URL('./saveWorker.ts', import.meta.url), { type: 'module' });
  saveWorkerInstance.onmessage = (e) => {
    const { msgId, success, storagePayload, error } = e.data;
    const resolvers = saveResolvers.get(msgId);
    if (resolvers) {
      if (success) resolvers.resolve(storagePayload);
      else resolvers.reject(new Error(error));
      saveResolvers.delete(msgId);
    }
  };
  saveWorkerInstance.onerror = (err) => {
    console.error('Save worker error:', err);
    saveResolvers.forEach((r) => r.reject(new Error('Worker error')));
    saveResolvers.clear();
    saveWorkerInstance?.terminate();
    saveWorkerInstance = null;
  };
  return saveWorkerInstance;
};

const runWorkerSave = (db: DatabaseSchema, pin: string | undefined): Promise<string> => {
  return new Promise((resolve, reject) => {
    const worker = getSaveWorker();
    if (!worker) {
      reject(new Error('Web Workers not supported'));
      return;
    }
    const msgId = ++saveMsgId;
    saveResolvers.set(msgId, { resolve, reject });
    worker.postMessage({ msgId, db, pin });
  });
};
// --------------------------------------------------------

interface DatabaseSchema {
  settings: SystemSettings;
  profiles: UserProfile[];
  accounts: BankAccount[];
  transactions: Transaction[];
  budgets: Budget[];
  fds: FixedDeposit[];
  stocks: StockHolding[];
  mutualfunds: MutualFundHolding[];
  gold: GoldHolding[];
  nps: NPSHolding[];
  pf: ProvidentFundHolding[];
  contacts: VendorCustomer[];
  inventory: InventoryItem[];
  invoices: BusinessInvoice[];
  register: BusinessRegisterEntry[];
  auditLogs: AuditLog[];
  recurringTransactions?: RecurringTransaction[];
  tdsRecords?: TDSSummary[];
  investmentPlans?: InvestmentPlan[];
  goals?: SavingsGoal[];
  taxInputs?: Record<string, TaxViewInputs>;
  emiInputs?: Record<string, EMICalculatorInputs>;
  businessDrafts?: Record<string, BusinessDrafts>;
  fireInputs?: Record<string, FireCalculatorInputs>;
  chatHistory?: Record<string, AIChatMessage[]>;
  encryptedDocuments?: EncryptedDocument[];
  automationRules?: AutomationRule[];
  schemaVersion?: number;
}

class DatabaseService {
  private db: DatabaseSchema | null = null;
  private storageKey = STORAGE_KEYS.dbCache;
  private lastSavedPayload: string | null = null;
  private cloudSyncTimer: ReturnType<typeof setTimeout> | null = null;
  private localSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private activeProfileId: string | null = null;
  private subscribers: Array<() => void> = [];
  private lastSyncedAt: number = 0;
  private unlockPromise: Promise<boolean | 'needs_pin'> | null = null;

  public hasUnsavedChanges = false;
  public lastSaveError: string | null = null;

  public subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  public notifySubscribers() {
    this.subscribers.forEach(cb => cb());
  }

  constructor() {
    if (typeof window !== 'undefined') {
      // Restore the cross-device sync watermark so a fresh boot doesn't re-apply
      // a cloud row that was already incorporated on a previous session.
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.lastSyncedAt);
        if (stored) this.lastSyncedAt = Number(stored) || 0;
      } catch { /* SSR / restricted context */ }

      window.addEventListener('storage', (e) => {
        if (e.key === this.storageKey && e.newValue) {
          if (e.newValue !== this.lastSavedPayload) {
            console.log('Cross-tab sync: Storage changed externally, reloading...');
            this.handleCrossTabSync(e.newValue);
          }
        }
      });
    }
  }

  public setSessionProfile(profileId: string) {
    this.activeProfileId = profileId;
  }

  private async handleCrossTabSync(payload: string) {
    this.lastSavedPayload = payload;
    let parsedDb: DatabaseSchema | null = null;

    // Check if it's AES-GCM encrypted
    if (payload.includes(':') && payload.split(':').length === 3) {
      const pin = authSession.getSessionPin();
      // SEC-04: never fall back to a default PIN. If no session PIN is available
      // (e.g. cross-tab reload before unlock), bail out — the next full unlock
      // will decrypt from the canonical source with the real PIN.
      if (!pin) return;
      try {
        const decrypted = await decryptData(payload, pin);
        parsedDb = JSON.parse(decrypted);
      } catch (e) {
        console.error('Cross-tab sync decryption failed', e);
        return;
      }
    } else {
      try {
        parsedDb = JSON.parse(payload);
      } catch (e) {
        console.error('Cross-tab sync payload parsing failed', e);
      }
    }

    if (parsedDb) {
      this.db = parsedDb;
      this.notifySubscribers();
    }
  }

  private unsavedChangesListeners: ((hasUnsaved: boolean) => void)[] = [];
  private saveErrorListeners: ((error: string | null) => void)[] = [];

  public onUnsavedChangeStatus(callback: (hasUnsaved: boolean) => void): () => void {
    this.unsavedChangesListeners.push(callback);
    callback(this.hasUnsavedChanges);
    return () => {
      this.unsavedChangesListeners = this.unsavedChangesListeners.filter(cb => cb !== callback);
    };
  }

  public onSaveErrorStatus(callback: (error: string | null) => void): () => void {
    this.saveErrorListeners.push(callback);
    callback(this.lastSaveError);
    return () => {
      this.saveErrorListeners = this.saveErrorListeners.filter(cb => cb !== callback);
    };
  }

  private setUnsavedChanges(status: boolean) {
    if (this.hasUnsavedChanges !== status) {
      this.hasUnsavedChanges = status;
      this.unsavedChangesListeners.forEach(cb => cb(status));
    }
  }

  private setSaveError(error: string | null) {
    this.lastSaveError = error;
    this.saveErrorListeners.forEach(cb => cb(error));
  }

  private persistLastSyncedAt(value: number) {
    this.lastSyncedAt = value;
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEYS.lastSyncedAt, String(value)); } catch { /* quota */ }
    }
  }

  public async isInitialized(): Promise<boolean> {
    return localStorage.getItem(this.storageKey) !== null || (await authSession.isAuthenticated());
  }

  public async syncToCloud(): Promise<void> {
    if (this.db) {
      await this.save();
    }
  }

  public async initializeNewDb(adminName: string): Promise<void> {
    this.lastSavedPayload = null;
    const adminId = 'p1';
    this.activeProfileId = adminId;
    const settings: SystemSettings = {
      theme: 'glass-cyan',
      currency: 'INR',
      backupSchedule: 'weekly',
      isCloudBackupEnabled: true
    };
    const profiles: UserProfile[] = [
      { id: adminId, name: adminName, role: 'Admin', relationship: 'Self', isNomineeProvided: true }
    ];

    this.db = {
      schemaVersion: 1,
      settings, profiles, accounts: [], transactions: [], budgets: [], fds: [], stocks: [], mutualfunds: [], gold: [], nps: [], pf: [], contacts: [], inventory: [], invoices: [], register: [], recurringTransactions: [], auditLogs: [
        { id: 'log1', timestamp: new Date().toISOString(), userId: adminId, action: 'SETUP', details: 'Database initialized for user: ' + adminName }
      ], tdsRecords: [], encryptedDocuments: []
    };
    await this.save(true);
  }

  public async unlock(): Promise<boolean | 'needs_pin'> {
    if (this.unlockPromise) {
      return this.unlockPromise;
    }
    this.unlockPromise = this.internalUnlock().finally(() => {
      this.unlockPromise = null;
    });
    return this.unlockPromise;
  }

  private async internalUnlock(): Promise<boolean | 'needs_pin'> {
    if (!(await authSession.isAuthenticated())) return false;

    // 1. Cloud pull — cross-device canonical source. If the cloud has a row it
    //    is loaded into this.db here. A missing/incorrect session PIN returns
    //    'needs_pin' so the UI prompts the user rather than silently creating a
    //    fresh empty DB that would overwrite the encrypted cloud payload.
    const cloudResult = await this.pullFromCloud();
    if (cloudResult === 'needs_pin') return 'needs_pin';

    // 2. Local sources — only when cloud pull did not supply data.
    if (cloudResult !== 'synced') {
      const candidates: string[] = [];
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(this.storageKey);
        if (cached) candidates.push(cached);
      }

      let parsedDb: DatabaseSchema | null = null;
      let decryptionFailed = false;

      for (const dbPayload of candidates) {
        if (dbPayload.includes(':') && dbPayload.split(':').length === 3) {
          const pin = authSession.getSessionPin();
          if (!pin) return 'needs_pin';
          try {
            const decrypted = await decryptData(dbPayload, pin);
            if (decrypted) {
              parsedDb = JSON.parse(decrypted);
              this.lastSavedPayload = dbPayload;
              break;
            }
          } catch (e) {
            console.error('Failed to decrypt database. Wrong PIN or corrupted.', e);
            decryptionFailed = true;
          }
        } else {
          try {
            parsedDb = JSON.parse(dbPayload);
            this.lastSavedPayload = dbPayload;
            break;
          } catch (e) {
            console.error('Failed to parse database JSON', e);
            if (await authSession.isAuthenticated()) {
              console.warn('OAuth authenticated user has corrupted local JSON. Skipping cache source.');
            } else {
              return false;
            }
          }
        }
      }

      if (parsedDb) {
        this.db = this.normalizeDb(parsedDb);
      }

      if (!parsedDb) {
        if (decryptionFailed) {
          return false;
        }

        let userName = 'Default User';
        try {
          const user = await authSession.getUser();
          if (user?.user_metadata?.full_name) {
            userName = user.user_metadata.full_name;
          } else if (user?.email) {
            userName = user.email.split('@')[0];
          }
        } catch (e) {
          console.warn('Could not fetch user info for DB init:', e);
        }
        await this.initializeNewDb(userName);
      }
    }

    if (this.db && (!this.db.profiles || this.db.profiles.length === 0)) {
      let userName = 'Default User';
      try {
        const user = await authSession.getUser();
        if (user?.user_metadata?.full_name) {
          userName = user.user_metadata.full_name;
        } else if (user?.email) {
          userName = user.email.split('@')[0];
        }
      } catch (e) {
        console.debug('Error extracting user data:', e);
      }
      this.db.profiles = [{ id: 'p1', name: userName, role: 'Admin', relationship: 'Self', isNomineeProvided: true }];
    }

    if (this.db && !this.db.recurringTransactions) {
      this.db.recurringTransactions = [];
    }

    await this.processRecurringTransactions();
    await this.save();

    this.logAction('LOGIN', 'User logged in and database unlocked successfully');
    return true;
  }

  public async save(immediate = false): Promise<void> {
    if (!this.db) return;
    this.setUnsavedChanges(true); // Signal to UI that a save is pending

    if (this.localSaveTimer) clearTimeout(this.localSaveTimer);

    const performSave = async () => {
      try {
        if (!this.db) return;

        const pin = authSession.getSessionPin() || undefined;
        let storagePayload = '';

        const serializeAndEncryptSync = async (): Promise<string | null> => {
          if (!this.db) return null;
          const plainPayload = JSON.stringify(this.db);
          let payload = plainPayload;
          if (pin) {
            try {
              payload = await encryptData(plainPayload, pin);
            } catch (e) {
              console.error('Encryption failed', e);
              this.setSaveError('Authentication failed');
              this.setUnsavedChanges(true);
              return null;
            }
          } else if (this.lastSavedPayload && this.lastSavedPayload.includes(':')) {
            this.setSaveError('Authentication failed');
            this.setUnsavedChanges(true);
            return null;
          }
          return payload;
        };

        if (typeof window !== 'undefined' && window.Worker) {
          try {
            storagePayload = await runWorkerSave(this.db, pin);
          } catch (err) {
            console.error('Worker save failed, falling back to synchronous save', err);
            const fallback = await serializeAndEncryptSync();
            if (!fallback) return;
            storagePayload = fallback;
          }
        } else {
          const fallback = await serializeAndEncryptSync();
          if (!fallback) return;
          storagePayload = fallback;
        }

        this.lastSavedPayload = storagePayload;

        if (typeof globalThis.localStorage !== 'undefined' || typeof window !== 'undefined') {
          // Instant local persistence (<1ms)
          try {
            const targetStorage = globalThis.localStorage || (typeof window !== 'undefined' ? window.localStorage : null);
            if (targetStorage) {
              targetStorage.setItem(this.storageKey, storagePayload);
            }
          } catch (e) {
            console.warn('Browser localStorage quota exceeded or unavailable. Falling back to other persistence mechanisms.', e);
          }

          // Local storage write succeeded - mark save as clean immediately
          this.setSaveError(null);
          this.setUnsavedChanges(false);

          // Debounced background cloud sync to avoid network lag or API rate limits.
          // Pushed only when the user consents to cloud backup (isCloudBackupEnabled !== false).
          if ((await authSession.isAuthenticated()) && this.db?.settings?.isCloudBackupEnabled !== false) {
            if (this.cloudSyncTimer) clearTimeout(this.cloudSyncTimer);
            this.cloudSyncTimer = setTimeout(() => {
              this.saveCloudDb(storagePayload).catch((err: unknown) => {
                console.error('Cloud sync error:', err);
              });
            }, 1000);
          }
        }
      } catch (err) {
        console.error('Save failed:', err);
        this.setSaveError('Local save failed. Retrying...');
        this.setUnsavedChanges(true);
      }
    };

    if (immediate) {
      await performSave();
    } else {
      this.localSaveTimer = setTimeout(performSave, 350);
    }
  }

  /**
   * Applies defensive defaults and profileId migration to a parsed database
   * before it is used by the UI. Shared by unlock() and pullFromCloud() so every
   * payload (local or cloud) is normalized identically.
   */
  private normalizeDb(db: DatabaseSchema): DatabaseSchema {
    db.settings = db.settings || {
      theme: 'glass-cyan',
      currency: 'INR',
      backupSchedule: 'weekly',
      isCloudBackupEnabled: true
    };
    db.profiles = db.profiles || [];
    db.accounts = db.accounts || [];
    db.transactions = db.transactions || [];
    db.budgets = db.budgets || [];
    db.fds = db.fds || [];
    db.stocks = db.stocks || [];
    db.mutualfunds = db.mutualfunds || [];
    db.gold = db.gold || [];
    db.nps = db.nps || [];
    db.pf = db.pf || [];
    db.contacts = db.contacts || [];
    db.inventory = db.inventory || [];
    db.invoices = db.invoices || [];
    db.register = db.register || [];
    db.auditLogs = db.auditLogs || [];
    db.recurringTransactions = db.recurringTransactions || [];
    db.tdsRecords = db.tdsRecords || [];
    db.investmentPlans = db.investmentPlans || [];
    db.goals = db.goals || [];
    db.taxInputs = db.taxInputs || {};
    db.emiInputs = db.emiInputs || {};
    db.businessDrafts = db.businessDrafts || {};
    db.fireInputs = db.fireInputs || {};
    db.chatHistory = db.chatHistory || {};
    db.encryptedDocuments = db.encryptedDocuments || [];
    db.automationRules = db.automationRules || [];

    // Data Migration: Inject profileId into business records if missing
    const defaultProfileId = db.profiles?.[0]?.id || 'p_default';
    db.contacts.forEach(c => { if (!c.profileId) c.profileId = defaultProfileId; });
    db.inventory.forEach(i => { if (!i.profileId) i.profileId = defaultProfileId; });
    db.invoices.forEach(inv => { if (!inv.profileId) inv.profileId = defaultProfileId; });
    db.register.forEach(r => { if (!r.profileId) r.profileId = defaultProfileId; });

    return db;
  }

  /**
   * Cloud backup: upsert the user's COMPLETE encrypted payload as a single row in
   * `user_dbs` keyed by the authenticated Supabase user id. This is the only cloud
   * write path — the app never stores plaintext records in Supabase (CRIT-02).
   *
   * Gated on: consent (isCloudBackupEnabled !== false), an authenticated session,
   * and the payload being an AES-GCM encrypted `salt:iv:ciphertext` blob (exactly
   * 3 colon-separated parts). A PIN-less user's plaintext JSON is refused — it
   * must never reach the server.
   *
   * Retries with backoff (1s / 5s / 15s) so offline edits are not dropped when the
   * network flaps. On success the row's updated_at becomes the last-known-sync
   * watermark used by pullFromCloud() to avoid re-applying stale rows.
   */
  public async saveCloudDb(payload: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    if (this.db?.settings?.isCloudBackupEnabled === false) return; // consent off → stop pushing
    if (typeof payload !== 'string' || payload.split(':').length !== 3) return; // refuse plaintext
    if (!(await authSession.isAuthenticated())) return;

    let user;
    try {
      user = await authSession.getUser();
    } catch {
      return;
    }
    if (!user) return;

    const rowTime = Date.now();
    const delays = [1000, 5000, 15000];
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const { error } = await client
          .from('user_dbs')
          .upsert({ user_id: user.id, payload, schema_version: 1, updated_at: new Date(rowTime).toISOString() });
        if (error) throw error;
        this.persistLastSyncedAt(rowTime);
        this.setSaveError(null);
        return;
      } catch (err) {
        console.warn(`Cloud backup attempt ${attempt + 1}/${delays.length + 1} failed:`, err);
        if (attempt < delays.length) {
          await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
        }
      }
    }
    this.setSaveError('Cloud backup failed after retries. Will retry on next save.');
  }

  /**
   * Cloud pull: fetch the user's encrypted backup from `user_dbs` and, if it is
   * newer than the last known sync, decrypt it with the session PIN and load it
   * into this.db.
   *
   * Returns:
   *   'synced'    — a newer cloud payload was decrypted and applied.
   *   'needs_pin' — a cloud row exists but we cannot decrypt it (no session PIN or
   *                 wrong PIN). The caller must prompt for the PIN rather than
   *                 initialize a fresh DB, otherwise a second device with a wrong
   *                 PIN would overwrite the user's real data with an empty DB.
   *   'none'      — no cloud row / not consented / transient network error; the
   *                 caller should fall through to the local sources.
   */
  public async pullFromCloud(): Promise<'synced' | 'needs_pin' | 'none'> {
    const client = getSupabaseClient();
    if (!client) return 'none';
    if (!(await authSession.isAuthenticated())) return 'none';
    if (this.db?.settings?.isCloudBackupEnabled === false) return 'none';

    let user;
    try {
      user = await authSession.getUser();
    } catch {
      return 'none';
    }
    if (!user) return 'none';

    let row: { payload: string; updated_at?: string } | null = null;
    try {
      const res = await client
        .from('user_dbs')
        .select('payload, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (res.error || !res.data?.payload) return 'none';
      row = res.data as { payload: string; updated_at?: string };
    } catch (e) {
      console.warn('Cloud pull network error:', e);
      return 'none'; // transient — do not block boot; local sources still work
    }

    const rowTime = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    if (rowTime > 0 && rowTime <= this.lastSyncedAt) return 'none';

    const pin = authSession.getSessionPin();
    if (!pin) return 'needs_pin';

    try {
      const decrypted = await decryptData(row.payload, pin);
      if (!decrypted) return 'needs_pin';
      const parsed = JSON.parse(decrypted) as DatabaseSchema;
      this.db = this.normalizeDb(parsed);
      this.lastSavedPayload = row.payload;
      this.persistLastSyncedAt(rowTime);
      this.notifySubscribers();
      return 'synced';
    } catch (e) {
      console.warn('Cloud pull decryption failed (wrong PIN?):', e);
      return 'needs_pin';
    }
  }

  /** Deletes the user's encrypted cloud backup row. Local data is untouched. */
  public async deleteCloudBackup(): Promise<{ ok: boolean; message: string }> {
    const client = getSupabaseClient();
    if (!client) return { ok: false, message: 'Cloud sync is not configured.' };
    if (!(await authSession.isAuthenticated())) return { ok: false, message: 'Not authenticated.' };
    let user;
    try {
      user = await authSession.getUser();
    } catch {
      return { ok: false, message: 'Could not identify the signed-in user.' };
    }
    if (!user) return { ok: false, message: 'Could not identify the signed-in user.' };

    try {
      const { error } = await client
        .from('user_dbs')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
      return { ok: true, message: 'Cloud backup deleted.' };
    } catch (e) {
      console.error('Failed to delete cloud backup:', e);
      return { ok: false, message: 'Could not delete cloud backup. Try again.' };
    }
  }

  /** 30s poll of pullFromCloud() while unlocked; fires callback when a newer cloud copy was applied. */
  public listenForCloudSync(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => { };
    const interval = setInterval(async () => {
      try {
        const result = await this.pullFromCloud();
        if (result === 'synced') {
          callback();
        }
      } catch (e) {
        console.warn('Cloud sync poll failed:', e);
      }
    }, 30000);
    return () => clearInterval(interval);
  }

  /** Real-time sync listener combining local cross-tab sync and cloud pull */
  public listenForSync(callback: () => void): () => void {
    const unsubSubscribe = this.subscribe(callback);
    const unsubCloud = this.listenForCloudSync(callback);
    return () => {
      unsubSubscribe();
      unsubCloud();
    };
  }

  public purgeLocalDatabase(): void {
    this.db = null;
    this.lastSavedPayload = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (e) {
        console.error('Failed to purge local storage', e);
      }
    }
  }

  public lock(): void {
    authSession.logout();
    this.db = null;
  }

  public isUnlocked(): boolean {
    return this.db !== null;
  }

  // Log action to audit logs
  private logAction(action: string, details: string): void {
    if (!this.db) return;
    if (!this.db.auditLogs) this.db.auditLogs = [];
    const log: AuditLog = {
      id: 'log_' + generateSalt(6),
      timestamp: new Date().toISOString(),
      userId: this.db.profiles[0]?.id || 'system',
      action,
      details
    };
    this.db.auditLogs.unshift(log);
    // Limit to 500 logs
    if (this.db.auditLogs.length > 500) {
      this.db.auditLogs = this.db.auditLogs.slice(0, 500);
    }
  }

  // --- API Repositories ---

  public getSettings(): SystemSettings {
    if (!this.db) throw new Error('Database is locked');
    return this.db.settings;
  }

  public async updateSettings(settings: Partial<SystemSettings>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.settings = { ...this.db.settings, ...settings };
    this.logAction('SETTINGS_UPDATE', `Settings updated: ${JSON.stringify(settings)}`);
    await this.save();
  }

  // Profiles
  public getProfiles(): UserProfile[] {
    if (!this.db) throw new Error('Database is locked');
    return this.db.profiles;
  }

  public async addProfile(profile: Omit<UserProfile, 'id'>): Promise<UserProfile> {
    if (!this.db) throw new Error('Database is locked');
    const newProfile: UserProfile = {
      ...profile,
      id: 'p_' + generateSalt(6)
    };
    this.db.profiles.push(newProfile);
    this.logAction('PROFILE_ADD', `Added profile for ${profile.name}`);
    await this.save(true);
    this.notifySubscribers();
    return newProfile;
  }

  public async updateProfile(id: string, updates: Partial<UserProfile>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.profiles = this.db.profiles.map(p => p.id === id ? { ...p, ...updates } : p);
    this.logAction('PROFILE_UPDATE', `Updated profile ID ${id}`);
    await this.save(true);
    this.notifySubscribers();
  }

  public async deleteProfile(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.profiles = this.db.profiles.filter(p => p.id !== id);

    // BUG-002 Cascade Purge
    this.db.accounts = this.db.accounts.filter(a => a.profileId !== id);
    this.db.transactions = this.db.transactions.filter(t => t.profileId !== id);
    this.db.budgets = this.db.budgets.filter(b => b.profileId !== id);
    this.db.fds = this.db.fds.filter(f => f.profileId !== id);
    this.db.stocks = this.db.stocks.filter(s => s.profileId !== id);
    this.db.mutualfunds = this.db.mutualfunds.filter(m => m.profileId !== id);
    this.db.gold = this.db.gold.filter(g => g.profileId !== id);
    this.db.nps = this.db.nps.filter(n => n.profileId !== id);
    this.db.pf = this.db.pf.filter(p => p.profileId !== id);

    if (this.db.contacts) this.db.contacts = this.db.contacts.filter(c => c.profileId !== id);
    if (this.db.inventory) this.db.inventory = this.db.inventory.filter(i => i.profileId !== id);
    if (this.db.invoices) this.db.invoices = this.db.invoices.filter(i => i.profileId !== id);
    if (this.db.register) this.db.register = this.db.register.filter(r => r.profileId !== id);
    if (this.db.recurringTransactions) this.db.recurringTransactions = this.db.recurringTransactions.filter(r => r.profileId !== id);
    if (this.db.goals) this.db.goals = this.db.goals.filter(g => g.profileId !== id);
    if (this.db.investmentPlans) this.db.investmentPlans = this.db.investmentPlans.filter(p => p.profileId !== id);
    if (this.db.encryptedDocuments) this.db.encryptedDocuments = this.db.encryptedDocuments.filter(d => d.profileId !== id);
    if (this.db.automationRules) this.db.automationRules = this.db.automationRules.filter(r => r.profileId !== id);
    if (this.db.tdsRecords) this.db.tdsRecords = this.db.tdsRecords.filter(t => t.profileId !== id);
    if (this.db.taxInputs) delete this.db.taxInputs[id];
    if (this.db.emiInputs) delete this.db.emiInputs[id];
    if (this.db.businessDrafts) delete this.db.businessDrafts[id];
    if (this.db.fireInputs) delete this.db.fireInputs[id];
    if (this.db.chatHistory) delete this.db.chatHistory[id];

    if (this.activeProfileId === id) {
      this.activeProfileId = this.db.profiles.length > 0 ? this.db.profiles[0].id : null;
    }

    this.logAction('PROFILE_DELETE', `Deleted profile ID ${id} and cascaded all associated personal data`);
    await this.save(true);
    this.notifySubscribers();
  }

  // Bank Accounts
  public getAccounts(): BankAccount[] {
    if (!this.db) throw new Error('Database is locked');
    if (this.activeProfileId) return this.db.accounts.filter(a => a.profileId === this.activeProfileId);
    return this.db.accounts;
  }

  public async addAccount(account: Omit<BankAccount, 'id'>): Promise<BankAccount> {
    if (!this.db) throw new Error('Database is locked');
    if (this.activeProfileId && account.profileId && account.profileId !== this.activeProfileId) {
      throw new Error('Authentication failed: Cannot add account for a different profile');
    }
    const newAccount: BankAccount = { ...account, id: 'a_' + generateSalt(6) };
    this.db.accounts.push(newAccount);
    await this.save();
    return newAccount;
  }

  public async updateAccount(id: string, updates: Partial<BankAccount>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    const existing = this.db.accounts.find(a => a.id === id);
    if (existing && this.activeProfileId && existing.profileId !== this.activeProfileId) {
      throw new Error('Authentication failed: Account belongs to a different profile');
    }
    this.db.accounts = this.db.accounts.map(a => a.id === id ? { ...a, ...updates } : a);
    await this.save();
  }

  public async deleteAccount(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    const existing = this.db.accounts.find(a => a.id === id);
    if (existing && this.activeProfileId && existing.profileId !== this.activeProfileId) {
      throw new Error('Authentication failed: Account belongs to a different profile');
    }
    this.db.accounts = this.db.accounts.filter(a => a.id !== id);
    this.db.transactions = this.db.transactions.filter(t => t.accountId !== id);
    await this.save();
  }

  // Transactions Ledger
  public getTransactions(profileId?: string): Transaction[] {
    if (!this.db) throw new Error('Database is locked');
    const targetPid = profileId || this.activeProfileId;
    return (targetPid ? this.db.transactions.filter(x => x.profileId === targetPid) : [...this.db.transactions]).sort((a, b) => b.date.localeCompare(a.date));
  }

  public async addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    if (!this.db) throw new Error('Database is locked');

    // Auto-apply active automation rules
    let category = tx.category;
    let tag = tx.tag;
    const rules = (this.db.automationRules || []).filter(r => r.isActive && r.profileId === tx.profileId);
    for (const r of rules) {
      if (r.triggerType === 'DescriptionContains' && tx.description.toLowerCase().includes(r.matchPattern.toLowerCase())) {
        category = r.targetCategory;
        if (r.targetTag) tag = r.targetTag;
        break;
      } else if (r.triggerType === 'AmountOver' && tx.amount >= parseFloat(r.matchPattern)) {
        category = r.targetCategory;
        if (r.targetTag) tag = r.targetTag;
        break;
      } else if (r.triggerType === 'CategoryMatch' && tx.category.toLowerCase() === r.matchPattern.toLowerCase()) {
        category = r.targetCategory;
        if (r.targetTag) tag = r.targetTag;
        break;
      }
    }

    const newTx: Transaction = { ...tx, category, tag, id: 't_' + generateSalt(6) };
    this.db.transactions.push(newTx);

    // Update bank balance
    const account = this.db.accounts.find(a => a.id === tx.accountId);
    if (account) {
      if (tx.type === 'Income') account.balance += tx.amount;
      else if (tx.type === 'Expense') account.balance -= tx.amount;
      else if (tx.type === 'Transfer') {
        account.balance -= tx.amount;
      }
    }

    // For transfers to other bank accounts
    if (tx.type === 'Transfer' && tx.refAccountId) {
      const refAccount = this.db.accounts.find(a => a.id === tx.refAccountId);
      if (refAccount) refAccount.balance += tx.amount;
    }

    await this.save();
    return newTx;
  }

  public async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    const oldTx = this.db.transactions.find(t => t.id === id);
    if (!oldTx) return;

    // Rollback old balance
    const oldAccount = this.db.accounts.find(a => a.id === oldTx.accountId);
    if (oldAccount) {
      if (oldTx.type === 'Income') oldAccount.balance -= oldTx.amount;
      else if (oldTx.type === 'Expense') oldAccount.balance += oldTx.amount;
      else if (oldTx.type === 'Transfer') oldAccount.balance += oldTx.amount;
    }
    if (oldTx.type === 'Transfer' && oldTx.refAccountId) {
      const refAccount = this.db.accounts.find(a => a.id === oldTx.refAccountId);
      if (refAccount) refAccount.balance -= oldTx.amount;
    }

    const updatedTx: Transaction = { ...oldTx, ...updates };
    this.db.transactions = this.db.transactions.map(t => t.id === id ? updatedTx : t);

    // Apply new balance
    const newAccount = this.db.accounts.find(a => a.id === updatedTx.accountId);
    if (newAccount) {
      if (updatedTx.type === 'Income') newAccount.balance += updatedTx.amount;
      else if (updatedTx.type === 'Expense') newAccount.balance -= updatedTx.amount;
      else if (updatedTx.type === 'Transfer') newAccount.balance -= updatedTx.amount;
    }
    if (updatedTx.type === 'Transfer' && updatedTx.refAccountId) {
      const refAccount = this.db.accounts.find(a => a.id === updatedTx.refAccountId);
      if (refAccount) refAccount.balance += updatedTx.amount;
    }

    await this.save();
  }

  public async deleteTransaction(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    const tx = this.db.transactions.find(t => t.id === id);
    if (tx) {
      // Rollback bank balance
      const account = this.db.accounts.find(a => a.id === tx.accountId);
      if (account) {
        if (tx.type === 'Income') account.balance -= tx.amount;
        else if (tx.type === 'Expense') account.balance += tx.amount;
        else if (tx.type === 'Transfer') {
          account.balance += tx.amount;
        }
      }
      if (tx.type === 'Transfer' && tx.refAccountId) {
        const refAccount = this.db.accounts.find(a => a.id === tx.refAccountId);
        if (refAccount) refAccount.balance -= tx.amount;
      }
      this.db.transactions = this.db.transactions.filter(t => t.id !== id);
      await this.save();
    }
  }

  // Budgets
  public getBudgets(): Budget[] {
    if (!this.db) throw new Error('Database is locked');
    return (this.activeProfileId ? this.db.budgets.filter(x => x.profileId === this.activeProfileId) : this.db.budgets);
  }

  public async addBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
    if (!this.db) throw new Error('Database is locked');
    const newBudget: Budget = { ...budget, id: 'b_' + generateSalt(6) };
    this.db.budgets.push(newBudget);
    await this.save();
    return newBudget;
  }

  public async updateBudget(id: string, updates: Partial<Budget>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.budgets = this.db.budgets.map(b => b.id === id ? { ...b, ...updates } : b);
    await this.save();
  }

  public async deleteBudget(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.budgets = this.db.budgets.filter(b => b.id !== id);
    await this.save();
  }

  // Encrypted Documents (Document Vault)
  public getEncryptedDocuments(profileId?: string): EncryptedDocument[] {
    if (!this.db) throw new Error('Database is locked');
    const docs = this.db.encryptedDocuments || [];
    const targetPid = profileId || this.activeProfileId;
    return targetPid ? docs.filter(d => d.profileId === targetPid) : docs;
  }

  public async addEncryptedDocument(doc: EncryptedDocument): Promise<EncryptedDocument> {
    if (!this.db) throw new Error('Database is locked');
    if (!this.db.encryptedDocuments) this.db.encryptedDocuments = [];
    this.db.encryptedDocuments.push(doc);
    await this.save();
    return doc;
  }

  public async deleteEncryptedDocument(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    if (this.db.encryptedDocuments) {
      this.db.encryptedDocuments = this.db.encryptedDocuments.filter(d => d.id !== id);
      await this.save();
    }
  }

  // FDs
  public getFDs(): FixedDeposit[] {
    if (!this.db) throw new Error('Database is locked');
    return (this.activeProfileId ? this.db.fds.filter(x => x.profileId === this.activeProfileId) : this.db.fds);
  }

  public async addFD(fd: Omit<FixedDeposit, 'id'>): Promise<FixedDeposit> {
    if (!this.db) throw new Error('Database is locked');
    const newFD: FixedDeposit = { ...fd, id: 'fd_' + generateSalt(6) };
    this.db.fds.push(newFD);
    await this.save();
    return newFD;
  }

  public async updateFD(id: string, updates: Partial<FixedDeposit>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.fds = this.db.fds.map(f => f.id === id ? { ...f, ...updates } : f);
    await this.save();
  }

  public async deleteFD(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.fds = this.db.fds.filter(f => f.id !== id);
    await this.save();
  }

  // Stocks
  public getStocks(): StockHolding[] {
    if (!this.db) throw new Error('Database is locked');
    return (this.activeProfileId ? this.db.stocks.filter(x => x.profileId === this.activeProfileId) : this.db.stocks);
  }

  public async updateStock(id: string, updates: Partial<StockHolding>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.stocks = this.db.stocks.map(s => s.id === id ? { ...s, ...updates } : s);
    await this.save();
  }

  public async addStock(stock: Omit<StockHolding, 'id'>): Promise<StockHolding> {
    if (!this.db) throw new Error('Database is locked');
    const newStock: StockHolding = { ...stock, id: 'stk_' + generateSalt(6) };
    this.db.stocks.push(newStock);
    await this.save();
    return newStock;
  }

  public async deleteStock(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.stocks = this.db.stocks.filter(s => s.id !== id);
    await this.save();
  }

  // Mutual Funds
  public getMutualFunds(): MutualFundHolding[] {
    if (!this.db) throw new Error('Database is locked');
    return (this.activeProfileId ? this.db.mutualfunds.filter(x => x.profileId === this.activeProfileId) : this.db.mutualfunds);
  }

  public async addMutualFund(mf: Omit<MutualFundHolding, 'id'>): Promise<MutualFundHolding> {
    if (!this.db) throw new Error('Database is locked');
    const newMF: MutualFundHolding = { ...mf, id: 'mf_' + generateSalt(6) };
    this.db.mutualfunds.push(newMF);
    await this.save();
    return newMF;
  }

  public async updateMutualFund(id: string, updates: Partial<MutualFundHolding>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.mutualfunds = this.db.mutualfunds.map(m => m.id === id ? { ...m, ...updates } : m);
    await this.save();
  }

  public async deleteMutualFund(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.mutualfunds = this.db.mutualfunds.filter(m => m.id !== id);
    await this.save();
  }

  // Gold Holdings
  public getGold(): GoldHolding[] {
    if (!this.db) throw new Error('Database is locked');
    return (this.activeProfileId ? this.db.gold.filter(x => x.profileId === this.activeProfileId) : this.db.gold);
  }

  public async addGold(gold: Omit<GoldHolding, 'id'>): Promise<GoldHolding> {
    if (!this.db) throw new Error('Database is locked');
    const newGold: GoldHolding = { ...gold, id: 'gld_' + generateSalt(6) };
    this.db.gold.push(newGold);
    await this.save();
    return newGold;
  }

  public async updateGold(id: string, updates: Partial<GoldHolding>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.gold = this.db.gold.map(g => g.id === id ? { ...g, ...updates } : g);
    await this.save();
  }

  public async deleteGold(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.gold = this.db.gold.filter(g => g.id !== id);
    await this.save();
  }

  // NPS
  public getNPS(): NPSHolding[] {
    if (!this.db) throw new Error('Database is locked');
    return (this.activeProfileId ? this.db.nps.filter(x => x.profileId === this.activeProfileId) : this.db.nps);
  }

  public async addNPS(nps: Omit<NPSHolding, 'id'>): Promise<NPSHolding> {
    if (!this.db) throw new Error('Database is locked');
    const newNPS: NPSHolding = { ...nps, id: 'nps_' + generateSalt(6) };
    this.db.nps.push(newNPS);
    await this.save();
    return newNPS;
  }

  public async updateNPS(id: string, updates: Partial<NPSHolding>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.nps = this.db.nps.map(n => n.id === id ? { ...n, ...updates } : n);
    await this.save();
  }

  public async deleteNPS(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.nps = this.db.nps.filter(n => n.id !== id);
    await this.save();
  }

  // Provident Fund (EPF/PPF)
  public getPF(): ProvidentFundHolding[] {
    if (!this.db) throw new Error('Database is locked');
    return (this.activeProfileId ? this.db.pf.filter(x => x.profileId === this.activeProfileId) : this.db.pf);
  }

  public async addPF(pf: Omit<ProvidentFundHolding, 'id'>): Promise<ProvidentFundHolding> {
    if (!this.db) throw new Error('Database is locked');
    const newPF: ProvidentFundHolding = { ...pf, id: 'pf_' + generateSalt(6) };
    this.db.pf.push(newPF);
    await this.save();
    return newPF;
  }

  public async updatePF(id: string, updates: Partial<ProvidentFundHolding>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.pf = this.db.pf.map(p => p.id === id ? { ...p, ...updates } : p);
    await this.save();
  }

  public async deletePF(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.pf = this.db.pf.filter(p => p.id !== id);
    await this.save();
  }

  // Business: Contacts
  public getContacts(): VendorCustomer[] {
    if (!this.db) throw new Error('Database is locked');
    return (this.activeProfileId ? this.db.contacts.filter(x => x.profileId === this.activeProfileId) : this.db.contacts);
  }

  public async addContact(contact: Omit<VendorCustomer, 'id'>): Promise<VendorCustomer> {
    if (!this.db) throw new Error('Database is locked');
    const newContact: VendorCustomer = { ...contact, id: 'c_' + generateSalt(6) };
    this.db.contacts.push(newContact);
    await this.save();
    return newContact;
  }

  public async updateContact(id: string, updates: Partial<VendorCustomer>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.contacts = this.db.contacts.map(c => c.id === id ? { ...c, ...updates } : c);
    await this.save();
  }

  public async deleteContact(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.contacts = this.db.contacts.filter(c => c.id !== id);
    await this.save();
  }

  // Business: Inventory
  public getInventory(): InventoryItem[] {
    if (!this.db) throw new Error('Database is locked');
    return (this.activeProfileId ? this.db.inventory.filter(x => x.profileId === this.activeProfileId) : this.db.inventory);
  }

  public async addInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    if (!this.db) throw new Error('Database is locked');
    const newItem: InventoryItem = { ...item, id: 'i_' + generateSalt(6) };
    this.db.inventory.push(newItem);
    await this.save();
    return newItem;
  }

  public async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.inventory = this.db.inventory.map(i => i.id === id ? { ...i, ...updates } : i);
    await this.save();
  }

  public async deleteInventoryItem(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.inventory = this.db.inventory.filter(i => i.id !== id);
    await this.save();
  }

  public async updateInventoryQty(id: string, qtyChange: number): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.inventory = this.db.inventory.map(i => {
      if (i.id === id) {
        return { ...i, quantity: Math.max(0, i.quantity + qtyChange) };
      }
      return i;
    });
    await this.save();
  }

  // Business: Invoices
  public getInvoices(): BusinessInvoice[] {
    if (!this.db) throw new Error('Database is locked');
    return (this.activeProfileId ? this.db.invoices.filter(x => x.profileId === this.activeProfileId) : this.db.invoices);
  }

  public async addInvoice(invoice: Omit<BusinessInvoice, 'id'>): Promise<BusinessInvoice> {
    if (!this.db) throw new Error('Database is locked');
    const newInvoice: BusinessInvoice = { ...invoice, id: 'inv_' + generateSalt(6) };
    this.db.invoices.push(newInvoice);

    // Log to register
    const reg: Omit<BusinessRegisterEntry, 'id'> = {
      profileId: invoice.profileId,
      date: invoice.date,
      type: 'Sales',
      refNumber: invoice.invoiceNumber,
      partyName: invoice.customerName,
      taxableAmount: invoice.subtotal,
      cgst: invoice.cgstTotal,
      sgst: invoice.sgstTotal,
      igst: invoice.igstTotal,
      totalAmount: invoice.grandTotal,
      gstRate: invoice.items[0]?.gstRate || 18
    };
    await this.addRegisterEntry(reg);

    // Deduct inventory items
    for (const item of invoice.items) {
      await this.updateInventoryQty(item.itemId, -item.quantity);
    }

    await this.save();
    return newInvoice;
  }

  public async updateInvoiceStatus(id: string, status: 'Draft' | 'Sent' | 'Paid' | 'Overdue'): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.invoices = this.db.invoices.map(i => i.id === id ? { ...i, status } : i);
    await this.save();
  }

  public async deleteInvoice(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    const invoice = this.db.invoices.find(i => i.id === id);
    if (!invoice) return;

    // Rollback inventory items
    for (const item of invoice.items) {
      await this.updateInventoryQty(item.itemId, item.quantity); // add it back
    }

    // Remove from register (by refNumber == invoiceNumber)
    this.db.register = this.db.register.filter(r => r.refNumber !== invoice.invoiceNumber);

    // Remove invoice
    this.db.invoices = this.db.invoices.filter(i => i.id !== id);

    await this.save();
  }

  // Business: Purchase/Sales Register
  public getRegister(): BusinessRegisterEntry[] {
    if (!this.db) throw new Error('Database is locked');
    return (this.activeProfileId ? this.db.register.filter(x => x.profileId === this.activeProfileId) : [...this.db.register]).sort((a, b) => b.date.localeCompare(a.date));
  }

  public async addRegisterEntry(entry: Omit<BusinessRegisterEntry, 'id'>): Promise<BusinessRegisterEntry> {
    if (!this.db) throw new Error('DB not initialized');
    const newEntry: BusinessRegisterEntry = { ...entry, id: 'reg_' + generateSalt(6) };
    this.db.register.push(newEntry);
    await this.save();
    return newEntry;
  }

  public async updateRegisterEntry(id: string, updates: Partial<BusinessRegisterEntry>): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    this.db.register = this.db.register.map(r => r.id === id ? { ...r, ...updates } : r);
    await this.save();
  }

  public async deleteRegisterEntry(id: string): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    this.db.register = this.db.register.filter(r => r.id !== id);
    await this.save();
  }

  // TDS Records
  public getTDSRecords(): TDSSummary[] {
    if (!this.db) return [];
    if (!this.db.tdsRecords) this.db.tdsRecords = [];
    return this.db.tdsRecords;
  }

  public async addTDSRecord(record: Omit<TDSSummary, 'id'>): Promise<TDSSummary> {
    if (!this.db) throw new Error('DB not initialized');
    if (!this.db.tdsRecords) this.db.tdsRecords = [];
    const newRecord: TDSSummary = { ...record, id: 'tds_' + generateSalt(6) };
    this.db.tdsRecords.push(newRecord);
    await this.save();
    return newRecord;
  }

  public async updateTDSRecord(id: string, updates: Partial<TDSSummary>): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    if (!this.db.tdsRecords) this.db.tdsRecords = [];
    this.db.tdsRecords = this.db.tdsRecords.map(r => r.id === id ? { ...r, ...updates } : r);
    await this.save();
  }

  public async deleteTDSRecord(id: string): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    if (!this.db.tdsRecords) return;
    this.db.tdsRecords = this.db.tdsRecords.filter(r => r.id !== id);
    await this.save();
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    if (!this.db) throw new Error('Database is locked');
    return this.db.auditLogs;
  }

  // Export full JSON representation (for backup)
  public getRawDb(): string {
    if (!this.db) throw new Error('Database is locked');
    return JSON.stringify(this.db, null, 2);
  }

  // Overwrite database from JSON import
  public async importRawDb(jsonString: string): Promise<boolean> {
    try {
      const imported = JSON.parse(jsonString);
      if (
        imported &&
        typeof imported === 'object' &&
        imported.settings &&
        Array.isArray(imported.profiles) &&
        Array.isArray(imported.accounts) &&
        Array.isArray(imported.transactions) &&
        Array.isArray(imported.budgets)
      ) {
        // Validate profile fields
        for (const p of imported.profiles) {
          if (!p.id || !p.name) return false;
        }

        // Validate account profileIds
        const profileIds = new Set(imported.profiles.map((p: any) => p.id));
        for (const a of imported.accounts) {
          if (!a.id || !profileIds.has(a.profileId)) return false;
        }

        // Validate transaction accountIds
        const accountIds = new Set(imported.accounts.map((a: any) => a.id));
        for (const t of imported.transactions) {
          if (!t.id || !accountIds.has(t.accountId)) return false;
        }

        // Create pre-import snapshot backup
        if (typeof window !== 'undefined' && this.db) {
          try {
            localStorage.setItem(`pre_import_snapshot_${Date.now()}`, JSON.stringify(this.db));
          } catch (e) {
            console.error('Pre-import snapshot failed', e);
            return false;
          }
        }

        const db = imported as DatabaseSchema;
        if (!db.recurringTransactions) db.recurringTransactions = [];
        if (!db.auditLogs) db.auditLogs = [];
        this.db = db;
        await this.save();
        this.logAction('BACKUP_IMPORT', 'Database imported and overwritten from backup');
        return true;
      }
    } catch (e) {
      console.error('Invalid backup JSON format', e);
    }
    return false;
  }

  // Recurring Transactions
  public getRecurringTransactions(): RecurringTransaction[] {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.recurringTransactions) db.recurringTransactions = [];
    return db.recurringTransactions;
  }

  public async addRecurringTransaction(rt: Omit<RecurringTransaction, 'id'>): Promise<RecurringTransaction> {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.recurringTransactions) db.recurringTransactions = [];
    const newRt: RecurringTransaction = { ...rt, id: 'rt_' + generateSalt(6) };
    db.recurringTransactions.push(newRt);
    await this.save();

    // Immediately process in case it is already due
    await this.processRecurringTransactions();
    return newRt;
  }

  public async deleteRecurringTransaction(id: string): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.recurringTransactions) db.recurringTransactions = [];
    db.recurringTransactions = db.recurringTransactions.filter(r => r.id !== id);
    await this.save();
  }

  // Investment Plans
  public getInvestmentPlans(profileId?: string): InvestmentPlan[] {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    const plans = db.investmentPlans || [];
    const pid = profileId || this.activeProfileId;
    return pid ? plans.filter(p => p.profileId === pid) : plans;
  }

  public async addInvestmentPlan(plan: Omit<InvestmentPlan, 'id'>): Promise<InvestmentPlan> {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.investmentPlans) db.investmentPlans = [];

    // Check if one already exists for profile, replace if so (1 per profile constraint might be good, but we can just use ID)
    const newPlan: InvestmentPlan = { ...plan, id: 'ip_' + generateSalt(6) };
    db.investmentPlans.push(newPlan);
    await this.save();
    return newPlan;
  }

  public async updateInvestmentPlan(id: string, updates: Partial<InvestmentPlan>): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.investmentPlans) db.investmentPlans = [];
    db.investmentPlans = db.investmentPlans.map(p => p.id === id ? { ...p, ...updates } : p);
    await this.save();
  }


  // Savings Goals
  public getGoals(profileId?: string): SavingsGoal[] {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    const goals = db.goals || [];
    const pid = profileId || this.activeProfileId;
    return pid ? goals.filter(g => g.profileId === pid) : goals;
  }

  public async addGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt'>): Promise<SavingsGoal> {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.goals) db.goals = [];
    const newGoal: SavingsGoal = { ...goal, id: 'goal_' + generateSalt(6), createdAt: new Date().toISOString() };
    db.goals.push(newGoal);
    this.logAction('GOAL_ADD', `Added savings goal: ${goal.name}`);
    await this.save();
    return newGoal;
  }

  public async updateGoal(id: string, updates: Partial<SavingsGoal>): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.goals) db.goals = [];
    db.goals = db.goals.map(g => g.id === id ? { ...g, ...updates } : g);
    await this.save();
  }

  public async deleteGoal(id: string): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.goals) return;
    db.goals = db.goals.filter(g => g.id !== id);
    this.logAction('GOAL_DELETE', `Deleted savings goal ID: ${id}`);
    await this.save();
  }

  // Automation Rules
  public getAutomationRules(profileId?: string): AutomationRule[] {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    const rules = db.automationRules || [];
    const pid = profileId || this.activeProfileId;
    return pid ? rules.filter(r => r.profileId === pid) : rules;
  }

  public async addAutomationRule(rule: Omit<AutomationRule, 'id'>): Promise<AutomationRule> {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.automationRules) db.automationRules = [];
    const newRule: AutomationRule = { ...rule, id: 'rule_' + generateSalt(6) };
    db.automationRules.push(newRule);
    this.logAction('AUTOMATION_RULE_ADD', `Added automation rule: ${rule.name}`);
    await this.save();
    return newRule;
  }

  public async updateAutomationRule(id: string, updates: Partial<AutomationRule>): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.automationRules) db.automationRules = [];
    db.automationRules = db.automationRules.map(r => r.id === id ? { ...r, ...updates } : r);
    await this.save();
  }

  public async deleteAutomationRule(id: string): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.automationRules) return;
    db.automationRules = db.automationRules.filter(r => r.id !== id);
    this.logAction('AUTOMATION_RULE_DELETE', `Deleted automation rule ID: ${id}`);
    await this.save();
  }

  // Helper to calculate stepped-up amount based on anniversaries
  private getStepUpAmount(baseAmount: number, startDateStr: string, currentDateStr: string, stepUpPct: number): number {
    const start = new Date(startDateStr);
    const current = new Date(currentDateStr);
    let years = current.getFullYear() - start.getFullYear();

    // Adjust if current date is before start date anniversary in the year
    const anniversary = new Date(current.getFullYear(), start.getMonth(), start.getDate());
    if (current < anniversary) {
      years--;
    }

    years = Math.max(0, years);
    return Math.round(baseAmount * Math.pow(1 + stepUpPct / 100, years));
  }

  // Automated Dividends: 2% annual yield, paid quarterly (0.5% per quarter)
  private autoGenerateDividends(today: Date): boolean {
    const db = this.db;
    if (!db || !db.stocks || db.stocks.length === 0) return false;

    const todayStr = today.toISOString().split('T')[0];

    // We check if we already posted dividends today to prevent dupes.
    // Usually a real system checks the exact stock dividend dates. Here we just post quarterly.
    const isQuarterEnd = (today.getMonth() + 1) % 3 === 0 && today.getDate() === 28; // e.g. Mar 28, Jun 28

    if (!isQuarterEnd) return false;

    // Check if any dividend was posted today already to prevent duplicates on multiple reloads
    const alreadyPosted = db.transactions.some(t => t.date === todayStr && t.description.startsWith('[Auto-Dividend]'));
    if (alreadyPosted) return false;

    let changed = false;

    for (const stock of db.stocks) {
      if (stock.quantity <= 0) continue;

      const value = stock.quantity * (stock.currentPrice || stock.averagePrice);
      if (value < 1000) continue; // Skip very small holdings

      const dividendAmount = Math.round(value * 0.005); // 0.5% per quarter (~2% annually)

      if (dividendAmount > 0) {
        // Find default account to deposit to
        const account = db.accounts.find(a => a.profileId === stock.profileId);
        if (account) {
          account.balance += dividendAmount;

          const newTx: Transaction = {
            id: 't_' + generateSalt(6),
            accountId: account.id,
            profileId: stock.profileId,
            date: todayStr,
            description: `[Auto-Dividend] ${stock.name || stock.symbol}`,
            amount: dividendAmount,
            type: 'Income',
            category: 'Investments',
          };

          if (!db.transactions) db.transactions = [];
          db.transactions.push(newTx);
          this.logAction('AUTOMATION', `Posted automated dividend for ${stock.symbol}: ₹${dividendAmount}`);
          changed = true;
        }
      }
    }

    return changed;
  }

  // Background processor: run on unlock to post due transactions
  public async processRecurringTransactions(): Promise<void> {
    const db = this.db;
    if (!db) return;
    const nowStr = new Date().toISOString().split('T')[0];
    const today = new Date(nowStr);
    let changed = false;

    if (!db.recurringTransactions) {
      db.recurringTransactions = [];
    }

    for (const rt of db.recurringTransactions) {
      if (!rt.isActive) continue;

      const nextDue = new Date(rt.nextDueDate);
      // Process if nextDueDate is on or before today
      while (nextDue <= today) {
        const nextDueStr = nextDue.toISOString().split('T')[0];

        // Calculate step-up amount if configured
        let currentAmount = rt.amount;
        if (rt.startDate && rt.stepUpPct) {
          currentAmount = this.getStepUpAmount(rt.amount, rt.startDate, nextDueStr, rt.stepUpPct);
        }

        // Create actual transaction
        const newTx: Transaction = {
          id: 't_' + generateSalt(6),
          accountId: rt.accountId,
          profileId: rt.profileId,
          date: nextDueStr,
          description: rt.stepUpPct ? `[Auto Step-Up SIP] ${rt.description}` : `[Auto-SIP] ${rt.description}`,
          amount: currentAmount,
          type: rt.type,
          category: rt.category,
          refAccountId: rt.refAccountId,
          isAutoGenerated: true
        };

        db.transactions.push(newTx);

        // Update account balances
        const account = db.accounts.find(a => a.id === rt.accountId);
        if (account) {
          if (rt.type === 'Income') account.balance += currentAmount;
          else if (rt.type === 'Expense') account.balance -= currentAmount;
          else if (rt.type === 'Transfer' && rt.category === 'Investments') {
            account.balance -= currentAmount;
          }
        }
        if (rt.type === 'Transfer' && rt.refAccountId) {
          const refAccount = db.accounts.find(a => a.id === rt.refAccountId);
          if (refAccount) refAccount.balance += currentAmount;
        }

        // Buy Investment Units if linked
        if (rt.targetAssetId) {
          const mf = db.mutualfunds.find(m => m.id === rt.targetAssetId);
          if (mf) {
            const buyNav = mf.currentNav || mf.averageNav || 10;
            const purchasedUnits = currentAmount / buyNav;
            const oldCost = mf.units * mf.averageNav;
            const newCost = oldCost + currentAmount;
            mf.units += purchasedUnits;
            mf.averageNav = mf.units > 0 ? newCost / mf.units : buyNav;
          }

          const stock = db.stocks.find(s => s.id === rt.targetAssetId);
          if (stock) {
            const buyPrice = stock.currentPrice || stock.averagePrice || 100;
            const purchasedQty = currentAmount / buyPrice;
            const oldCost = stock.quantity * stock.averagePrice;
            const newCost = oldCost + currentAmount;
            stock.quantity += purchasedQty;
            stock.averagePrice = stock.quantity > 0 ? newCost / stock.quantity : buyPrice;
          }
        }

        // Advance next due date
        if (rt.frequency === 'Monthly') {
          nextDue.setMonth(nextDue.getMonth() + 1);
        } else if (rt.frequency === 'Quarterly') {
          nextDue.setMonth(nextDue.getMonth() + 3);
        } else if (rt.frequency === 'Weekly') {
          nextDue.setDate(nextDue.getDate() + 7);
        }

        rt.nextDueDate = nextDue.toISOString().split('T')[0];
        changed = true;

        // Log audit log
        this.logAction('AUTOMATION', `Posted automated recurring transaction: ${rt.description} (₹${currentAmount})`);
      }
    }

    const dividendChanged = this.autoGenerateDividends(today);

    if (changed || dividendChanged) {
      await this.save();
    }
  }

  // --- Auto-Save Feature State Repositories ---

  public getTaxInputs(profileId: string): TaxViewInputs | null {
    if (!this.db) return null;
    return this.db.taxInputs?.[profileId] || null;
  }

  public async updateTaxInputs(profileId: string, inputs: TaxViewInputs): Promise<void> {
    if (!this.db) return;
    if (!this.db.taxInputs) this.db.taxInputs = {};
    this.db.taxInputs[profileId] = inputs;
    await this.save();
  }

  public getEmiInputs(profileId: string): EMICalculatorInputs | null {
    if (!this.db) return null;
    return this.db.emiInputs?.[profileId] || null;
  }

  public async updateEmiInputs(profileId: string, inputs: EMICalculatorInputs): Promise<void> {
    if (!this.db) return;
    if (!this.db.emiInputs) this.db.emiInputs = {};
    this.db.emiInputs[profileId] = inputs;
    await this.save();
  }

  public getBusinessDrafts(profileId: string): BusinessDrafts | null {
    if (!this.db) return null;
    return this.db.businessDrafts?.[profileId] || null;
  }

  public async updateBusinessDrafts(profileId: string, drafts: BusinessDrafts): Promise<void> {
    if (!this.db) return;
    if (!this.db.businessDrafts) this.db.businessDrafts = {};
    this.db.businessDrafts[profileId] = drafts;
    await this.save();
  }

  public getFireInputs(profileId: string): FireCalculatorInputs | null {
    if (!this.db) return null;
    return this.db.fireInputs?.[profileId] || null;
  }

  public async updateFireInputs(profileId: string, inputs: FireCalculatorInputs): Promise<void> {
    if (!this.db) return;
    if (!this.db.fireInputs) this.db.fireInputs = {};
    this.db.fireInputs[profileId] = inputs;
    await this.save();
  }

  public getChatHistory(profileId: string): AIChatMessage[] {
    if (!this.db) return [];
    return this.db.chatHistory?.[profileId] || [];
  }

  public async saveChatHistory(profileId: string, history: AIChatMessage[]): Promise<void> {
    if (!this.db) return;
    if (!this.db.chatHistory) this.db.chatHistory = {};
    this.db.chatHistory[profileId] = history;
    await this.save();
  }
}

export const dbService = new DatabaseService();
export default dbService;

