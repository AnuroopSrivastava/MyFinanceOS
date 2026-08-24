import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TimelineSegmentedFilter } from './TimelineSegmentedFilter.js';

describe('TimelineSegmentedFilter component', () => {
  const options = ['6M', '12M', '2Y', '5Y', '10Y'] as const;

  it('renders all options and selects the active one', () => {
    const handleChange = vi.fn();
    render(
      <TimelineSegmentedFilter
        options={options}
        value="12M"
        onChange={handleChange}
        ariaLabel="Forecast timeframe"
      />
    );

    const radiogroup = screen.getByRole('radiogroup', { name: 'Forecast timeframe' });
    expect(radiogroup).toBeDefined();

    const optionButtons = screen.getAllByRole('radio');
    expect(optionButtons.length).toBe(5);

    const activeOption = screen.getByRole('radio', { name: '12M' });
    expect(activeOption.getAttribute('aria-checked')).toBe('true');

    const inactiveOption = screen.getByRole('radio', { name: '5Y' });
    expect(inactiveOption.getAttribute('aria-checked')).toBe('false');
  });

  it('calls onChange when clicking an option', () => {
    const handleChange = vi.fn();
    render(
      <TimelineSegmentedFilter
        options={options}
        value="6M"
        onChange={handleChange}
      />
    );

    const option5Y = screen.getByRole('radio', { name: '5Y' });
    fireEvent.click(option5Y);
    expect(handleChange).toHaveBeenCalledWith('5Y');
  });

  it('supports keyboard navigation via ArrowRight and ArrowLeft', () => {
    const handleChange = vi.fn();
    render(
      <TimelineSegmentedFilter
        options={options}
        value="12M"
        onChange={handleChange}
      />
    );

    const activeOption = screen.getByRole('radio', { name: '12M' });
    fireEvent.keyDown(activeOption, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith('2Y');

    fireEvent.keyDown(activeOption, { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith('6M');
  });
});
