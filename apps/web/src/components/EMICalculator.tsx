import React, { useState, useEffect, useMemo } from 'react';
import { Button, MetricCard, PanelHeader, Slider, Tabs, SummaryMetricGrid, PaginationControls } from '@financeos/ui';
import { dbService } from '@financeos/database';
import { formatRupee, calculateEMI, generateAmortizationSchedule } from '@financeos/shared';
import { exportToCSV } from '../utils/exportCsv.js';
import { Calculator, Download, IndianRupee, Clock, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts';

interface EMICalculatorProps {
  activeProfileId: string;
}

export const EMICalculator: React.FC<EMICalculatorProps> = ({ activeProfileId }) => {
  const [principal, setPrincipal] = useState(0);
  const [rate, setRate] = useState(0);
  const [tenureYears, setTenureYears] = useState(0);
  const [prepayment, setPrepayment] = useState(0);
  const [prepaymentMonth, setPrepaymentMonth] = useState(12);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = dbService.getEmiInputs?.(activeProfileId);
      if (saved) {
        setPrincipal(saved.principal || 0);
        setRate(saved.rate || 0);
        setTenureYears(saved.tenureYears || 0);
        setPrepayment(saved.prepayment || 0);
        setPrepaymentMonth(saved.prepaymentMonth || 12);
      } else {
        setPrincipal(0);
        setRate(0);
        setTenureYears(0);
        setPrepayment(0);
        setPrepaymentMonth(12);
      }
    } catch (e) {
      console.error('Failed to load EMI inputs', e);
    } finally {
      setIsLoaded(true);
    }
  }, [activeProfileId]);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      dbService.updateEmiInputs(activeProfileId, {
        principal,
        rate,
        tenureYears,
        prepayment,
        prepaymentMonth
      }).catch(console.error);
    }, 150);
    return () => clearTimeout(timer);
  }, [principal, rate, tenureYears, prepayment, prepaymentMonth, activeProfileId, isLoaded]);

  const tenureMonths = tenureYears * 12;

  const emi = useMemo(() => {
    return calculateEMI(principal, rate, tenureMonths);
  }, [principal, rate, tenureMonths]);

  const amortization = useMemo(() => {
    const rows = generateAmortizationSchedule(principal, rate, tenureMonths, prepayment, prepaymentMonth);
    const totalInterest = rows.reduce((sum, r) => sum + r.interest, 0);
    const totalPrincipal = rows.reduce((sum, r) => sum + r.principal, 0);
    return {
      rows,
      totalInterest,
      totalPrincipal,
      totalPayment: totalInterest + totalPrincipal,
      actualTenure: rows.length
    };
  }, [principal, rate, tenureMonths, prepayment, prepaymentMonth]);

  // Without prepayment baseline
  const baselineTotal = useMemo(() => {
    return Math.round(emi * tenureMonths);
  }, [emi, tenureMonths]);

  const savings = prepayment > 0 ? baselineTotal - amortization.totalPayment : 0;

  const pieData = [
    { name: 'Principal', value: amortization.totalPrincipal, color: 'var(--accent-1)' },
    { name: 'Interest', value: amortization.totalInterest, color: 'var(--error)' }
  ];

  // Yearly balance chart
  const yearlyData = useMemo(() => {
    const points: { year: string; balance: number; paid: number }[] = [];
    let cumulativePaid = 0;
    for (let i = 0; i < amortization.rows.length; i++) {
      cumulativePaid += amortization.rows[i].emi;
      if ((i + 1) % 12 === 0 || i === amortization.rows.length - 1) {
        points.push({
          year: `Y${Math.ceil((i + 1) / 12)}`,
          balance: amortization.rows[i].closingBalance,
          paid: Math.round(cumulativePaid)
        });
      }
    }
    return points;
  }, [amortization]);

  const [scheduleMode, setScheduleMode] = useState<'annual' | 'monthly'>('annual');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  const annualSummary = useMemo(() => {
    const years: Array<{
      year: number;
      openingBalance: number;
      totalEmi: number;
      totalPrincipal: number;
      totalInterest: number;
      closingBalance: number;
    }> = [];

    const rows = amortization.rows;
    const numYears = Math.ceil(rows.length / 12);
    for (let y = 0; y < numYears; y++) {
      const chunk = rows.slice(y * 12, (y + 1) * 12);
      if (chunk.length === 0) continue;
      years.push({
        year: y + 1,
        openingBalance: chunk[0].openingBalance,
        totalEmi: chunk.reduce((sum, r) => sum + r.emi, 0),
        totalPrincipal: chunk.reduce((sum, r) => sum + r.principal, 0),
        totalInterest: chunk.reduce((sum, r) => sum + r.interest, 0),
        closingBalance: chunk[chunk.length - 1].closingBalance
      });
    }
    return years;
  }, [amortization.rows]);

  const totalMonthlyPages = Math.ceil(amortization.rows.length / pageSize) || 1;
  const paginatedMonthlyRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return amortization.rows.slice(start, start + pageSize);
  }, [amortization.rows, currentPage, pageSize]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-125)' }}>

      {/* Input Controls */}
      <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-15)' }}>
        <PanelHeader
          title="EMI & Loan Amortization Calculator"
          icon={<Calculator size={18} />}
          style={{ marginBottom: 'var(--spacing-125)' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 'var(--spacing-125)' }}>
          {/* Principal Input & Slider */}
          <Slider
            label="Loan Amount"
            value={principal}
            onChange={(v) => setPrincipal(Math.max(0, v))}
            min={0}
            max={50000000}
            step={100000}
            editable
            prefix="₹"
            inputWidth={120}
            ariaLabel="Loan Amount"
          />

          {/* Interest Rate Input & Slider */}
          <Slider
            label="Interest Rate"
            value={rate}
            onChange={(v) => setRate(Math.max(0, v))}
            min={0}
            max={25}
            step={0.1}
            editable
            suffix="%"
            inputWidth={60}
            ariaLabel="Interest Rate"
          />

          {/* Tenure Input & Slider */}
          <Slider
            label="Loan Tenure"
            value={tenureYears}
            onChange={(v) => setTenureYears(Math.max(0, v))}
            min={0}
            max={35}
            step={1}
            editable
            suffix="Yrs"
            inputWidth={50}
            ariaLabel="Loan Tenure"
          />

          {/* Prepayment Input */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-04)' }}>
              <label htmlFor="emi-prepay-input" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', fontWeight: 'var(--fw-medium)' }}>Lump-sum Prepayment</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-02)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', padding: 'var(--spacing-02) var(--spacing-05)', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-inset-sm)' }}>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--accent-1)', fontWeight: 'var(--fw-heavy)' }}>₹</span>
                <input
                  id="emi-prepay-input"
                  type="number"
                  min={0}
                  max={500000000}
                  step={10000}
                  value={prepayment}
                  onChange={e => setPrepayment(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: '120px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-1)',
                    fontWeight: 'var(--fw-heavy)',
                    fontSize: 'var(--font-sm)',
                    outline: 'none',
                    textAlign: 'right'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)', marginTop: 'var(--spacing-04)' }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>At Month:</span>
              <input
                type="number"
                aria-label="Prepayment Month"
                min={1}
                max={tenureMonths || 12}
                value={prepaymentMonth}
                onChange={e => setPrepaymentMonth(Math.max(1, Number(e.target.value)))}
                style={{ width: '80px', padding: 'var(--spacing-02) var(--spacing-04)', fontSize: 'var(--font-xs)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-primary)', textAlign: 'center' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryMetricGrid minItemWidth="180px">
        <MetricCard
          label="Monthly EMI"
          value={formatRupee(emi)}
          subtext="Principal + Interest monthly"
          accentColor="var(--accent-1)"
        />

        <MetricCard
          label="Total Interest"
          value={formatRupee(amortization.totalInterest)}
          subtext={`${((amortization.totalInterest / (amortization.totalPayment || 1)) * 100).toFixed(0)}% of total repayment`}
          accentColor="var(--error)"
        />

        <MetricCard
          label="Total Payment"
          value={formatRupee(amortization.totalPayment)}
          subtext={`Principal: ${formatRupee(amortization.totalPrincipal)}`}
          accentColor="var(--text-primary)"
        />

        {prepayment > 0 && (
          <MetricCard
            label="Prepayment Savings"
            value={formatRupee(savings)}
            subtext={`Tenure reduced to ${Math.ceil(amortization.actualTenure / 12)} yrs`}
            progressVariant="positive"
            accentColor="var(--success)"
          />
        )}
      </SummaryMetricGrid>

      {/* Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-1)' }}>
        {/* Principal vs Interest Donut */}
        <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-125)' }}>
          <PanelHeader
            title="Loan Breakdown"
            icon={<PieIcon size={14} />}
            tag="h4"
          />
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatRupee(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Balance Over Time Area Chart */}
        <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-125)' }}>
          <PanelHeader
            title="Repayment Timeline"
            icon={<Clock size={14} />}
            tag="h4"
          />
          <div style={{ width: '100%', height: 'var(--chart-height-sm)' }}>
            <ResponsiveContainer>
              <AreaChart data={yearlyData}>
                <defs>
                  <linearGradient id="emiBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-1)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-1)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v) => formatRupee(Number(v))} />
                <Area type="monotone" dataKey="balance" stroke="var(--accent-1)" fillOpacity={1} fill="url(#emiBalanceGrad)" name="Remaining Balance" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Amortization Schedule with Annual Consolidation & Pagination */}
      <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-125)' }}>
        <PanelHeader
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', flexWrap: 'wrap' }}>
              Amortization Schedule
              {/* View Mode Toggle */}
              <Tabs
                tabs={[
                  { id: 'annual', label: `Yearly Consolidation (${annualSummary.length} Yrs)` },
                  { id: 'monthly', label: `Monthly Breakdown (${amortization.rows.length} Mo)` },
                ]}
                activeTab={scheduleMode}
                onChange={(id) => setScheduleMode(id as 'annual' | 'monthly')}
                variant="segmented"
              />
            </span>
          }
          icon={<IndianRupee size={14} />}
          tag="h4"
          style={{ marginBottom: 0 }}
          action={
            <Button
              variant="primary"
              onClick={() => exportToCSV('emi_amortization', [
                { label: 'Month', key: 'month' }, { label: 'Opening Balance', key: 'openingBalance' },
                { label: 'EMI', key: 'emi' }, { label: 'Principal', key: 'principal' },
                { label: 'Interest', key: 'interest' }, { label: 'Closing Balance', key: 'closingBalance' }
              ], amortization.rows)}
              style={{ padding: 'var(--spacing-04) var(--spacing-06)', fontSize: 'var(--font-xs)', gap: 'var(--spacing-04)' }}
            >
              <Download size={12} /> Export CSV
            </Button>
          }
        />

        {/* Schedule Table */}
        <div style={{ overflowX: 'auto', maxHeight: 'var(--chart-height-xl)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-xs)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {(scheduleMode === 'annual'
                  ? ['Year', 'Opening Balance', 'Annual EMI Paid', 'Principal Paid', 'Interest Paid', 'Closing Balance']
                  : ['Month', 'Opening Balance', 'EMI Paid', 'Principal', 'Interest', 'Closing Balance']
                ).map(h => (
                  <th key={h} style={{ padding: 'var(--spacing-05)', textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', fontWeight: 'var(--fw-semibold)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduleMode === 'annual' ? (
                annualSummary.map(r => (
                  <tr key={r.year} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: 'var(--spacing-04) var(--spacing-05)', textAlign: 'right', fontWeight: 'var(--fw-bold)', color: 'var(--accent-1)', fontVariantNumeric: 'tabular-nums' }}>Year {r.year}</td>
                    <td style={{ padding: 'var(--spacing-04) var(--spacing-05)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(r.openingBalance)}</td>
                    <td style={{ padding: 'var(--spacing-04) var(--spacing-05)', textAlign: 'right', fontWeight: 'var(--fw-semibold)', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(r.totalEmi)}</td>
                    <td style={{ padding: 'var(--spacing-04) var(--spacing-05)', textAlign: 'right', color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(r.totalPrincipal)}</td>
                    <td style={{ padding: 'var(--spacing-04) var(--spacing-05)', textAlign: 'right', color: 'var(--error)', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(r.totalInterest)}</td>
                    <td style={{ padding: 'var(--spacing-04) var(--spacing-05)', textAlign: 'right', fontWeight: 'var(--fw-semibold)', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(r.closingBalance)}</td>
                  </tr>
                ))
              ) : (
                paginatedMonthlyRows.map(r => (
                  <tr key={r.month} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: 'var(--spacing-04) var(--spacing-05)', textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>Month {r.month}</td>
                    <td style={{ padding: 'var(--spacing-04) var(--spacing-05)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(r.openingBalance)}</td>
                    <td style={{ padding: 'var(--spacing-04) var(--spacing-05)', textAlign: 'right', fontWeight: 'var(--fw-semibold)', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(r.emi)}</td>
                    <td style={{ padding: 'var(--spacing-04) var(--spacing-05)', textAlign: 'right', color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(r.principal)}</td>
                    <td style={{ padding: 'var(--spacing-04) var(--spacing-05)', textAlign: 'right', color: 'var(--error)', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(r.interest)}</td>
                    <td style={{ padding: 'var(--spacing-04) var(--spacing-05)', textAlign: 'right', fontWeight: 'var(--fw-semibold)', fontVariantNumeric: 'tabular-nums' }}>{formatRupee(r.closingBalance)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Monthly Pagination Controls */}
        {scheduleMode === 'monthly' && totalMonthlyPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalMonthlyPages}
            totalItems={amortization.rows.length}
            pageSize={pageSize}
            itemLabel="months"
            onPageChange={setCurrentPage}
          />
        )}
      </div>

    </div>
  );
};
