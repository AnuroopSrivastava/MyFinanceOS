import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChangelogSearchBar } from './ChangelogSearchBar';

describe('ChangelogSearchBar Component', () => {
  it('renders search input with accessible placeholder and label', () => {
    render(<ChangelogSearchBar value="" onChange={vi.fn()} onClear={vi.fn()} />);
    const input = screen.getByRole('searchbox');
    expect(input).toBeDefined();
    expect(input.getAttribute('placeholder')).toContain('Search releases');
  });

  it('calls onChange callback when user types in search input', () => {
    const handleChange = vi.fn();
    render(<ChangelogSearchBar value="" onChange={handleChange} onClear={vi.fn()} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'sqlite' } });
    expect(handleChange).toHaveBeenCalledWith('sqlite');
  });

  it('renders clear button when value is present and calls onClear on click', () => {
    const handleClear = vi.fn();
    const { rerender } = render(
      <ChangelogSearchBar value="" onChange={vi.fn()} onClear={handleClear} />
    );
    expect(screen.queryByLabelText('Clear search input')).toBeNull();

    rerender(
      <ChangelogSearchBar value="vault" onChange={vi.fn()} onClear={handleClear} />
    );
    const clearBtn = screen.getByLabelText('Clear search input');
    expect(clearBtn).toBeDefined();

    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('focuses input on / key press and clears on Escape key', () => {
    const handleClear = vi.fn();
    render(<ChangelogSearchBar value="test" onChange={vi.fn()} onClear={handleClear} />);
    const input = screen.getByRole('searchbox') as HTMLInputElement;

    // Simulate '/' keydown when not focused on an input
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(input);

    // Simulate 'Escape' keydown while input is active
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});
