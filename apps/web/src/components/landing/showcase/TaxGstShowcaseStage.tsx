import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  LandingSliderField,
  LandingSegmentedToggle,
  LandingMetricCard
} from '../primitives/index.js';

export interface TaxGstShowcaseStageProps {
  initialIncome?: number;
  initialRegime?: 'new' | 'old';
}

export const TaxGstShowcaseStage: React.FC<TaxGstShowcaseStageProps> = ({
  initialIncome = 1800000,
  initialRegime = 'new'
}) => {
  const [taxRegime, setTaxRegime] = useState<'new' | 'old'>(initialRegime);
  const [selectedGrossIncome, setSelectedGrossIncome] = useState<number>(initialIncome);

  // Tax calculation helper for interactive preview
  const calculateTax = (income: number, regime: 'new' | 'old') => {
    if (regime === 'new') {
      // FY 2024-25 New Regime with standard deduction ₹75,000
      const taxable = Math.max(0, income - 75000);
      if (taxable <= 700000) return 0; // Rebate 87A
      let tax = 0;
      if (taxable > 300000) tax += Math.min(taxable - 300000, 400000) * 0.05;
      if (taxable > 700000) tax += Math.min(taxable - 700000, 300000) * 0.10;
      if (taxable > 1000000) tax += Math.min(taxable - 1000000, 200000) * 0.15;
      if (taxable > 1200000) tax += Math.min(taxable - 1200000, 300000) * 0.20;
      if (taxable > 1500000) tax += (taxable - 1500000) * 0.30;
      return Math.round(tax * 1.04); // 4% cess
    } else {
      // Old Regime with ₹2,50,000 deductions (80C 1.5L + 80D 25k + 80CCD 50k + Std Ded 50k)
      const taxable = Math.max(0, income - 275000);
      if (taxable <= 500000) return 0;
      let tax = 0;
      if (taxable > 250000) tax += Math.min(taxable - 250000, 250000) * 0.05;
      if (taxable > 500000) tax += Math.min(taxable - 500000, 500000) * 0.20;
      if (taxable > 1000000) tax += (taxable - 1000000) * 0.30;
      return Math.round(tax * 1.04);
    }
  };

  const currentTax = calculateTax(selectedGrossIncome, taxRegime);
  const altTax = calculateTax(selectedGrossIncome, taxRegime === 'new' ? 'old' : 'new');
  const taxSavings = Math.max(0, altTax - currentTax);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Regime Selector Toggle */}
      <LandingSegmentedToggle
        value={taxRegime}
        onChange={setTaxRegime}
        options={[
          { value: 'new', label: 'New Tax Regime (Section 115BAC)' },
          { value: 'old', label: 'Old Tax Regime (With 80C & 80D)' }
        ]}
        ariaLabel="Income Tax Regime"
      />

      {/* Gross Salary Interactive Slider */}
      <LandingSliderField
        id="gross-income-slider"
        label="Annual Gross Income (CTC / Professional Receipts)"
        value={selectedGrossIncome}
        displayValue={`₹${(selectedGrossIncome / 100000).toFixed(2)} Lakhs`}
        min={500000}
        max={5000000}
        step={50000}
        accentColor="#06b6d4"
        onChange={setSelectedGrossIncome}
      />

      {/* 2-Card Comparative Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
        <LandingMetricCard
          label={`Estimated Tax Liability (${taxRegime.toUpperCase()})`}
          value={`₹${currentTax.toLocaleString('en-IN')}`}
          sub={`Effective rate: ${((currentTax / selectedGrossIncome) * 100).toFixed(1)}% (Inc. 4% Cess)`}
          variant="cyan"
        />
        <LandingMetricCard
          label="Recommended Savings Option"
          value={taxSavings > 0 ? `Save ₹${taxSavings.toLocaleString('en-IN')}` : 'Optimal Regime Active'}
          sub={taxRegime === 'new' ? 'Standard ₹75,000 deduction included' : 'Full 80C + 80D loaded'}
          variant="emerald"
        />
      </div>

      {/* GST B2B Quick Invoicing Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.15rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          fontSize: '0.82rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={16} color="#06b6d4" />
          <span style={{ color: '#ffffff', fontWeight: 600 }}>GSTR-1 & 3B Auto-Reconciliation</span>
        </div>
        <span style={{ color: '#67e8f9', fontWeight: 700, fontSize: '0.75rem' }}>HSN 998311 • 18% GST</span>
      </div>
    </div>
  );
};
