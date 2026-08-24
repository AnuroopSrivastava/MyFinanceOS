import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GoalTracker } from './GoalTracker';

vi.mock('@financeos/database', () => ({
  dbService: {
    getGoals: () => [
      {
        id: 'g1',
        profileId: 'p1',
        name: 'Emergency Fund',
        targetAmount: 500000,
        currentAmount: 250000,
        deadline: '2026-12-31',
        icon: '🎯',
        color: '#06b6d4',
        createdAt: '2026-01-01'
      }
    ],
    subscribe: () => () => {},
    onUnsavedChangeStatus: () => () => {},
    onSaveErrorStatus: () => () => {},
    addGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn()
  }
}));

describe('GoalTracker Component', () => {
  it('renders savings goals correctly with circular progress and target amount', () => {
    render(<GoalTracker activeProfileId="p1" />);
    expect(screen.getByText('Savings Goals')).toBeDefined();
    expect(screen.getByText('Emergency Fund')).toBeDefined();
    expect(screen.getByText('50%')).toBeDefined();
  });

  it('opens and cancels the new-goal form via click', () => {
    render(<GoalTracker activeProfileId="p1" />);

    fireEvent.click(screen.getByText('New Goal'));
    expect(screen.getByText(/Create Savings Goal|Add Goal/i)).toBeTruthy();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('e.g. Emergency Fund')).toBeNull();
  });
});
