import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DateRangePicker, DateRange } from './DateRangePicker.js';

describe('DateRangePicker component', () => {
  const initialRange: DateRange = {
    startDate: '2026-01-01',
    endDate: null,
    label: 'This Year'
  };

  it('renders trigger button with current label and toggles popup on click', () => {
    const handleChange = vi.fn();
    render(
      <DateRangePicker
        value={initialRange}
        onChange={handleChange}
      />
    );

    const trigger = screen.getByRole('button', { name: /Date filter: This Year/i });
    expect(trigger).toBeDefined();

    expect(screen.queryByRole('dialog', { name: 'Select Date Range' })).toBeNull();

    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Select Date Range' })).toBeDefined();
  });

  it('selects preset when clicked and notifies parent', () => {
    const handleChange = vi.fn();
    render(
      <DateRangePicker
        value={initialRange}
        onChange={handleChange}
      />
    );

    const trigger = screen.getByRole('button', { name: /Date filter: This Year/i });
    fireEvent.click(trigger);

    const allTimePreset = screen.getByRole('button', { name: 'All Time' });
    fireEvent.click(allTimePreset);

    expect(handleChange).toHaveBeenCalledWith({
      startDate: null,
      endDate: null,
      label: 'All Time'
    });
  });

  it('applies custom date range on submit', () => {
    const handleChange = vi.fn();
    render(
      <DateRangePicker
        value={initialRange}
        onChange={handleChange}
      />
    );

    const trigger = screen.getByRole('button', { name: /Date filter: This Year/i });
    fireEvent.click(trigger);

    const startInput = screen.getByLabelText('Custom Start Date');
    const endInput = screen.getByLabelText('Custom End Date');
    const applyButton = screen.getByRole('button', { name: 'Apply' });

    fireEvent.change(startInput, { target: { value: '2026-04-01' } });
    fireEvent.change(endInput, { target: { value: '2026-06-30' } });
    fireEvent.click(applyButton);

    expect(handleChange).toHaveBeenCalledWith({
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      label: '2026-04-01 to 2026-06-30'
    });
  });
});
