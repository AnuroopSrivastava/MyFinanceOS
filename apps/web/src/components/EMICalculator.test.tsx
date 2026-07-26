import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { EMICalculator } from './EMICalculator';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('@financeos/database', () => ({
  dbService: {
    getAccounts: () => [
      { id: 'l1', profileId: 'p1', name: 'Home Loan', balance: -2500000, interestRate: 8.5, accountType: 'Loan' }
    ]
  }
}));

describe('EMICalculator Component', () => {
  it('renders EMI Calculator header and auto-populates loan amount', () => {
    render(<EMICalculator activeProfileId="p1" />);
    expect(screen.getByText('EMI & Loan Amortization Calculator')).toBeDefined();
    expect(screen.getAllByText(/monthly emi/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/amortization schedule/i).length).toBeGreaterThan(0);
  });
});
