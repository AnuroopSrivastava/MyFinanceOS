import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InvestmentsView } from './InvestmentsView.js';

vi.mock('@financeos/database', () => ({
  dbService: {
    getAccounts: () => [{ id: 'acc1', name: 'HDFC Savings', profileId: 'default', balance: 50000, bankName: 'HDFC', accountNumber: '1234', accountType: 'Savings' }],
    getStocks: () => [
      { id: 's1', profileId: 'default', symbol: 'RELIANCE', name: 'Reliance Industries', quantity: 10, averagePrice: 2500, currentPrice: 2800, nomineeName: 'Jane Doe' }
    ],
    getMutualFunds: () => [
      { id: 'mf1', profileId: 'default', schemeName: 'Parag Parikh Flexi Cap', units: 100, averageNav: 50, currentNav: 65, nomineeName: 'Jane Doe' }
    ],
    getFDs: () => [
      { id: 'fd1', profileId: 'default', bankName: 'SBI', principalAmount: 100000, interestRate: 7.1, startDate: '2025-01-01', maturityDate: '2026-01-01' }
    ],
    getGold: () => [
      { id: 'g1', profileId: 'default', type: 'SGB', quantityGrams: 10, purchasePrice: 5000, currentPrice: 6500 }
    ],
    getNPS: () => [
      { id: 'nps1', profileId: 'default', pranNumber: '123456789012', balance: 200000, tier: 'Tier1', allocationE: 50, allocationC: 30, allocationG: 20, allocationA: 0 }
    ],
    getPF: () => [
      { id: 'pf1', profileId: 'default', type: 'EPF', accountNumber: 'EPF123', balance: 300000, yearlyContribution: 50000 }
    ],
    getTransactions: () => [],
    getProfiles: () => [{ id: 'default', name: 'Test User' }],
    subscribe: () => () => {},
    onUnsavedChangeStatus: () => () => {},
    onSaveErrorStatus: () => () => {},
    addStock: vi.fn(),
    updateStock: vi.fn(),
    deleteStock: vi.fn(),
    addMF: vi.fn(),
    updateMF: vi.fn(),
    deleteMF: vi.fn(),
    addFD: vi.fn(),
    updateFD: vi.fn(),
    deleteFD: vi.fn(),
    addGold: vi.fn(),
    updateGold: vi.fn(),
    deleteGold: vi.fn(),
    addNPS: vi.fn(),
    updateNPS: vi.fn(),
    deleteNPS: vi.fn(),
    addPF: vi.fn(),
    updatePF: vi.fn(),
    deletePF: vi.fn(),
  }
}));

describe('InvestmentsView Component Diagnostics', () => {
  it('renders Portfolio Valuation header & summary metrics', () => {
    render(<InvestmentsView activeProfileId="default" />);

    expect(screen.getByText(/Portfolio Valuation/i)).toBeTruthy();
    expect(screen.getByText(/Invested Cost/i)).toBeTruthy();
    expect(screen.getByText(/Returns \(Gain\)/i)).toBeTruthy();
    expect(screen.getByText(/XIRR \(Annualized\)/i)).toBeTruthy();
  });

  it('renders asset holdings tables and items with mock data', () => {
    render(<InvestmentsView activeProfileId="default" />);

    // Direct Equity Stocks
    expect(screen.getByText('Direct Equity Stocks')).toBeTruthy();
    expect(screen.getByText('RELIANCE')).toBeTruthy();
    expect(screen.getByText('Reliance Industries')).toBeTruthy();

    // Mutual Funds
    expect(screen.getByText('Mutual Funds (Direct Growth)')).toBeTruthy();
    expect(screen.getByText('Parag Parikh Flexi Cap')).toBeTruthy();
  });

  it('opens and cancels Add Stock modal', async () => {
    render(<InvestmentsView activeProfileId="default" />);

    const addStockBtn = screen.getByText('Add Stock');
    fireEvent.click(addStockBtn);

    expect(screen.getAllByText('Add Stock Position').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('e.g. RELIANCE')).toBeTruthy();

    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('e.g. RELIANCE')).toBeNull();
    });
  });

  it('opens and cancels Add Mutual Fund modal', async () => {
    render(<InvestmentsView activeProfileId="default" />);

    const addMFBtn = screen.getByText('Add Mutual Fund');
    fireEvent.click(addMFBtn);

    expect(screen.getAllByText('Add Mutual Fund').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('e.g. Parag Parikh Flexi Cap')).toBeTruthy();

    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('e.g. Parag Parikh Flexi Cap')).toBeNull();
    });
  });

  it('switches between tabs: Holdings, Rebalancing, Simulator', () => {
    render(<InvestmentsView activeProfileId="default" />);

    // Switch to Rebalancing tab
    const rebalanceTab = screen.getByText('Portfolio Rebalancing');
    fireEvent.click(rebalanceTab);
    expect(screen.getByText('Target Asset Allocation Rebalancer')).toBeTruthy();

    // Switch to Simulator tab
    const simTab = screen.getByText('Retirement Simulator (Monte Carlo)');
    fireEvent.click(simTab);
    expect(screen.getByText('Monte Carlo Retirement Projection Engine')).toBeTruthy();
    expect(screen.getByText('Run Simulation')).toBeTruthy();
  });
});
