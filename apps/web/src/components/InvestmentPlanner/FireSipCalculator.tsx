import React, { useState, useEffect } from 'react';
import { dbService } from '@financeos/database';
import { formatRupee as formatINR } from '../../utils/currency.js';
import { Flame, TrendingUp, Target, Award, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';

interface FireSipCalculatorProps {
  activeProfileId?: string;
  currentMonthlyExpense: number;
  currentLiquidNetWorth: number;
}

export const FireSipCalculator: React.FC<FireSipCalculatorProps> = ({
  activeProfileId,
  currentMonthlyExpense,
  currentLiquidNetWorth
}) => {
  const [monthlyExpense, setMonthlyExpense] = useState<number>(0);
  const [currentCorpus, setCurrentCorpus] = useState<number>(0);
  const [monthlySip, setMonthlySip] = useState<number>(0);
  const [annualStepUp, setAnnualStepUp] = useState<number>(10); // 10% step up per year
  const [expectedReturn, setExpectedReturn] = useState<number>(12); // 12% CAGR
  const [inflationRate, setInflationRate] = useState<number>(6); // 6% annual inflation
  const [swr, setSwr] = useState<number>(3.5); // 3.5% Safe Withdrawal Rate
  const [yearsToRetire, setYearsToRetire] = useState<number>(15);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!activeProfileId) return;
    try {
      const saved = dbService.getFireInputs?.(activeProfileId);
      if (saved) {
        if (saved.monthlyExpense !== undefined) setMonthlyExpense(saved.monthlyExpense);
        if (saved.currentCorpus !== undefined) setCurrentCorpus(saved.currentCorpus);
        if (saved.monthlySip !== undefined) setMonthlySip(saved.monthlySip);
        if (saved.annualStepUp !== undefined) setAnnualStepUp(saved.annualStepUp);
        if (saved.yearsToRetire !== undefined) setYearsToRetire(saved.yearsToRetire);
        if (saved.expectedReturn !== undefined) setExpectedReturn(saved.expectedReturn);
        if (saved.expectedInflation !== undefined) setInflationRate(saved.expectedInflation);
        if (saved.swrPct !== undefined) setSwr(saved.swrPct);
      }
    } catch (e) {
      console.error('Failed to load FIRE inputs', e);
    } finally {
      setIsLoaded(true);
    }
  }, [activeProfileId]);

  useEffect(() => {
    if (!activeProfileId || !isLoaded) return;
    const timer = setTimeout(() => {
      dbService.updateFireInputs(activeProfileId, {
        monthlyExpense,
        currentCorpus,
        monthlySip,
        annualStepUp,
        yearsToRetire,
        expectedReturn,
        expectedInflation: inflationRate,
        swrPct: swr
      }).catch(console.error);
    }, 150);
    return () => clearTimeout(timer);
  }, [monthlyExpense, currentCorpus, monthlySip, annualStepUp, yearsToRetire, expectedReturn, inflationRate, swr, activeProfileId, isLoaded]);

  const annualExpense = monthlyExpense * 12;
  
  // Real return rate (Fisher equation approximation)
  const realReturnRate = Math.max(0, expectedReturn - inflationRate);

  // Target FIRE Corpuses based on SWR (25x for 4%, ~28.5x for 3.5%, 33.3x for 3%)
  const standardFireCorpus = swr > 0 ? Math.round(annualExpense / (swr / 100)) : 0;
  const leanFireCorpus = Math.round(standardFireCorpus * 0.75); // 75% of standard
  const fatFireCorpus = Math.round(standardFireCorpus * 1.5); // 150% of standard

  const activeCorpus = currentCorpus || currentLiquidNetWorth || 0;

  // Calculate future value of corpus with SIP & annual step-up
  const calculateSIPWealth = (months: number) => {
    if (months === 0 || (monthlySip <= 0 && activeCorpus <= 0)) {
      return { totalCorpus: activeCorpus, totalInvested: activeCorpus };
    }
    const r = expectedReturn / 100 / 12;
    let totalCorpus = activeCorpus;
    let totalInvested = activeCorpus;
    let currentMonthlySip = monthlySip;

    for (let m = 1; m <= months; m++) {
      totalCorpus = (totalCorpus + currentMonthlySip) * (1 + r);
      totalInvested += currentMonthlySip;

      // Increase SIP every 12 months by annualStepUp %
      if (m % 12 === 0) {
        currentMonthlySip *= (1 + annualStepUp / 100);
      }
    }

    return { totalCorpus: Math.round(totalCorpus), totalInvested: Math.round(totalInvested) };
  };

  const { totalCorpus: futureWealth, totalInvested } = calculateSIPWealth(yearsToRetire * 12);
  const totalGains = Math.max(0, futureWealth - totalInvested);

  // Milestone timeline targets
  const milestones = [
    { label: '₹25 Lakhs', target: 2500000 },
    { label: '₹50 Lakhs', target: 5000000 },
    { label: '₹1 Crore', target: 10000000 },
    { label: '₹3 Crores', target: 30000000 },
    { label: '₹5 Crores', target: 50000000 }
  ];

  const getMilestoneYear = (targetAmount: number) => {
    let corpus = activeCorpus;
    let sip = monthlySip;
    const r = expectedReturn / 100 / 12;

    if (corpus >= targetAmount) return 'Achieved 🎉';
    if (sip <= 0 && corpus <= 0) return '--';

    for (let m = 1; m <= 480; m++) { // Up to 40 years
      corpus = (corpus + sip) * (1 + r);
      if (m % 12 === 0) sip *= (1 + annualStepUp / 100);
      if (corpus >= targetAmount) {
        const years = Math.floor(m / 12);
        const months = m % 12;
        return years > 0 ? `${years}y ${months > 0 ? `${months}m` : ''}` : `${months} months`;
      }
    }
    return '40+ years';
  };

  const fireProgress = standardFireCorpus > 0
    ? Math.min(100, Math.max(0, Math.round((activeCorpus / standardFireCorpus) * 100)))
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Target FIRE Corpus ({swr}% SWR)</span>
            <Flame size={18} color="var(--accent-1)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {formatINR(standardFireCorpus)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Based on {formatINR(monthlyExpense)}/mo expenses
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Projected Wealth ({yearsToRetire} Yrs)</span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981', marginTop: '0.5rem' }}>
            {formatINR(futureWealth)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Invested: {formatINR(totalInvested)} | Gains: {formatINR(totalGains)}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>FIRE Readiness</span>
            <ShieldCheck size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.5rem' }}>
            {fireProgress}%
          </div>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
            <div style={{ width: `${fireProgress}%`, background: '#3b82f6', height: '100%', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Control Sliders & Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* FIRE Parameters */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={18} color="var(--accent-1)" /> FIRE Goal Parameters
          </h3>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
              Estimated Monthly Living Expense (₹)
            </label>
            <input
              type="number"
              className="form-input"
              value={monthlyExpense}
              onChange={e => setMonthlyExpense(Math.max(0, Number(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
              Current Liquid Net Worth (₹)
            </label>
            <input
              type="number"
              className="form-input"
              value={currentCorpus}
              onChange={e => setCurrentCorpus(Math.max(0, Number(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              <span>Expected Annual Inflation Rate</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inflationRate}%</span>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              step="0.5"
              value={inflationRate}
              onChange={e => setInflationRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-1)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              <span>Safe Withdrawal Rate (SWR)</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{swr}%</span>
            </div>
            <input
              type="range"
              min="2.5"
              max="5.0"
              step="0.1"
              value={swr}
              onChange={e => setSwr(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-1)' }}
            />
          </div>

          {/* FIRE Tier Matrix */}
          <div style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>FIRE TARGET TIERS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.2rem 0' }}>
              <span style={{ color: '#94a3b8' }}>Lean FIRE (Essential living):</span>
              <span style={{ fontWeight: 600 }}>{formatINR(leanFireCorpus)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.2rem 0' }}>
              <span style={{ color: 'var(--accent-1)' }}>Standard FIRE:</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-1)' }}>{formatINR(standardFireCorpus)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.2rem 0' }}>
              <span style={{ color: '#a855f7' }}>Fat FIRE (Luxurious lifestyle):</span>
              <span style={{ fontWeight: 600, color: '#a855f7' }}>{formatINR(fatFireCorpus)}</span>
            </div>
          </div>
        </div>

        {/* Step-Up SIP Calculator */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#10b981" /> Step-Up SIP Parameters
          </h3>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
              Starting Monthly SIP Amount (₹)
            </label>
            <input
              type="number"
              className="form-input"
              value={monthlySip}
              onChange={e => setMonthlySip(Math.max(0, Number(e.target.value)))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              <span>Annual SIP Step-Up % (Annual Increase)</span>
              <span style={{ fontWeight: 600, color: '#10b981' }}>{annualStepUp}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={annualStepUp}
              onChange={e => setAnnualStepUp(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10b981' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              <span>Expected Investment Returns (CAGR)</span>
              <span style={{ fontWeight: 600, color: '#10b981' }}>{expectedReturn}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="0.5"
              value={expectedReturn}
              onChange={e => setExpectedReturn(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10b981' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              <span>Investment Time Horizon</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{yearsToRetire} Years</span>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              step="1"
              value={yearsToRetire}
              onChange={e => setYearsToRetire(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-1)' }}
            />
          </div>

          <div style={{ marginTop: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '0.78rem', color: '#10b981', marginBottom: '0.3rem', fontWeight: 600 }}>COMPOUNDING POWER</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Real Return (Adjusted for Inflation): <strong style={{ color: '#fff' }}>{realReturnRate.toFixed(1)}% p.a.</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Milestone Projections Timeline */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={18} color="var(--accent-1)" /> Wealth Milestone Timeline
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {milestones.map(m => {
            const timeToReach = getMilestoneYear(m.target);
            const isAchieved = timeToReach.includes('Achieved');

            return (
              <div
                key={m.label}
                className="glass-card"
                style={{
                  padding: '1rem',
                  borderTop: `3px solid ${isAchieved ? '#10b981' : 'var(--border-color)'}`,
                  background: isAchieved ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Milestone</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.2rem 0', color: isAchieved ? '#10b981' : 'var(--text-primary)' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: isAchieved ? '#10b981' : 'var(--accent-1)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ArrowUpRight size={14} />
                  <span>{timeToReach}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
