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
    getProfiles: () => [{ id: 'default', name: 'Test User' }]
  }
}));

describe('TaxView Component Diagnostics', () => {
  it('renders Indian Tax Engine headers and regime comparison', () => {
    render(<TaxView activeProfileId="default" />);

    expect(screen.getByText(/India Tax Planner/i)).toBeTruthy();
    expect(screen.getByText(/Income & Deductions Form/i)).toBeTruthy();
    expect(screen.getByText(/Advance Tax Quarterly Schedule/i)).toBeTruthy();
    expect(screen.getByText(/TDS Summary/i)).toBeTruthy();
  });
});
