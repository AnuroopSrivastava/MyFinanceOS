import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { LedgerView } from './LedgerView.js';

vi.mock('@financeos/database', () => ({
  dbService: {
    getAccounts: () => [],
    getTransactions: () => [],
    getRecurringTransactions: () => [],
    getStocks: () => [],
    getMutualFunds: () => [],
    getFDs: () => [],
    getGold: () => [],
    getProfiles: () => [{ id: 'default', name: 'Test User' }],
    getBudgets: () => []
  }
}));

describe('LedgerView Component Diagnostics', () => {
  it('renders Transaction Log & Financial Ledger', () => {
    render(<LedgerView activeProfileId="default" />);

    expect(screen.getByText(/Banking & Double-Entry Ledger/i)).toBeTruthy();
    expect(screen.getAllByText(/Export CSV/i)[0]).toBeTruthy();
  });
});
