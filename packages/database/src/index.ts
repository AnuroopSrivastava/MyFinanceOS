import { authSession } from '@financeos/auth';
import { generateSalt } from '@financeos/shared';

import {
  UserProfile, BankAccount, Transaction, Budget, FixedDeposit,
  StockHolding, MutualFundHolding, GoldHolding, NPSHolding,
  ProvidentFundHolding, VendorCustomer, InventoryItem, BusinessInvoice,
  BusinessRegisterEntry, AuditLog, SystemSettings, RecurringTransaction,
  TDSSummary, InvestmentPlan, SavingsGoal, TaxViewInputs, EMICalculatorInputs,
  BusinessDrafts, FireCalculatorInputs, AIChatMessage,
  encryptData, decryptData
} from '@financeos/shared';

// --- Web Worker for Database Serialization and Encryption ---
let saveWorkerInstance: Worker | null = null;
let saveMsgId = 0;
const saveResolvers = new Map<number, { resolve: (val: string) => void, reject: (err: Error) => void }>();

const getSaveWorker = (): Worker | null => {
  if (typeof window === 'undefined' || !window.Worker) return null;
  if (saveWorkerInstance) return saveWorkerInstance;
  
  const workerCode = `
    const getSubtle = () => {
      if (typeof self !== 'undefined' && self.crypto) return self.crypto.subtle;
      throw new Error('Web Crypto API is not supported.');
    };
    const textEncode = (text) => new TextEncoder().encode(text);
    const textDecode = (buffer) => new TextDecoder().decode(buffer);
    const bufferToHex = (buffer) => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const hexToBuffer = (hex) => {
      const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
      const buffer = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) buffer[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
      return buffer.buffer;
    };
    const generateSalt = (bytes = 16) => {
      const array = new Uint8Array(bytes);
      self.crypto.getRandomValues(array);
      return bufferToHex(array.buffer);
    };
    const deriveKey = async (password, saltHex) => {
      const subtle = getSubtle();
      const passwordBuffer = textEncode(password);
      const saltBuffer = hexToBuffer(saltHex);
      const baseKey = await subtle.importKey('raw', passwordBuffer, { name: 'PBKDF2' }, false, ['deriveKey']);
      return await subtle.deriveKey({ name: 'PBKDF2', salt: saltBuffer, iterations: 100000, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    };
    const encrypt = async (plainText, key) => {
      const subtle = getSubtle();
      const ivArray = new Uint8Array(12);
      self.crypto.getRandomValues(ivArray);
      const encoded = textEncode(plainText);
      const encryptedBuffer = await subtle.encrypt({ name: 'AES-GCM', iv: ivArray }, key, encoded);
      return { ciphertext: bufferToHex(encryptedBuffer), iv: bufferToHex(ivArray.buffer) };
    };
    const encryptData = async (plainText, pin) => {
      const salt = generateSalt(16);
      const key = await deriveKey(pin, salt);
      const { ciphertext, iv } = await encrypt(plainText, key);
      return \`\${salt}:\${iv}:\${ciphertext}\`;
    };

    self.onmessage = async (e) => {
      try {
        const { msgId, db, pin } = e.data;
        const plainPayload = JSON.stringify(db);
        let storagePayload = plainPayload;
        if (pin) {
          storagePayload = await encryptData(plainPayload, pin);
        }
        self.postMessage({ msgId, success: true, storagePayload });
      } catch (err) {
        self.postMessage({ msgId, success: false, error: err instanceof Error ? err.message : String(err) });
      }
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  saveWorkerInstance = new Worker(URL.createObjectURL(blob));
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

const runWorkerSave = (db: any, pin: string | undefined): Promise<string> => {
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
}

class DatabaseService {
  private db: DatabaseSchema | null = null;
  private storageKey = 'financeos_db_cache';
  private driveFileId: string | null = null;
  private isSyncing = false;
  private lastSavedPayload: string | null = null;
  private cloudSyncTimer: any = null;
  private localSaveTimer: any = null;
  private activeProfileId: string | null = null;
  private subscribers: Array<() => void> = [];

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
      const pin = authSession.getUserProfile()?.pin;
      try {
        const decrypted = await decryptData(payload, pin || 'default-pin');
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

  public isInitialized(): boolean {
    return localStorage.getItem(this.storageKey) !== null || authSession.isAuthenticated();
  }

  // Google Drive REST API utilities
  private async fetchDriveFileId(): Promise<string | null> {
    if (this.driveFileId) return this.driveFileId;
    if (!authSession.isAuthenticated()) return null;
    const token = authSession.getAccessToken();
    const res = await fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name="financeos_db.json"', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      authSession.logout();
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      this.driveFileId = data.files[0].id;
      return this.driveFileId;
    }
    return null;
  }

  private async fetchFromDrive(): Promise<string | null> {
    const fileId = await this.fetchDriveFileId();
    if (!fileId) return null;
    const token = authSession.getAccessToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      authSession.logout();
      return null;
    }
    if (!res.ok) return null;
    return await res.text();
  }

  private async pushToDrive(payload: string): Promise<void> {
    if (!authSession.isAuthenticated()) {
      this.setSaveError(null);
      this.setUnsavedChanges(false);
      return;
    }
    try {
      const token = authSession.getAccessToken();
      const fileId = await this.fetchDriveFileId();

      if (!authSession.isAuthenticated()) {
        this.setSaveError('Cloud auth token expired. Local data is auto-saved on disk.');
        this.setUnsavedChanges(false);
        return;
      }

      if (fileId) {
        // Update existing file
        const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: payload
        });
        if (res.status === 401) {
          authSession.logout();
          this.setSaveError('Google Drive session expired (401). Local data is auto-saved on disk.');
          this.setUnsavedChanges(false);
          return;
        }
        if (!res.ok) throw new Error(`Cloud storage API HTTP ${res.status}`);
      } else {
        // Create new file in appDataFolder
        const metadata = {
          name: 'financeos_db.json',
          parents: ['appDataFolder']
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([payload], { type: 'application/json' }));

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
        if (res.status === 401) {
          authSession.logout();
          this.setSaveError('Google Drive session expired (401). Local data is auto-saved on disk.');
          this.setUnsavedChanges(false);
          return;
        }
        if (!res.ok) throw new Error(`Cloud storage API HTTP ${res.status}`);
        const data = await res.json();
        if (data.id) this.driveFileId = data.id;
      }

      // Clear unsaved changes flag and save error on successful upload
      this.setSaveError(null);
      this.setUnsavedChanges(false);
    } catch (err: any) {
      console.error('Push to Drive failed:', err);
      const is401 = err?.message?.includes('401');
      if (is401) {
        authSession.logout();
        this.setSaveError('Google session expired (401). Local data is auto-saved on disk.');
        this.setUnsavedChanges(false);
      } else {
        const errMsg = err?.message ? `Cloud backup failed: ${err.message}` : 'Google Drive sync failed';
        this.setSaveError(errMsg);
        this.setUnsavedChanges(true);
      }
      throw err;
    }
  }

  public async syncToCloud(): Promise<void> {
    if (this.cloudSyncTimer) {
      clearTimeout(this.cloudSyncTimer);
      this.cloudSyncTimer = null;
    }
    if (this.lastSavedPayload && authSession.isAuthenticated()) {
      await this.pushToDrive(this.lastSavedPayload);
    } else if (this.db) {
      await this.save();
    }
  }

  public async initializeNewDb(adminName: string): Promise<void> {
    const adminId = 'p1';
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
      settings, profiles, accounts: [], transactions: [], budgets: [], fds: [], stocks: [], mutualfunds: [], gold: [], nps: [], pf: [], contacts: [], inventory: [], invoices: [], register: [], auditLogs: [
        { id: 'log1', timestamp: new Date().toISOString(), userId: adminId, action: 'SETUP', details: 'Database initialized for user: ' + adminName }
      ], tdsRecords: []
    };
    await this.save();
  }

  public async unlock(): Promise<boolean> {
    if (!authSession.isAuthenticated()) return false;

    let dbPayload = null;
    try {
      dbPayload = await this.fetchFromDrive();
    } catch (e) {
      console.warn('Failed to fetch from Google Drive, falling back to local cache', e);
    }

    if (!dbPayload) {
      // 1. Try Desktop Local Backup (Atomic, Unlimited Size)
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        try {
          const res = await (window as any).electronAPI.loadDbBackup();
          if (res.success && res.payload) {
            dbPayload = res.payload;
          }
        } catch (e) {
          console.error('Failed to load Electron DB backup', e);
        }
      }
      
      // 2. Try Browser Local Storage (Volatile, 5MB Limit)
      if (!dbPayload) {
        dbPayload = localStorage.getItem(this.storageKey);
      }
    }

    if (dbPayload) {
      this.lastSavedPayload = dbPayload;
      let parsedDb: DatabaseSchema | null = null;

      // Handle Encryption / Migration
      if (dbPayload.includes(':') && dbPayload.split(':').length === 3) {
        // AES-GCM format
        const pin = authSession.getUserProfile()?.pin;
        try {
          const decrypted = await decryptData(dbPayload, pin || 'default-pin');
          if (!pin) {
            console.log('Migrating from default-pin encrypted vault to plaintext vault on next save.');
          }
          parsedDb = JSON.parse(decrypted);
        } catch (e) {
          console.error('Failed to decrypt database. Wrong PIN or corrupted.', e);
          return false;
        }
      } else {
        // Migration from plaintext JSON
        try {
          parsedDb = JSON.parse(dbPayload);
          console.log('Migrating plaintext database to ciphertext on next save.');
        } catch (e) {
          console.error('Failed to parse database JSON', e);
          return false;
        }
      }

      if (parsedDb) {
        // Ensure all arrays/objects are initialized to prevent undefined errors
        parsedDb.settings = parsedDb.settings || {
          theme: 'glass-cyan',
          currency: 'INR',
          backupSchedule: 'weekly',
          isCloudBackupEnabled: true
        };
        parsedDb.profiles = parsedDb.profiles || [];
        parsedDb.accounts = parsedDb.accounts || [];
        parsedDb.transactions = parsedDb.transactions || [];
        parsedDb.budgets = parsedDb.budgets || [];
        parsedDb.fds = parsedDb.fds || [];
        parsedDb.stocks = parsedDb.stocks || [];
        parsedDb.mutualfunds = parsedDb.mutualfunds || [];
        parsedDb.gold = parsedDb.gold || [];
        parsedDb.nps = parsedDb.nps || [];
        parsedDb.pf = parsedDb.pf || [];
        parsedDb.contacts = parsedDb.contacts || [];
        parsedDb.inventory = parsedDb.inventory || [];
        parsedDb.invoices = parsedDb.invoices || [];
        parsedDb.register = parsedDb.register || [];
        parsedDb.auditLogs = parsedDb.auditLogs || [];
        parsedDb.recurringTransactions = parsedDb.recurringTransactions || [];
        parsedDb.tdsRecords = parsedDb.tdsRecords || [];
        parsedDb.investmentPlans = parsedDb.investmentPlans || [];
        parsedDb.goals = parsedDb.goals || [];
        parsedDb.taxInputs = parsedDb.taxInputs || {};
        parsedDb.emiInputs = parsedDb.emiInputs || {};
        parsedDb.businessDrafts = parsedDb.businessDrafts || {};
        parsedDb.fireInputs = parsedDb.fireInputs || {};
        parsedDb.chatHistory = parsedDb.chatHistory || {};

        // Data Migration: Inject profileId into business records if missing
        const defaultProfileId = parsedDb.profiles?.[0]?.id || 'p_default';
        parsedDb.contacts.forEach(c => { if (!c.profileId) c.profileId = defaultProfileId; });
        parsedDb.inventory.forEach(i => { if (!i.profileId) i.profileId = defaultProfileId; });
        parsedDb.invoices.forEach(inv => { if (!inv.profileId) inv.profileId = defaultProfileId; });
        parsedDb.register.forEach(r => { if (!r.profileId) r.profileId = defaultProfileId; });

        this.db = parsedDb;
      }
    } else {
      const profile = authSession.getUserProfile();
      await this.initializeNewDb(profile?.name || 'Default User');
    }

    if (this.db && !this.db.recurringTransactions) {
      this.db.recurringTransactions = [];
    }

    await this.processRecurringTransactions();
    await this.save();

    this.logAction('LOGIN', 'User logged in and database unlocked successfully');
    return true;
  }

  public async save(): Promise<void> {
    if (!this.db) return;
    this.setUnsavedChanges(true); // Signal to UI that a save is pending

    if (this.localSaveTimer) clearTimeout(this.localSaveTimer);
    
    this.localSaveTimer = setTimeout(async () => {
      try {
        if (!this.db) return;

        const pin = authSession.getUserProfile()?.pin;
        let storagePayload = '';

        if (typeof window !== 'undefined' && window.Worker) {
          try {
            storagePayload = await runWorkerSave(this.db, pin);
          } catch (err) {
            console.error('Worker save failed, falling back to synchronous save', err);
            const plainPayload = JSON.stringify(this.db);
            storagePayload = plainPayload;
            if (pin) {
              try {
                storagePayload = await encryptData(plainPayload, pin);
              } catch (e) {
                console.error('Encryption failed, falling back to plaintext', e);
              }
            }
          }
        } else {
          const plainPayload = JSON.stringify(this.db);
          storagePayload = plainPayload;
          if (pin) {
            try {
              storagePayload = await encryptData(plainPayload, pin);
            } catch (e) {
              console.error('Encryption failed, falling back to plaintext', e);
            }
          }
        }
  
        this.lastSavedPayload = storagePayload;
  
        if (typeof window !== 'undefined') {
          // Instant local persistence (<1ms)
          try {
            localStorage.setItem(this.storageKey, storagePayload);
          } catch (e) {
            console.warn('Browser localStorage quota exceeded or unavailable. Falling back to other persistence mechanisms.', e);
          }
  
          let localDiskSuccess = true;
          // Save local backup if running inside Electron
          if ((window as any).electronAPI) {
            try {
              const res = await (window as any).electronAPI.saveDbBackup(storagePayload);
              if (!res.success) {
                localDiskSuccess = false;
                console.error('Electron local backup save returned error:', res.error);
              }
            } catch (err) {
              localDiskSuccess = false;
              console.error('Electron local backup save error:', err);
            }
          }
  
          if (!localDiskSuccess) {
            this.setSaveError('Critical: Local disk save failed. Please check permissions.');
            this.setUnsavedChanges(true);
          } else {
            // Local storage write succeeded - mark save as clean immediately
            this.setSaveError(null);
            this.setUnsavedChanges(false);
          }
  
          // Debounced background cloud sync to avoid network lag or API rate limits
          if (authSession.isAuthenticated()) {
            if (this.cloudSyncTimer) clearTimeout(this.cloudSyncTimer);
            this.cloudSyncTimer = setTimeout(() => {
              this.pushToDrive(storagePayload).catch((err: any) => {
                console.error('Cloud drive sync error:', err);
              });
            }, 800);
          }
        }
      } catch (e: any) {
        console.error('Failed to save database:', e);
        const errMsg = e?.message ? `Local storage save failed: ${e.message}` : 'Local database save failed';
        this.setSaveError(errMsg);
        this.setUnsavedChanges(true);
      }
    }, 300);
  }

  public async syncDatabaseState(): Promise<boolean> {
    if (!this.db || typeof window === 'undefined' || !authSession.isAuthenticated()) return false;
    // Don't overwrite local data with cloud data if we have pending local unsaved changes
    if (this.hasUnsavedChanges) return false;

    let payload = null;
    try {
      payload = await this.fetchFromDrive();
    } catch (e) {
      console.warn('Failed to fetch central db for sync', e);
    }

    if (payload && payload !== this.lastSavedPayload) {
      try {
        const remoteDb: DatabaseSchema = JSON.parse(payload);

        // Compare timestamps to avoid overwriting newer local data with stale cloud data
        const localLatest = (this.db && this.db.auditLogs && this.db.auditLogs.length > 0)
          ? new Date(this.db.auditLogs[0].timestamp).getTime()
          : 0;
        const remoteLatest = (remoteDb.auditLogs && remoteDb.auditLogs.length > 0)
          ? new Date(remoteDb.auditLogs[0].timestamp).getTime()
          : 0;

        if (remoteLatest > localLatest) {
          this.lastSavedPayload = payload;
          try {
            localStorage.setItem(this.storageKey, payload);
          } catch(e) {
            console.warn('Browser localStorage quota exceeded or unavailable. Falling back to other persistence mechanisms.', e);
          }
          this.db = remoteDb;
          this.notifySubscribers();
          return true; // We successfully updated the database from cloud
        } else if (remoteLatest < localLatest) {
          // If remote is older, our last push might have failed or hasn't propagated. 
          // We can optionally trigger a re-save here, but updating lastSavedPayload 
          // isn't strictly necessary as we want to keep trying to push the newer data.
        }
      } catch (e) {
        console.error('Failed to parse database during sync', e);
      }
    }
    return false; // No changes applied
  }

  public listenForSync(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => { };
    // Poll every 30 seconds for cloud sync
    const interval = setInterval(async () => {
      if (this.isSyncing) return;
      this.isSyncing = true;
      try {
        const didSync = await this.syncDatabaseState();
        if (didSync) {
          callback();
        }
      } finally {
        this.isSyncing = false;
      }
    }, 30000);
    return () => clearInterval(interval);
  }

  public lock(): void {
    authSession.logout();
    this.db = null;
    this.driveFileId = null;
  }

  // Log action to audit logs
  private logAction(action: string, details: string): void {
    if (!this.db) return;
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
    await this.save();
    return newProfile;
  }

  public async updateProfile(id: string, updates: Partial<UserProfile>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.profiles = this.db.profiles.map(p => p.id === id ? { ...p, ...updates } : p);
    this.logAction('PROFILE_UPDATE', `Updated profile ID ${id}`);
    await this.save();
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
    if (this.db.tdsRecords) this.db.tdsRecords = this.db.tdsRecords.filter(t => t.profileId !== id);
    if (this.db.taxInputs) delete this.db.taxInputs[id];
    if (this.db.emiInputs) delete this.db.emiInputs[id];
    if (this.db.businessDrafts) delete this.db.businessDrafts[id];
    if (this.db.fireInputs) delete this.db.fireInputs[id];
    if (this.db.chatHistory) delete this.db.chatHistory[id];

    this.logAction('PROFILE_DELETE', `Deleted profile ID ${id} and cascaded all associated personal data`);
    await this.save();
  }

  // Bank Accounts
  public getAccounts(): BankAccount[] {
    if (!this.db) throw new Error('Database is locked');
    if (this.activeProfileId) return this.db.accounts.filter(a => a.profileId === this.activeProfileId);
    return this.db.accounts;
  }

  public async addAccount(account: Omit<BankAccount, 'id'>): Promise<BankAccount> {
    if (!this.db) throw new Error('Database is locked');
    const newAccount: BankAccount = { ...account, id: 'a_' + generateSalt(6) };
    this.db.accounts.push(newAccount);

    // Adjust balance audit log
    this.logAction('ACCOUNT_ADD', `Added account ${account.name} at ${account.bankName}`);
    await this.save();
    return newAccount;
  }

  public async updateAccount(id: string, updates: Partial<BankAccount>): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.accounts = this.db.accounts.map(a => a.id === id ? { ...a, ...updates } : a);
    await this.save();
  }

  public async deleteAccount(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');
    this.db.accounts = this.db.accounts.filter(a => a.id !== id);
    this.db.transactions = this.db.transactions.filter(t => t.accountId !== id);
    await this.save();
  }

  // Transactions Ledger
  public getTransactions(): Transaction[] {
    if (!this.db) throw new Error('Database is locked');
    return (this.activeProfileId ? this.db.transactions.filter(x => x.profileId === this.activeProfileId) : [...this.db.transactions]).sort((a, b) => b.date.localeCompare(a.date));
  }

  public async addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    if (!this.db) throw new Error('Database is locked');
    const newTx: Transaction = { ...tx, id: 't_' + generateSalt(6) };
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

  // Seed sample demo data for new users
  public async seedSampleData(profileId: string): Promise<void> {
    if (!this.db) throw new Error('Database is locked');

    // Add sample accounts
    const acc1 = await this.addAccount({
      profileId, name: 'HDFC Salary Account', bankName: 'HDFC Bank',
      accountNumber: '501004829103', ifscCode: 'HDFC0001234', accountType: 'Savings', balance: 245000, nomineeName: 'Ananya Srivastava'
    });

    const acc2 = await this.addAccount({
      profileId, name: 'ICICI Savings', bankName: 'ICICI Bank',
      accountNumber: '000401582910', ifscCode: 'ICIC0000004', accountType: 'Savings', balance: 85000, nomineeName: 'Ananya Srivastava'
    });

    const acc3 = await this.addAccount({
      profileId, name: 'SBI Credit Card', bankName: 'SBI Card',
      accountNumber: '4312-XXXX-9102', ifscCode: 'N/A', accountType: 'CreditCard', balance: -18500
    });

    // Add sample transactions
    await this.addTransaction({
      profileId, accountId: acc1.id, date: '2026-07-01', description: 'Tech Payout - Monthly Salary',
      amount: 150000, type: 'Income', category: 'Salary'
    });

    await this.addTransaction({
      profileId, accountId: acc1.id, date: '2026-07-02', description: 'Apartment Rent Payout',
      amount: 28000, type: 'Expense', category: 'Rent'
    });

    await this.addTransaction({
      profileId, accountId: acc1.id, date: '2026-07-05', description: 'Swiggy Gourmet Delivery',
      amount: 2450, type: 'Expense', category: 'Food & Dining'
    });

    await this.addTransaction({
      profileId, accountId: acc1.id, date: '2026-07-10', description: 'Monthly Mutual Fund SIP',
      amount: 25000, type: 'Transfer', category: 'Investments'
    });

    await this.addTransaction({
      profileId, accountId: acc1.id, date: '2026-07-12', description: 'Airtel Broadband & Electricity',
      amount: 3200, type: 'Expense', category: 'Utilities'
    });

    // Add sample stocks
    await this.addStock({
      profileId, symbol: 'TCS', name: 'Tata Consultancy Services', quantity: 15,
      averagePrice: 3850, currentPrice: 4120, nomineeName: 'Ananya Srivastava'
    });

    await this.addStock({
      profileId, symbol: 'RELIANCE', name: 'Reliance Industries Ltd', quantity: 25,
      averagePrice: 2750, currentPrice: 3050, nomineeName: 'Ananya Srivastava'
    });

    // Add sample mutual funds
    await this.addMutualFund({
      profileId, schemeCode: '122639', schemeName: 'Parag Parikh Flexi Cap Fund - Direct Growth', units: 310,
      averageNav: 72.5, currentNav: 85.4, nomineeName: 'Ananya Srivastava'
    });

    // Add sample FDs
    await this.addFD({
      profileId, bankName: 'HDFC Bank', principalAmount: 200000,
      interestRate: 7.25, startDate: '2025-08-15', maturityDate: '2026-08-15', maturityAmount: 214950, isMatured: false
    });

    // Add sample Budgets
    await this.addBudget({
      profileId, category: 'Food & Dining', limitAmount: 15000, spentAmount: 2450, period: 'Monthly'
    });

    await this.addBudget({
      profileId, category: 'Rent', limitAmount: 30000, spentAmount: 28000, period: 'Monthly'
    });

    await this.addBudget({
      profileId, category: 'Utilities', limitAmount: 5000, spentAmount: 3200, period: 'Monthly'
    });

    this.logAction('SAMPLE_DATA_SEEDED', 'Populated sample financial dataset for testing.');
  }

  // Overwrite database from JSON import
  public async importRawDb(jsonString: string): Promise<boolean> {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.settings && imported.profiles && imported.accounts) {
        const db = imported as DatabaseSchema;
        if (!db.recurringTransactions) {
          db.recurringTransactions = [];
        }
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
  public getInvestmentPlans(): InvestmentPlan[] {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.investmentPlans) db.investmentPlans = [];
    return db.investmentPlans;
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
  public getGoals(): SavingsGoal[] {
    const db = this.db;
    if (!db) throw new Error('Database is locked');
    if (!db.goals) db.goals = [];
    return db.goals;
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
    const nowStr = '2026-07-16'; // Consistent current date
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
          refAccountId: rt.refAccountId
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

  public async syncLiveFeedTransaction(
    profileId: string,
    tx: Omit<Transaction, 'id' | 'profileId'>
  ): Promise<Transaction | null> {
    const db = this.db;
    if (!db) return null;

    const newTx: Transaction = {
      ...tx,
      id: 't_' + generateSalt(6),
      profileId
    };

    if (!db.transactions) db.transactions = [];
    db.transactions.push(newTx);

    // Update account balances
    const account = db.accounts.find(a => a.id === tx.accountId);
    if (account) {
      if (tx.type === 'Income') account.balance += tx.amount;
      else if (tx.type === 'Expense') account.balance -= tx.amount;
      else if (tx.type === 'Transfer' && tx.category === 'Investments') {
        account.balance -= tx.amount;
      }
    }

    if (tx.type === 'Transfer' && tx.refAccountId) {
      const refAccount = db.accounts.find(a => a.id === tx.refAccountId);
      if (refAccount) {
        refAccount.balance += tx.amount;
      }
    }

    // Save and log action
    this.logAction('AUTOMATION', `Live Feed Sync: ${tx.description} (₹${tx.amount})`);
    await this.save();
    return newTx;
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

