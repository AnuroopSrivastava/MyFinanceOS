import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChangelogView } from './ChangelogView';
import { CURRENT_VERSION } from '@financeos/shared';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

describe('ChangelogView Component', () => {
  it('renders header, current version pill, and title', () => {
    render(<ChangelogView showNav={true} />);
    expect(screen.getByTestId('changelog-view')).toBeDefined();
    expect(screen.getByText(/What's New in MyFinanceOS/i)).toBeDefined();
    const versionPill = screen.getByTestId('current-version-pill');
    expect(versionPill.textContent).toContain(`v${CURRENT_VERSION}`);
  });

  it('renders baseline version card with summary and categorized changes', () => {
    render(<ChangelogView showNav={true} />);
    const baselineCard = screen.getByTestId('release-card-1.0.0');
    expect(baselineCard).toBeDefined();
    expect(baselineCard.textContent).toContain('v1.0.0');
    expect(baselineCard.textContent).toContain('Initial baseline release');

    // Expand older release details if collapsed
    const expandButtons = screen.queryAllByRole('button', { name: /expand changelog details/i });
    if (expandButtons.length > 0) {
      fireEvent.click(expandButtons[0]);
    }

    expect(baselineCard.textContent).toContain('Features');
    expect(baselineCard.textContent).toContain('Security');
  });

  it('includes direct release anchor ID and share link action', () => {
    render(<ChangelogView showNav={true} />);
    const card = screen.getByTestId('release-card-1.0.0');
    expect(card.getAttribute('id')).toBe('v1.0.0');

    const shareButton = screen.getByRole('button', { name: /copy direct link to release v1\.0\.0/i });
    expect(shareButton).toBeDefined();
  });

  it('renders release type legend with Major, Minor, and Patch indicators', () => {
    render(<ChangelogView showNav={true} />);
    expect(screen.getByText(/Foundational architecture & breaking upgrades/i)).toBeDefined();
    expect(screen.getByText(/Meaningful new capabilities & features/i)).toBeDefined();
    expect(screen.getByText(/Bug fixes, UI polish, & performance/i)).toBeDefined();
  });

  it('filters releases when searching via search input', () => {
    render(<ChangelogView showNav={true} />);
    const searchInput = screen.getByPlaceholderText(/Search releases/i);
    
    // Type a non-matching query
    fireEvent.change(searchInput, { target: { value: 'nonexistent-xyz-release-test' } });
    expect(screen.getByText(/No releases matched your filter/i)).toBeDefined();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByTestId('release-card-1.0.0')).toBeDefined();
  });
});
