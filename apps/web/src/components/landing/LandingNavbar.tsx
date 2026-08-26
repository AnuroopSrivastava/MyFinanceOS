import React, { useState } from 'react';
import { ArrowRight, ChevronRight, Menu, X } from 'lucide-react';
import { LandingButton } from './primitives/index.js';

export interface LandingNavbarProps {
  onUnlock: () => void;
  onNavigateSection?: (sectionId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onUnlock,
  onNavigateSection,
  className = '',
  style = {}
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleScrollTo = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(sectionId);
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <header className={`l-nav-header ${className}`} style={style}>
        {/* Logo & Zero Custody Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#07080d',
              fontWeight: 900,
              fontSize: '1.2rem',
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.45)'
            }}
          >
            ₹
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.03em'
              }}
            >
              MyFinanceOS
            </span>
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                borderRadius: '6px',
                padding: '0.15rem 0.45rem',
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399' }} />
              ZERO PLAINTEXT CUSTODY
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="l-nav-links" aria-label="Main Navigation">
          <button type="button" className="l-nav-link" onClick={() => handleScrollTo('products-showcase')}>
            Showcase
          </button>
          <button type="button" className="l-nav-link" onClick={() => handleScrollTo('value-narrative')}>
            Architecture
          </button>
          <button type="button" className="l-nav-link" onClick={() => handleScrollTo('all-features')}>
            Modules
          </button>
          <button type="button" className="l-nav-link" onClick={() => handleScrollTo('metrics-telemetry')}>
            Telemetry
          </button>
          <button type="button" className="l-nav-link" onClick={() => handleScrollTo('faq-section')}>
            FAQ
          </button>
        </nav>

        {/* Right Action Buttons & Mobile Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            type="button"
            className="l-mobile-menu-btn"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <LandingButton
            type="button"
            onClick={onUnlock}
            variant="primary"
            size="sm"
            icon={<ArrowRight size={14} />}
            ariaLabel="Launch Sovereign Vault"
          >
            Launch Vault
          </LandingButton>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="l-mobile-drawer" role="dialog" aria-label="Mobile Navigation Drawer">
          <button
            type="button"
            className="l-mobile-nav-link"
            onClick={() => handleScrollTo('products-showcase')}
          >
            <span>Interactive Showcase</span>
            <ChevronRight size={16} color="#06b6d4" />
          </button>
          <button
            type="button"
            className="l-mobile-nav-link"
            onClick={() => handleScrollTo('value-narrative')}
          >
            <span>Architecture Pillars</span>
            <ChevronRight size={16} color="#06b6d4" />
          </button>
          <button
            type="button"
            className="l-mobile-nav-link"
            onClick={() => handleScrollTo('all-features')}
          >
            <span>All System Modules</span>
            <ChevronRight size={16} color="#06b6d4" />
          </button>
          <button
            type="button"
            className="l-mobile-nav-link"
            onClick={() => handleScrollTo('metrics-telemetry')}
          >
            <span>Telemetry in Numbers</span>
            <ChevronRight size={16} color="#06b6d4" />
          </button>
          <button
            type="button"
            className="l-mobile-nav-link"
            onClick={() => handleScrollTo('faq-section')}
          >
            <span>Knowledge Base & FAQ</span>
            <ChevronRight size={16} color="#06b6d4" />
          </button>
        </div>
      )}
    </>
  );
};
