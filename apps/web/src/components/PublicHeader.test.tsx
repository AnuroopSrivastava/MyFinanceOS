import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PublicHeader } from './PublicHeader';
import { CURRENT_VERSION } from '@financeos/shared';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

describe('PublicHeader Component', () => {
  it('renders brand logo, nav links, and version pill', () => {
    const handleToggle = vi.fn();
    render(<PublicHeader dark={false} onToggleTheme={handleToggle} />);

    expect(screen.getByTestId('changelog-header')).toBeDefined();
    expect(screen.getByTestId('brand-logo')).toBeDefined();
    expect(screen.getByTestId('changelog-navigation')).toBeDefined();
    expect(screen.getByTestId('current-version-pill').textContent).toContain(`v${CURRENT_VERSION}`);
  });

  it('marks changelog link active by default and renders nav-dot', () => {
    render(<PublicHeader dark={false} onToggleTheme={vi.fn()} activeRoute="/changelog" />);
    const nav = screen.getByTestId('changelog-navigation');
    const activeLink = nav.querySelector('a.active');
    expect(activeLink).toBeDefined();
    expect(activeLink?.textContent).toContain('Changelog');
    expect(activeLink?.querySelector('.nav-dot')).toBeDefined();
  });

  it('invokes onToggleTheme when theme toggle is clicked', () => {
    const handleToggle = vi.fn();
    render(<PublicHeader dark={false} onToggleTheme={handleToggle} />);
    const toggleBtn = screen.getByTestId('theme-toggle');
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('invokes onBack callback for both desktop and mobile drawer buttons', () => {
    const handleBack = vi.fn();
    render(<PublicHeader dark={false} onToggleTheme={vi.fn()} onBack={handleBack} />);

    const workspaceButtons = screen.getAllByRole('button', { name: /workspace/i });
    expect(workspaceButtons.length).toBe(2);

    fireEvent.click(workspaceButtons[0]);
    expect(handleBack).toHaveBeenCalledTimes(1);

    fireEvent.click(workspaceButtons[1]);
    expect(handleBack).toHaveBeenCalledTimes(2);
  });

  it('toggles mobile menu open and closed', () => {
    render(<PublicHeader dark={false} onToggleTheme={vi.fn()} />);
    const toggle = screen.getByTestId('changelog-mobile-nav-toggle');
    const panel = screen.getByTestId('changelog-mobile-nav-panel');

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.classList.contains('is-open')).toBe(false);

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.classList.contains('is-open')).toBe(true);

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.classList.contains('is-open')).toBe(false);
  });

  it('scrolls to top when clicking active changelog nav link', () => {
    const mockScrollTo = vi.fn();
    (window as any).__myfinanceos_lenis__ = { scrollTo: mockScrollTo };

    render(<PublicHeader dark={false} onToggleTheme={vi.fn()} activeRoute="/changelog" />);
    const nav = screen.getByTestId('changelog-navigation');
    const activeLink = nav.querySelector('a.active');
    if (activeLink) {
      fireEvent.click(activeLink);
      expect(mockScrollTo).toHaveBeenCalledWith(0, { offset: 0 });
    }

    delete (window as any).__myfinanceos_lenis__;
  });
});
