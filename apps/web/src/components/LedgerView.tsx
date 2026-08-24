import React, { useState, useMemo, useEffect } from 'react';
import { Button, CurrencyInput, Badge, StatusBadge, SectionHeader, Modal, SearchFilterBar, IconButton, PanelHeader, EmptyState, InfoCallout, FileDropzone, FormRow, FormField, FormActions, ActionRow, chartTooltipStyle, chartTooltipItemStyle, useReducedMotion } from '@financeos/ui';
import { motion } from 'framer-motion';
import { dbService } from '@financeos/database';
import { useDbSyncCallback } from '../hooks/useDbSync.js';
import { BankAccount, Transaction, AccountType, RecurringTransaction, formatRupee, downloadBlob, todayStamp, parseRupeeToNumber } from '@financeos/shared';
import { GlobalDateRange, filterByDateRange } from '../utils/dateFilter.js';
import {
  Plus, Upload, Download, Landmark, Search, Trash2, CreditCard,
  RefreshCw, Edit2, PieChart as PieIcon, ArrowUpRight,
  ArrowDownLeft, ArrowRightLeft, Calendar, FileText
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { exportToCSV } from '../utils/exportCsv.js';
import { ConfirmModal, useConfirmModal } from './ConfirmModal.js';

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
  const reduceMotion = useReducedMotion();
  // DB States
  const [accounts, setAccounts] = useState<BankAccount[]>(() => dbService.getAccounts().filter(a => a.profileId === activeProfileId));
  const [transactions, setTransactions] = useState<Transaction[]>(() => dbService.getTransactions().filter(t => t.profileId === activeProfileId));
  const [recurringTxs, setRecurringTxs] = useState<RecurringTransaction[]>(() => dbService.getRecurringTransactions().filter(r => r.profileId === activeProfileId));
  const [stocks, setStocks] = useState(() => dbService.getStocks().filter(s => s.profileId === activeProfileId));
  const [mfs, setMfs] = useState(() => dbService.getMutualFunds().filter(m => m.profileId === activeProfileId));
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = React.useRef<HTMLInputElement>(null);
  const { modal: confirmModal, openConfirm, closeConfirm } = useConfirmModal();
  const [accFormError, setAccFormError] = useState<string | null>(null);

  const refreshData = () => {
    setAccounts(dbService.getAccounts().filter(a => a.profileId === activeProfileId));
    setTransactions(dbService.getTransactions().filter(t => t.profileId === activeProfileId));
    setRecurringTxs(dbService.getRecurringTransactions().filter(r => r.profileId === activeProfileId));
    setStocks(dbService.getStocks().filter(s => s.profileId === activeProfileId));
    setMfs(dbService.getMutualFunds().filter(m => m.profileId === activeProfileId));
  };

  useDbSyncCallback(refreshData);

  useEffect(() => {
    refreshData();
  }, [activeProfileId]);

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
    openConfirm({
      title: 'Stop Recurring Transaction',
      message: 'This will stop future automatic postings. The transaction history already recorded stays unchanged.',
      confirmLabel: 'Stop',
      isDanger: true,
      onConfirm: async () => { await dbService.deleteRecurringTransaction(id); refreshData(); }
    });
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

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => { if (t.tag) set.add(t.tag); });
    return Array.from(set);
  }, [transactions]);

  // Available categories in transactions
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => { if (t.category) set.add(t.category); });
    return Array.from(set);
  }, [transactions]);

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    const dateFiltered = filterByDateRange(transactions, dateRange, t => t.date);
    return dateFiltered.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.tag && t.tag.toLowerCase().includes(q)) ||
        t.amount.toString().includes(q);

      const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
      const matchesTag = selectedTag === 'All' || t.tag === selectedTag;

      return matchesSearch && matchesCat && matchesTag;
    });
  }, [transactions, dateRange, searchQuery, selectedCategory, selectedTag]);

  // Category analytics for spending donut chart
  const categoryAnalytics = useMemo(() => {
    const dateFiltered = filterByDateRange(transactions, dateRange, t => t.date);
    const catMap: Record<string, number> = {};
    let totalExpense = 0;
    dateFiltered.forEach(t => {
      if (t.type === 'Expense') {
        catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount);
        totalExpense += Math.abs(t.amount);
      }
    });

    const colors = [
      'var(--color-asset-cash)',
      'var(--color-asset-stocks)',
      'var(--color-asset-fd)',
      'var(--color-asset-mf)',
      'var(--color-asset-gold)',
      'var(--color-asset-retirement)',
      'var(--error)',
      'var(--color-asset-realestate)'
    ];
    const data = Object.entries(catMap)
      .map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length],
        pct: totalExpense > 0 ? ((value / totalExpense) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.value - a.value);

    return { data, totalExpense };
  }, [transactions, dateRange]);

  // Top 5 spends
  const topSpends = useMemo(() => {
    const dateFiltered = filterByDateRange(transactions, dateRange, t => t.date);
    return dateFiltered
      .filter(t => t.type === 'Expense')
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 5);
  }, [transactions, dateRange]);

  // Keyboard accelerators: '/' to focus search, 'N' / 'Ctrl+N' to add transaction, 'A' to add account
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setShowAddTx(true);
        return;
      }

      if (!isInput) {
        if (e.key === '/') {
          e.preventDefault();
          searchRef.current?.focus();
        } else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          setShowAddTx(true);
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setShowAddAccount(true);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccBank.trim()) {
      setAccFormError('Enter an account name and bank to continue.');
      return;
    }
    setAccFormError(null);

    try {
      await dbService.addAccount({
        profileId: activeProfileId,
        name: newAccName.trim(),
        bankName: newAccBank.trim(),
        accountNumber: newAccNumber.trim() || 'N/A',
        ifscCode: 'N/A',
        accountType: newAccType,
        balance: typeof newAccBalance === 'string' ? (parseRupeeToNumber(newAccBalance) || 0) : (newAccBalance || 0),
        nomineeName: newAccNominee.trim() || undefined
      });

      // Reset Form
      setNewAccName('');
      setNewAccBank('');
      setNewAccNumber('');
      setNewAccBalance('');
      setNewAccNominee('');
      setShowAddAccount(false);
      refreshData();
    } catch (err) {
      console.error('Failed to add account:', err);
    }
  };

  const handleEditAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccName.trim() || !editAccBank.trim()) return;

    try {
      await dbService.updateAccount(editAccId, {
        name: editAccName.trim(),
        bankName: editAccBank.trim(),
        accountNumber: editAccNumber.trim() || 'N/A',
        accountType: editAccType,
        balance: typeof editAccBalance === 'string' ? (parseRupeeToNumber(editAccBalance) || 0) : (editAccBalance || 0),
        nomineeName: editAccNominee.trim() || undefined
      });

      setShowEditAccount(false);
      refreshData();
    } catch (err) {
      console.error('Failed to update account:', err);
    }
  };

  const handleDeleteAccount = (id: string) => {
    openConfirm({
      title: 'Remove Bank Account',
      message: 'This will permanently delete this account and all associated transactions. This action cannot be undone.',
      confirmLabel: 'Delete Account',
      isDanger: true,
      onConfirm: async () => {
        try {
          await dbService.deleteAccount(id);
          refreshData();
        } catch (err) {
          console.error('Failed to delete account:', err);
        }
      }
    });
  };

  const openEditAccount = (acc: BankAccount) => {
    setEditAccId(acc.id);
    setEditAccName(acc.name);
    setEditAccBank(acc.bankName);
    setEditAccNumber(acc.accountNumber === 'N/A' ? '' : (acc.accountNumber || ''));
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
    openConfirm({
      title: 'Delete Transaction',
      message: 'Permanently delete this transaction? The corresponding account balance will be automatically adjusted.',
      confirmLabel: 'Delete Transaction',
      isDanger: true,
      onConfirm: async () => { await dbService.deleteTransaction(id); refreshData(); }
    });
  };

  // CSV Statement Parser & File Loader
  const handleCSVImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) return;
    const parsed = parseStatementText(csvContent);
    if (parsed.length === 0) {
      setImportStatus('Could not parse transactions from text. Ensure each line contains a valid date (e.g. DD-MM-YYYY), narration, and amount.');
      return;
    }
    setParsedReviewTxs(parsed);
    setStatementAccount(accounts[0]?.id || '');
    setCsvContent('');
  };

  const handleStatementFile = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseStatementText(text);
      if (parsed.length === 0) {
        setImportStatus('Could not extract transactions from file. Verify column headers or ensure rows include dates, descriptions, and numeric amounts.');
        return;
      }
      setParsedReviewTxs(parsed);
      setStatementAccount(accounts[0]?.id || '');
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleStatementFile(file);
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
    downloadBlob(`financeos_ledger_${todayStamp()}.csv`, blob);
  };

  return (
    <>
      <ConfirmModal state={confirmModal} onClose={closeConfirm} />
      <motion.div
        {...(reduceMotion ? { initial: false, animate: false } : { initial: "hidden", animate: "visible" })}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        className="gap-stack-xl"
      >

        {/* Page Header Banner */}
        <SectionHeader
          variant="banner"
          icon={<Landmark size={22} color="var(--text-on-action)" />}
          title="Banking & Double-Entry Ledger"
          description="Manage personal accounts, journal records, and statement syncs"
          action={
            <div style={{ display: 'flex', gap: 'var(--spacing-075)', flexWrap: 'wrap' }}>
              <Button variant="secondary" className="mobile-w-full" onClick={exportLedgerToCSV} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-04)', padding: 'var(--spacing-05) var(--spacing-1)', fontSize: 'var(--font-sm)' }}>
                <Download size={16} /> Export CSV
              </Button>
              <Button variant="primary" className="mobile-w-full" onClick={() => setShowAddTx(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-04)', padding: 'var(--spacing-05) var(--spacing-1)', fontSize: 'var(--font-sm)' }}>
                <Plus size={16} /> Add Transaction
              </Button>
            </div>
          }
        />

        {/* Grid: Left - Accounts List, Right - Statement Import */}
        <div className="card-grid-lg responsive-stack" style={{ gridTemplateColumns: '2fr 1fr' }}>

          {/* Accounts Overview */}
          <motion.div
            className="glass-panel" data-interactive-card="off"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80 } }
            }}
            {...(reduceMotion ? { initial: false, animate: false } : {})}
            style={{ padding: 'var(--spacing-15)' }}
          >
            <PanelHeader
              icon={<Landmark size={18} />}
              title="Bank & Cash Accounts"
              action={
                <Button variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', padding: 'var(--spacing-04) var(--spacing-085)', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-sm)' }} onClick={() => setShowAddAccount(true)}>
                  <Plus size={14} /> Add Account
                </Button>
              }
            />

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: 'var(--spacing-1)',
            }}>
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="glass-panel"
                  data-interactive-card="off"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '1.15rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    borderLeft: `4px solid ${acc.accountType === 'CreditCard' ? 'var(--accent-1)' : 'var(--accent-2, #f59e0b)'}`,
                    backgroundImage: 'var(--neo-convex-grad)',
                    boxShadow: 'var(--neo-raised-sm)',
                  }}
                >
                  {/* Top Row: Icon Badge + Name/Bank + Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', position: 'relative', zIndex: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        minWidth: '36px',
                        minHeight: '36px',
                        borderRadius: 'var(--radius-sm)',
                        background: acc.accountType === 'CreditCard' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        border: `1px solid ${acc.accountType === 'CreditCard' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: acc.accountType === 'CreditCard' ? 'var(--accent-1)' : 'var(--accent-2, #f59e0b)',
                        flexShrink: 0
                      }}>
                        {acc.accountType === 'CreditCard' ? <CreditCard size={18} /> : <Landmark size={18} />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{
                          fontSize: 'var(--font-base)',
                          fontWeight: 'var(--fw-bold)',
                          color: 'var(--text-primary)',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {acc.name}
                        </h4>
                        <span style={{
                          fontSize: 'var(--font-xs)',
                          color: 'var(--text-secondary)',
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px'
                        }}>
                          {acc.bankName || acc.accountType}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0, position: 'relative', zIndex: 10 }}>
                      <IconButton
                        icon={<Edit2 size={14} />}
                        label="Edit Account"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditAccount(acc);
                        }}
                      />
                      <IconButton
                        icon={<Trash2 size={14} />}
                        label="Delete Account"
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAccount(acc.id);
                        }}
                      />
                    </div>
                  </div>

                  {/* Middle Row: Balance Display */}
                  <div style={{ margin: '0.15rem 0' }}>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.15rem', fontWeight: 600 }}>
                      Available Balance
                    </div>
                    <div className="tabular-nums" style={{
                      fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)',
                      fontWeight: 'var(--fw-heavy)',
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text-primary)',
                      lineHeight: 1.2,
                      wordBreak: 'break-word'
                    }}>
                      {formatRupee(acc.balance)}
                    </div>
                  </div>

                  {/* Bottom Row: Account Number & Nominee / Type Badge */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: 'var(--font-xs)',
                    color: 'var(--text-secondary)'
                  }}>
                    <span style={{
                      fontFamily: 'monospace',
                      letterSpacing: '0.04em',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {acc.accountNumber ? `•••• ${acc.accountNumber.slice(-4)}` : '••••'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {acc.nomineeName && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-pill)',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#10b981',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>
                          ✓ Nominee
                        </span>
                      )}
                      <span style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface-tint)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        fontWeight: 600
                      }}>
                        {acc.accountType || 'Bank'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <EmptyState
                  variant="minimal"
                  size="sm"
                  title="No bank or cash accounts linked"
                  description="Click '+ Add Account' above to start tracking your account balances and cash flow."
                />
              )}
            </div>
          </motion.div>

          {/* Right Column Container */}
          <div className="gap-stack-lg">

            {/* Automated Bills & SIPs Scheduler */}
            <motion.div
              className="glass-panel" data-interactive-card="off"
              variants={{
                hidden: { opacity: 0, x: 20 },
                visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 80 } }
              }}
              {...(reduceMotion ? { initial: false, animate: false } : {})}
              style={{ padding: 'var(--spacing-15)' }}
            >
              <PanelHeader
                icon={<RefreshCw size={18} />}
                title="Automated SIPs & Bills"
                action={
                  <Button variant="secondary" style={{ padding: 'var(--spacing-04) var(--spacing-075)', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-sm)' }} onClick={() => setShowAddRecurring(true)}>
                    <Plus size={14} style={{ display: 'inline', marginRight: 'var(--spacing-025)' }} /> Add Recurring
                  </Button>
                }
              />
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-075)' }}>
                Recurring transactions that post automatically on their due date.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-06)', maxHeight: 'var(--chart-height-sm)', overflowY: 'auto' }}>
                {recurringTxs.map(rt => {
                  const accName = accounts.find(a => a.id === rt.accountId)?.name || 'Account';
                  return (
                    <ActionRow
                      key={rt.id}
                      variant="filled"
                      wrapDescription
                      title={rt.description}
                      description={`${rt.frequency} (${accName}) • Next: ${rt.nextDueDate}`}
                      action={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
                          <span className="tabular-nums" style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--font-sm)', color: rt.type === 'Income' ? 'var(--success)' : 'var(--text-primary)' }}>
                            {rt.type === 'Income' ? '+' : '-'}{formatRupee(rt.amount)}
                          </span>
                          <IconButton
                            icon={<Trash2 size={14} />}
                            label="Delete recurring transaction"
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteRecurring(rt.id)}
                          />
                        </div>
                      }
                    />
                  );
                })}
                {recurringTxs.length === 0 && (
                  <EmptyState
                    variant="minimal"
                    size="sm"
                    title="No recurring schedules active"
                    description="Automate SIPs, rent payments, and regular salary deposits with recurring rules."
                  />
                )}
              </div>
            </motion.div>

            {/* Statement Import (CSV / manual copy-paste) */}
            <motion.div
              className="glass-panel" data-interactive-card="off"
              variants={{
                hidden: { opacity: 0, x: 20 },
                visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 80 } }
              }}
              style={{ padding: 'var(--spacing-15)' }}
            >
              <PanelHeader icon={<Upload size={18} />} title="Statement Smart-Import" />
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-1)', lineHeight: 1.4 }}>
                Upload statement files or paste logs to automatically extract, categorize, and verify entries.
              </p>

              <form onSubmit={handleCSVImport}>
                <FileDropzone
                  accept=".csv,.txt"
                  label="Upload Statement (.csv, .txt)"
                  sublabel="Drag & drop bank statement or click to browse"
                  onFileSelect={handleStatementFile}
                  variant="compact"
                  style={{ marginBottom: 'var(--spacing-075)' }}
                />
                <div style={{ textAlign: 'center', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 'var(--spacing-075) 0' }}>— OR —</div>
                <textarea
                  className="form-input"
                  style={{ height: '80px', fontSize: 'var(--font-sm)', fontFamily: 'var(--font-mono)', marginBottom: 'var(--spacing-1)', padding: 'var(--spacing-075)' }}
                  placeholder="Paste statement text here...&#10;15-Jul-2026 Swiggy Delivery -720&#10;16-Jul-2026 Salary Credit +150000"
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                />
                <Button type="submit" variant="secondary" style={{ width: '100%', fontSize: 'var(--font-sm)', padding: 'var(--spacing-06)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spacing-05)' }}>
                  <Search size={16} /> Analyze Statement Text
                </Button>
              </form>

              {importStatus && (
                <InfoCallout variant="info" style={{ marginTop: 'var(--spacing-075)' }}>
                  {importStatus}
                </InfoCallout>
              )}
            </motion.div>

          </div>

        </div>

        {/* Category Analytics & Top Spends Panel */}
        {categoryAnalytics.data.length > 0 && (
          <motion.div
            {...(reduceMotion ? { initial: false, animate: false } : { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-50px" } })}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              }
            }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="card-grid responsive-stack"
          >
            {/* Donut chart */}
            <motion.div
              className="glass-panel" data-interactive-card="off"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70 } }
              }}
              {...(reduceMotion ? { initial: false, animate: false } : {})}
              style={{ padding: 'var(--spacing-15)', backgroundImage: 'var(--neo-convex-grad)', boxShadow: 'var(--neo-raised-md)' }}
            >
              <PanelHeader icon={<PieIcon size={18} />} title="Expense Distribution by Category" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                <div style={{ width: 'var(--chart-height-sm)', height: 'var(--chart-height-sm)' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={categoryAnalytics.data} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={2} dataKey="value">
                        {categoryAnalytics.data.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatRupee(v)} contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-04)', fontSize: 'var(--font-xs)', maxWidth: '200px' }}>
                  {categoryAnalytics.data.slice(0, 5).map((cat, i) => (
                    <motion.div
                      key={i}
                      {...(reduceMotion ? { initial: false, animate: false } : { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true } })}
                      transition={{ delay: i * 0.1 }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-05)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                      </div>
                      <span className="tabular-nums" style={{ fontWeight: 'var(--fw-semibold)' }}>{cat.pct}%</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Top 5 Spends */}
            <motion.div
              className="glass-panel" data-interactive-card="off"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70 } }
              }}
              {...(reduceMotion ? { initial: false, animate: false } : {})}
              style={{ padding: 'var(--spacing-15)' }}
            >
              <PanelHeader icon={<ArrowUpRight size={18} />} title="Highest Single Spends" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-04)' }}>
                {topSpends.map((t, idx) => (
                  <motion.div
                    key={t.id}
                    {...(reduceMotion ? { initial: false, animate: false, whileHover: undefined } : { whileHover: { scale: 1.02 } })}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-04) var(--spacing-06)', background: 'var(--surface-faint)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)' }}
                  >
                    <div>
                      <div style={{ fontWeight: 'var(--fw-semibold)' }}>{t.description}</div>
                      <span style={{ fontSize: 'var(--font-2xs)', color: 'var(--text-muted)' }}>{t.date} • {t.category}</span>
                    </div>
                    <span className="tabular-nums" style={{ fontWeight: 'var(--fw-heavy)', color: 'var(--error)' }}>{formatRupee(t.amount)}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Main Journal Transactions Table */}
        <motion.div
          {...(reduceMotion ? { initial: false, animate: false } : { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-50px" } })}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.4 } }
          }}
          className="glass-panel" data-interactive-card="off"
          style={{ padding: '0', overflow: 'hidden' }}
        >
          <div className="flex-between flex-wrap gap-stack-md p-15" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-faint)' }}>
            <PanelHeader
              icon={<FileText size={18} />}
              title="Ledger Journal Log"
              style={{ marginBottom: 0 }}
            />
            <div className="flex-1" style={{ maxWidth: '760px', minWidth: 'min(100%, 300px)' }}>
              <SearchFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                placeholder="Search transactions by narration, category, tag, or amount (Press /)"
                inputRef={searchRef}
                filters={[
                  {
                    id: 'category',
                    label: 'Category',
                    value: selectedCategory,
                    options: [
                      { value: 'All', label: 'All Categories' },
                      ...availableCategories.map(c => ({ value: c, label: c }))
                    ],
                    onChange: setSelectedCategory
                  },
                  ...(availableTags.length > 0 ? [{
                    id: 'tag',
                    label: 'Tag',
                    value: selectedTag,
                    options: [
                      { value: 'All', label: 'All Tags' },
                      ...availableTags.map(t => ({ value: t, label: t }))
                    ],
                    onChange: setSelectedTag
                  }] : [])
                ]}
                actions={
                  <Button
                    variant="secondary"
                    className="mobile-w-full"
                    onClick={() => {
                      exportToCSV('ledger_transactions', [
                        { label: 'Date', key: 'date' },
                        { label: 'Description', key: 'description' },
                        { label: 'Category', key: 'category' },
                        { label: 'Type', key: 'type' },
                        { label: 'Amount (INR)', key: 'amount' }
                      ], filteredTxs);
                    }}
                    style={{ padding: 'var(--spacing-04) var(--spacing-08)', fontSize: 'var(--font-sm)', gap: 'var(--spacing-04)', display: 'flex', alignItems: 'center' }}
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </Button>
                }
              />
            </div>
          </div>

          <div className="table-responsive" style={{ margin: 0, padding: 0 }}>
            <table className="custom-table">
              <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0, padding: 0, margin: -1 }}>
                Ledger journal log: transaction, account, category, and amount for each entry
              </caption>
              <thead style={{ background: 'var(--surface-tint-strong)' }}>
                <tr>
                  <th scope="col">Transaction</th>
                  <th scope="col">Account</th>
                  <th scope="col">Category</th>
                  <th scope="col" className="numeric-cell">Amount</th>
                  <th scope="col" aria-label="Actions" style={{ textAlign: 'center', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.length > 0 ? (
                  filteredTxs.slice(0, 500).map((tx, idx) => {
                    const accName = accounts.find(a => a.id === tx.accountId)?.name || 'External';

                    // Transaction Type styling map
                    const typeStyles = {
                      Income: { icon: <ArrowDownLeft size={16} />, color: 'var(--color-inflow)', bg: 'var(--color-inflow-bg)', badge: 'emerald' as const },
                      Expense: { icon: <ArrowUpRight size={16} />, color: 'var(--text-primary)', bg: 'var(--border-strong)', badge: 'rose' as const },
                      Transfer: { icon: <ArrowRightLeft size={16} />, color: 'var(--color-transfer)', bg: 'var(--color-transfer-bg)', badge: 'cyan' as const }
                    };

                    const style = typeStyles[tx.type as keyof typeof typeStyles];

                    return (
                      <motion.tr
                        key={tx.id}
                        {...(reduceMotion ? { initial: false, animate: false } : { initial: { opacity: 0, y: 5 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-20px" } })}
                        transition={{ delay: Math.min((idx % 10) * 0.03, 0.3) }}
                        style={{ borderBottom: '1px solid var(--border-faint)', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e: React.MouseEvent<HTMLTableRowElement>) => e.currentTarget.style.backgroundColor = 'var(--surface-faint)'}
                        onMouseLeave={(e: React.MouseEvent<HTMLTableRowElement>) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: style.bg, color: style.color
                            }}>
                              {style.icon}
                            </div>
                            <div>
                              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--font-base)', color: 'var(--text-primary)', lineHeight: 1.4 }}>{tx.description}</div>
                              <div className="tabular-nums" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 'var(--spacing-02)' }}>
                                <Calendar size={12} />
                                {tx.date}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge size="sm" icon={<Landmark size={12} />}>{accName}</Badge>
                        </td>
                        <td>
                          <Badge size="sm">{tx.category}</Badge>
                          {tx.tag && <Badge size="sm" variant="indigo" style={{ marginLeft: 'var(--spacing-05)' }}>{tx.tag}</Badge>}
                        </td>
                        <td className="numeric-cell">
                          <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--font-lg)', color: tx.type === 'Income' ? 'var(--success)' : 'inherit', fontFamily: 'var(--font-display)' }}>
                            {tx.type === 'Income' ? '+' : tx.type === 'Expense' ? '-' : ''}{formatRupee(tx.amount)}
                          </div>
                          <div style={{ marginTop: 'var(--spacing-02)' }}>
                            <Badge size="sm" variant={style.badge}>{tx.type}</Badge>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="action-menu-container" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                            <IconButton
                              icon={<Trash2 size={16} />}
                              label="Delete transaction"
                              variant="ghost"
                              size="md"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTx(tx.id);
                              }}
                            />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-15)' }}>
                      <EmptyState
                        variant="dashed"
                        size="sm"
                        icon={<RefreshCw size={24} />}
                        title={transactions.length === 0 ? "No transactions recorded in this ledger" : "No transactions match your current search or category filters"}
                        description={transactions.length === 0 ? "Record your first income or expense to begin tracking cash flow." : "Try clearing your search query or selecting 'All Categories'."}
                        action={transactions.length === 0 ? (
                          <Button variant="primary" size="sm" onClick={() => setShowAddTx(true)}>
                            <Plus size={14} /> Add First Transaction
                          </Button>
                        ) : (searchQuery || selectedCategory !== 'All' || selectedTag !== 'All') ? (
                          <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedTag('All'); }}>
                            Clear Filters
                          </Button>
                        ) : undefined}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Dialog: Add Account */}
        <Modal isOpen={showAddAccount} onClose={() => setShowAddAccount(false)} title="Add Bank Account" size="sm">
          <form onSubmit={handleAddAccount}>
            <FormField label="Account Label Name" htmlFor="ledger-acc-name">
              <input id="ledger-acc-name" type="text" className="form-input" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} placeholder="e.g. HDFC Salary account" required />
            </FormField>
            <FormField label="Bank Institution" htmlFor="ledger-acc-bank">
              <input id="ledger-acc-bank" type="text" className="form-input" value={newAccBank} onChange={(e) => setNewAccBank(e.target.value)} placeholder="e.g. HDFC Bank" required />
            </FormField>
            <FormField label="Account Number (Encrypted on disk)" htmlFor="ledger-acc-number">
              <input id="ledger-acc-number" type="text" className="form-input" value={newAccNumber} onChange={(e) => setNewAccNumber(e.target.value)} placeholder="e.g. 501004829103" />
            </FormField>
            <FormRow>
              <FormField label="Account Type" htmlFor="ledger-acc-type">
                <select id="ledger-acc-type" value={newAccType} onChange={(e) => setNewAccType(e.target.value as AccountType)}>
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                  <option value="CreditCard">Credit Card</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Loan">Loan/Debt</option>
                </select>
              </FormField>
              <FormField label="Opening Balance" htmlFor="ledger-acc-balance">
                <CurrencyInput id="ledger-acc-balance" className="form-input tabular-nums" value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)} placeholder="0.00" />
              </FormField>
            </FormRow>
            <FormField label="Designated Nominee Name" htmlFor="ledger-acc-nominee">
              <input id="ledger-acc-nominee" type="text" className="form-input" value={newAccNominee} onChange={(e) => setNewAccNominee(e.target.value)} placeholder="Nominee full name" />
            </FormField>
            <FormActions
              submitLabel="Add Bank Account"
              submitType="submit"
              onCancel={() => setShowAddAccount(false)}
              style={{ marginTop: 'var(--spacing-1)' }}
            />
          </form>
        </Modal>

        {/* Dialog: Edit Account */}
        <Modal isOpen={showEditAccount} onClose={() => setShowEditAccount(false)} title="Edit Bank Account" size="sm">
          <form onSubmit={handleEditAccountSubmit}>
            <FormField label="Account Nickname" htmlFor="ledger-edit-acc-name">
              <input id="ledger-edit-acc-name" type="text" className="form-input" value={editAccName} onChange={(e) => setEditAccName(e.target.value)} placeholder="e.g. Primary Savings" required />
            </FormField>
            <FormField label="Bank Name" htmlFor="ledger-edit-acc-bank">
              <input id="ledger-edit-acc-bank" type="text" className="form-input" value={editAccBank} onChange={(e) => setEditAccBank(e.target.value)} placeholder="e.g. HDFC Bank" required />
            </FormField>
            <FormRow>
              <FormField label="Account Type" htmlFor="ledger-edit-acc-type">
                <select id="ledger-edit-acc-type" className="form-input" value={editAccType} onChange={(e) => setEditAccType(e.target.value as AccountType)}>
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                  <option value="CreditCard">Credit Card</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Loan">Loan/Debt</option>
                </select>
              </FormField>
              <FormField label="Current Balance (₹)" htmlFor="ledger-edit-acc-balance">
                <CurrencyInput id="ledger-edit-acc-balance" className="form-input tabular-nums" value={editAccBalance} onChange={(e) => setEditAccBalance(e.target.value)} placeholder="0.00" required />
              </FormField>
            </FormRow>
            <FormField label="Account Number (Optional)" htmlFor="ledger-edit-acc-number">
              <input id="ledger-edit-acc-number" type="text" className="form-input" value={editAccNumber} onChange={(e) => setEditAccNumber(e.target.value)} placeholder="XXXX1234" />
            </FormField>
            <FormField label="Nominee Name (Optional)" htmlFor="ledger-edit-acc-nominee">
              <input id="ledger-edit-acc-nominee" type="text" className="form-input" value={editAccNominee} onChange={(e) => setEditAccNominee(e.target.value)} placeholder="Registered nominee" />
            </FormField>
            <FormActions
              submitLabel="Save Changes"
              submitType="submit"
              onCancel={() => setShowEditAccount(false)}
              style={{ marginTop: 'var(--spacing-1)' }}
            />
          </form>
        </Modal>

        {/* Dialog: Add Transaction */}
        <Modal isOpen={showAddTx} onClose={() => setShowAddTx(false)} title="Add Transaction" size="sm">
          <form onSubmit={handleAddTx}>
            <FormField label="Source Account" htmlFor="ledger-tx-account">
              <select id="ledger-tx-account" value={newTxAccount} onChange={(e) => setNewTxAccount(e.target.value)}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatRupee(a.balance)})</option>)}
              </select>
            </FormField>
            <FormRow columns="1fr 1.2fr">
              <FormField label="Transaction Type" htmlFor="ledger-tx-type">
                <select id="ledger-tx-type" value={newTxType} onChange={(e) => setNewTxType(e.target.value as any)}>
                  <option value="Expense">Expense (-)</option>
                  <option value="Income">Income (+)</option>
                  <option value="Transfer">Transfer (⇅)</option>
                </select>
              </FormField>
              <FormField label="Transaction Amount" htmlFor="ledger-tx-amount">
                <CurrencyInput id="ledger-tx-amount" className="form-input tabular-nums" value={newTxAmount} onChange={(e) => setNewTxAmount(e.target.value)} placeholder="0.00" required />
              </FormField>
            </FormRow>

            {newTxType === 'Transfer' && (
              <FormField label="Destination Account" htmlFor="ledger-tx-ref-account">
                <select id="ledger-tx-ref-account" value={newTxRefAcc} onChange={(e) => setNewTxRefAcc(e.target.value)}>
                  <option value="">-- Choose Account --</option>
                  {accounts.filter(a => a.id !== newTxAccount).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FormField>
            )}

            <FormField label="Date" htmlFor="ledger-tx-date">
              <input id="ledger-tx-date" type="date" className="form-input tabular-nums" value={newTxDate} onChange={(e) => setNewTxDate(e.target.value)} required />
            </FormField>
            <FormField label="Category" htmlFor="ledger-tx-category">
              <select id="ledger-tx-category" value={newTxCategory} onChange={(e) => setNewTxCategory(e.target.value)}>
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
            </FormField>
            <FormField label="Description (Encrypted on disk)" htmlFor="ledger-tx-desc">
              <input id="ledger-tx-desc" type="text" className="form-input" value={newTxDesc} onChange={(e) => setNewTxDesc(e.target.value)} placeholder="e.g. Amazon shopping purchase" required />
            </FormField>
            <FormActions
              submitLabel="Save Transaction"
              submitType="submit"
              onCancel={() => setShowAddTx(false)}
              style={{ marginTop: 'var(--spacing-1)' }}
            />
          </form>
        </Modal>

        {/* Dialog: Add Recurring Scheduler */}
        <Modal isOpen={showAddRecurring} onClose={() => setShowAddRecurring(false)} title="Add Recurring Transaction" size="sm">
          <form onSubmit={handleAddRecurring}>
            <FormField label="Description / Template Name" htmlFor="ledger-rec-desc">
              <input id="ledger-rec-desc" type="text" className="form-input" value={recDesc} onChange={(e) => setRecDesc(e.target.value)} placeholder="e.g. HDFC Index Fund SIP" required />
            </FormField>
            <FormField label="Amount (₹)" htmlFor="ledger-rec-amount">
              <CurrencyInput id="ledger-rec-amount" className="form-input tabular-nums" value={recAmount} onChange={(e) => setRecAmount(e.target.value)} placeholder="e.g. 10000" required />
            </FormField>
            <FormField label="Transaction Type" htmlFor="ledger-rec-type">
              <select id="ledger-rec-type" value={recType} onChange={(e) => setRecType(e.target.value as any)}>
                <option value="Expense">Expense (Withdrawal)</option>
                <option value="Income">Income (Deposit)</option>
                <option value="Transfer">Transfer</option>
              </select>
            </FormField>
            <FormField label="Category" htmlFor="ledger-rec-category">
              <input id="ledger-rec-category" type="text" className="form-input" value={recCategory} onChange={(e) => setRecCategory(e.target.value)} placeholder="e.g. Investments" required />
            </FormField>
            <FormField label="Source Account" htmlFor="ledger-rec-account">
              <select id="ledger-rec-account" value={recAccount} onChange={(e) => setRecAccount(e.target.value)}>
                <option value="">-- Choose Account --</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bankName})</option>)}
              </select>
            </FormField>
            {recType === 'Transfer' && (
              <FormField label="Destination Account" htmlFor="ledger-rec-ref-account">
                <select id="ledger-rec-ref-account" value={recRefAccount} onChange={(e) => setRecRefAccount(e.target.value)}>
                  <option value="">-- Select Destination --</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bankName})</option>)}
                </select>
              </FormField>
            )}
            <FormRow>
              <FormField label="Frequency" htmlFor="ledger-rec-frequency">
                <select id="ledger-rec-frequency" value={recFrequency} onChange={(e) => setRecFrequency(e.target.value as any)}>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
              </FormField>
              <FormField label="Schedule Start Date" htmlFor="ledger-rec-start-date">
                <input id="ledger-rec-start-date" type="date" className="form-input tabular-nums" value={recStartDate} onChange={(e) => setRecStartDate(e.target.value)} required />
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="Annual Step-Up % (Optional)" htmlFor="ledger-rec-stepup">
                <input
                  id="ledger-rec-stepup"
                  type="number"
                  className="form-input tabular-nums"
                  value={recStepUpPct}
                  onChange={(e) => setRecStepUpPct(e.target.value)}
                  placeholder="e.g. 10"
                />
              </FormField>
              <FormField label="Link Asset (Optional)" htmlFor="ledger-rec-target-asset">
                <select id="ledger-rec-target-asset" value={recTargetAssetId} onChange={(e) => setRecTargetAssetId(e.target.value)}>
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
              </FormField>
            </FormRow>
            <FormActions
              submitLabel="Create Recurring Schedule"
              submitType="submit"
              onCancel={() => setShowAddRecurring(false)}
              style={{ marginTop: 'var(--spacing-1)' }}
            />
          </form>
        </Modal>

        {/* Dialog: Parsed Statement Review Grid */}
        <Modal
          isOpen={parsedReviewTxs.length > 0}
          onClose={() => setParsedReviewTxs([])}
          title="Review & Categorize Statement Entries"
          description="Verify transaction dates, amounts, and categories before committing to your permanent journal."
          size="xl"
          style={{ maxWidth: '850px' }}
          footer={
            <>
              <Button variant="secondary" onClick={() => setParsedReviewTxs([])}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleImportVerified}
                disabled={parsedReviewTxs.filter(t => t.selected).length === 0}
              >
                Import {parsedReviewTxs.filter(t => t.selected).length} Verified Entries
              </Button>
            </>
          }
        >
          <div className="form-group" style={{ display: 'flex', gap: 'var(--spacing-1)', alignItems: 'center', marginBottom: 'var(--spacing-1)', background: 'var(--bg-secondary)', padding: 'var(--spacing-075)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-inset-sm)' }}>
            <label htmlFor="statement-import-account" className="form-label" style={{ margin: 0, whiteSpace: 'nowrap', fontSize: 'var(--font-sm)' }}>Import into Account:</label>
            <select
              id="statement-import-account"
              value={statementAccount}
              onChange={(e) => setStatementAccount(e.target.value)}
              style={{ width: '220px', padding: 'var(--spacing-04) var(--spacing-05)', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)' }}
            >
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bankName})</option>)}
            </select>
          </div>

          <div style={{ overflowX: 'auto', overflowY: 'auto', marginBottom: 'var(--spacing-125)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <table className="custom-table" style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={parsedReviewTxs.every(t => t.selected)}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setParsedReviewTxs(prev => prev.map(t => ({ ...t, selected: val })));
                          }}
                        />
                      </th>
                      <th scope="col">Date</th>
                      <th scope="col">Narration Description</th>
                      <th scope="col">Type</th>
                      <th scope="col">Category</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Amount (₹)</th>
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
                            style={{ padding: 'var(--spacing-02) var(--spacing-04)', fontSize: 'var(--font-sm)', width: '110px' }}
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
                            style={{ padding: 'var(--spacing-02) var(--spacing-04)', fontSize: 'var(--font-sm)', width: '220px' }}
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
                            style={{ padding: 'var(--spacing-02) var(--spacing-04)', fontSize: 'var(--font-xs)', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)' }}
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
                            style={{ padding: 'var(--spacing-02) var(--spacing-04)', fontSize: 'var(--font-xs)', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)' }}
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
                            style={{ padding: 'var(--spacing-02) var(--spacing-04)', fontSize: 'var(--font-sm)', width: '120px', textAlign: 'right' }}
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
        </Modal>

      </motion.div>
    </>
  );
};
