import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
import { DashboardView } from './DashboardView';

// Mock dependencies
vi.mock('@financeos/database', () => ({
  dbService: {
    getAccounts: () => [{ id: '1', name: 'HDFC', balance: 50000, accountType: 'Savings' }],
    getTransactions: () => [],
    getBudgets: () => [],
    getFds: () => [],
    getInvestmentPlans: () => [],
    getProfiles: () => [{ id: 'p1', name: 'Test User' }],
    getStocks: () => [],
    getMutualFunds: () => [],
    getFDs: () => [],
    getGold: () => [],
    getPF: () => [],
    getNPS: () => []
  }
}));

describe('DashboardView', () => {
  it('renders Net Worth header correctly', () => {
    // Provide a dummy profileId
    render(<DashboardView activeProfileId="p1" dateRange="1y" />);
    
    // Check for the net worth text (case-insensitive)
    expect(screen.getAllByText(/net worth/i).length).toBeGreaterThan(0);
    
    // Check if a balance is rendered
    expect(screen.getAllByText(/₹[0-9.,]+/i).length).toBeGreaterThan(0);
  });
});
