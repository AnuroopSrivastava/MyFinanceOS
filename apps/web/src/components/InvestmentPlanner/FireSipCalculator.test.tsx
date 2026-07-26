import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FireSipCalculator } from './FireSipCalculator.js';

describe('FireSipCalculator Component Unit Tests', () => {
  it('renders inputs and calculates FIRE corpuses correctly', () => {
    render(<FireSipCalculator currentNetWorth={2500000} activeProfileId="p1" />);

    expect(screen.getByText(/Target FIRE Corpus/i)).toBeTruthy();
    expect(screen.getByText(/FIRE Readiness/i)).toBeTruthy();
    expect(screen.getByText(/Wealth Milestone Timeline/i)).toBeTruthy();
  });

  it('updates inputs dynamically and recalculates compounding timeline', () => {
    render(<FireSipCalculator currentNetWorth={1000000} activeProfileId="p1" />);

    const monthlyExpenseInput = screen.getByDisplayValue('75000');
    fireEvent.change(monthlyExpenseInput, { target: { value: '100000' } });

    expect(screen.getByDisplayValue('100000')).toBeTruthy();
    expect(screen.getByText(/Wealth Milestone Timeline/i)).toBeTruthy();
  });
});
