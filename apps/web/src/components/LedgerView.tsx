import React, { useState, useMemo, useEffect } from 'react';
import { dbService } from '@financeos/database';
import { BankAccount, Transaction, AccountType, RecurringTransaction } from '@financeos/shared';
import { GlobalDateRange, filterByDateRange } from '../utils/dateFilter.js';
import {
  Plus, Upload, Download, Landmark, Search, Trash2, CreditCard,
  HelpCircle, AlertCircle, RefreshCw, Edit2
} from 'lucide-react';
import { formatRupee } from '../utils/currency.js';
import { CurrencyInput } from './ui/CurrencyInput.js';

interface ParsedTx {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense' | 'Transfer';
  category: string;
  selected: boolean;
}

const parseStatementText = (text: string): ParsedTx[] => {
  const lines = text.split('\n');
  const results: ParsedTx[] = [];
  const dateRegex = /(\d{4}-\d{2}-\d{2})|(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{1,2}[/-][A-Za-z]{3}[/-]\d{2,4})/;

  const getCategory = (desc: string): string => {
    const d = desc.toLowerCase();
    if (d.includes('swiggy') || d.includes('zomato') || d.includes('restaurant') || d.includes('starbucks') || d.includes('food') || d.includes('dining')) {
      return 'Food & Dining';
    }
    if (d.includes('salary') || d.includes('google') || d.includes('credit') || d.includes('payout')) {
      return 'Salary';
    }
    if (d.includes('sip') || d.includes('mutual fund') || d.includes('zerodha') || d.includes('nifty') || d.includes('groww') || d.includes('investment')) {
      return 'Investments';
    }
    if (d.includes('airtel') || d.includes('broadband') || d.includes('power') || d.includes('electricity') || d.includes('bill') || d.includes('recharge') || d.includes('mobile')) {
      return 'Utilities';
    }
    if (d.includes('uber') || d.includes('ola') || d.includes('taxi') || d.includes('cab') || d.includes('transportation') || d.includes('metro') || d.includes('fuel')) {
      return 'Transportation';
    }
    if (d.includes('cred') || d.includes('cc payment') || d.includes('credit card bill')) {
      return 'CreditCard Dues';
    }
    if (d.includes('rent') || d.includes('landlord')) {
      return 'Rent';
    }
    if (d.includes('gst') || d.includes('business') || d.includes('sales')) {
      return 'Business Sales';
    }
    return 'Miscellaneous';
  };

  const cleanDescription = (desc: string): string => {
    let clean = desc.trim();
    if (clean.includes('UPI/')) {
      const parts = clean.split('/');
      const merchantPart = parts.find(p => p.trim().length > 3 && !/^\d+$/.test(p) && !p.toLowerCase().includes('upi') && !p.toLowerCase().includes('hdfc') && !p.toLowerCase().includes('icici') && !p.toLowerCase().includes('sbi'));
      if (merchantPart) clean = merchantPart.trim();
    } else if (clean.startsWith('UPI-')) {
      const parts = clean.split('-');
      const merchantPart = parts.find(p => p.trim().length > 3 && !p.toLowerCase().includes('upi') && !p.toLowerCase().includes('icici') && !p.toLowerCase().includes('sbi'));
      if (merchantPart) clean = merchantPart.trim();
    }
    return clean.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase());
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const dateMatch = trimmed.match(dateRegex);
    if (!dateMatch) return;

    const rawDate = dateMatch[0];
    let normalizedDate = new Date().toISOString().split('T')[0];
    try {
      if (/[A-Za-z]{3}/.test(rawDate)) {
        const parts = rawDate.split(/[/-]/);
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const day = parseInt(parts[0]);
        const monthIdx = months.indexOf(parts[1].toLowerCase().slice(0, 3));
        let year = parseInt(parts[2]);
        if (year < 100) year += 2000;
        if (monthIdx !== -1) {
          normalizedDate = new Date(year, monthIdx, day + 1).toISOString().split('T')[0];
        }
      } else {
        const parts = rawDate.split(/[/-]/);
        if (parts[0].length === 4) {
          normalizedDate = rawDate;
        } else {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          let year = parseInt(parts[2]);
          if (year < 100) year += 2000;
          normalizedDate = new Date(year, month, day + 1).toISOString().split('T')[0];
        }
      }
    } catch (e) {
      normalizedDate = rawDate;
    }

    const cleanLine = trimmed.replace(rawDate, '');
    const tokens = cleanLine.split(/[\t,|]/).map(t => t.trim()).filter(Boolean);

    const amounts: number[] = [];
    let desc = '';

    tokens.forEach(t => {
      const numClean = t.replace(/,/g, '');
      const numMatch = numClean.match(/^[-+]?\d+(\.\d+)?$/);
      if (numMatch) {
        amounts.push(parseFloat(numClean));
      } else if (t.length > 2 && !t.match(/^\d+$/)) {
        desc += ' ' + t;
      }
    });

    if (amounts.length > 0) {
      let finalAmt = amounts[0];
      let type: 'Income' | 'Expense' | 'Transfer' = 'Expense';

      if (amounts.length >= 2) {
        const withdrawal = amounts[0];
        const deposit = amounts[1];
        if (withdrawal > 0 && deposit === 0) {
          finalAmt = withdrawal;
          type = 'Expense';
        } else if (deposit > 0 && withdrawal === 0) {
          finalAmt = deposit;
          type = 'Income';
        }
      } else {
        if (finalAmt < 0) {
          finalAmt = Math.abs(finalAmt);
          type = 'Expense';
        } else {
          type = 'Income';
        }
      }

      const lowercaseDesc = desc.toLowerCase();
      if (lowercaseDesc.includes('cred') || lowercaseDesc.includes('cc bill') || lowercaseDesc.includes('transfer') || lowercaseDesc.includes('sip')) {
        type = 'Transfer';
      }

      const finalDesc = cleanDescription(desc);
      results.push({
        id: `parsed_${idx}_${Date.now()}`,
        date: normalizedDate,
        description: finalDesc,
        amount: finalAmt,
        type,
        category: getCategory(finalDesc),
        selected: true
      });
    }
  });

  return results;
};

