import React, { useState, useEffect } from 'react';
import { dbService } from '@financeos/database';
import { formatRupee as formatINR, calculateFIRECorpus, calculateStepUpSIPWealth } from '@financeos/shared';
import { MetricCard, FormField, SummaryMetricGrid } from '@financeos/ui';
import { Flame, TrendingUp, Target, Award, ArrowUpRight, ShieldCheck } from 'lucide-react';

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
  // Shared production formula — see utils/financialCalculations.ts
  const standardFireCorpus = calculateFIRECorpus(monthlyExpense, swr);
  const leanFireCorpus = Math.round(standardFireCorpus * 0.75); // 75% of standard
  const fatFireCorpus = Math.round(standardFireCorpus * 1.5); // 150% of standard

  const activeCorpus = currentCorpus || currentLiquidNetWorth || 0;

  // Calculate future value of corpus with SIP & annual step-up
  const { totalCorpus: futureWealth, totalInvested } = calculateStepUpSIPWealth(
    activeCorpus,
    monthlySip,
    expectedReturn,
    annualStepUp,
    yearsToRetire * 12
  );
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-15)' }}>
      
      {/* Overview Cards */}
      <SummaryMetricGrid minItemWidth="240px">
        <MetricCard
          label={`Target FIRE Corpus (${swr}% SWR)`}
          value={formatINR(standardFireCorpus)}
          icon={<Flame size={15} color="var(--accent-1)" />}
          subtext={`Based on ${formatINR(monthlyExpense)}/mo expenses`}
          accentColor="var(--accent-1)"
        />
        <MetricCard
          label={`Projected Wealth (${yearsToRetire} Yrs)`}
          value={formatINR(futureWealth)}
          icon={<TrendingUp size={15} color="var(--success)" />}
          subtext={`Invested: ${formatINR(totalInvested)} | Gains: ${formatINR(totalGains)}`}
          accentColor="var(--success)"
        />
        <MetricCard
          label="FIRE Readiness"
          value={`${fireProgress}%`}
          icon={<ShieldCheck size={15} color="var(--accent-1)" />}
          progress={fireProgress}
          accentColor="var(--accent-1)"
        />
      </SummaryMetricGrid>

      {/* Control Sliders & Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 'var(--spacing-15)' }}>
        {/* FIRE Parameters */}
        <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-15)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
            <Flame size={18} color="var(--accent-1)" /> FIRE Goal Parameters
          </h3>

          <FormField label="Estimated Monthly Living Expense (₹)" htmlFor="fire-monthly-expense">
            <input
              id="fire-monthly-expense"
              type="number"
              className="form-input"
              value={monthlyExpense}
              onChange={e => setMonthlyExpense(Math.max(0, Number(e.target.value)))}
            />
          </FormField>

          <FormField label="Current Liquid Net Worth (₹)" htmlFor="fire-current-corpus">
            <input
              id="fire-current-corpus"
              type="number"
              className="form-input"
              value={currentCorpus}
              onChange={e => setCurrentCorpus(Math.max(0, Number(e.target.value)))}
            />
          </FormField>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-04)' }}>
              <label htmlFor="fire-inflation-slider">Expected Annual Inflation Rate</label>
              <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>{inflationRate}%</span>
            </div>
            <input
              id="fire-inflation-slider"
              aria-label="Expected Annual Inflation Rate"
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-04)' }}>
              <label htmlFor="fire-swr-slider">Safe Withdrawal Rate (SWR)</label>
              <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>{swr}%</span>
            </div>
            <input
              id="fire-swr-slider"
              aria-label="Safe Withdrawal Rate"
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
          <div style={{ marginTop: 'var(--spacing-05)', background: 'var(--surface-tint)', padding: 'var(--spacing-08)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--spacing-05)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-body)' }}>FIRE TARGET TIERS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', padding: 'var(--spacing-02) 0' }}>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Lean FIRE (Essential living):</span>
              <span style={{ fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>{formatINR(leanFireCorpus)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', padding: 'var(--spacing-02) 0' }}>
              <span style={{ color: 'var(--accent-1)', fontFamily: 'var(--font-body)' }}>Standard FIRE:</span>
              <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--accent-1)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>{formatINR(standardFireCorpus)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', padding: 'var(--spacing-02) 0' }}>
              <span style={{ color: 'var(--color-asset-mf)', fontFamily: 'var(--font-body)' }}>Fat FIRE (Luxurious lifestyle):</span>
              <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--color-asset-mf)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>{formatINR(fatFireCorpus)}</span>
            </div>
          </div>
        </div>

        {/* Step-Up SIP Calculator */}
        <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-15)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
            <TrendingUp size={18} color="var(--success)" /> Step-Up SIP Parameters
          </h3>

          <FormField label="Starting Monthly SIP Amount (₹)" htmlFor="fire-sip-monthly">
            <input
              id="fire-sip-monthly"
              type="number"
              className="form-input"
              value={monthlySip}
              onChange={e => setMonthlySip(Math.max(0, Number(e.target.value)))}
            />
          </FormField>

          <FormField label="Annual Step-up Percentage (%/year)" htmlFor="fire-sip-stepup">
            <input
              id="fire-sip-stepup"
              type="number"
              className="form-input"
              value={annualStepUp}
              onChange={e => setAnnualStepUp(Math.max(0, Number(e.target.value)))}
            />
          </FormField>

          <FormField label="Expected Annual Return (%)" htmlFor="fire-sip-return">
            <input
              id="fire-sip-return"
              type="number"
              className="form-input"
              value={expectedReturn}
              onChange={e => setExpectedReturn(Math.max(0, Number(e.target.value)))}
            />
          </FormField>

          <FormField label="Expected Inflation Rate (%)" htmlFor="fire-sip-inflation">
            <input
              id="fire-sip-inflation"
              type="number"
              className="form-input"
              value={inflationRate}
              onChange={e => setInflationRate(Math.max(0, Number(e.target.value)))}
            />
          </FormField>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-04)' }}>
              <label htmlFor="fire-sip-years" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                Years to Retirement: <strong style={{ color: 'var(--text-primary)' }}>{yearsToRetire} Years</strong>
              </label>
            </div>
            <input
              id="fire-sip-years"
              aria-label="Years to Retirement"
              type="range"
              min="1"
              max="35"
              step="1"
              value={yearsToRetire}
              onChange={e => setYearsToRetire(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--success)' }}
            />
          </div>

          <div style={{ marginTop: 'var(--spacing-05)', background: 'var(--success-bg)', padding: 'var(--spacing-08)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-paid-border)' }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--success)', marginBottom: 'var(--spacing-04)', fontWeight: 'var(--fw-semibold)' }}>COMPOUNDING POWER</div>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Real Return (Adjusted for Inflation): <strong style={{ color: 'var(--text-primary)' }}>{realReturnRate.toFixed(1)}% p.a.</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Projections Timeline */}
      <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-15)' }}>
        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--spacing-1)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
          <Award size={18} color="var(--accent-1)" /> Wealth Milestone Timeline
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-1)' }}>
          {milestones.map(m => {
            const timeToReach = getMilestoneYear(m.target);
            const isAchieved = timeToReach.includes('Achieved');

            return (
              <div
                key={m.label}
                className="glass-card"
                style={{
                  padding: 'var(--spacing-1)',
                  borderTop: `3px solid ${isAchieved ? 'var(--success)' : 'var(--border-color)'}`,
                  background: isAchieved ? 'var(--success-bg)' : 'var(--surface-faint)'
                }}
              >
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>Target Milestone</div>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-heavy)', margin: 'var(--spacing-02) 0', color: isAchieved ? 'var(--success)' : 'var(--text-primary)' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 'var(--font-sm)', color: isAchieved ? 'var(--success)' : 'var(--accent-1)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)' }}>
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
