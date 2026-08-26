import React from 'react';
import { LandingMetricCard, LandingAllocationBar } from '../primitives/index.js';

export interface InvestmentsWealthShowcaseStageProps {
  netWorth?: string;
  xirr?: string;
  runway?: string;
  runwayDetails?: string;
}

const DEFAULT_ALLOCATIONS = [
  { label: 'Indian Equities & Nifty 50 Index', pct: 55, color: '#06b6d4', amount: '₹81.4L' },
  { label: 'Debt & Corporate Bonds / EPF', pct: 25, color: '#10b981', amount: '₹37.0L' },
  { label: 'Physical / Sovereign Gold Bonds', pct: 12, color: '#f59e0b', amount: '₹17.7L' },
  { label: 'Fixed Deposits & Cash Reserves', pct: 8, color: '#3b82f6', amount: '₹11.9L' }
];

export const InvestmentsWealthShowcaseStage: React.FC<InvestmentsWealthShowcaseStageProps> = ({
  netWorth = '₹1.48 Cr',
  xirr = '+18.4% Portfolio XIRR',
  runway = '8.4 Months',
  runwayDetails = '₹8.5L Liquid Overnight Fund'
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 2-Column KPI Readout Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
        <LandingMetricCard
          label="Total Net Worth"
          value={netWorth}
          sub={<span style={{ color: '#34d399', fontWeight: 700 }}>{xirr}</span>}
          variant="default"
        />
        <LandingMetricCard
          label="Emergency Runway"
          value={runway}
          sub={runwayDetails}
          variant="cyan"
        />
      </div>

      {/* Asset Allocation Bars */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '14px',
          padding: '1.15rem'
        }}
      >
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '0.85rem'
          }}
        >
          Target vs Actual Asset Allocation
        </div>

        {DEFAULT_ALLOCATIONS.map((item, idx) => (
          <LandingAllocationBar
            key={idx}
            label={item.label}
            amount={item.amount}
            pct={item.pct}
            color={item.color}
          />
        ))}
      </div>
    </div>
  );
};
