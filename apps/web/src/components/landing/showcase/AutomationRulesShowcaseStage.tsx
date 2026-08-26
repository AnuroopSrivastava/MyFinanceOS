import React, { useState } from 'react';
import {
  LandingSliderField,
  LandingChipGroup,
  LandingMetricCard
} from '../primitives/index.js';

export interface AutomationRulesShowcaseStageProps {
  initialMonthlySip?: number;
  initialStrategy?: 'wealth' | 'balanced' | 'debt';
}

export const AutomationRulesShowcaseStage: React.FC<AutomationRulesShowcaseStageProps> = ({
  initialMonthlySip = 25000,
  initialStrategy = 'wealth'
}) => {
  const [monthlySipAmount, setMonthlySipAmount] = useState<number>(initialMonthlySip);
  const [autoAllocationRule, setAutoAllocationRule] = useState<'wealth' | 'balanced' | 'debt'>(initialStrategy);

  // SIP 10-Year compounding helper at 14% annual return (Nifty 50 CAGR)
  const calculateSipCorpus = (monthly: number, years: number = 10, annualRate: number = 0.14) => {
    const r = annualRate / 12;
    const n = years * 12;
    const fv = monthly * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    return Math.round(fv);
  };

  const projectedCorpus = calculateSipCorpus(monthlySipAmount);
  const totalInvested = monthlySipAmount * 120;
  const wealthGain = projectedCorpus - totalInvested;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Allocation Strategy Chips */}
      <LandingChipGroup
        value={autoAllocationRule}
        onChange={(val) => setAutoAllocationRule(val as any)}
        options={[
          { value: 'wealth', label: 'Wealth Accelerator' },
          { value: 'balanced', label: 'Balanced Sovereign' },
          { value: 'debt', label: 'Debt Elimination' }
        ]}
        ariaLabel="Auto-Debit Allocation Strategy"
        style={{ width: '100%' }}
      />

      {/* Monthly SIP Amount Slider */}
      <LandingSliderField
        id="monthly-sip-slider"
        label="Monthly Automated SIP (Nifty 50 Index)"
        value={monthlySipAmount}
        displayValue={`₹${monthlySipAmount.toLocaleString('en-IN')} / mo`}
        min={5000}
        max={150000}
        step={2500}
        accentColor="#10b981"
        onChange={setMonthlySipAmount}
      />

      {/* 10-Year Compounding Projection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <LandingMetricCard
          label="10-Yr Projected Corpus (14% CAGR)"
          value={`₹${(projectedCorpus / 100000).toFixed(2)} Lakhs`}
          sub={`Total Invested: ₹${(totalInvested / 100000).toFixed(2)}L`}
          variant="cyan"
        />
        <LandingMetricCard
          label="Compounded Wealth Gain"
          value={`+₹${(wealthGain / 100000).toFixed(2)} Lakhs`}
          sub="Auto-Debit on 01st of every month"
          variant="emerald"
        />
      </div>
    </div>
  );
};
