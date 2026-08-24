import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbService } from '@financeos/database';
import { useDbVersion } from '../hooks/useDbSync.js';
import { FixedDeposit, formatRupee } from '@financeos/shared';
import { GlobalDateRange, filterByDateRange } from '../utils/dateFilter.js';
import {
  TrendingUp, TrendingDown, Landmark, PieChart as PieIcon,
  Calendar, Users, AlertTriangle, Lightbulb, Wallet, ShieldCheck, CreditCard
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import { GoalTracker } from './GoalTracker.js';

const calculateFdAccruedValue = (fd: FixedDeposit): number => {
  const now = new Date(); // Dynamic active date context
  const start = new Date(fd.startDate);
  const maturity = new Date(fd.maturityDate);

  if (now <= start) return fd.principalAmount;
  if (now >= maturity) return fd.maturityAmount;

  // Quarterly compounding (n = 4)
  const rate = fd.interestRate / 100;
  const daysTotal = (maturity.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const daysElapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

  if (daysTotal <= 0 || daysElapsed <= 0) return fd.principalAmount;

  // Compounded quarterly: A = P * (1 + r/4) ^ (4 * years)
  const years = daysElapsed / 365.25;
  const accrued = fd.principalAmount * Math.pow(1 + rate / 4, 4 * years);

  return Math.min(fd.maturityAmount, Math.round(accrued));
};

interface DashboardViewProps {
  activeProfileId: string;
  dateRange: GlobalDateRange;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ activeProfileId, dateRange }) => {
  const dbVersion = useDbVersion();
  // Fetch dynamic database states
  const accounts = useMemo(() => dbService.getAccounts().filter(a => a.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const rawTransactions = useMemo(() => dbService.getTransactions().filter(t => t.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const transactions = useMemo(() => filterByDateRange(rawTransactions, dateRange, t => t.date), [rawTransactions, dateRange]);
  const stocks = useMemo(() => dbService.getStocks().filter(s => s.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const mfs = useMemo(() => dbService.getMutualFunds().filter(m => m.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const fds = useMemo(() => dbService.getFDs().filter(f => f.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const gold = useMemo(() => dbService.getGold().filter(g => g.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const nps = useMemo(() => dbService.getNPS().filter(n => n.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const pf = useMemo(() => dbService.getPF().filter(p => p.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const profiles = useMemo(() => dbService.getProfiles(), [dbVersion]);

  // Compute Aggregates
  const bankBalances = useMemo(() => {
    return accounts
      .filter(a => a.accountType !== 'Loan')
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  const stockValue = useMemo(() => {
    return stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
  }, [stocks]);

  const mfValue = useMemo(() => {
    return mfs.reduce((sum, m) => sum + (m.units * m.currentNav), 0);
  }, [mfs]);

  const goldValue = useMemo(() => {
    return gold.reduce((sum, g) => sum + (g.quantityGrams * g.currentPrice), 0);
  }, [gold]);

  const npsValue = useMemo(() => {
    return nps.reduce((sum, n) => sum + n.balance, 0);
  }, [nps]);

  const pfValue = useMemo(() => {
    return pf.reduce((sum, p) => sum + p.balance, 0);
  }, [pf]);

  const fdValue = useMemo(() => {
    return fds.filter(f => !f.isMatured).reduce((sum, f) => sum + calculateFdAccruedValue(f), 0);
  }, [fds]);

  const totalAssets = bankBalances + stockValue + mfValue + goldValue + npsValue + pfValue + fdValue;

  const totalLiabilities = useMemo(() => {
    const loanDebt = accounts
      .filter(a => a.accountType === 'Loan')
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const cardDebt = accounts
      .filter(a => a.accountType === 'CreditCard' && a.balance < 0)
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);
    return loanDebt + cardDebt;
  }, [accounts]);

  const netWorth = totalAssets - totalLiabilities;

  // Budgets & Spending Alerts
  const budgets = useMemo(() => dbService.getBudgets().filter(b => b.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const currentMonthStr = useMemo(() => new Date().toISOString().substring(0, 7), []);
  const currentMonthName = useMemo(() => new Date().toLocaleString('en-IN', { month: 'short' }).toUpperCase(), []);
  const budgetAlerts = useMemo(() => {
    // Optimization: Build a category-to-spent map in a single pass O(T) instead of O(B * T)
    const categorySpentMap = new Map<string, number>();
    for (let i = 0; i < rawTransactions.length; i++) {
      const t = rawTransactions[i];
      if (t.type === 'Expense' && t.date.startsWith(currentMonthStr)) {
        categorySpentMap.set(t.category, (categorySpentMap.get(t.category) || 0) + t.amount);
      }
    }

    return budgets.map(b => {
      const spent = categorySpentMap.get(b.category) || 0;
      const pct = Math.round((spent / b.limitAmount) * 100);
      return { ...b, spent, pct };
    }).sort((a, b) => b.pct - a.pct);
  }, [budgets, rawTransactions, currentMonthStr]);

  // Monthly flows (Income vs Expense in current active month)
  const monthlyIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'Income' && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonthStr]);

  const monthlyExpense = useMemo(() => {
    return transactions
      .filter(t => t.type === 'Expense' && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions, currentMonthStr]);

  const savingsRate = useMemo(() => {
    if (monthlyIncome === 0) return 0;
    return Math.max(0, ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100);
  }, [monthlyIncome, monthlyExpense]);

  // Chart data for Asset Allocation
  const allocationData = useMemo(() => {
    return [
      { name: 'Cash & Banks', value: bankBalances, color: 'var(--color-asset-cash)' },
      { name: 'FDs / FIs', value: fdValue, color: 'var(--color-asset-fd)' },
      { name: 'Stocks', value: stockValue, color: 'var(--color-asset-stocks)' },
      { name: 'Mutual Funds', value: mfValue, color: 'var(--color-asset-mf)' },
      { name: 'Gold', value: goldValue, color: 'var(--color-asset-gold)' },
      { name: 'Retirement (NPS/PF)', value: npsValue + pfValue, color: 'var(--color-asset-retirement)' }
    ].filter(item => item.value > 0);
  }, [bankBalances, fdValue, stockValue, mfValue, goldValue, npsValue, pfValue]);

  const [timelineFilter, setTimelineFilter] = useState<'6M' | '12M' | '2Y' | '5Y' | '10Y'>('6M');

  const historyData = useMemo(() => {
    const now = new Date();
    let points = 6;
    let monthStep = 1;

    switch (timelineFilter) {
      case '6M':
        points = 6;
        monthStep = 1;
        break;
      case '12M':
        points = 12;
        monthStep = 1;
        break;
      case '2Y':
        points = 12;
        monthStep = 2;
        break;
      case '5Y':
        points = 20;
        monthStep = 3;
        break;
      case '10Y':
        points = 20;
        monthStep = 6;
        break;
    }

    const data = [];
    const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Single-pass transaction aggregation O(N)
    const monthlyNetDiffs: Record<string, number> = {};
    transactions.forEach(t => {
      const monthStr = t.date.slice(0, 7);
      if (!monthlyNetDiffs[monthStr]) monthlyNetDiffs[monthStr] = 0;
      if (t.type === 'Income') monthlyNetDiffs[monthStr] += t.amount;
      else if (t.type === 'Expense') monthlyNetDiffs[monthStr] -= Math.abs(t.amount);
    });

    const sortedTxDates = Object.keys(monthlyNetDiffs).sort();
    const oldestTxDate = sortedTxDates.length > 0 ? sortedTxDates[0] : currentMonthStr;

    let oldestActualDiff = 0;
    Object.entries(monthlyNetDiffs).forEach(([m, diff]) => {
      if (m > oldestTxDate) oldestActualDiff += diff;
    });
    const oldestNetWorth = netWorth - oldestActualDiff;

    for (let i = points - 1; i >= 0; i--) {
      const monthsBack = i * monthStep;
      const d = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
      const dateStr = d.toISOString().slice(0, 7);

      let actualDiff = 0;
      Object.entries(monthlyNetDiffs).forEach(([m, diff]) => {
        if (m > dateStr) actualDiff += diff;
      });

      let calculatedNetWorth = netWorth - actualDiff;

      if (dateStr < oldestTxDate) {
        const oldestYear = parseInt(oldestTxDate.slice(0, 4));
        const oldestMonth = parseInt(oldestTxDate.slice(5, 7)) - 1;
        const diffMonths = (oldestYear - d.getFullYear()) * 12 + (oldestMonth - d.getMonth());

        if (diffMonths > 0) {
          const decay = Math.pow(1 - 0.08 / 12, diffMonths);
          calculatedNetWorth = oldestNetWorth * decay;
        }
      }

      calculatedNetWorth = Math.max(0, calculatedNetWorth);

      const label = (timelineFilter === '5Y' || timelineFilter === '10Y')
        ? `${monthsNames[d.getMonth()]} '${d.getFullYear().toString().slice(2)}`
        : `${monthsNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;

      data.push({
        month: label,
        networth: Math.round(calculatedNetWorth)
      });
    }

    return data;
  }, [timelineFilter, netWorth, transactions, currentMonthStr]);

  // Cashflow compare monthly data
  const cashflowData = useMemo(() => {
    const monthlyData: Record<string, { Income: number; Expense: number }> = {};
    const now = new Date();
    const cMonthStr = now.toISOString().slice(0, 7);
    monthlyData[cMonthStr] = { Income: 0, Expense: 0 };

    transactions.forEach(t => {
      const monthPrefix = t.date.slice(0, 7);
      if (!monthlyData[monthPrefix]) {
        monthlyData[monthPrefix] = { Income: 0, Expense: 0 };
      }
      if (t.type === 'Income') {
        monthlyData[monthPrefix].Income += t.amount;
      } else if (t.type === 'Expense') {
        monthlyData[monthPrefix].Expense += Math.abs(t.amount);
      }
    });

    const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([monthPrefix, totals]) => {
        const [year, month] = monthPrefix.split('-');
        const monthName = monthsNames[parseInt(month, 10) - 1] || monthPrefix;
        return {
          name: monthName,
          Income: totals.Income,
          Expense: totals.Expense
        };
      }).filter(d => d.Income > 0 || d.Expense > 0);
  }, [transactions]);

  // Nominee alerts check
  const nomineeAlerts = useMemo(() => {
    const alerts: string[] = [];
    stocks.forEach(s => {
      if (!s.nomineeName) alerts.push(`Stock [${s.symbol}] lacks a nominee`);
    });
    mfs.forEach(m => {
      if (!m.nomineeName) alerts.push(`Mutual Fund [${m.schemeName.slice(0, 15)}...] lacks a nominee`);
    });
    accounts.forEach(a => {
      if (a.accountType !== 'CreditCard' && !a.nomineeName) {
        alerts.push(`Account [${a.name}] lacks a nominee`);
      }
    });
    return alerts;
  }, [stocks, mfs, accounts]);

  // Upcoming Maturities
  const maturities = useMemo(() => {
    return fds
      .filter(f => !f.isMatured)
      .map(f => ({
        id: f.id,
        label: `${f.bankName} FD (${(f.principalAmount / 100000).toFixed(1)}L)`,
        date: f.maturityDate,
        amount: f.maturityAmount
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [fds]);

  const smartInsights = useMemo(() => {
    const insights: string[] = [];
    if (monthlyIncome === 0 && monthlyExpense === 0) {
      insights.push(`Welcome! Add your bank accounts and first transaction in Banking & Ledger to initialize financial analytics.`);
    } else if (savingsRate > 40) {
      insights.push(`Your savings rate of ${savingsRate.toFixed(1)}% is excellent. Try increasing your monthly SIP step-up to reach financial independence earlier.`);
    } else if (savingsRate > 20) {
      insights.push(`Good savings rate (${savingsRate.toFixed(1)}%). Consider optimizing monthly expenses to reach 30%.`);
    } else {
      insights.push(`Your savings rate is ${savingsRate.toFixed(1)}%. Track your Food & Dining expenses to boost this.`);
    }

    if (totalAssets > 0 && bankBalances / totalAssets > 0.4) {
      insights.push(`You hold over 40% of assets in cash/bank accounts. Consider allocating to Index Funds or FDs.`);
    }

    if (monthlyExpense > monthlyIncome && monthlyIncome > 0) {
      insights.push(`Warning: Expenses exceed income this month. Review your budget to prevent a deficit.`);
    }

    return insights.slice(0, 2);
  }, [savingsRate, totalAssets, bankBalances, monthlyExpense, monthlyIncome]);

  // Automated Financial Health Score (0-100) strictly from User Data
  const healthScore = useMemo(() => {
    let score = 0;
    const breakdown: { label: string; points: number; max: number; tip: string }[] = [];

    // 1. Savings Rate (0-25 pts)
    const srPts = monthlyIncome > 0 ? Math.min(25, Math.round(savingsRate * 0.5)) : 0;
    breakdown.push({
      label: 'Savings Rate',
      points: srPts,
      max: 25,
      tip: monthlyIncome === 0 ? 'Record monthly income to compute savings rate' : savingsRate < 20 ? 'Target 30%+ monthly savings' : 'Great savings discipline!'
    });
    score += srPts;

    // 2. Debt-to-Asset Ratio (0-20 pts)
    let daPts = 0;
    if (totalAssets > 0) {
      const debtRatio = totalLiabilities / totalAssets;
      daPts = debtRatio === 0 ? 20 : debtRatio < 0.2 ? 18 : debtRatio < 0.4 ? 14 : debtRatio < 0.6 ? 8 : 3;
      breakdown.push({
        label: 'Debt-to-Asset',
        points: daPts,
        max: 20,
        tip: debtRatio > 0.4 ? 'Focus on reducing liabilities' : debtRatio === 0 ? 'Zero debt balance — Excellent!' : 'Healthy debt levels'
      });
    } else {
      breakdown.push({
        label: 'Debt-to-Asset',
        points: 0,
        max: 20,
        tip: 'Add bank accounts or assets to compute debt ratio'
      });
    }
    score += daPts;

    // 3. Emergency Fund (0-20 pts) — 6+ months = full score
    let efPts = 0;
    const emergencyMonths = monthlyExpense > 0 ? bankBalances / monthlyExpense : 0;
    if (monthlyExpense > 0 && bankBalances > 0) {
      efPts = Math.min(20, Math.round((emergencyMonths / 6) * 20));
      breakdown.push({
        label: 'Emergency Fund',
        points: efPts,
        max: 20,
        tip: emergencyMonths < 3 ? 'Build 6 months of expenses in liquid savings' : `${emergencyMonths.toFixed(1)} months covered`
      });
    } else {
      breakdown.push({
        label: 'Emergency Fund',
        points: 0,
        max: 20,
        tip: bankBalances === 0 ? 'Add liquid bank balance' : 'Record monthly expenses to compute emergency runway'
      });
    }
    score += efPts;

    // 4. Investment Diversification (0-15 pts)
    const hasStocks = stockValue > 0 ? 1 : 0;
    const hasMf = mfValue > 0 ? 1 : 0;
    const hasGold = goldValue > 0 ? 1 : 0;
    const hasRetirement = (npsValue + pfValue) > 0 ? 1 : 0;
    const hasFd = fdValue > 0 ? 1 : 0;
    const diversityCount = hasStocks + hasMf + hasGold + hasRetirement + hasFd;
    const divPts = diversityCount > 0 ? Math.min(15, diversityCount * 3) : 0;
    breakdown.push({
      label: 'Diversification',
      points: divPts,
      max: 15,
      tip: diversityCount === 0 ? 'Add holdings across stocks, mutual funds, FD, or gold' : diversityCount < 3 ? 'Spread across equity, debt, and gold' : `${diversityCount} asset classes active`
    });
    score += divPts;

    // 5. Nominee Coverage (0-10 pts)
    const totalHoldings = stocks.length + mfs.length + accounts.filter(a => a.accountType !== 'CreditCard').length;
    let nomPts = 0;
    if (totalHoldings > 0) {
      const withNominee = stocks.filter(s => s.nomineeName).length + mfs.filter(m => m.nomineeName).length + accounts.filter(a => a.accountType !== 'CreditCard' && a.nomineeName).length;
      const nomPct = withNominee / totalHoldings;
      nomPts = Math.round(nomPct * 10);
      breakdown.push({
        label: 'Nominee Coverage',
        points: nomPts,
        max: 10,
        tip: nomPct < 1 ? 'Update nominees for all holdings' : 'All nominees set!'
      });
    } else {
      breakdown.push({
        label: 'Nominee Coverage',
        points: 0,
        max: 10,
        tip: 'Add holdings or accounts to measure nominee coverage'
      });
    }
    score += nomPts;

    // 6. Budget Discipline (0-10 pts)
    let budPts = 0;
    if (budgets.length > 0) {
      const overBudgets = budgetAlerts.filter(b => b.pct > 100).length;
      budPts = overBudgets === 0 ? 10 : Math.max(0, 10 - overBudgets * 3);
      breakdown.push({
        label: 'Budget Discipline',
        points: budPts,
        max: 10,
        tip: overBudgets > 0 ? `${overBudgets} categories over budget` : 'Within all budgets'
      });
    } else {
      breakdown.push({
        label: 'Budget Discipline',
        points: 0,
        max: 10,
        tip: 'Set up category budgets to measure spending discipline'
      });
    }
    score += budPts;

    return { score: Math.min(100, score), breakdown };
  }, [savingsRate, monthlyIncome, totalAssets, totalLiabilities, bankBalances, monthlyExpense, stockValue, mfValue, goldValue, npsValue, pfValue, fdValue, stocks, mfs, accounts, budgets, budgetAlerts]);

  const [showHealthBreakdown, setShowHealthBreakdown] = useState(false);

  // Health Score SVG arc
  const HealthGauge: React.FC<{ score: number }> = ({ score }) => {
    const size = 100;
    const cx = size / 2, cy = size / 2;
    const radius = 40;
    const startAngle = -210;
    const endAngle = 30;
    const totalAngle = endAngle - startAngle; // 240 degrees
    const progressAngle = startAngle + (score / 100) * totalAngle;

    const polarToCart = (angleDeg: number, r: number) => ({
      x: cx + r * Math.cos((angleDeg * Math.PI) / 180),
      y: cy + r * Math.sin((angleDeg * Math.PI) / 180)
    });

    const bgStart = polarToCart(startAngle, radius);
    const bgEnd = polarToCart(endAngle, radius);
    const progEnd = polarToCart(progressAngle, radius);

    const scoreFill = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--error)';
    const label = score >= 70 ? 'Excellent' : score >= 40 ? 'Fair' : 'Needs Work';

    return (
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.75}`}>
        {/* Background arc */}
        <path d={`M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 1 1 ${bgEnd.x} ${bgEnd.y}`}
          fill="none" stroke="rgba(150,150,150,0.15)" strokeWidth="6" strokeLinecap="round" />
        {/* Progress arc */}
        {score > 0 && (
          <path d={`M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 ${(score / 100) * totalAngle > 180 ? 1 : 0} 1 ${progEnd.x} ${progEnd.y}`}
            fill="none" stroke={scoreFill} strokeWidth="6" strokeLinecap="round"
            style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="700">{score}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={scoreFill} fontSize="8" fontWeight="600">{label}</text>
      </svg>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
      }}
      className="gap-stack-lg"
    >

      {/* Top Banner metrics */}
      <div className="card-grid-sm" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 'var(--spacing-085)' }}>

        {/* Net Worth Card */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          style={{ padding: 'var(--spacing-15)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-05)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-2xs)', fontWeight: 'var(--fw-bold)', letterSpacing: '0.06em' }}>TOTAL NET WORTH</span>
            <Wallet size={16} color="var(--accent-1)" />
          </div>
          <h3 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(netWorth)}</h3>

          {/* Subtle bottom glow */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-1) 0%, transparent 100%)', opacity: 0.6
          }} />
        </motion.div>

        {/* Monthly Income Card */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          style={{ padding: 'var(--spacing-15)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-05)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-2xs)', fontWeight: 'var(--fw-bold)', letterSpacing: '0.06em' }}>INCOME ({currentMonthName})</span>
            <TrendingUp size={16} color="var(--success)" />
          </div>
          <h3 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 var(--spacing-025) 0', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(monthlyIncome)}</h3>
          <p style={{ fontSize: 'var(--font-2xs)', color: 'var(--text-muted)', margin: 0 }}>Business Sales + Salaries</p>
        </motion.div>

        {/* Monthly Expense Card */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          style={{ padding: 'var(--spacing-15)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-05)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-2xs)', fontWeight: 'var(--fw-bold)', letterSpacing: '0.06em' }}>EXPENSES ({currentMonthName})</span>
            <TrendingDown size={16} color="var(--error)" />
          </div>
          <h3 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 var(--spacing-025) 0', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(monthlyExpense)}</h3>
          <p style={{ fontSize: 'var(--font-2xs)', color: 'var(--text-muted)', margin: 0 }}>Groceries, Utilities & Bills</p>
        </motion.div>

        {/* Savings Rate Card */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          style={{ padding: 'var(--spacing-15)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-05)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-2xs)', fontWeight: 'var(--fw-bold)', letterSpacing: '0.06em' }}>SAVINGS RATE</span>
            <Landmark size={16} color="var(--accent-2)" />
          </div>
          <h3 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 var(--spacing-025) 0', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{savingsRate.toFixed(1)}%</h3>
          <div style={{
            height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-xs)', marginTop: 'var(--spacing-05)', overflow: 'hidden'
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${savingsRate}%` }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              style={{ height: '100%', background: 'var(--accent-grad)' }}
            />
          </div>
        </motion.div>

        {/* Liabilities & Debt Card */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          style={{ padding: 'var(--spacing-15)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-05)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-2xs)', fontWeight: 'var(--fw-bold)', letterSpacing: '0.06em' }}>TOTAL LIABILITIES</span>
            <CreditCard size={16} color={totalLiabilities > 0 ? 'var(--error)' : 'var(--text-muted)'} />
          </div>
          <h3 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 var(--spacing-025) 0', color: totalLiabilities > 0 ? 'var(--error)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {formatRupee(totalLiabilities)}
          </h3>
          <p style={{ fontSize: 'var(--font-2xs)', color: 'var(--text-muted)', margin: 0 }}>
            {totalLiabilities === 0 ? 'Zero Debt — Excellent' : 'Loans & Credit Card Debt'}
          </p>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
            background: totalLiabilities > 0 ? 'linear-gradient(90deg, var(--error) 0%, transparent 100%)' : 'linear-gradient(90deg, var(--success) 0%, transparent 100%)',
            opacity: 0.6
          }} />
        </motion.div>

        {/* Financial Health Score */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } }
          }}
          style={{ padding: 'var(--spacing-15)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
          onClick={() => setShowHealthBreakdown(!showHealthBreakdown)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-05)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-2xs)', fontWeight: 'var(--fw-bold)', letterSpacing: '0.06em' }}>HEALTH SCORE</span>
            <ShieldCheck size={16} color="var(--text-muted)" />
          </div>
          <motion.div
            style={{ display: 'flex', justifyContent: 'center' }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <HealthGauge score={healthScore.score} />
          </motion.div>

          <AnimatePresence>
            {showHealthBreakdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)', marginTop: 'var(--spacing-075)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-075)', overflow: 'hidden' }}
              >
                {healthScore.breakdown.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-xs)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
                      <div style={{ width: '40px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xs)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: b.points >= b.max * 0.7 ? 'var(--success)' : 'var(--warning)',
                          transform: `scaleX(${Math.min(1, Math.max(0, b.points / b.max))})`,
                          transformOrigin: 'left',
                          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }} />
                      </div>
                      <span style={{ fontWeight: 'var(--fw-semibold)', minWidth: '28px', textAlign: 'right' }}>{b.points}/{b.max}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Main Charts & Analytics Row */}
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}>

        {/* Net Worth Timeline Card */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, x: -30 },
            visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 50, damping: 15 } }
          }}
          style={{ padding: 'var(--spacing-15)', minWidth: 0 }}
        >
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <h4 style={{ fontSize: 'var(--font-lg)', fontWeight: 650, margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)', flexWrap: 'wrap' }}>
              <Wallet size={16} color="var(--accent-1)" />
              <span>Net Worth Progression</span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>
                ({timelineFilter === '6M' ? '6 Months' : timelineFilter === '12M' ? '12 Months' : timelineFilter === '2Y' ? '2 Years' : timelineFilter === '5Y' ? '5 Years' : '10 Years'})
              </span>
            </h4>
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-05)',
              background: 'rgba(255,255,255,0.03)',
              padding: 'var(--spacing-05)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              flexWrap: 'wrap'
            }}>
              {(['6M', '12M', '2Y', '5Y', '10Y'] as const).map(f => (
                <button
                  key={f}
                  onPointerDown={() => setTimelineFilter(f)}
                  style={{
                    padding: 'var(--spacing-05) var(--spacing-075)',
                    fontSize: 'var(--font-xs)',
                    background: timelineFilter === f ? 'var(--accent-grad)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    color: timelineFilter === f ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 'var(--fw-semibold)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: '240px', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={240} debounce={50}>
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(1)}L`} />
                <Tooltip
                  formatter={(value: any) => [formatRupee(value), 'Net Worth']}
                  contentStyle={{
                    background: 'var(--bg-panel)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-tooltip)',
                    boxShadow: 'var(--shadow-tooltip)',
                    padding: 'var(--spacing-1)'
                  }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="networth" stroke="var(--accent-1)" strokeWidth={2} fillOpacity={1} fill="url(#colorNetWorth)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cashflow Bar Chart */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, x: 30 },
            visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 50, damping: 15 } }
          }}
          style={{ padding: 'var(--spacing-15)', minWidth: 0 }}
        >
          <h4 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--spacing-1)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
            <TrendingUp size={16} color="var(--success)" /> Income vs Expense comparison
          </h4>
          <div style={{ width: '100%', height: 'var(--chart-height-md)', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={240} debounce={50}>
              <BarChart data={cashflowData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any) => formatRupee(value)}
                  contentStyle={{
                    background: 'var(--bg-panel)',
                    borderColor: 'var(--border-color)',
                    borderRadius: 'var(--radius-tooltip)',
                    boxShadow: 'var(--shadow-tooltip)',
                    color: 'var(--text-primary)',
                    padding: 'var(--spacing-1)'
                  }}
                  itemStyle={{ fontWeight: 600 }}
                  cursor={{ fill: 'rgba(150,150,150,0.05)' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Income" fill="var(--success)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                <Bar dataKey="Expense" fill="var(--error)" radius={[4, 4, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* Third Row: Allocation and Alerts */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        className="card-grid responsive-stack"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))' }}
      >

        {/* Investment Allocation Chart */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, scale: 0.98, y: 15 },
            visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } }
          }}
          style={{ padding: 'var(--spacing-15)', display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          <h4 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--spacing-1)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
            <PieIcon size={16} color="var(--accent-2)" /> Investment Allocation
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flex: 1, flexWrap: 'wrap', minWidth: 0 }}>
            <div style={{ width: '100%', maxWidth: '160px', height: 'var(--chart-height-sm)', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={160} debounce={50}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => formatRupee(v)}
                    contentStyle={{
                      background: 'var(--bg-panel)',
                      borderColor: 'var(--border-color)',
                      borderRadius: 'var(--radius-tooltip)',
                      color: 'var(--text-primary)',
                      boxShadow: 'var(--shadow-tooltip)',
                      padding: 'var(--spacing-1)'
                    }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-05)', fontSize: 'var(--font-xs)', minWidth: '150px' }}>
              {allocationData.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
                  <span style={{ fontWeight: 600 }}>{((item.value / totalAssets) * 100).toFixed(0)}%</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right side: AI insights, nominee alerts, upcoming maturities */}
        <div className="gap-stack-lg" style={{ minWidth: 0 }}>

          {/* AI Insights & Alerts panel */}
          <motion.div
            className="glass-panel"
            variants={{
              hidden: { opacity: 0, x: 30 },
              visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 70 } }
            }}
            whileHover={{ scale: 1.02 }}
            style={{ padding: 'var(--spacing-15)', minWidth: 0 }}
          >
            <h4 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--spacing-075)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
              <Lightbulb size={16} color="var(--warning)" /> Smart Insights
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* Category Budget Alerts */}
              <AnimatePresence>
                {budgetAlerts.filter(b => b.pct > 80).map((b, idx) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: idx * 0.1 }}
                    style={{
                      display: 'flex', gap: 'var(--spacing-05)', background: b.pct >= 100 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      border: `1px solid ${b.pct >= 100 ? 'var(--error)' : 'var(--warning)'}`,
                      padding: 'var(--spacing-05) var(--spacing-075)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)',
                      color: b.pct >= 100 ? 'var(--error)' : 'var(--warning)'
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Budget Alert ({b.category}):</strong> Spending reached {b.pct}% of monthly limit ({formatRupee(b.spent)} / {formatRupee(b.limitAmount)}).
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {nomineeAlerts.length > 0 ? (
                  <div style={{
                    display: 'flex', gap: 'var(--spacing-05)', background: 'var(--warning-bg)', border: '1px solid var(--warning)',
                    padding: 'var(--spacing-05) var(--spacing-075)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)', color: 'var(--warning)'
                  }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Nominee Audit:</strong> {nomineeAlerts.length} investment account{nomineeAlerts.length > 1 ? 's do' : ' does'} not have a designated nominee.
                      Assign legal nominees in Portfolio &amp; Investments to safeguard your estate.
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', gap: 'var(--spacing-05)', background: 'var(--success-bg)', border: '1px solid var(--success)',
                    padding: 'var(--spacing-05) var(--spacing-075)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)', color: 'var(--success)'
                  }}>
                    <ShieldCheck size={16} />
                    <div>All bank accounts and investment assets have designated legal nominees assigned.</div>
                  </div>
                )}
              </motion.div>

              {/* General tax insight */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  display: 'flex', gap: 'var(--spacing-05)', background: 'hsla(186, 100%, 50%, 0.05)', border: '1px solid var(--border-focus)',
                  padding: 'var(--spacing-05) var(--spacing-075)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)'
                }}
              >
                <Lightbulb size={16} color="var(--accent-1)" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Tax Saver Alert:</strong> You can save up to ₹15,600 by shifting to the New Tax Regime slabs (FY 2026-27) or maximizing 80C under Old.
                  Open the tax comparator to analyze your savings.
                </div>
              </motion.div>

            </div>
          </motion.div>

          {/* Upcoming Maturities Calendar */}
          <motion.div
            className="glass-panel"
            variants={{
              hidden: { opacity: 0, x: 30 },
              visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 70 } }
            }}
            whileHover={{ scale: 1.02 }}
            style={{ padding: 'var(--spacing-15)', minWidth: 0 }}
          >
            <h4 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--spacing-075)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
              <Calendar size={16} color="var(--accent-1)" /> Upcoming Bill & Deposit Maturities
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-05)', maxHeight: '120px', overflowY: 'auto' }}>
              {maturities.length > 0 ? (
                maturities.map((m, idx) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: 'var(--spacing-05) var(--spacing-075)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-sm)'
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{m.label}</span>
                    <div style={{ display: 'flex', gap: 'var(--spacing-075)', color: 'var(--text-secondary)', fontSize: 'var(--font-xs)' }}>
                      <span>Matures: {m.date}</span>
                      <span style={{ color: 'var(--accent-1)', fontWeight: 600 }}>{formatRupee(m.amount)}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', textAlign: 'center', padding: 'var(--spacing-1)' }}>
                  No deposits or bonds maturing in the next 90 days. Active term deposits with maturity dates will appear here automatically.
                </div>
              )}
            </div>
          </motion.div>

          {/* Family Profiles Summary */}
          <motion.div
            className="glass-panel"
            variants={{
              hidden: { opacity: 0, x: 30 },
              visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 70 } }
            }}
            style={{ padding: 'var(--spacing-15)', minWidth: 0 }}
          >
            <h4 style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--spacing-075)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
              <Users size={16} color="var(--accent-2)" /> Family Wealth Profiles
            </h4>
            <div style={{ display: 'flex', gap: 'var(--spacing-05)', flexWrap: 'wrap' }}>
              {profiles.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2, scale: 1.05 }}
                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 300 }}
                  className="glass-panel"
                  style={{
                    padding: 'var(--spacing-04) var(--spacing-075)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)',
                    fontSize: 'var(--font-xs)', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{
                    width: p.avatar ? '20px' : '8px', height: p.avatar ? '20px' : '8px', borderRadius: '50%',
                    background: p.role === 'Admin' ? 'var(--accent-1)' : 'var(--text-muted)',
                    overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                  </div>
                  <span style={{ fontWeight: 'var(--fw-semibold)' }}>{p.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-2xs)' }}>({p.relationship})</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>

      </motion.div>

      {/* Goals Section (embedded) */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 60, delay: 0.2 }}
        className="mt-15"
      >
        <GoalTracker activeProfileId={activeProfileId} />
      </motion.div>

    </motion.div>
  );
};
