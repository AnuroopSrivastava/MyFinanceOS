import { authSession } from '@financeos/auth';
import { encrypt, decrypt, generateSalt, hashPin } from '@financeos/shared';

import {
  UserProfile, BankAccount, Transaction, Budget, FixedDeposit,
  StockHolding, MutualFundHolding, GoldHolding, NPSHolding,
  ProvidentFundHolding, VendorCustomer, InventoryItem, BusinessInvoice,
  BusinessRegisterEntry, AuditLog, SystemSettings, RecurringTransaction,
  TDSSummary, InvestmentPlan
} from '@financeos/shared';

// Interface defining the encrypted structure stored on disk
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
}

class DatabaseService {
  private db: DatabaseSchema | null = null;
  private storageKey = 'financeos_db_encrypted';
  private configKey = 'financeos_auth_config';
  private lastSavedPayload: string | null = null;

  // Check if system is initialized (i.e. pin config exists)
  public isInitialized(): boolean {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.configKey) !== null;
    }
    return false;
  }

  // Load auth config details (salt and verifier hash)
  public getAuthConfig(): { salt: string; verifier: string } | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(this.configKey);
      if (data) return JSON.parse(data);
    }
    return null;
  }

  // Save auth config details (on setup)
  public saveAuthConfig(salt: string, verifier: string): void {
    if (typeof window !== 'undefined') {
      const payload = JSON.stringify({ salt, verifier });
      localStorage.setItem(this.configKey, payload);
      
      const win = window as any;
      if (win.electronAPI && win.electronAPI.saveConfigBackup) {
          win.electronAPI.saveConfigBackup(payload).catch(console.warn);
      } else {
          fetch('/api/config', { method: 'POST', body: payload }).catch(console.warn);
      }
    }
  }

  // Synchronize configuration and database from the central filesystem to local storage
  public async syncFromFilesystem(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const win = window as any;
      
      // 1. Sync Config
      let configPayload: string | null = null;
      if (win.electronAPI && win.electronAPI.loadConfigBackup) {
        const res = await win.electronAPI.loadConfigBackup();
        if (res.success) configPayload = res.payload;
      } else {
        const res = await fetch('/api/config');
        if (res.ok) configPayload = await res.text();
      }

      if (configPayload) {
        localStorage.setItem(this.configKey, configPayload);
      }

      // 2. Sync DB
      let dbPayload: string | null = null;
      if (win.electronAPI && win.electronAPI.loadDbBackup) {
        const res = await win.electronAPI.loadDbBackup();
        if (res.success) dbPayload = res.payload;
      } else {
        const res = await fetch('/api/db');
        if (res.ok) dbPayload = await res.text();
      }

      if (dbPayload) {
        localStorage.setItem(this.storageKey, dbPayload);
      }
    } catch (e) {
      console.warn('Failed to sync from filesystem', e);
    }
  }

  // Core setup: creates first user profile and seeds mock data
  public async initializeNewDb(pin: string, adminName: string): Promise<void> {
    const { salt, verifier } = await authSession.setupPin(pin);
    this.saveAuthConfig(salt, verifier);

    // Create seed schema
    const adminId = 'p1';
    const settings: SystemSettings = {
      theme: 'glass-cyan',
      currency: 'INR',
      backupSchedule: 'weekly',
      isCloudBackupEnabled: false
    };

    const profiles: UserProfile[] = [
      { id: adminId, name: adminName, role: 'Admin', relationship: 'Self', isNomineeProvided: true }
    ];

    this.db = {
      settings,
      profiles,
      accounts: [],
      transactions: [],
      budgets: [],
      fds: [],
      stocks: [],
      mutualfunds: [],
      gold: [],
      nps: [],
      pf: [],
      contacts: [],
      inventory: [],
      invoices: [],
      register: [],
      auditLogs: [
        { id: 'log1', timestamp: new Date().toISOString(), userId: adminId, action: 'SETUP', details: 'Database initialized empty for user: ' + adminName }
      ],
      tdsRecords: []
    };

    await this.save();
  }

  // Unlock and load database
  public async unlock(pin: string): Promise<boolean> {
    const config = this.getAuthConfig();
    if (!config) return false;

    const success = await authSession.login(pin, config.salt, config.verifier);
    if (!success) return false;

    // Ensure the config is pushed to the filesystem for cross-platform sync
    if (typeof window !== 'undefined') {
        const win = window as any;
        const configStr = localStorage.getItem(this.configKey);
        if (configStr) {
            if (win.electronAPI && win.electronAPI.saveConfigBackup) {
                win.electronAPI.saveConfigBackup(configStr).catch(console.warn);
            } else {
                fetch('/api/config', { method: 'POST', body: configStr }).catch(console.warn);
            }
        }
    }

    // Load encrypted string
    if (typeof window !== 'undefined') {
      const win = window as any;
      let encryptedString: string | null = null;
      
      try {
        if (win.electronAPI && win.electronAPI.loadDbBackup) {
          const res = await win.electronAPI.loadDbBackup();
          if (res.success) {
            encryptedString = res.payload;
          }
        } else {
          const res = await fetch('/api/db');
          if (res.ok) {
            encryptedString = await res.text();
          }
        }
      } catch (e) {
        console.warn('Failed to fetch central db', e);
      }

      if (!encryptedString) {
        encryptedString = localStorage.getItem(this.storageKey);
      }

      if (encryptedString) {
        localStorage.setItem(this.storageKey, encryptedString);
        try {
          const key = authSession.getActiveKey();
          const parts = encryptedString.split(':');
          if (parts.length === 2) {
            const decryptedJson = await decrypt(parts[1], parts[0], key);
            this.db = JSON.parse(decryptedJson);
          } else {
            // Unencrypted fallback (first run debug)
            this.db = JSON.parse(encryptedString);
          }
        } catch (e) {
          console.error('Failed to decrypt database. Incorrect session key derivation.', e);
          return false;
        }
      } else {
        // Create blank DB if not present
        await this.initializeNewDb(pin, 'Default User');
      }
    }

    // Ensure recurring transactions list is initialized
    if (this.db && !this.db.recurringTransactions) {
      this.db.recurringTransactions = [];
    }

    // Process due recurring transactions automatically
    await this.processRecurringTransactions();

    // Push the current local storage data to the filesystem as the authoritative source
    await this.save();

    this.logAction('LOGIN', 'User logged in and database unlocked successfully');
    return true;
  }

  // Encrypt and persist database
  public async save(): Promise<void> {
    if (!this.db) return;
    try {
      const key = authSession.getActiveKey();
      const rawJson = JSON.stringify(this.db);
      const { ciphertext, iv } = await encrypt(rawJson, key);
      const payload = `${iv}:${ciphertext}`;
      this.lastSavedPayload = payload;

      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, payload);

        // Expose to native desktop Electron wrapper if window.electronAPI exists
        const win = window as any;
        if (win.electronAPI && win.electronAPI.saveDbBackup) {
          await win.electronAPI.saveDbBackup(payload);
        } else {
          try {
            await fetch('/api/db', { method: 'POST', body: payload });
          } catch (e) {
            console.warn('Failed to sync to local API backend');
          }
        }
      }
    } catch (e) {
      console.error('Failed to encrypt and save database', e);
    }
  }

  // --- Real-Time Sync ---
  public async syncDatabaseState(): Promise<void> {
    if (!this.db || typeof window === 'undefined') return;
    const win = window as any;
    let encryptedString: string | null = null;
    
    try {
      if (win.electronAPI && win.electronAPI.loadDbBackup) {
        const res = await win.electronAPI.loadDbBackup();
        if (res.success) encryptedString = res.payload;
      } else {
        const res = await fetch('/api/db');
        if (res.ok) encryptedString = await res.text();
      }
    } catch (e) {
      console.warn('Failed to fetch central db for sync', e);
    }

    if (encryptedString && encryptedString !== this.lastSavedPayload) {
      this.lastSavedPayload = encryptedString;
      localStorage.setItem(this.storageKey, encryptedString);
      try {
        const key = authSession.getActiveKey();
        if (key) {
          const parts = encryptedString.split(':');
          if (parts.length === 2) {
            const decryptedJson = await decrypt(parts[1], parts[0], key);
            this.db = JSON.parse(decryptedJson);
          } else {
            this.db = JSON.parse(encryptedString);
          }
        }
      } catch (e) {
        console.error('Failed to decrypt database during sync', e);
      }
    }
  }

  private isSyncing = false;

  public listenForSync(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const win = window as any;
    let cleanup = () => {};

    const handleSync = async () => {
      if (this.isSyncing) return;
      this.isSyncing = true;
      try {
        await this.syncDatabaseState();
        callback();
      } finally {
        this.isSyncing = false;
      }
    };

    if (win.electronAPI && win.electronAPI.onExternalChange) {
      cleanup = win.electronAPI.onExternalChange(() => {
        handleSync();
      });
    } else {
      const evtSource = new EventSource('/api/sync-stream');
      evtSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'db_changed') handleSync();
        } catch(err) { /* ignore */ }
      };
      cleanup = () => {
        evtSource.close();
      };
    }
    return cleanup;
  }


  // Lock database session
  public lock(): void {
    authSession.logout();
    this.db = null;
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
    this.db.accounts = this.db.accounts.filter(a => a.profileId !== id);
    this.db.transactions = this.db.transactions.filter(t => t.profileId !== id);
    this.db.budgets = this.db.budgets.filter(b => b.profileId !== id);
    this.db.fds = this.db.fds.filter(f => f.profileId !== id);
    this.db.stocks = this.db.stocks.filter(s => s.profileId !== id);
    this.db.mutualfunds = this.db.mutualfunds.filter(m => m.profileId !== id);
    this.db.gold = this.db.gold.filter(g => g.profileId !== id);
    this.db.nps = this.db.nps.filter(n => n.profileId !== id);
    this.db.pf = this.db.pf.filter(p => p.profileId !== id);
    if (this.db.recurringTransactions) {
      this.db.recurringTransactions = this.db.recurringTransactions.filter(r => r.profileId !== id);
    }

    this.logAction('PROFILE_DELETE', `Deleted profile ID ${id} and all associated personal data`);
    await this.save();
  }

  // Bank Accounts
  public getAccounts(): BankAccount[] {
    if (!this.db) throw new Error('Database is locked');
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
    return this.db.transactions.sort((a, b) => b.date.localeCompare(a.date));
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
      else if (tx.type === 'Transfer' && tx.category === 'Investments') {
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
        else if (tx.type === 'Transfer' && tx.category === 'Investments') {
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
    return this.db.budgets;
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
    return this.db.fds;
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
    return this.db.stocks;
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
    return this.db.mutualfunds;
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
    return this.db.gold;
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
    return this.db.nps;
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
    return this.db.pf;
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
    return this.db.contacts;
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
    return this.db.inventory;
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
    return this.db.invoices;
  }

  public async addInvoice(invoice: Omit<BusinessInvoice, 'id'>): Promise<BusinessInvoice> {
    if (!this.db) throw new Error('Database is locked');
    const newInvoice: BusinessInvoice = { ...invoice, id: 'inv_' + generateSalt(6) };
    this.db.invoices.push(newInvoice);

    // Log to register
    const reg: Omit<BusinessRegisterEntry, 'id'> = {
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
    return this.db.register.sort((a, b) => b.date.localeCompare(a.date));
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
}

export const dbService = new DatabaseService();
export default dbService;
