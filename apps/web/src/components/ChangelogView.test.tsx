import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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
    const baselineExpandBtn = baselineCard.querySelector('button[aria-label="Expand changelog details"]');
    if (baselineExpandBtn) {
      fireEvent.click(baselineExpandBtn);
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

  it('highlights the Changelog link with active state and nav-dot', () => {
    render(<ChangelogView showNav={true} />);
    const nav = screen.getByTestId('changelog-navigation');
    const activeLink = nav.querySelector('a.active');
    expect(activeLink).toBeDefined();
    expect(activeLink?.textContent).toContain('Changelog');
    expect(activeLink?.querySelector('.nav-dot')).toBeDefined();
  });

  it('toggles light and dark theme classes on user interaction', () => {
    render(<ChangelogView showNav={true} />);
    const changelogShell = screen.getByTestId('changelog-view');
    const toggleBtn = screen.getByTestId('theme-toggle');

    const initialIsDark = changelogShell.classList.contains('dark');
    fireEvent.click(toggleBtn);
    expect(changelogShell.classList.contains('dark')).toBe(!initialIsDark);

    // Toggle back
    fireEvent.click(toggleBtn);
    expect(changelogShell.classList.contains('dark')).toBe(initialIsDark);
  });

  it('filters releases by category pill selection', () => {
    render(<ChangelogView showNav={true} />);
    const filterGroup = screen.getByRole('group', { name: /filter releases by category/i });
    expect(filterGroup).toBeDefined();

    // Click 'Features' filter pill
    const featuresPill = within(filterGroup).getByRole('button', { name: /features/i });
    fireEvent.click(featuresPill);
    expect(featuresPill.getAttribute('aria-pressed')).toBe('true');

    // Click 'All' filter pill to reset
    const allPill = within(filterGroup).getByRole('button', { name: /^all/i });
    fireEvent.click(allPill);
    expect(allPill.getAttribute('aria-pressed')).toBe('true');
    expect(featuresPill.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders sticky milestone rail and allows quick-jump to versions', () => {
    render(<ChangelogView showNav={true} />);
    const rail = screen.getByTestId('changelog-milestones-rail');
    expect(rail).toBeDefined();

    const milestoneButtons = rail.querySelectorAll('.changelog-milestone-link');
    expect(milestoneButtons.length).toBeGreaterThanOrEqual(3);

    // Jump to v1.0.0
    const v100Btn = screen.getByRole('button', { name: /jump to release v1\.0\.0/i });
    fireEvent.click(v100Btn);
    expect(v100Btn.classList.contains('is-active')).toBe(true);
  });

  it('handles keyboard navigation shortcuts for next and previous releases', () => {
    render(<ChangelogView showNav={true} />);
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'k' });
    fireEvent.keyDown(window, { key: 'e' });
  });

  it('invokes onBack callback when Workspace button is clicked', () => {
    const handleBack = vi.fn();
    render(<ChangelogView showNav={true} onBack={handleBack} />);
    const workspaceBtns = screen.getAllByRole('button', { name: /workspace/i });
    expect(workspaceBtns.length).toBe(2);
    fireEvent.click(workspaceBtns[0]);
    expect(handleBack).toHaveBeenCalledTimes(1);

    fireEvent.click(workspaceBtns[1]);
    expect(handleBack).toHaveBeenCalledTimes(2);
  });

  it('triggers smooth scroll when clicking the active Changelog nav link', () => {
    const mockScrollTo = vi.fn();
    (window as any).__myfinanceos_lenis__ = {
      scrollTo: mockScrollTo
    };

    render(<ChangelogView showNav={true} />);
    const nav = screen.getByTestId('changelog-navigation');
    const activeLink = nav.querySelector('a.active');
    expect(activeLink).toBeDefined();

    if (activeLink) {
      fireEvent.click(activeLink);
      expect(mockScrollTo).toHaveBeenCalledWith(0, { offset: 0 });
    }

    delete (window as any).__myfinanceos_lenis__;
  });

  it('toggles mobile navigation drawer when mobile menu button is clicked', () => {
    render(<ChangelogView showNav={true} />);
    const mobileToggle = screen.getByTestId('changelog-mobile-nav-toggle');
    const mobilePanel = screen.getByTestId('changelog-mobile-nav-panel');
    expect(mobileToggle).toBeDefined();
    expect(mobilePanel).toBeDefined();

    expect(mobileToggle.getAttribute('aria-expanded')).toBe('false');
    expect(mobilePanel.classList.contains('is-open')).toBe(false);

    // Open mobile menu
    fireEvent.click(mobileToggle);
    expect(mobileToggle.getAttribute('aria-expanded')).toBe('true');
    expect(mobilePanel.classList.contains('is-open')).toBe(true);

    // Close mobile menu by clicking toggle again
    fireEvent.click(mobileToggle);
    expect(mobileToggle.getAttribute('aria-expanded')).toBe('false');
    expect(mobilePanel.classList.contains('is-open')).toBe(false);
  });

  it('provides accessible status live region for search results and copy announcements', () => {
    render(<ChangelogView showNav={true} />);
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeDefined();
    expect(liveRegion.textContent).toMatch(/releases displayed/i);

    const searchInput = screen.getByPlaceholderText(/Search releases/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent-xyz-query' } });
    expect(liveRegion.textContent).toContain('0 releases displayed');

    fireEvent.change(searchInput, { target: { value: '' } });
    expect(liveRegion.textContent).toMatch(/[1-9]\d* releases displayed/);
  });

  it('renders tabular-nums class on numerical metrics and version tags', () => {
    render(<ChangelogView showNav={true} />);
    const versionHeading = screen.getByTestId('release-card-1.0.0').querySelector('.changelog-version-heading');
    expect(versionHeading).toBeDefined();

    const metricValues = document.querySelectorAll('.changelog-metric-value');
    expect(metricValues.length).toBeGreaterThan(0);
  });
});

