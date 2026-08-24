import { CurrencyInput, FormField } from '@financeos/ui';
import React from 'react';
import { formatRupee } from '@financeos/shared';

interface TopLevelInputsProps {
  salary: number;
  investmentPercentage: number;
  onSalaryChange: (val: number) => void;
  onInvestmentPercentageChange: (val: number) => void;
}

export const TopLevelInputs: React.FC<TopLevelInputsProps> = ({
  salary,
  investmentPercentage,
  onSalaryChange,
  onInvestmentPercentageChange
}) => {
  const totalInvestmentAmount = (salary * investmentPercentage) / 100;

  return (
    <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-15)', marginBottom: 'var(--spacing-15)' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-bold)', letterSpacing: '-0.015em', marginBottom: 'var(--spacing-125)' }}>Step 1: Your Income & Goal</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 'var(--spacing-15)' }}>

        <FormField label="Monthly Salary (₹)" htmlFor="plan-salary-input">
          <CurrencyInput
            id="plan-salary-input"
            className="form-input"
            value={salary || ''}
            onChange={(e) => onSalaryChange(Number(e.target.value))}
            placeholder="e.g. 100000"
            style={{ width: '100%', fontSize: 'var(--font-lg)' }}
          />
        </FormField>

        <FormField label={`Investment Goal (${investmentPercentage}%)`} htmlFor="plan-goal-slider">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
            <input
              id="plan-goal-slider"
              type="range"
              min="0"
              max="100"
              value={investmentPercentage}
              onChange={(e) => onInvestmentPercentageChange(Number(e.target.value))}
              aria-label="Investment goal percentage slider"
              style={{ flex: 1 }}
            />
            <input
              type="number"
              className="form-input"
              value={investmentPercentage}
              onChange={(e) => onInvestmentPercentageChange(Math.min(100, Math.max(0, Number(e.target.value))))}
              aria-label="Investment goal percentage value"
              style={{ width: '80px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
              min="0"
              max="100"
            />
          </div>
        </FormField>

        <div className="form-group" style={{
          background: 'var(--accent-grad)',
          padding: 'var(--spacing-1)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'var(--font-xs)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--spacing-02)', fontFamily: 'var(--font-body)' }}>
            Monthly Investment Pool
          </div>
          <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 'var(--font-2xl)', fontWeight: 'var(--fw-heavy)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>
            {formatRupee(totalInvestmentAmount)}
          </div>
        </div>

      </div>
    </div>
  );
};
