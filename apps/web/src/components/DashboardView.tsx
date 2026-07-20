import React, { useMemo, useState } from 'react';
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

  // Monthly flows (Income vs Expense in current July 2026 month)
  const monthlyIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'Income' && t.date.startsWith('2026-07'))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const monthlyExpense = useMemo(() => {
    return transactions
      .filter(t => t.type === 'Expense' && t.date.startsWith('2026-07'))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);

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
    const now = new Date('2026-07-16');
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
    const sortedTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

    for (let i = points - 1; i >= 0; i--) {
      const monthsBack = i * monthStep;
      const d = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
      const dateStr = d.toISOString().slice(0, 7);

      // Backtrack actual transactions
      let actualDiff = 0;
      sortedTx.forEach(t => {
        if (t.date.slice(0, 7) > dateStr) {
          if (t.type === 'Income') actualDiff += t.amount;
          else if (t.type === 'Expense') actualDiff -= Math.abs(t.amount);
        }
      });

      let calculatedNetWorth = netWorth - actualDiff;

      // Simulated backward compounding decay factor (8% annual backwards decay) if past oldest transaction
      const oldestTxDate = sortedTx.length > 0 ? sortedTx[sortedTx.length - 1].date.slice(0, 7) : '2026-07';
      if (dateStr < oldestTxDate) {
        const oldestYear = parseInt(oldestTxDate.slice(0, 4));
        const oldestMonth = parseInt(oldestTxDate.slice(5, 7)) - 1;
        const diffMonths = (oldestYear - d.getFullYear()) * 12 + (oldestMonth - d.getMonth());
        
        if (diffMonths > 0) {
          const decay = Math.pow(1 - 0.08 / 12, diffMonths);
          let oldestActualDiff = 0;
          sortedTx.forEach(t => {
            if (t.date.slice(0, 7) > oldestTxDate) {
              if (t.type === 'Income') oldestActualDiff += t.amount;
              else if (t.type === 'Expense') oldestActualDiff -= Math.abs(t.amount);
            }
          });
          const oldestNetWorth = netWorth - oldestActualDiff;
          calculatedNetWorth = oldestNetWorth * decay;
        }
      }

      calculatedNetWorth = Math.max(0, calculatedNetWorth);

      let label = '';
      if (timelineFilter === '5Y' || timelineFilter === '10Y') {
        label = `${monthsNames[d.getMonth()]} '${d.getFullYear().toString().slice(2)}`;
      } else {
        label = `${monthsNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      }

      data.push({
        month: label,
        networth: Math.round(calculatedNetWorth)
      });
    }

    return data;
  }, [timelineFilter, netWorth, transactions]);

  // Cashflow compare monthly data
  const cashflowData = [
    { name: 'Apr', Income: 160000, Expense: 98000 },
    { name: 'May', Income: 195000, Expense: 110000 },
    { name: 'Jun', Income: 175000, Expense: 115000 },
    { name: 'Jul', Income: monthlyIncome, Expense: monthlyExpense }
  ];

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
    if (savingsRate > 40) {
      insights.push(`Your savings rate of ${savingsRate.toFixed(1)}% is excellent. Try increasing your SIP step-up by 2% to reach financial independence earlier.`);
    } else if (savingsRate > 20) {
      insights.push(`Good savings rate (${savingsRate.toFixed(1)}%). Consider optimizing expenses to reach 30%.`);
    } else {
      insights.push(`Your savings rate is ${savingsRate.toFixed(1)}%. Track your Food & Dining expenses to boost this.`);
    }

    if (totalAssets > 0 && bankBalances / totalAssets > 0.4) {
      insights.push(`You hold over 40% of assets in bank accounts. Consider moving excess cash to Index Funds or FDs to beat inflation.`);
    }

    if (monthlyExpense > monthlyIncome && monthlyIncome > 0) {
      insights.push(`Warning: Your expenses exceed income this month. Review your budget to prevent a deficit.`);
    } else if (monthlyExpense < monthlyIncome * 0.3) {
      insights.push(`Incredible expense control! You have high surplus liquidity this month for additional investments.`);
    }

    return insights.slice(0, 2); // Max 2 insights
  }, [savingsRate, totalAssets, bankBalances, monthlyExpense, monthlyIncome]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Banner metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        
        {/* Net Worth Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 550 }}>NET WORTH</span>
            <Wallet size={20} color="var(--accent-1)" />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0.2rem 0' }}>{formatRupee(netWorth)}</h3>

          {/* Subtle bottom glows */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
            background: 'var(--accent-grad)'
          }} />
        </div>

        {/* Monthly Income Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 550 }}>INCOME (JULY)</span>
            <TrendingUp size={20} color="var(--success)" />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0.2rem 0' }}>{formatRupee(monthlyIncome)}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Business Sales + Salaries</p>
        </div>

        {/* Monthly Expense Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 550 }}>EXPENSES (JULY)</span>
            <TrendingDown size={20} color="var(--error)" />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0.2rem 0' }}>{formatRupee(monthlyExpense)}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Groceries, Utilities & Bills</p>
        </div>

        {/* Savings Rate Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 550 }}>SAVINGS RATE</span>
            <Landmark size={20} color="var(--accent-2)" />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0.2rem 0' }}>{savingsRate.toFixed(1)}%</h3>
          <div style={{
            height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden'
          }}>
            <div style={{ width: `${savingsRate}%`, height: '100%', background: 'var(--accent-grad)' }} />
          </div>
        </div>

        {/* Smart Insights Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 550 }}>AI SMART INSIGHTS</span>
            <Lightbulb size={20} color="#f59e0b" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {smartInsights.map((insight, idx) => (
              <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#f59e0b' }}>✦</span>
                <span style={{ lineHeight: 1.4 }}>{insight}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Main Charts & Analytics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.25rem'
      }}>
        
        {/* Net Worth Timeline Card */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
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
                    fontWeight: 650
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer>
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-1)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-1)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v/100000).toFixed(1)}L`} />
                <Tooltip 
                  formatter={(value: any) => [formatRupee(value), 'Net Worth']}
                  contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="networth" stroke="var(--accent-1)" strokeWidth={2} fillOpacity={1} fill="url(#colorNetWorth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cashflow Bar Chart */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="var(--success)" /> Income vs Expense comparison
          </h4>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer>
              <BarChart data={cashflowData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: any) => formatRupee(value)}
                  contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Income" fill="var(--success)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="var(--error)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Third Row: Allocation and Alerts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem',
        flexWrap: 'wrap'
      }} className="responsive-stack">
        
        {/* Investment Allocation Chart */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieIcon size={16} color="var(--accent-2)" /> Investment Allocation
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flex: 1, flexWrap: 'wrap' }}>
            <div style={{ width: '160px', height: '160px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatRupee(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', minWidth: '150px' }}>
              {allocationData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
                  <span style={{ fontWeight: 600 }}>{((item.value / totalAssets) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: AI insights, nominee alerts, upcoming maturities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* AI Insights & Alerts panel */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lightbulb size={16} color="var(--warning)" /> AI Assistant Insights
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {/* Nominee alert */}
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

              {/* General tax insight */}
              <div style={{
                display: 'flex', gap: '0.5rem', background: 'hsla(186, 100%, 50%, 0.05)', border: '1px solid var(--border-focus)',
                padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem'
              }}>
                <Lightbulb size={16} color="var(--accent-1)" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Tax Saver Alert:</strong> You can save up to ₹15,600 by shifting to the New Tax Regime slabs (FY25-26) or maximizing 80C under Old. 
                  View tax comparator.
                </div>
              </div>

            </div>
          </div>

          {/* Upcoming Maturities Calendar */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} color="var(--accent-1)" /> Upcoming Bill & Deposit Maturities
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
              {maturities.length > 0 ? (
                maturities.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem'
                  }}>
                    <span style={{ fontWeight: 500 }}>{m.label}</span>
                    <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      <span>Matures: {m.date}</span>
                      <span style={{ color: 'var(--accent-1)', fontWeight: 600 }}>{formatRupee(m.amount)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                  No upcoming maturities found in the next 60 days
                </div>
              )}
            </div>
          </div>

          {/* Family Profiles Summary */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="var(--accent-2)" /> Family Wealth Profiles
            </h4>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {profiles.map(p => (
                <div key={p.id} className="glass-panel" style={{
                  padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                  fontSize: '0.78rem', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)'
                }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: p.role === 'Admin' ? 'var(--accent-1)' : 'var(--text-muted)'
                  }} />
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({p.relationship})</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
