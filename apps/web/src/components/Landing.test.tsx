import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Landing,
  Logo,
  ThemeToggle,
  Header,
  PhoneMockup,
  BalanceCard,
  WeeklyCard,
  ExpenseCard,
  AboutSection,
  PricingSection,
  BlogSection,
  ContactSection,
  ChangelogSection,
  FivePhasesSection,
  LegalSection,
  Faq,
} from './Landing.js';

describe('Emergent Landing Page Component', () => {
  it('renders brand logo and main navigation links', () => {
    render(<Landing />);
    expect(screen.getByTestId('brand-logo')).toBeDefined();
    expect(screen.getByTestId('main-navigation')).toBeDefined();
    expect(screen.getByTestId('nav-link-home')).toBeDefined();
    expect(screen.getByTestId('nav-link-about')).toBeDefined();
    expect(screen.getByTestId('nav-link-features')).toBeDefined();
    expect(screen.getByTestId('nav-link-pricing')).toBeDefined();
    expect(screen.getByTestId('nav-link-blog')).toBeDefined();
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

  it('renders all core sections and reference UI showcases', () => {
    render(<Landing />);
    expect(screen.getByTestId('about-section')).toBeDefined();
    expect(screen.getByTestId('together-card')).toBeDefined();
    expect(screen.getByTestId('showcase-section')).toBeDefined();
    expect(screen.getByTestId('integrations-card')).toBeDefined();
    expect(screen.getByTestId('digital-payments-card')).toBeDefined();
    expect(screen.getByTestId('pricing-section')).toBeDefined();
    expect(screen.getByTestId('pricing-card-free')).toBeDefined();
    expect(screen.getByTestId('pricing-card-plus')).toBeDefined();
    expect(screen.getByTestId('pricing-card-premium')).toBeDefined();
    expect(screen.getByTestId('blog-section')).toBeDefined();
    expect(screen.getByTestId('contact-section')).toBeDefined();
    expect(screen.getByTestId('changelog-section')).toBeDefined();
    expect(screen.getByTestId('legal-section')).toBeDefined();
    expect(screen.getByTestId('faq-section')).toBeDefined();
    expect(screen.getByTestId('mega-cta')).toBeDefined();
    expect(screen.getByTestId('site-footer')).toBeDefined();
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

    const mobileHomeLink = screen.getByTestId('mobile-nav-link-home');
    fireEvent.click(mobileHomeLink);
    expect(mobilePanel.classList.contains('is-open')).toBe(false);
  });

  it('renders individual modular sections in isolation', () => {
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

    const { container: aboutContainer } = render(<AboutSection />);
    expect(aboutContainer.querySelector('.about-headline')?.textContent).toContain('HOW IT ALL COMES TOGETHER');

    const { container: pricingContainer } = render(<PricingSection />);
    expect(pricingContainer.querySelector('.about-headline')?.textContent).toContain('PRICING THAT SCALES');

    const { container: blogContainer } = render(<BlogSection />);
    expect(blogContainer.querySelector('.blog-grid')).toBeDefined();

    const { container: contactContainer } = render(<ContactSection />);
    expect(contactContainer.querySelector('.contact-card-console')).toBeDefined();

    const { container: changelogContainer } = render(<ChangelogSection />);
    expect(changelogContainer.querySelector('.changelog-timeline')).toBeDefined();

    const { container: phasesContainer } = render(<FivePhasesSection />);
    expect(phasesContainer.querySelector('.phases-headline')?.textContent).toContain('Five phases.');
    expect(phasesContainer.querySelector('.phases-headline')?.textContent).toContain('No mystery.');
    expect(phasesContainer.textContent).toContain('Capture');
    expect(phasesContainer.textContent).toContain('Dissect');
    expect(phasesContainer.textContent).toContain('Optimize');
    expect(phasesContainer.textContent).toContain('Compound');
    expect(phasesContainer.textContent).toContain('Govern');
    expect(phasesContainer.querySelectorAll('.phases-item').length).toBe(5);

    const { container: legalContainer } = render(<LegalSection />);
    expect(legalContainer.querySelector('.legal-cards-grid')).toBeDefined();
  });

  it('renders FAQ with all items collapsed by default and toggles on click', () => {
    render(<Faq />);
    const firstQuestion = screen.getByTestId('faq-question-0');
    const firstRow = screen.getByTestId('faq-row-0');

    // Should be collapsed by default
    expect(firstQuestion.getAttribute('aria-expanded')).toBe('false');
    expect(firstRow.classList.contains('is-open')).toBe(false);

    // Clicking should expand it
    fireEvent.click(firstQuestion);
    expect(firstQuestion.getAttribute('aria-expanded')).toBe('true');
    expect(firstRow.classList.contains('is-open')).toBe(true);

    // Clicking again should collapse it
    fireEvent.click(firstQuestion);
    expect(firstQuestion.getAttribute('aria-expanded')).toBe('false');
    expect(firstRow.classList.contains('is-open')).toBe(false);
  });

  it('triggers interactive pay confirmation feedback in WeeklyCard', () => {
    render(<WeeklyCard />);
    expect(screen.getByText('14.20K')).toBeDefined();
    const payBtn = screen.getByTestId('pay-chip');
    expect(payBtn.textContent).toBe('Pay');

    fireEvent.click(payBtn);
    expect(payBtn.textContent).toBe('✓ Paid');
  });

  it('switches interactive architecture pills and renders corresponding domain telemetry in AboutSection', () => {
    render(<AboutSection />);
    expect(screen.getByText('Smart Categorization & Cash Flow')).toBeDefined();
    expect(screen.getByText('Swiggy UPI')).toBeDefined();

    // Switch to Growth
    fireEvent.click(screen.getByText('Growth'));
    expect(screen.getByText('Multi-Asset Wealth & FIRE Planning')).toBeDefined();
    expect(screen.getByText('Target Age 42 Corpus')).toBeDefined();

    // Switch to Tax Planning
    fireEvent.click(screen.getByText('Tax Planning'));
    expect(screen.getByText('Old vs New Tax Regime Engine')).toBeDefined();
    expect(screen.getByText('New Regime (115BAC)')).toBeDefined();

    // Switch to Invoicing
    fireEvent.click(screen.getByText('Invoicing'));
    expect(screen.getByText('Professional GST Invoicing')).toBeDefined();
    expect(screen.getByText('Invoice #INV-2026-0042')).toBeDefined();

    // Switch to Local Vault
    fireEvent.click(screen.getByText('Local Vault'));
    expect(screen.getByText('Argon2id Encrypted Document Vault')).toBeDefined();
    expect(screen.getByText('Encrypted Artifacts')).toBeDefined();
  });

  it('toggles billing frequency and currency in PricingSection', () => {
    render(<PricingSection />);
    const plusCard = screen.getByTestId('pricing-card-plus');
    expect(plusCard.textContent).toContain('₹499');

    // Toggle to Annual
    fireEvent.click(screen.getByText('Annual'));
    expect(plusCard.textContent).toContain('₹399');

    // Toggle to USD
    fireEvent.click(screen.getByText('USD ($)'));
    expect(plusCard.textContent).toContain('$6.39');

    // Toggle back to Monthly
    fireEvent.click(screen.getByText('Monthly'));
    expect(plusCard.textContent).toContain('$7.99');
  });
});


