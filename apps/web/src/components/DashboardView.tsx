import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbService } from '@financeos/database';
import { FixedDeposit } from '@financeos/shared';
import { GlobalDateRange, filterByDateRange } from '../utils/dateFilter.js';
import { formatRupee } from '../utils/currency.js';
import {
  TrendingUp, TrendingDown, Landmark, PieChart as PieIcon,
  Calendar, Users, AlertTriangle, Lightbulb, Wallet, ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import { GoalTracker } from './GoalTracker.js';

const calculateFdAccruedValue = (fd: FixedDeposit): number => {
  const now = new Date('2026-07-16'); // App's active date context
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
  // Fetch dynamic database states
  const accounts = useMemo(() => dbService.getAccounts().filter(a => a.profileId === activeProfileId), [activeProfileId]);
  const rawTransactions = useMemo(() => dbService.getTransactions().filter(t => t.profileId === activeProfileId), [activeProfileId]);
  const transactions = useMemo(() => filterByDateRange(rawTransactions, dateRange, t => t.date), [rawTransactions, dateRange]);
  const stocks = useMemo(() => dbService.getStocks().filter(s => s.profileId === activeProfileId), [activeProfileId]);
  const mfs = useMemo(() => dbService.getMutualFunds().filter(m => m.profileId === activeProfileId), [activeProfileId]);
  const fds = useMemo(() => dbService.getFDs().filter(f => f.profileId === activeProfileId), [activeProfileId]);
  const gold = useMemo(() => dbService.getGold().filter(g => g.profileId === activeProfileId), [activeProfileId]);
  const nps = useMemo(() => dbService.getNPS().filter(n => n.profileId === activeProfileId), [activeProfileId]);
  const pf = useMemo(() => dbService.getPF().filter(p => p.profileId === activeProfileId), [activeProfileId]);
  const profiles = useMemo(() => dbService.getProfiles(), []);

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
  const budgets = useMemo(() => dbService.getBudgets().filter(b => b.profileId === activeProfileId), [activeProfileId]);
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const budgetAlerts = useMemo(() => {
    return budgets.map(b => {
      const spent = rawTransactions
        .filter(t => t.type === 'Expense' && t.category === b.category && t.date.startsWith(currentMonthStr))
        .reduce((sum, t) => sum + t.amount, 0);
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
      { name: 'Cash & Banks', value: bankBalances, color: '#06b6d4' },
      { name: 'FDs / FIs', value: fdValue, color: '#3b82f6' },
      { name: 'Stocks', value: stockValue, color: '#10b981' },
      { name: 'Mutual Funds', value: mfValue, color: '#8b5cf6' },
      { name: 'Gold', value: goldValue, color: '#f59e0b' },
      { name: 'Retirement (NPS/PF)', value: npsValue + pfValue, color: '#ec4899' }
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
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">{score}</text>
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
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >

      {/* Top Banner metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        gap: '1.25rem'
      }}>

        {/* Net Worth Card */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>NET WORTH</span>
            <Wallet size={18} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>{formatRupee(netWorth)}</h3>

          {/* Subtle bottom glows */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px'
          }} />
        </motion.div>

        {/* Monthly Income Card */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          style={{ padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>INCOME (JULY)</span>
            <TrendingUp size={18} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>{formatRupee(monthlyIncome)}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Business Sales + Salaries</p>
        </motion.div>

        {/* Monthly Expense Card */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          style={{ padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>EXPENSES (JULY)</span>
            <TrendingDown size={18} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>{formatRupee(monthlyExpense)}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Groceries, Utilities & Bills</p>
        </motion.div>

        {/* Savings Rate Card */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
          }}
          style={{ padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>SAVINGS RATE</span>
            <Landmark size={18} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>{savingsRate.toFixed(1)}%</h3>
          <div style={{
            height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden'
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${savingsRate}%` }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              style={{ height: '100%', background: 'var(--accent-grad)' }}
            />
          </div>
        </motion.div>

        {/* Budget Gauges */}
        {budgetAlerts.slice(0, 2).map((b, idx) => (
          <motion.div
            key={idx}
            className="glass-panel"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            style={{ padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{b.category}</span>
              <span style={{ fontSize: '0.8rem', color: b.pct > 90 ? 'var(--error)' : 'var(--text-secondary)' }}>
                {b.pct}%
              </span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(b.pct, 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ height: '100%', background: b.pct > 90 ? 'var(--error)' : 'var(--accent-2)' }}
              />
            </div>
          </motion.div>
        ))}

        {/* Financial Health Score */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } }
          }}
          style={{ padding: '1.25rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
          onClick={() => setShowHealthBreakdown(!showHealthBreakdown)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>HEALTH SCORE</span>
            <ShieldCheck size={18} color="var(--text-muted)" />
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
                style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', overflow: 'hidden' }}
              >
                {healthScore.breakdown.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: '40px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${(b.points / b.max) * 100}%`, height: '100%', background: b.points >= b.max * 0.7 ? 'var(--success)' : 'var(--warning)', transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ fontWeight: 600, minWidth: '28px', textAlign: 'right' }}>{b.points}/{b.max}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Main Charts & Analytics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
        gap: '1.25rem'
      }}>

        {/* Net Worth Timeline Card */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, x: -30 },
            visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 50, damping: 15 } }
          }}
          style={{ padding: '1.25rem', minWidth: 0 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={16} color="var(--accent-1)" /> Net Worth Progression ({timelineFilter === '6M' ? '6 Months' : timelineFilter === '12M' ? '12 Months' : timelineFilter === '2Y' ? '2 Years' : timelineFilter === '5Y' ? '5 Years' : '10 Years'})
            </h4>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', padding: '0.2rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              {(['6M', '12M', '2Y', '5Y', '10Y'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTimelineFilter(f)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.7rem',
                    background: timelineFilter === f ? 'var(--accent-grad)' : 'transparent',
                    border: 'none',
                    borderRadius: '3px',
                    color: timelineFilter === f ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 650,
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
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="networth" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorNetWorth)" animationDuration={1500} />
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
          style={{ padding: '1.25rem', minWidth: 0 }}
        >
          <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="var(--success)" /> Income vs Expense comparison
          </h4>
          <div style={{ width: '100%', height: '240px', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={240} debounce={50}>
              <BarChart data={cashflowData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any) => formatRupee(value)}
                  contentStyle={{
                    background: 'var(--bg-panel)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    color: 'var(--text-primary)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 600 }}
                  cursor={{ fill: 'rgba(150,150,150,0.05)' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1500} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} animationDuration={1500} />
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
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
          gap: '1.25rem'
        }} className="responsive-stack"
      >

        {/* Investment Allocation Chart */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, scale: 0.98, y: 15 },
            visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } }
          }}
          style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieIcon size={16} color="var(--accent-2)" /> Investment Allocation
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flex: 1, flexWrap: 'wrap', minWidth: 0 }}>
            <div style={{ width: '100%', maxWidth: '160px', height: '160px', minWidth: 0 }}>
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
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      padding: '12px'
                    }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', minWidth: '150px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>

          {/* AI Insights & Alerts panel */}
          <motion.div
            className="glass-panel"
            variants={{
              hidden: { opacity: 0, x: 30 },
              visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 70 } }
            }}
            whileHover={{ scale: 1.02 }}
            style={{ padding: '1.25rem', minWidth: 0 }}
          >
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lightbulb size={16} color="var(--warning)" /> AI Assistant Insights
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
                      display: 'flex', gap: '0.5rem', background: b.pct >= 100 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      border: `1px solid ${b.pct >= 100 ? 'var(--error)' : 'var(--warning)'}`,
                      padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
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
                    display: 'flex', gap: '0.5rem', background: 'var(--warning-bg)', border: '1px solid var(--warning)',
                    padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--warning)'
                  }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Nominee Audit:</strong> {nomineeAlerts.length} investment accounts lack designated nominees.
                      Select "List investments without nominees" in AI Chat.
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', gap: '0.5rem', background: 'var(--success-bg)', border: '1px solid var(--success)',
                    padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--success)'
                  }}>
                    <ShieldCheck size={16} />
                    <div>All active accounts have nominative details. Well done!</div>
                  </div>
                )}
              </motion.div>

              {/* General tax insight */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  display: 'flex', gap: '0.5rem', background: 'hsla(186, 100%, 50%, 0.05)', border: '1px solid var(--border-focus)',
                  padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem'
                }}
              >
                <Lightbulb size={16} color="var(--accent-1)" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Tax Saver Alert:</strong> You can save up to ₹15,600 by shifting to the New Tax Regime slabs (FY25-26) or maximizing 80C under Old.
                  View tax comparator.
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
            style={{ padding: '1.25rem', minWidth: 0 }}
          >
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} color="var(--accent-1)" /> Upcoming Bill & Deposit Maturities
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
              {maturities.length > 0 ? (
                maturities.map((m, idx) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem'
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{m.label}</span>
                    <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      <span>Matures: {m.date}</span>
                      <span style={{ color: 'var(--accent-1)', fontWeight: 600 }}>{formatRupee(m.amount)}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                  No upcoming maturities found in the next 60 days
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
            style={{ padding: '1.25rem', minWidth: 0 }}
          >
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="var(--accent-2)" /> Family Wealth Profiles
            </h4>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {profiles.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2, scale: 1.05 }}
                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 300 }}
                  className="glass-panel"
                  style={{
                    padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.78rem', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: p.role === 'Admin' ? 'var(--accent-1)' : 'var(--text-muted)'
                  }} />
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({p.relationship})</span>
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
      >
        <GoalTracker activeProfileId={activeProfileId} />
      </motion.div>

    </motion.div>
  );
};
