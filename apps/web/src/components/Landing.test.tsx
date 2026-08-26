import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Landing, Logo, ThemeToggle, Header, PhoneMockup, BalanceCard, WeeklyCard, ExpenseCard } from './Landing.js';

describe('Emergent Landing Page Component', () => {
  it('renders brand logo and main navigation links', () => {
    render(<Landing />);
    expect(screen.getByTestId('brand-logo')).toBeDefined();
    expect(screen.getByTestId('main-navigation')).toBeDefined();
    expect(screen.getByTestId('nav-link-home')).toBeDefined();
    expect(screen.getByTestId('nav-link-about')).toBeDefined();
    expect(screen.getByTestId('nav-link-features')).toBeDefined();
    expect(screen.getByTestId('nav-link-pricing')).toBeDefined();
  });

  it('renders hero headline, description, and visual stage elements', () => {
    render(<Landing />);
    expect(screen.getByTestId('hero-section')).toBeDefined();
    expect(screen.getByTestId('hero-headline').textContent).toContain('SMARTER FINANCE');
    expect(screen.getByTestId('hero-headline').textContent).toContain('MADE SIMPLE');
    expect(screen.getByTestId('hero-description')).toBeDefined();
    expect(screen.getByTestId('visual-stage')).toBeDefined();
    expect(screen.getByTestId('phone-mockup')).toBeDefined();
    expect(screen.getByTestId('balance-card')).toBeDefined();
    expect(screen.getByTestId('weekly-spend-card')).toBeDefined();
    expect(screen.getByTestId('expense-card')).toBeDefined();
    expect(screen.getByTestId('mini-amount-card')).toBeDefined();
  });

  it('invokes onUnlock when Get started button is clicked', () => {
    const handleUnlock = vi.fn();
    render(<Landing onUnlock={handleUnlock} />);

    const getStartedBtn = screen.getByTestId('hero-get-started-button');
    fireEvent.click(getStartedBtn);
    expect(handleUnlock).toHaveBeenCalledTimes(1);
  });

  it('toggles light/dark theme when theme toggle button is clicked', () => {
    render(<Landing />);
    const appShell = screen.getByTestId('app-shell');
    const toggleBtn = screen.getByTestId('theme-toggle');

    const initialIsDark = appShell.classList.contains('dark');
    fireEvent.click(toggleBtn);
    expect(appShell.classList.contains('dark')).toBe(!initialIsDark);
  });

  it('opens and closes mobile navigation drawer', () => {
    render(<Landing />);
    const mobileToggle = screen.getByTestId('mobile-nav-toggle');
    const mobilePanel = screen.getByTestId('mobile-nav-panel');

    expect(mobilePanel.classList.contains('is-open')).toBe(false);
    fireEvent.click(mobileToggle);
    expect(mobilePanel.classList.contains('is-open')).toBe(true);

    // Click link inside mobile panel to close
    const mobileHomeLink = screen.getByTestId('mobile-nav-link-home');
    fireEvent.click(mobileHomeLink);
    expect(mobilePanel.classList.contains('is-open')).toBe(false);
  });

  it('renders individual components in isolation', () => {
    const { container: logoContainer } = render(<Logo />);
    expect(logoContainer.querySelector('.logo-mark')).toBeDefined();

    const { container: phoneContainer } = render(<PhoneMockup />);
    expect(phoneContainer.querySelector('.phone-screen')).toBeDefined();

    const { container: balanceContainer } = render(<BalanceCard />);
    expect(balanceContainer.querySelector('.card-kicker')?.textContent).toBe('Your Balance');

    const { container: weeklyContainer } = render(<WeeklyCard />);
    expect(weeklyContainer.querySelector('.pay-chip')?.textContent).toBe('Pay');

    const { container: expenseContainer } = render(<ExpenseCard />);
    expect(expenseContainer.querySelector('.expense-top')?.textContent).toContain('Total expenses');
  });
});
