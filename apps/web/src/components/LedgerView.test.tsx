import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    getProfiles: () => [{ id: 'p1', name: 'Test User' }],
    subscribe: () => () => {},
    onUnsavedChangeStatus: () => () => {},
    onSaveErrorStatus: () => () => {},
    getBudgets: () => [],
    addAccount: vi.fn(),
    addTransaction: vi.fn(),
  }
}));

describe('LedgerView Component Diagnostics', () => {
  it('renders Transaction Log & Financial Ledger', () => {
    render(<LedgerView activeProfileId="default" />);

    expect(screen.getByText(/Banking & Double-Entry Ledger/i)).toBeTruthy();
    expect(screen.getAllByText(/Export CSV/i)[0]).toBeTruthy();
  });

  it('opens and cancels the add-transaction dialog via click', async () => {
    render(<LedgerView activeProfileId="default" />);

    fireEvent.click(screen.getByText('Add Transaction'));
    expect(screen.getByText('Save Transaction')).toBeTruthy();

    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText('Save Transaction')).toBeNull();
    });
  });

  it('opens and cancels the link-account dialog via click', async () => {
    render(<LedgerView activeProfileId="default" />);

    fireEvent.click(screen.getByText('Add Account'));
    expect(screen.getAllByText('Add Bank Account').length).toBeGreaterThan(0);

    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText('Add Bank Account')).toBeNull();
    });
  });
});