interface LedgerViewProps {
  dateRange: import('../utils/dateFilter.js').GlobalDateRange;

  activeProfileId: string;
}

export const LedgerView: React.FC<LedgerViewProps> = ({ activeProfileId, dateRange }) => {
  // DB States
  const [accounts, setAccounts] = useState<BankAccount[]>(() => dbService.getAccounts().filter(a => a.profileId === activeProfileId));
  const [transactions, setTransactions] = useState<Transaction[]>(() => dbService.getTransactions().filter(t => t.profileId === activeProfileId));
  const [recurringTxs, setRecurringTxs] = useState<RecurringTransaction[]>(() => dbService.getRecurringTransactions().filter(r => r.profileId === activeProfileId));
  const [stocks, setStocks] = useState(() => dbService.getStocks().filter(s => s.profileId === activeProfileId));
  const [mfs, setMfs] = useState(() => dbService.getMutualFunds().filter(m => m.profileId === activeProfileId));
  const [searchQuery, setSearchQuery] = useState('');
  const filteredTransactions = React.useMemo(() => filterByDateRange(transactions, dateRange, t => t.date), [transactions, dateRange]);

  // Modals / Add States
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);

  // Form: Recurring Scheduler
  const [recDesc, setRecDesc] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recType, setRecType] = useState<'Income' | 'Expense' | 'Transfer'>('Expense');
  const [recCategory, setRecCategory] = useState('Investments');
  const [recAccount, setRecAccount] = useState('');
  const [recRefAccount, setRecRefAccount] = useState('');
  const [recFrequency, setRecFrequency] = useState<'Weekly' | 'Monthly' | 'Quarterly'>('Monthly');
  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [recStepUpPct, setRecStepUpPct] = useState('');
  const [recTargetAssetId, setRecTargetAssetId] = useState('');

  // Statement Upload & Review States
  const [parsedReviewTxs, setParsedReviewTxs] = useState<ParsedTx[]>([]);
  const [statementAccount, setStatementAccount] = useState('');

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const accId = recAccount || accounts[0]?.id;
    if (!accId || !recDesc || !recAmount) return;

    await dbService.addRecurringTransaction({
      profileId: activeProfileId,
      description: recDesc,
      amount: parseFloat(recAmount),
      type: recType,
      category: recCategory,
      accountId: accId,
      refAccountId: recType === 'Transfer' ? recRefAccount : undefined,
      frequency: recFrequency,
      nextDueDate: recStartDate, // Backfill processes starting from startDate
      startDate: recStartDate,
      stepUpPct: parseFloat(recStepUpPct) || undefined,
      targetAssetId: recTargetAssetId || undefined,
      isActive: true
    });

    // Reset Form
    setRecDesc('');
    setRecAmount('');
    setRecStepUpPct('');
    setRecTargetAssetId('');
    setRecStartDate(new Date().toISOString().split('T')[0]);
    setShowAddRecurring(false);
    refreshData();
  };

  const handleDeleteRecurring = async (id: string) => {
    if (confirm('Are you sure you want to stop this automated recurring transaction scheduler?')) {
      await dbService.deleteRecurringTransaction(id);
      refreshData();
    }
  };

  // Form: Account
  const [newAccName, setNewAccName] = useState('');
  const [newAccBank, setNewAccBank] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('Savings');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccNominee, setNewAccNominee] = useState('');

  // Form: Edit Account
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [editAccId, setEditAccId] = useState('');
  const [editAccName, setEditAccName] = useState('');
  const [editAccBank, setEditAccBank] = useState('');
  const [editAccNumber, setEditAccNumber] = useState('');
  const [editAccType, setEditAccType] = useState<AccountType>('Savings');
  const [editAccBalance, setEditAccBalance] = useState('');
  const [editAccNominee, setEditAccNominee] = useState('');

  // Form: Transaction
  const [newTxAccount, setNewTxAccount] = useState('');
  const [newTxDate, setNewTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTxDesc, setNewTxDesc] = useState('');
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxType, setNewTxType] = useState<'Income' | 'Expense' | 'Transfer'>('Expense');
  const [newTxCategory, setNewTxCategory] = useState('Food & Dining');
  const [newTxRefAcc, setNewTxRefAcc] = useState('');

  // CSV Import State
  const [csvContent, setCsvContent] = useState('');
  const [importStatus, setImportStatus] = useState('');

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    return transactions.filter(t =>
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  const refreshData = () => {
    setAccounts(dbService.getAccounts().filter(a => a.profileId === activeProfileId));
    setTransactions(dbService.getTransactions().filter(t => t.profileId === activeProfileId));
    setRecurringTxs(dbService.getRecurringTransactions().filter(r => r.profileId === activeProfileId));
    setStocks(dbService.getStocks().filter(s => s.profileId === activeProfileId));
    setMfs(dbService.getMutualFunds().filter(m => m.profileId === activeProfileId));
  };

  useEffect(() => {
    refreshData();
  }, [activeProfileId]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccBank) return;

    await dbService.addAccount({
      profileId: activeProfileId,
      name: newAccName,
      bankName: newAccBank,
      accountNumber: newAccNumber || 'N/A',
      ifscCode: 'N/A',
      accountType: newAccType,
      balance: parseFloat(newAccBalance) || 0,
      nomineeName: newAccNominee || undefined
    });

    // Reset Form
    setNewAccName('');
    setNewAccBank('');
    setNewAccNumber('');
    setNewAccBalance('');
    setNewAccNominee('');
    setShowAddAccount(false);
    refreshData();
  };

  const handleEditAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccName || !editAccBank) return;

    await dbService.updateAccount(editAccId, {
      name: editAccName,
      bankName: editAccBank,
      accountNumber: editAccNumber || 'N/A',
      accountType: editAccType,
      balance: parseFloat(editAccBalance) || 0,
      nomineeName: editAccNominee || undefined
    });

    setShowEditAccount(false);
    refreshData();
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm('Are you sure you want to completely remove this bank account? This will also remove ALL associated transactions.')) {
      await dbService.deleteAccount(id);
      refreshData();
    }
  };

  const openEditAccount = (acc: BankAccount) => {
    setEditAccId(acc.id);
    setEditAccName(acc.name);
    setEditAccBank(acc.bankName);
    setEditAccNumber(acc.accountNumber);
    setEditAccType(acc.accountType);
    setEditAccBalance(acc.balance.toString());
    setEditAccNominee(acc.nomineeName || '');
    setShowEditAccount(true);
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const accId = newTxAccount || accounts[0]?.id;
    if (!accId || !newTxDesc || !newTxAmount) return;

    await dbService.addTransaction({
      accountId: accId,
      profileId: activeProfileId,
      date: newTxDate,
      description: newTxDesc,
      amount: parseFloat(newTxAmount),
      type: newTxType,
      category: newTxCategory,
      refAccountId: newTxType === 'Transfer' ? newTxRefAcc : undefined
    });

    // Reset Form
    setNewTxDesc('');
    setNewTxAmount('');
    setShowAddTx(false);
    refreshData();
  };

  const handleDeleteTx = async (id: string) => {
    if (confirm('Delete this transaction? This will automatically reverse the account balance update.')) {
      await dbService.deleteTransaction(id);
      refreshData();
    }
  };

  // CSV Statement Parser & File Loader
  const handleCSVImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) return;
    const parsed = parseStatementText(csvContent);
    if (parsed.length === 0) {
      setImportStatus('No valid transactions found in statement. Please verify the format.');
      return;
    }
    setParsedReviewTxs(parsed);
    setStatementAccount(accounts[0]?.id || '');
    setCsvContent('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseStatementText(text);
      if (parsed.length === 0) {
        setImportStatus('Could not extract transactions from file. Please check structure.');
        return;
      }
      setParsedReviewTxs(parsed);
      setStatementAccount(accounts[0]?.id || '');
    };
    reader.readAsText(file);
  };

  const handleImportVerified = async () => {
    const selected = parsedReviewTxs.filter(t => t.selected);
    if (selected.length === 0 || !statementAccount) return;

    let importedCount = 0;
    for (const tx of selected) {
      // Duplicate detection checks (same date, amount, description in past logs)
      const isDup = transactions.some(t =>
        t.date === tx.date &&
        t.amount === tx.amount &&
        t.description.toLowerCase() === tx.description.toLowerCase()
      );
      if (isDup) continue;

      await dbService.addTransaction({
        accountId: statementAccount,
        profileId: activeProfileId,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        category: tx.category
      });
      importedCount++;
    }

    setImportStatus(`Successfully parsed and imported ${importedCount} transactions.`);
    setParsedReviewTxs([]);
    refreshData();
  };

  // Export to CSV/Excel format
  const exportLedgerToCSV = () => {
    let csv = 'Date,Account,Description,Category,Type,Amount (INR)\n';
    transactions.forEach(t => {
      const acc = accounts.find(a => a.id === t.accountId)?.name || 'Unknown';
      csv += `"${t.date}","${acc}","${t.description}","${t.category}","${t.type}",${t.amount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `financeos_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Banking & Double-Entry Ledger</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Manage personal accounts, journal records, and statement syncs</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={exportLedgerToCSV}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddTx(true)}>
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Grid: Left - Accounts List, Right - Statement Import */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }} className="responsive-stack">

        {/* Accounts Overview */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Linked Accounts</h3>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setShowAddAccount(true)}>
              <Plus size={14} /> Add Account
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {accounts.map(acc => (
              <div key={acc.id} className="glass-panel" style={{
                padding: '1rem', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{acc.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.bankName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button onClick={() => openEditAccount(acc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-1)' }} title="Edit Account">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteAccount(acc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }} title="Delete Account">
                      <Trash2 size={14} />
                    </button>
                    {acc.accountType === 'CreditCard' ? <CreditCard size={18} color="var(--accent-1)" style={{ marginLeft: '0.2rem' }} /> : <Landmark size={18} color="var(--accent-2)" style={{ marginLeft: '0.2rem' }} />}
                  </div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.4rem 0' }}>
                  {formatRupee(acc.balance)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>{acc.accountNumber}</span>
                  {acc.nomineeName && <span style={{ color: 'var(--success)' }}>✓ Nominee</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>



          {/* Automated Bills & SIPs Scheduler */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RefreshCw size={16} color="var(--accent-2)" /> Automated SIPs & Bills
              </h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }} onClick={() => setShowAddRecurring(true)}>
                + Scheduler
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Autocommitted recurring transactions. Posted automatically on due date.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '180px', overflowY: 'auto' }}>
              {recurringTxs.map(rt => {
                const accName = accounts.find(a => a.id === rt.accountId)?.name || 'Account';
                return (
                  <div key={rt.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)', fontSize: '0.8rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{rt.description}</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {rt.frequency} ({accName}) • Next: {rt.nextDueDate}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 650, color: rt.type === 'Income' ? 'var(--success)' : 'var(--text-primary)' }}>
                        {rt.type === 'Income' ? '+' : '-'}{formatRupee(rt.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteRecurring(rt.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0.1rem' }}
                        title="Delete Scheduler"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {recurringTxs.length === 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No active recurring schedules configured.
                </div>
              )}
            </div>
          </div>

          {/* Statement Import (CSV / manual copy-paste) */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Upload size={16} color="var(--accent-1)" /> Statement Smart-Import
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Upload statement files or paste logs to automatically extract, categorize, and verify entries.
            </p>

            <form onSubmit={handleCSVImport}>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Upload Statement File (.csv, .txt)</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  style={{
                    fontSize: '0.75rem', width: '100%', padding: '0.4rem',
                    background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                />
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.4rem 0' }}>— OR —</div>
              <textarea
                className="form-input"
                style={{ height: '70px', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '0.5rem' }}
                placeholder="Paste statement text here...&#10;15-Jul-2026 Swiggy Delivery -720&#10;16-Jul-2026 Salary Credit +150000"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}>
                Analyze Statement Text
              </button>
            </form>

            {importStatus && (
              <div style={{
                marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', color: 'var(--accent-1)', display: 'flex', gap: '0.25rem'
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{importStatus}</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Main Journal Transactions Table */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Ledger Journal Log</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.2rem', width: '220px', padding: '0.45rem 2.2rem' }}
              placeholder="Search description/tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Account</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.length > 0 ? (
                filteredTxs.map(tx => {
                  const accName = accounts.find(a => a.id === tx.accountId)?.name || 'External';
                  return (
                    <tr key={tx.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{tx.date}</td>
                      <td>{accName}</td>
                      <td>
                        <div>{tx.description}</div>
                        {tx.tag && <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.3rem', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>{tx.tag}</span>}
                      </td>
                      <td>{tx.category}</td>
                      <td>
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px',
                          color: tx.type === 'Income' ? 'var(--success)' : tx.type === 'Expense' ? 'var(--error)' : 'var(--accent-2)',
                          background: tx.type === 'Income' ? 'var(--success-bg)' : tx.type === 'Expense' ? 'var(--error-bg)' : 'rgba(3,105,161,0.15)'
                        }}>{tx.type}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatRupee(tx.amount)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-danger" style={{ padding: '0.3rem', borderRadius: '4px' }} onClick={() => handleDeleteTx(tx.id)}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No matching ledger records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog: Add Account */}
      {showAddAccount && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Link New Account</h3>
            <form onSubmit={handleAddAccount}>
              <div className="form-group">
                <label className="form-label">Account Label Name</label>
                <input type="text" className="form-input" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} placeholder="e.g. HDFC Salary account" required />
              </div>
              <div className="form-group">
                <label className="form-label">Bank Institution</label>
                <input type="text" className="form-input" value={newAccBank} onChange={(e) => setNewAccBank(e.target.value)} placeholder="e.g. HDFC Bank" required />
              </div>
              <div className="form-group">
                <label className="form-label">Account Number (Encrypted on disk)</label>
                <input type="text" className="form-input" value={newAccNumber} onChange={(e) => setNewAccNumber(e.target.value)} placeholder="e.g. 501004829103" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <select value={newAccType} onChange={(e) => setNewAccType(e.target.value as AccountType)}>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="CreditCard">Credit Card</option>
                    <option value="Cash">Cash in Hand</option>
                    <option value="Loan">Loan/Debt</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Opening Balance</label>
                  <CurrencyInput className="form-input" value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Designated Nominee Name</label>
                <input type="text" className="form-input" value={newAccNominee} onChange={(e) => setNewAccNominee(e.target.value)} placeholder="Nominee full name" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddAccount(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Link Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Edit Account */}
      {showEditAccount && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Edit Bank Account</h3>
            <form onSubmit={handleEditAccountSubmit}>
              <div className="form-group">
                <label className="form-label">Account Nickname</label>
                <input type="text" className="form-input" value={editAccName} onChange={(e) => setEditAccName(e.target.value)} placeholder="e.g. Primary Savings" required />
              </div>
              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input type="text" className="form-input" value={editAccBank} onChange={(e) => setEditAccBank(e.target.value)} placeholder="e.g. HDFC Bank" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <select className="form-input" value={editAccType} onChange={(e) => setEditAccType(e.target.value as AccountType)}>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="CreditCard">Credit Card</option>
                    <option value="Wallet">Digital Wallet</option>
                    <option value="Loan">Loan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Current Balance (₹)</label>
                  <CurrencyInput className="form-input" value={editAccBalance} onChange={(e) => setEditAccBalance(e.target.value)} placeholder="0.00" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Account Number (Optional)</label>
                <input type="text" className="form-input" value={editAccNumber} onChange={(e) => setEditAccNumber(e.target.value)} placeholder="XXXX1234" />
              </div>
              <div className="form-group">
                <label className="form-label">Nominee Name (Optional)</label>
                <input type="text" className="form-input" value={editAccNominee} onChange={(e) => setEditAccNominee(e.target.value)} placeholder="Registered nominee" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditAccount(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Add Transaction */}
      {showAddTx && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Log Ledger Entry</h3>
            <form onSubmit={handleAddTx}>
              <div className="form-group">
                <label className="form-label">Source Account</label>
                <select value={newTxAccount} onChange={(e) => setNewTxAccount(e.target.value)}>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatRupee(a.balance)})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Transaction Type</label>
                  <select value={newTxType} onChange={(e) => setNewTxType(e.target.value as any)}>
                    <option value="Expense">Expense (-)</option>
                    <option value="Income">Income (+)</option>
                    <option value="Transfer">Transfer (⇅)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Transaction Amount</label>
                  <CurrencyInput className="form-input" value={newTxAmount} onChange={(e) => setNewTxAmount(e.target.value)} placeholder="0.00" required />
                </div>
              </div>

              {newTxType === 'Transfer' && (
                <div className="form-group">
                  <label className="form-label">Destination Account</label>
                  <select value={newTxRefAcc} onChange={(e) => setNewTxRefAcc(e.target.value)}>
                    <option value="">-- Choose Account --</option>
                    {accounts.filter(a => a.id !== newTxAccount).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={newTxDate} onChange={(e) => setNewTxDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={newTxCategory} onChange={(e) => setNewTxCategory(e.target.value)}>
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Salary">Salary</option>
                  <option value="Investments">Investments</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Business Sales">Business Sales</option>
                  <option value="Business Purchase">Business Purchase</option>
                  <option value="Rent">Rent</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description (Encrypted on disk)</label>
                <input type="text" className="form-input" value={newTxDesc} onChange={(e) => setNewTxDesc(e.target.value)} placeholder="e.g. Amazon shopping purchase" required />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTx(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Add Recurring Scheduler */}
      {showAddRecurring && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Create Automated Transaction Scheduler</h3>
            <form onSubmit={handleAddRecurring}>
              <div className="form-group">
                <label className="form-label">Description / Template Name</label>
                <input type="text" className="form-input" value={recDesc} onChange={(e) => setRecDesc(e.target.value)} placeholder="e.g. HDFC Index Fund SIP" required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <CurrencyInput className="form-input" value={recAmount} onChange={(e) => setRecAmount(e.target.value)} placeholder="e.g. 10000" required />
              </div>
              <div className="form-group">
                <label className="form-label">Transaction Type</label>
                <select value={recType} onChange={(e) => setRecType(e.target.value as any)}>
                  <option value="Expense">Expense (Withdrawal)</option>
                  <option value="Income">Income (Deposit)</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input type="text" className="form-input" value={recCategory} onChange={(e) => setRecCategory(e.target.value)} placeholder="e.g. Investments" required />
              </div>
              <div className="form-group">
                <label className="form-label">Source Account</label>
                <select value={recAccount} onChange={(e) => setRecAccount(e.target.value)}>
                  <option value="">-- Choose Account --</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bankName})</option>)}
                </select>
              </div>
              {recType === 'Transfer' && (
                <div className="form-group">
                  <label className="form-label">Destination Account</label>
                  <select value={recRefAccount} onChange={(e) => setRecRefAccount(e.target.value)}>
                    <option value="">-- Select Destination --</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bankName})</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <select value={recFrequency} onChange={(e) => setRecFrequency(e.target.value as any)}>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">SIP Start Date</label>
                  <input type="date" className="form-input" value={recStartDate} onChange={(e) => setRecStartDate(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Annual Step-Up % (Optional)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={recStepUpPct}
                    onChange={(e) => setRecStepUpPct(e.target.value)}
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Link Asset (Optional)</label>
                  <select value={recTargetAssetId} onChange={(e) => setRecTargetAssetId(e.target.value)}>
                    <option value="">-- None --</option>
                    {mfs.length > 0 && (
                      <optgroup label="Mutual Funds">
                        {mfs.map(m => <option key={m.id} value={m.id}>{m.schemeName}</option>)}
                      </optgroup>
                    )}
                    {stocks.length > 0 && (
                      <optgroup label="Stocks">
                        {stocks.map(s => <option key={s.id} value={s.id}>{s.symbol} ({s.name})</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddRecurring(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule SIP/Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Parsed Statement Review Grid */}
      {parsedReviewTxs.length > 0 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', padding: '1.5rem 2rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Review Bank Statement Entries</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Verify parsed dates, amounts, and categories before committing to ledger.</p>
              </div>
              <button onClick={() => setParsedReviewTxs([])} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.25rem' }}>&times;</button>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '0.82rem' }}>Import into Account:</label>
              <select
                value={statementAccount}
                onChange={(e) => setStatementAccount(e.target.value)}
                style={{ width: '220px', padding: '0.35rem 0.5rem', background: 'var(--bg-primary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              >
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bankName})</option>)}
              </select>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={parsedReviewTxs.every(t => t.selected)}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setParsedReviewTxs(prev => prev.map(t => ({ ...t, selected: val })));
                        }}
                      />
                    </th>
                    <th>Date</th>
                    <th>Narration Description</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedReviewTxs.map((tx) => (
                    <tr key={tx.id} style={{ opacity: tx.selected ? 1 : 0.5 }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={tx.selected}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setParsedReviewTxs(prev => prev.map(t => t.id === tx.id ? { ...t, selected: val } : t));
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: '110px' }}
                          value={tx.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedReviewTxs(prev => prev.map(t => t.id === tx.id ? { ...t, date: val } : t));
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: '220px' }}
                          value={tx.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedReviewTxs(prev => prev.map(t => t.id === tx.id ? { ...t, description: val } : t));
                          }}
                        />
                      </td>
                      <td>
                        <select
                          value={tx.type}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setParsedReviewTxs(prev => prev.map(t => t.id === tx.id ? { ...t, type: val } : t));
                          }}
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem', background: 'var(--bg-primary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                        >
                          <option value="Expense">Expense</option>
                          <option value="Income">Income</option>
                          <option value="Transfer">Transfer</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={tx.category}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedReviewTxs(prev => prev.map(t => t.id === tx.id ? { ...t, category: val } : t));
                          }}
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem', background: 'var(--bg-primary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                        >
                          <option value="Food & Dining">Food & Dining</option>
                          <option value="Salary">Salary</option>
                          <option value="Investments">Investments</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Transportation">Transportation</option>
                          <option value="CreditCard Dues">CreditCard Dues</option>
                          <option value="Rent">Rent</option>
                          <option value="Business Sales">Business Sales</option>
                          <option value="Business Purchase">Business Purchase</option>
                          <option value="Miscellaneous">Miscellaneous</option>
                        </select>
                      </td>
                      <td>
                        <CurrencyInput
                          className="form-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: '120px', textAlign: 'right' }}
                          value={tx.amount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setParsedReviewTxs(prev => prev.map(t => t.id === tx.id ? { ...t, amount: val } : t));
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setParsedReviewTxs([])}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleImportVerified}
                disabled={parsedReviewTxs.filter(t => t.selected).length === 0}
              >
                Import {parsedReviewTxs.filter(t => t.selected).length} Verified Entries
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
