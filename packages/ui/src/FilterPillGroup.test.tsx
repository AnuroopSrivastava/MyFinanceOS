import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPillGroup } from './FilterPillGroup';

describe('FilterPillGroup Component', () => {
  it('renders all string options with appropriate accessibility attributes', () => {
    const handleChange = vi.fn();
    render(
      <FilterPillGroup
        options={['All', 'Features', 'Fixes']}
        selected="All"
        onChange={handleChange}
        ariaLabel="Filter items"
      />
    );

    const group = screen.getByRole('group', { name: 'Filter items' });
    expect(group).toBeDefined();

    const allBtn = screen.getByRole('button', { name: 'All' });
    const featuresBtn = screen.getByRole('button', { name: 'Features' });

    expect(allBtn.getAttribute('aria-pressed')).toBe('true');
    expect(featuresBtn.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(featuresBtn);
    expect(handleChange).toHaveBeenCalledWith('Features');
  });

  it('renders object options with optional count badges', () => {
    const handleChange = vi.fn();
    const options = [
      { id: 'all', label: 'All Items', count: 12 },
      { id: 'active', label: 'Active', count: 4 }
    ];

    render(
      <FilterPillGroup
        options={options}
        selected="all"
        onChange={handleChange}
      />
    );

    expect(screen.getByText('(12)')).toBeDefined();
    expect(screen.getByText('(4)')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Active/i }));
    expect(handleChange).toHaveBeenCalledWith('active');
  });
});
