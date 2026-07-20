import React from 'react';
import { CurrencyInput } from '../ui/CurrencyInput.js';
import { formatRupee } from '../../utils/currency.js';

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
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Step 1: Your Income & Goal</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>

        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            Monthly Salary (₹)
          </label>
          <CurrencyInput
            className="form-input"
            value={salary || ''}
            onChange={(e) => onSalaryChange(Number(e.target.value))}
            placeholder="e.g. 100000"
            style={{ width: '100%', fontSize: '1.1rem' }}
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            Investment Goal ({investmentPercentage}%)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="range"
              min="0"
              max="100"
              value={investmentPercentage}
              onChange={(e) => onInvestmentPercentageChange(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              className="form-input"
              value={investmentPercentage}
              onChange={(e) => onInvestmentPercentageChange(Math.min(100, Math.max(0, Number(e.target.value))))}
              style={{ width: '70px', textAlign: 'center' }}
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="form-group" style={{
          background: 'var(--accent-grad)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
            Monthly Investment Pool
          </div>
          <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {formatRupee(totalInvestmentAmount)}
          </div>
        </div>

      </div>
    </div>
  );
};
