import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReleaseBadge, ReleaseLegend } from './ReleaseBadge';

describe('ReleaseBadge Component', () => {
  it('renders with release level label and badge classes', () => {
    render(<ReleaseBadge level="minor" />);
    const badge = screen.getByTestId('release-badge');
    expect(badge).toBeDefined();
    expect(badge.className).toContain('changelog-badge-minor');
    expect(badge.textContent).toContain('minor release');
  });

  it('renders custom label when provided', () => {
    render(<ReleaseBadge level="major" label="Architecture Upgrade" />);
    expect(screen.getByText('Architecture Upgrade')).toBeDefined();
  });

  it('renders ReleaseLegend with all semantic categories', () => {
    render(<ReleaseLegend />);
    expect(screen.getByText(/Foundational architecture & breaking upgrades/i)).toBeDefined();
    expect(screen.getByText(/Meaningful new capabilities & features/i)).toBeDefined();
    expect(screen.getByText(/Bug fixes, UI polish, & performance/i)).toBeDefined();
  });
});
