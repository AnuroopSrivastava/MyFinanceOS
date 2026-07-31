import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '@financeos/database';
import { formatRupee } from '../utils/currency.js';
import { exportToCSV } from '../utils/exportCsv.js';
import { Calculator, Download, IndianRupee, Clock, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts';

interface EMICalculatorProps {
  activeProfileId: string;
}

interface AmortRow {
  month: number;
  openingBalance: number;
  emi: number;
  principal: number;
  interest: number;
  closingBalance: number;
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
  const monthlyRate = rate / 12 / 100;

  const emi = useMemo(() => {
    if (tenureMonths === 0) return 0;
    if (monthlyRate === 0) return principal / tenureMonths;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  }, [principal, monthlyRate, tenureMonths]);

  const amortization = useMemo(() => {
    const rows: AmortRow[] = [];
    let balance = principal;
    let totalInterest = 0;
    let totalPrincipal = 0;

    for (let m = 1; m <= tenureMonths && balance > 0; m++) {
      let currentPrepayment = 0;
      const openingBalance = balance;
      
      // Apply prepayment at specified month
      if (prepayment > 0 && m === prepaymentMonth) {
        currentPrepayment = Math.min(balance, prepayment);
        balance = Math.max(0, balance - currentPrepayment);
      }

      const interestPart = balance * monthlyRate;
      let principalPart = emi - interestPart;
      
      if (principalPart > balance) principalPart = balance;
      const closingBalance = Math.max(0, balance - principalPart);

      totalInterest += interestPart;
      totalPrincipal += (principalPart + currentPrepayment);

      rows.push({
        month: m,
        openingBalance: Math.round(openingBalance),
        emi: Math.round(emi + currentPrepayment),
        principal: Math.round(principalPart + currentPrepayment),
        interest: Math.round(interestPart),
        closingBalance: Math.round(closingBalance)
      });

      balance = closingBalance;
      if (balance <= 0) break;
    }

    return { rows, totalInterest: Math.round(totalInterest), totalPrincipal: Math.round(totalPrincipal), totalPayment: Math.round(totalInterest + totalPrincipal), actualTenure: rows.length };
  }, [principal, monthlyRate, emi, tenureMonths, prepayment, prepaymentMonth]);

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

  const [showFullTable, setShowFullTable] = useState(false);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Input Controls */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calculator size={18} color="var(--accent-1)" /> EMI & Loan Amortization Calculator
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {/* Principal Input & Slider */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loan Amount</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.2rem 0.5rem', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-1)', fontWeight: 700 }}>₹</span>
                <input
                  type="number"
                  min={0}
                  max={500000000}
                  step={10000}
                  value={principal}
                  onChange={e => setPrincipal(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: '120px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-1)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    outline: 'none',
                    textAlign: 'right'
                  }}
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={50000000}
              step={100000}
              value={principal}
              onChange={e => setPrincipal(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-1)', marginTop: '0.3rem' }}
            />
          </div>

          {/* Interest Rate Input & Slider */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Interest Rate</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.2rem 0.5rem', border: '1px solid var(--border-color)' }}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={rate}
                  onChange={e => setRate(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: '60px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-1)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    outline: 'none',
                    textAlign: 'right'
                  }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-1)', fontWeight: 700 }}>%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              step={0.1}
              value={rate}
              onChange={e => setRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-1)', marginTop: '0.3rem' }}
            />
          </div>

          {/* Tenure Input & Slider */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tenure</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.2rem 0.5rem', border: '1px solid var(--border-color)' }}>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={1}
                  value={tenureYears}
                  onChange={e => setTenureYears(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: '50px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-1)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    outline: 'none',
                    textAlign: 'right'
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-1)', fontWeight: 600 }}>Yrs</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={tenureYears}
              onChange={e => setTenureYears(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-1)', marginTop: '0.3rem' }}
            />
          </div>

          {/* Prepayment Input & Slider */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Lump-Sum Prepayment</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.2rem 0.5rem', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 700 }}>₹</span>
                <input
                  type="number"
                  min={0}
                  max={500000000}
                  step={10000}
                  value={prepayment}
                  onChange={e => setPrepayment(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: '110px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--warning)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    outline: 'none',
                    textAlign: 'right'
                  }}
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(100000, principal * 0.5)}
              step={10000}
              value={prepayment}
              onChange={e => setPrepayment(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--warning)', marginTop: '0.3rem' }}
            />
            {prepayment > 0 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Applied at month {prepaymentMonth}
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, tenureMonths)}
                  value={prepaymentMonth}
                  onChange={e => setPrepaymentMonth(Number(e.target.value))}
                  style={{
                    width: '50px',
                    marginLeft: '0.3rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '0.1rem 0.3rem',
                    fontSize: '0.7rem'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Monthly EMI</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-1)' }}>{formatRupee(Math.round(emi))}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Total Interest</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>{formatRupee(amortization.totalInterest)}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Total Payment</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatRupee(amortization.totalPayment)}</div>
        </div>
        {savings > 0 && (
          <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', borderColor: 'var(--success)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginBottom: '0.3rem' }}>Prepayment Savings</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{formatRupee(savings)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Tenure reduced to {Math.ceil(amortization.actualTenure / 12)}Y {amortization.actualTenure % 12}M
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="responsive-stack">

        {/* Pie Chart */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieIcon size={14} color="var(--accent-2)" /> Principal vs Interest
          </h4>
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatRupee(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.78rem' }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{d.name}: {formatRupee(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Balance Over Time */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={14} color="var(--accent-1)" /> Outstanding Balance Over Time
          </h4>
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer>
              <AreaChart data={yearlyData}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--error)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--error)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: any) => formatRupee(v)} contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                <Area type="monotone" dataKey="balance" stroke="var(--error)" strokeWidth={2} fillOpacity={1} fill="url(#balGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Amortization Table */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IndianRupee size={14} color="var(--accent-1)" /> Amortization Schedule
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onPointerDown={() => setShowFullTable(!showFullTable)}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
              {showFullTable ? 'Show Less' : `Show All ${amortization.rows.length} Months`}
            </button>
            <button className="btn btn-primary" onPointerDown={() => exportToCSV('emi_amortization', [
              { label: 'Month', key: 'month' }, { label: 'Opening Balance', key: 'openingBalance' },
              { label: 'EMI', key: 'emi' }, { label: 'Principal', key: 'principal' },
              { label: 'Interest', key: 'interest' }, { label: 'Closing Balance', key: 'closingBalance' }
            ], amortization.rows)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}>
              <Download size={12} /> CSV
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: showFullTable ? '500px' : '240px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Month', 'Opening Balance', 'EMI', 'Principal', 'Interest', 'Closing Balance'].map(h => (
                  <th key={h} style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(showFullTable ? amortization.rows : amortization.rows.slice(0, 12)).map(r => (
                <tr key={r.month} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>{r.month}</td>
                  <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>{formatRupee(r.openingBalance)}</td>
                  <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>{formatRupee(r.emi)}</td>
                  <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', color: 'var(--success)' }}>{formatRupee(r.principal)}</td>
                  <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', color: 'var(--error)' }}>{formatRupee(r.interest)}</td>
                  <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>{formatRupee(r.closingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
