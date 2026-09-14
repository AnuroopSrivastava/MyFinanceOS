'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CURRENT_VERSION } from '@financeos/shared';
import { ThemeToggle } from './Landing';
import { smoothScrollTo } from '../hooks/useLenisScroll';

export interface PublicHeaderProps {
  dark: boolean;
  onToggleTheme: () => void;
  onBack?: () => void;
  activeRoute?: string;
  headerRef?: React.Ref<HTMLElement>;
  headerTestId?: string;
  navTestId?: string;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  dark,
  onToggleTheme,
  onBack,
  activeRoute = '/changelog',
  headerRef,
  headerTestId = 'changelog-header',
  navTestId = 'changelog-navigation'
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleBrandClick = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      e.preventDefault();
      smoothScrollTo(0);
    }
  };

  const handleChangelogClick = (e: React.MouseEvent) => {
    if (activeRoute === '/changelog') {
      e.preventDefault();
      smoothScrollTo(0);
    }
  };

  const handleMobileChangelogClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    smoothScrollTo(0);
  };

  return (
    <>
      <header ref={headerRef} className="site-header is-scrolled" data-testid={headerTestId}>
        <Link
          href="/"
          className="logo"
          data-testid="brand-logo"
          aria-label="MyFinanceOS home"
          style={{ textDecoration: 'none' }}
          onClick={handleBrandClick}
        >
          <span className="logo-mark" aria-hidden="true">
            <span className="mark-halo" />
            <i />
            <span className="mark-shine" />
          </span>
          <span>MyFinanceOS</span>
        </Link>

        <nav className="nav-pill" aria-label="Changelog navigation" data-testid={navTestId}>
          <Link href="/">Home</Link>
          <Link href="/#features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link
            href="/changelog"
            className={activeRoute === '/changelog' ? 'active' : ''}
            onClick={handleChangelogClick}
          >
            {activeRoute === '/changelog' && <span className="nav-dot" aria-hidden="true" />}
            Changelog
          </Link>
        </nav>

        <div className="header-actions">
          <span
            data-testid="current-version-pill"
            className="footer-version-tag hide-on-mobile changelog-tabular"
          >
            <span className="footer-version-dot" aria-hidden="true" />
            v{CURRENT_VERSION}
          </span>

          <ThemeToggle dark={dark} onToggle={onToggleTheme} />

          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="contact-button"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              Workspace
            </button>
          ) : (
            <Link href="/" className="contact-button" style={{ textDecoration: 'none' }}>
              Launch App
            </Link>
          )}

          <button
            type="button"
            className={`mobile-nav-toggle ${mobileMenuOpen ? 'is-open' : ''}`}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="changelog-mobile-nav"
            data-testid="changelog-mobile-nav-toggle"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        id="changelog-mobile-nav"
        className={`mobile-nav-panel ${mobileMenuOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Changelog mobile navigation"
        data-testid="changelog-mobile-nav-panel"
        onClick={() => setMobileMenuOpen(false)}
      >
        <nav className="mobile-nav-list" onClick={(e) => e.stopPropagation()} aria-label="Mobile links">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link href="/#features" onClick={() => setMobileMenuOpen(false)}>
            Features
          </Link>
          <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)}>
            Pricing
          </Link>
          <Link href="/privacy" onClick={() => setMobileMenuOpen(false)}>
            Privacy
          </Link>
          <Link href="/terms" onClick={() => setMobileMenuOpen(false)}>
            Terms
          </Link>
          <Link
            href="/changelog"
            className={activeRoute === '/changelog' ? 'active' : ''}
            onClick={handleMobileChangelogClick}
          >
            Changelog
          </Link>
          {onBack ? (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onBack();
              }}
              className="mobile-nav-contact"
              style={{ cursor: 'pointer', border: 'none', textAlign: 'center' }}
            >
              Workspace
            </button>
          ) : (
            <Link href="/" className="mobile-nav-contact" onClick={() => setMobileMenuOpen(false)}>
              Launch App
            </Link>
          )}
        </nav>
      </div>
    </>
  );
};

export default PublicHeader;
