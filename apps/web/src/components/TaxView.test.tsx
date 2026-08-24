import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaxView } from './TaxView.js';

vi.mock('@financeos/database', () => ({
  dbService: {
    getAccounts: () => [],
    getTransactions: () => [],
    getFds: () => [],
    getFDs: () => [],
    getStocks: () => [],
    getMutualFunds: () => [],
    getGold: () => [],
    getTDSRecords: () => [],
    getTdsRecords: () => [],
    getProfiles: () => [{ id: 'p1', name: 'Test User' }],
    subscribe: () => () => {},
    onUnsavedChangeStatus: () => () => {},
    onSaveErrorStatus: () => () => {}
  }
}));

describe('TaxView Component Diagnostics', () => {
  it('renders Indian Tax Optimizer headers and regime comparison', () => {
    render(<TaxView activeProfileId="default" />);

    expect(screen.getByText(/India Tax Optimizer/i)).toBeTruthy();
    expect(screen.getByText(/Deduction Engine/i)).toBeTruthy();
    expect(screen.getByText(/Advance Tax Schedule \(Sec 208\)/i)).toBeTruthy();
    expect(screen.getByText(/TDS Summary/i)).toBeTruthy();
  });

  it('shows empty state without phantom optimization actions when profile has no income data', () => {
    render(<TaxView activeProfileId="empty-profile" />);

    expect(screen.getByText(/No income or deduction data recorded for this profile/i)).toBeTruthy();
    expect(screen.queryByText(/Invest in ELSS \/ PPF to max 80C/i)).toBeNull();
    expect(screen.queryByText(/Buy health insurance to max 80D/i)).toBeNull();
    expect(screen.queryByText(/Contribute to NPS Tier I/i)).toBeNull();
  });
});
