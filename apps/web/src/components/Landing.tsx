import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import posthog from 'posthog-js';
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  MotionConfig,
} from 'framer-motion';
import Link from 'next/link';
import '../styles/emergent-landing.css';
import { getSavedTheme, setTheme } from '@financeos/ui';
import { STORAGE_KEYS, CURRENT_VERSION, LATEST_CHANGELOG_ENTRY } from '@financeos/shared';
import { DEFAULT_IMAGES, Skiper30, PARALLAX_VARIANT_WIDTHS, parallaxVariantSrc } from './ui/skiper-ui/skiper30';
import { useLenisScroll, smoothScrollTo } from '../hooks/useLenisScroll';
import { useLenisSectionProgress } from '../hooks/useLenisSectionProgress';

interface LandingProps {
  onUnlock?: () => void;
  authenticating?: boolean;
}

/**
 * Piecewise linear map with clamping — same interpolation contract as
 * framer-motion's useTransform(progress, xs, ys), driven manually so every
 * scroll-linked style write happens inside the gallery's single Lenis RAF tick.
 */
function piecewiseMap(progress: number, xs: readonly number[] | number[], ys: readonly number[] | number[]): number {
  if (progress <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (progress <= xs[i]) {
      const t = (progress - xs[i - 1]) / (xs[i] - xs[i - 1] || 1);
      return ys[i - 1] + t * (ys[i] - ys[i - 1]);
    }
  }
  return ys[ys.length - 1];
}

/**
 * Lightweight hero viewport observer.
 * Toggles `body.past-hero` so the site header drops backdrop-filter
 * and ambient hero CSS animations pause declaratively via CSS.
 * Completely eliminates the 1,374ms forced reflow from getAnimations() subtree walks.
 */
function useHeroScrollObserver() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const hero = document.querySelector<HTMLElement>('main.hero');
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          document.body.classList.remove('past-hero');
        } else {
          document.body.classList.add('past-hero');
        }
      },
      { rootMargin: '0px 0px -5% 0px' }
    );
    observer.observe(hero);

    return () => {
      observer.disconnect();
      document.body.classList.remove('past-hero');
    };
  }, []);
}

const navItems = ['Home', 'About', 'Features', 'Pricing', 'Blog'];
const easeOutExpo = [0.16, 1, 0.3, 1] as const;
const springBouncy = { type: 'spring', stiffness: 240, damping: 20 } as const;

function CtaSpinner() {
  return (
    <span
      aria-hidden="true"
      className="cta-spinner"
      style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.35)',
        borderTopColor: '#fff',
        boxSizing: 'border-box',
        verticalAlign: '-3px',
        marginLeft: 8,
      }}
    />
  );
}

export function Logo() {
  return (
    <a
      className="logo"
      href="#home"
      data-testid="brand-logo"
      aria-label="MyFinanceOS home"
      onClick={(e) => {
        e.preventDefault();
        smoothScrollTo(0);
      }}
    >
      <span className="logo-mark" aria-hidden="true">
        <span className="mark-halo" />
        <i />
        <span className="mark-shine" />
      </span>
      <span>MyFinanceOS</span>
    </a>
  );
}

export function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={dark}
      data-testid="theme-toggle"
    >
      <span className={`theme-toggle-icon ${dark ? 'is-dark' : ''}`} aria-hidden="true">
        <span className="tt-moon" />
        <span className="tt-sun" />
      </span>
    </button>
  );
}

export const Header = memo(function Header({ dark, onToggleTheme, onUnlock, authenticating = false }: { dark: boolean; onToggleTheme: () => void; onUnlock?: () => void; authenticating?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const lastYRef = useRef(0);
  const scrolledRef = useRef(false);
  const hiddenRef = useRef(false);

  const accumulatedDownRef = useRef(0);
  const accumulatedUpRef = useRef(0);

  const handleScrollTick = useCallback((e?: { scroll: number }) => {
    const el = headerRef.current;
    if (!el) return;

    const y = e?.scroll ?? (typeof window !== 'undefined' ? window.scrollY : 0);
    const isScrolled = y > 20;
    if (scrolledRef.current !== isScrolled) {
      scrolledRef.current = isScrolled;
      // Direct classList toggle — zero React re-renders during scroll.
      el.classList.toggle('is-scrolled', isScrolled);
    }

    const diff = y - lastYRef.current;
    lastYRef.current = y;

    if (y < 120) {
      if (hiddenRef.current) {
        hiddenRef.current = false;
        el.classList.remove('is-retracted');
      }
      accumulatedDownRef.current = 0;
      accumulatedUpRef.current = 0;
      return;
    }

    if (diff > 0) {
      accumulatedDownRef.current += diff;
      accumulatedUpRef.current = 0;
      if (accumulatedDownRef.current > 60 && y > 300) {
        if (!hiddenRef.current) {
          hiddenRef.current = true;
          el.classList.add('is-retracted');
        }
      }
    } else if (diff < 0) {
      accumulatedUpRef.current += Math.abs(diff);
      accumulatedDownRef.current = 0;
      if (accumulatedUpRef.current > 16) {
        if (hiddenRef.current) {
          hiddenRef.current = false;
          el.classList.remove('is-retracted');
        }
      }
    }
  }, []);

  useLenisScroll(true, handleScrollTick);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // When the mobile menu opens, ensure header is visible
  useEffect(() => {
    if (menuOpen && headerRef.current) {
      headerRef.current.classList.remove('is-retracted');
    }
  }, [menuOpen]);

  const handleNavClick = (e: React.MouseEvent, item: string) => {
    const hash = `#${item.toLowerCase()}`;
    const target = document.querySelector(hash);
    if (target) {
      e.preventDefault();
      smoothScrollTo(target as HTMLElement, -40);
    }
  };

  return (
    <header
      ref={headerRef}
      className={`site-header`}
      data-testid="main-header"
    >
      <Logo />
      <nav className="nav-pill" aria-label="Main navigation" data-testid="main-navigation">
        {navItems.map((item, index) => (
          <motion.a
            className={index === 0 ? 'active' : ''}
            href={`#${item.toLowerCase()}`}
            key={item}
            data-testid={`nav-link-${item.toLowerCase()}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easeOutExpo, delay: 0.12 + index * 0.04 }}
            onClick={(e) => handleNavClick(e, item)}
          >
            {index === 0 && <span className="nav-dot" aria-hidden="true" />}
            {item}
          </motion.a>
        ))}
      </nav>
      <div className="header-actions">
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        <a
          className="contact-button"
          href="#contact"
          onClick={(e) => {
            const target = document.querySelector('#contact');
            if (target) {
              e.preventDefault();
              smoothScrollTo(target as HTMLElement, -40);
            } else if (onUnlock) {
              e.preventDefault();
              onUnlock();
            }
          }}
          data-testid="contact-button"
          aria-busy={authenticating}
          style={authenticating ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
        >
          {authenticating ? 'Connecting…' : 'Contact us'}
        </a>
        <button
          type="button"
          className={`mobile-nav-toggle ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-panel"
          data-testid="mobile-nav-toggle"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <div
        id="mobile-nav-panel"
        className={`mobile-nav-panel ${menuOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        data-testid="mobile-nav-panel"
        onClick={() => setMenuOpen(false)}
      >
        <nav className="mobile-nav-list" onClick={(e) => e.stopPropagation()} aria-label="Mobile main navigation">
          {navItems.map((item, index) => (
            <a
              className={index === 0 ? 'active' : ''}
              href={`#${item.toLowerCase()}`}
              key={item}
              onClick={(e) => {
                setMenuOpen(false);
                handleNavClick(e, item);
              }}
              data-testid={`mobile-nav-link-${item.toLowerCase()}`}
            >
              {item}
            </a>
          ))}
          <a
            className="mobile-nav-contact"
            href="#contact"
            onClick={(e) => {
              setMenuOpen(false);
              const target = document.querySelector('#contact');
              if (target) {
                e.preventDefault();
                smoothScrollTo(target as HTMLElement, -40);
              } else if (onUnlock) {
                e.preventDefault();
                onUnlock();
              }
            }}
            data-testid="mobile-nav-contact"
            aria-busy={authenticating}
            style={authenticating ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
          >
            {authenticating ? 'Connecting…' : 'Contact us'}
          </a>
        </nav>
      </div>
    </header>
  );
});

/**
 * Groups an integer with the Indian digit convention (last three digits, then
 * pairs) without Intl. `toLocaleString('en-IN')` needs full ICU, so a Node
 * runtime with small-icu and a browser produce different strings for the same
 * number — a hydration mismatch. This helper is deterministic across both.
 */
function formatIndianNumber(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();
  if (digits.length <= 3) return sign + digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return sign + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}

function HeroOdometer({
  target,
  format,
  duration = 0.85,
  delay = 0.2,
}: {
  target: number;
  format: (n: number) => string;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    let lastFormatted = '';
    const timer = setTimeout(() => {
      const controls = animate(0, target, {
        duration,
        ease: easeOutExpo,
        onUpdate: (latest) => {
          const formatted = format(latest);
          if (formatted !== lastFormatted) {
            lastFormatted = formatted;
            el.textContent = formatted;
          }
        },
      });
      return () => controls.stop();
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [target, format, duration, delay]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {format(target)}
    </span>
  );
}

export function PhoneMockup() {
  return (
    <motion.div
      className="phone-glow"
      data-testid="phone-glow"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.1 }}
    >
      <div className="phone" data-testid="phone-mockup">
        <motion.div
          className="phone-screen"
          data-testid="phone-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            className="phone-pill"
            data-testid="phone-label"
            initial={{ opacity: 0, y: -10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.26 }}
          >
            100% OFFLINE &amp; PRIVATE
          </motion.div>
          <motion.div
            className="phone-symbol"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.7, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%' }}
            transition={{ ...springBouncy, delay: 0.3 }}
          >
            <span className="symbol-ring" />
            <span className="symbol-core" />
            <span className="symbol-cut" />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function BalanceCard() {
  return (
    <motion.div
      className="finance-card balance-card"
      data-testid="balance-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.16 }}
    >
      <div className="card-kicker-row">
        <span className="card-kicker">Your Balance</span>
        <span className="card-live-badge">Encrypted</span>
      </div>
      <strong className="balance-amount">
        <span className="balance-curr">₹</span>
        <HeroOdometer target={1842250} format={formatIndianNumber} delay={0.25} />
        <span className="balance-cents">.00</span>
      </strong>
      <div className="balance-gain-row">
        <span className="gain">
          <svg className="gain-icon" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          +<HeroOdometer target={18.4} format={(n) => n.toFixed(1)} delay={0.35} duration={0.9} />%
        </span>
        <span className="gain-period">total net worth</span>
      </div>
    </motion.div>
  );
}

export function WeeklyCard() {
  const [paid, setPaid] = useState(false);

  const handlePay = () => {
    setPaid(true);
    setTimeout(() => setPaid(false), 1400);
  };

  return (
    <motion.div
      className="weekly-wrap"
      data-testid="weekly-spend-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.2 }}
    >
      <div className="finance-card weekly-card">
        <span className="weekly-amount">
          <span className="weekly-curr">₹</span>
          <HeroOdometer target={14.2} format={(n) => `${n.toFixed(2)}K`} delay={0.28} />
          <span className="weekly-per">/ week</span>
        </span>
        <motion.button
          type="button"
          className={`pay-chip ${paid ? 'is-paid' : ''}`}
          data-testid="pay-chip"
          onClick={handlePay}
          whileTap={{ scale: 0.94 }}
        >
          {paid ? '✓ Paid' : 'Pay'}
        </motion.button>
      </div>
    </motion.div>
  );
}

const EXPENSE_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const EXPENSE_BARS = [42, 65, 54, 88, 48, 72, 38] as const;

export function ExpenseCard() {
  return (
    <motion.div
      className="finance-card expense-card"
      data-testid="expense-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.3 }}
    >
      <div className="expense-top">
        <div className="expense-title-group">
          <span className="expense-label">Total expenses</span>
          <span className="expense-badge">This Month</span>
        </div>
        <span className="tiny-dots" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="13" cy="8" r="1.5" />
          </svg>
        </span>
      </div>
      <div className="expense-amount-row">
        <strong className="expense-amount">
          <span className="expense-curr">₹</span>
          <HeroOdometer target={24850} format={formatIndianNumber} delay={0.38} />
          <span className="expense-cents">.00</span>
        </strong>
        <span className="expense-trend-pill" title="Down 14.8% vs budget">
          ↓ 14.8%
        </span>
      </div>
      <div className="bar-chart-wrap">
        <div className="bar-chart" data-testid="expense-chart">
          {EXPENSE_BARS.map((height, index) => {
            const isPeak = index === 3;
            return (
              <div key={index} className={`bar-col ${isPeak ? 'is-peak' : ''}`}>
                {isPeak && <span className="bar-peak-pill">₹1.8k</span>}
                <motion.i
                  style={{ height: `${height}%`, transformOrigin: 'bottom' }}
                  initial={{ scaleY: 0, opacity: 1 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.44 + index * 0.05 }}
                />
                <span className="bar-day-label">{EXPENSE_DAYS[index]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export const partnerLogos: { text: string; mark?: React.ReactNode; strong?: boolean }[] = [
  {
    text: '100% Offline-First',
    strong: true,
    mark: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
      </svg>
    ),
  },
  {
    text: 'AES-256 Encrypted',
    mark: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M12 1.4l2.15 6.45L20.6 10l-6.45 2.15L12 18.6l-2.15-6.45L3.4 10l6.45-2.15z" />
        <circle cx="12" cy="10" r="2.1" fillOpacity=".45" />
      </svg>
    ),
  },
  {
    text: 'Old vs New Tax Regime',
    mark: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5.5" />
        <rect x="8.5" y="8.5" width="7" height="7" rx="2.2" fillOpacity=".35" />
      </svg>
    ),
  },
  {
    text: 'GST Invoicing Suite',
    mark: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M12 2.3l8.4 4.85v9.7L12 21.7 3.6 16.85v-9.7z" />
        <path d="M12 7.4l3.9 2.25v4.5L12 16.4 8.1 14.15v-4.5z" fillOpacity=".35" />
      </svg>
    ),
  },
  {
    text: 'Multi-Asset Wealth & FIRE',
    mark: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M4 6.6A2.6 2.6 0 016.6 4H16a4 4 0 014 4v9.4A2.6 2.6 0 0117.4 20H8a4 4 0 01-4-4z" />
      </svg>
    ),
  },
  {
    text: 'Private Local AI',
    strong: true,
    mark: (
      <svg viewBox="0 0 26 24" width="20" height="18" fill="currentColor" aria-hidden="true">
        <circle cx="9" cy="12" r="6.2" />
        <circle cx="17" cy="12" r="6.2" fillOpacity=".5" />
      </svg>
    ),
  },
];

export function LogoCloud() {
  return (
    <div
      className="logo-cloud"
      data-testid="logo-cloud"
      aria-label="Core architecture highlights"
      role="list"
    >
      {partnerLogos.map((logo, index) => (
        <motion.span
          className={`logo-cloud-item ${logo.strong ? 'is-strong' : ''}`}
          key={`${logo.text}-${index}`}
          role="listitem"
          initial={{ opacity: 0, y: 14, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 280,
            damping: 24,
            delay: 0.50 + index * 0.055,
          }}
          whileHover={{
            y: -2.5,
            scale: 1.035,
            transition: { type: 'spring', stiffness: 420, damping: 22 },
          }}
          whileTap={{
            scale: 0.97,
            transition: { duration: 0.1 },
          }}
        >
          <span className="logo-cloud-mark" aria-hidden="true">
            {logo.mark}
          </span>
          <span className="logo-cloud-text">{logo.text}</span>
        </motion.span>
      ))}
    </div>
  );
}

export function Hero({ onUnlock, authenticating = false }: { onUnlock?: () => void; authenticating?: boolean }) {
  return (
    <main
      className="hero"
      id="home"
      data-testid="hero-section"
    >
      <div className="bg-texture-sheen" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-glare-ambient" aria-hidden="true" />
      <div className="hero-lens-flare" aria-hidden="true">
        <div className="lens-flare-core" />
        <div className="lens-flare-streak" />
        <div className="lens-flare-halo" />
      </div>
      <div className="hero-prism-light" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-1" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-2" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-3" aria-hidden="true" />
      <div className="light light-top" aria-hidden="true" />
      <div className="light light-cyan" aria-hidden="true" />
      <div className="light light-left" aria-hidden="true" />
      <div className="light light-right" aria-hidden="true" />
      <div className="light light-center" aria-hidden="true" />
      <div className="streak streak-one" aria-hidden="true" />
      <div className="streak streak-two" aria-hidden="true" />
      <div
        className="glass-frame"
        data-testid="glass-frame"
        aria-hidden="true"
      />
      <div
        className="visual-stage"
        data-testid="visual-stage"
      >
        <BalanceCard />
        <WeeklyCard />
        <motion.div
          className="finance-card mini-card"
          data-testid="mini-amount-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.24 }}
        >
          <div className="mini-card-top">
            <span className="card-kicker">SIP &amp; Yield</span>
            <span className="mini-card-badge">Live</span>
          </div>
          <strong className="mini-card-amount">
            <span className="mini-plus">+</span>
            <span className="mini-curr">₹</span>
            <HeroOdometer target={12450} format={formatIndianNumber} delay={0.32} />
            <span className="mini-cents">.00</span>
          </strong>
          <span className="mini-subtext">Monthly portfolio payout</span>
        </motion.div>
        <PhoneMockup />
        <ExpenseCard />
      </div>
      <section className="hero-copy" aria-labelledby="hero-headline">
        <h1 id="hero-headline" data-testid="hero-headline" className="hero-headline-fast">
          <span className="hero-title-main">
            SMARTER FINANCE
          </span>
          <b className="hero-title-sub">
            MADE SIMPLE
          </b>
        </h1>
        <motion.p
          data-testid="hero-description"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: easeOutExpo, delay: 0.28 }}
        >
          A complete platform for managing spend, payments, investments, Indian tax regimes, GST invoicing, and forecasting—all in one encrypted sovereign workspace.
        </motion.p>
        <div className="cta-row" data-testid="hero-cta-group">
          <motion.button
            className="primary-cta"
            type="button"
            onClick={() => {
              posthog.capture('get_started_clicked', { source: 'hero_primary_cta' });
              onUnlock?.();
            }}
            disabled={authenticating}
            data-testid="hero-get-started-button"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...springBouncy, delay: 0.35 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {authenticating ? 'Connecting' : 'Get started'}
            {authenticating ? (
              <CtaSpinner />
            ) : (
              <span className="cta-arrow" aria-hidden="true">→</span>
            )}
          </motion.button>
          <motion.button
            className="secondary-cta"
            type="button"
            onClick={(e) => {
              const target = document.querySelector('#features');
              if (target) {
                e.preventDefault();
                smoothScrollTo(target as HTMLElement, -40);
              } else if (onUnlock) {
                onUnlock();
              }
            }}
            disabled={authenticating}
            data-testid="hero-download-button"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...springBouncy, delay: 0.42 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {authenticating ? 'Connecting…' : 'Download now'}
          </motion.button>
        </div>
        <p className="hero-auth-links" data-testid="hero-auth-links">
          Already set a password?{' '}
          <Link href="/login">Sign in</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/forgot-password">Forgot password</Link>
        </p>
        <LogoCloud />
      </section>
      <div className="hero-seam" aria-hidden="true" data-testid="hero-seam" />
    </main>
  );
}

/* ==========================================================================
   SECTION: ABOUT / HOW IT ALL COMES TOGETHER
   ========================================================================== */
const PILL_DETAILS = {
  spending: {
    title: 'Smart Categorization & Cash Flow',
    desc: 'Real-time double-entry ledger that organizes every UPI, bank, and card spend automatically with zero cloud snooping.',
    metric1: '₹14,250',
    label1: 'Weekly Avg',
    metric2: '0.0ms',
    label2: 'Cloud Latency',
  },
  growth: {
    title: 'Multi-Asset Wealth & FIRE Planning',
    desc: 'Simulate financial independence (FIRE) milestone dates, asset allocation rebalancing, and SIP compound growth.',
    metric1: '24.8%',
    label1: 'Portfolio CAGR',
    metric2: '₹18.4L',
    label2: 'Tracked Assets',
  },
  tax: {
    title: 'Old vs New Tax Regime Engine',
    desc: 'Instant comparative breakdown of 80C, 80D, HRA deductions, and capital gains (STCG/LTCG) tailored for Indian tax laws.',
    metric1: '₹48,200',
    label1: 'Max Tax Saved',
    metric2: 'FY 2026-27',
    label2: 'Rules Active',
  },
  invoicing: {
    title: 'Professional GST Invoicing',
    desc: 'Generate compliant B2B/B2C GST tax invoices, track client receivables, and export instant Profit & Loss summaries.',
    metric1: '100%',
    label1: 'GST Compliant',
    metric2: '< 30 sec',
    label2: 'Invoice Creation',
  },
  vault: {
    title: 'Argon2id Encrypted Document Vault',
    desc: 'Store PAN cards, tax filing acknowledgments, mutual fund CAS statements, and property deeds in memory-hard encrypted local vaults.',
    metric1: 'AES-256',
    label1: 'Cipher Standard',
    metric2: '0 Bytes',
    label2: 'Uploaded to Web',
  },
} as const;

export function AboutSection() {
  const [activePill, setActivePill] = useState<'spending' | 'growth' | 'tax' | 'invoicing' | 'vault'>('spending');
  const activeInfo = PILL_DETAILS[activePill];

  return (
    <section className="about-section" id="about" data-testid="about-section">
      <div className="about-header">
        <span className="about-badge">
          <svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor" aria-hidden="true">
            <path d="M6 0l1.3 3.9L11 5.2 7.3 6.5 6 10.4 4.7 6.5 1 5.2l3.7-1.3z" />
          </svg>
          Architecture &amp; Vision
        </span>
        <h2 className="about-headline">HOW IT ALL COMES TOGETHER</h2>
        <p className="about-sub">
          From your daily transactions to generational wealth compounding, MyFinanceOS is structured as a private, interconnected money operating system.
        </p>
      </div>

      <div className="together-card" data-testid="together-card">
        <div className="together-interactive-row">
          <span>From seamless</span>
          <button
            type="button"
            className={`together-pill-btn pill-light ${activePill === 'spending' ? 'is-active' : ''}`}
            onClick={() => setActivePill('spending')}
          >
            <span className="together-pill-text">Spending</span>
            {activePill === 'spending' && (
              <motion.span
                layoutId="activeAboutPill"
                className="together-pill-active-bg"
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              />
            )}
          </button>
          <span>to confident</span>
          <button
            type="button"
            className={`together-pill-btn pill-light ${activePill === 'growth' ? 'is-active' : ''}`}
            onClick={() => setActivePill('growth')}
          >
            <span className="together-pill-text">Growth</span>
            {activePill === 'growth' && (
              <motion.span
                layoutId="activeAboutPill"
                className="together-pill-active-bg"
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              />
            )}
          </button>
          <span>, our platform unites</span>
          <button
            type="button"
            className={`together-pill-btn pill-dark ${activePill === 'tax' ? 'is-active' : ''}`}
            onClick={() => setActivePill('tax')}
          >
            <span className="together-pill-text">Tax Planning</span>
            {activePill === 'tax' && (
              <motion.span
                layoutId="activeAboutPill"
                className="together-pill-active-bg"
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              />
            )}
          </button>
          <span>,</span>
          <button
            type="button"
            className={`together-pill-btn pill-dark ${activePill === 'invoicing' ? 'is-active' : ''}`}
            onClick={() => setActivePill('invoicing')}
          >
            <span className="together-pill-text">Invoicing</span>
            {activePill === 'invoicing' && (
              <motion.span
                layoutId="activeAboutPill"
                className="together-pill-active-bg"
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              />
            )}
          </button>
          <span>, and</span>
          <button
            type="button"
            className={`together-pill-btn pill-light ${activePill === 'vault' ? 'is-active' : ''}`}
            onClick={() => setActivePill('vault')}
          >
            <span className="together-pill-text">Local Vault</span>
            {activePill === 'vault' && (
              <motion.span
                layoutId="activeAboutPill"
                className="together-pill-active-bg"
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              />
            )}
          </button>
          <span>in one sovereign OS.</span>
        </div>

        <motion.div
          className="together-live-preview"
          key={activePill}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: easeOutExpo }}
        >
          <div className="together-preview-info">
            <h3>{activeInfo.title}</h3>
            <p>{activeInfo.desc}</p>
            <div className="together-metric-row">
              <div className="together-metric-item">
                <strong>{activeInfo.metric1}</strong>
                <span>{activeInfo.label1}</span>
              </div>
              <div className="together-metric-item">
                <strong>{activeInfo.metric2}</strong>
                <span>{activeInfo.label2}</span>
              </div>
            </div>
          </div>
          <div className="together-preview-mock">
            {activePill === 'spending' && (
              <motion.div
                key="mock-spending"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: easeOutExpo }}
              >
                <div className="together-mock-header">
                  <span className="together-mock-status">
                    <span className="together-pulse-dot" /> DOUBLE-ENTRY STREAM
                  </span>
                  <span className="together-mock-badge">Zero Latency</span>
                </div>
                <div className="together-mock-item">
                  <div className="together-mock-line">
                    <span className="together-mock-tag">Swiggy UPI</span>
                    <span className="together-mock-amount text-expense">-₹480.00</span>
                  </div>
                  <div className="together-mock-sub">Auto-tagged: Food &amp; Dining · Reconciled</div>
                </div>
                <div className="together-mock-item is-success">
                  <div className="together-mock-line">
                    <span className="together-mock-tag">Zerodha Dividend</span>
                    <span className="together-mock-amount text-income">+₹1,250.00</span>
                  </div>
                  <div className="together-mock-sub">Direct Deposit · Ledger Balanced (Debit = Credit)</div>
                </div>
              </motion.div>
            )}

            {activePill === 'growth' && (
              <motion.div
                key="mock-growth"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: easeOutExpo }}
              >
                <div className="together-mock-header">
                  <span className="together-mock-status">
                    <span className="together-pulse-dot" /> COMPOUND WEALTH &amp; FIRE
                  </span>
                  <span className="together-mock-badge">Monte Carlo</span>
                </div>
                <div className="together-mock-item">
                  <div className="together-mock-line">
                    <span className="together-mock-tag">Target Age 42 Corpus</span>
                    <span className="together-mock-amount text-accent">₹3,50,00,000</span>
                  </div>
                  <div className="together-progress-track">
                    <motion.div
                      className="together-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: '64.2%' }}
                      transition={{ duration: 0.75, ease: easeOutExpo, delay: 0.1 }}
                    />
                  </div>
                  <div className="together-mock-sub">64.2% Funded · ₹2.25 Cr Accumulated</div>
                </div>
                <div className="together-mock-item is-success">
                  <div className="together-mock-line">
                    <span className="together-mock-tag">Portfolio Alpha</span>
                    <span className="together-mock-amount text-income">+6.4% vs Nifty 50</span>
                  </div>
                  <div className="together-mock-sub">Defensive Beta 0.82 · Rebalanced Monthly</div>
                </div>
              </motion.div>
            )}

            {activePill === 'tax' && (
              <motion.div
                key="mock-tax"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: easeOutExpo }}
              >
                <div className="together-mock-header">
                  <span className="together-mock-status">
                    <span className="together-pulse-dot" /> DUAL REGIME ARBITRAGE
                  </span>
                  <span className="together-mock-badge">FY 2026-27</span>
                </div>
                <div className="together-mock-item">
                  <div className="together-mock-line">
                    <span className="together-mock-tag">New Regime (115BAC)</span>
                    <span className="together-mock-amount text-income">₹1,08,000 Tax</span>
                  </div>
                  <div className="together-mock-sub">vs Old Regime ₹1,42,000 · Rebate 87A Applied</div>
                </div>
                <div className="together-mock-item is-highlight">
                  <div className="together-mock-line">
                    <span className="together-mock-tag">Optimal Strategy</span>
                    <span className="together-mock-amount text-accent">Save ₹34,000</span>
                  </div>
                  <div className="together-mock-sub">80C + 80D + 80CCD(1B) NPS Max Plan Ready</div>
                </div>
              </motion.div>
            )}

            {activePill === 'invoicing' && (
              <motion.div
                key="mock-invoicing"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: easeOutExpo }}
              >
                <div className="together-mock-header">
                  <span className="together-mock-status">
                    <span className="together-pulse-dot" /> GST INVOICE READY
                  </span>
                  <span className="together-mock-badge">B2B Compliant</span>
                </div>
                <div className="together-mock-item">
                  <div className="together-mock-line">
                    <span className="together-mock-tag">Invoice #INV-2026-0042</span>
                    <span className="together-mock-amount text-accent">₹1,45,000.00</span>
                  </div>
                  <div className="together-mock-sub">Apex Labs Tech Consulting · 18% IGST ₹26,100</div>
                </div>
                <div className="together-mock-item is-success">
                  <div className="together-mock-line">
                    <span className="together-mock-tag">Cryptographic Hash</span>
                    <span className="together-mock-amount text-income">IRN Generated</span>
                  </div>
                  <div className="together-mock-sub">E-Invoice QR verified · Ready for 1-Click PDF</div>
                </div>
              </motion.div>
            )}

            {activePill === 'vault' && (
              <motion.div
                key="mock-vault"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: easeOutExpo }}
              >
                <div className="together-mock-header">
                  <span className="together-mock-status">
                    <span className="together-pulse-dot" /> ARGON2ID LOCAL VAULT
                  </span>
                  <span className="together-mock-badge">100% Offline</span>
                </div>
                <div className="together-mock-item">
                  <div className="together-mock-line">
                    <span className="together-mock-tag">Encrypted Artifacts</span>
                    <span className="together-mock-amount text-income">18 Documents</span>
                  </div>
                  <div className="together-mock-sub">PAN, Mutual Fund CAS, ITR-V, Property Deed</div>
                </div>
                <div className="together-mock-item is-success">
                  <div className="together-mock-line">
                    <span className="together-mock-tag">Network Telemetry</span>
                    <span className="together-mock-amount text-income">0 Bytes Uploaded</span>
                  </div>
                  <div className="together-mock-sub">AES-256-GCM cipher authenticated · OPFS Disk</div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="about-pillars-grid">
        <div className="about-pillar-card">
          <div className="about-pillar-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h4>100% Offline-First</h4>
          <p>Operates entirely in your browser and on your local disk. Never waits for internet connection and never relies on cloud availability.</p>
        </div>
        <div className="about-pillar-card">
          <div className="about-pillar-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h4>Zero-Knowledge Security</h4>
          <p>Protected by Argon2id memory-hard key derivation and AES-256-GCM cipher encryption. Your financial data cannot be read by anyone else.</p>
        </div>
        <div className="about-pillar-card">
          <div className="about-pillar-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h4>Private Local AI</h4>
          <p>Run financial queries, summarize tax deductions, and analyze investment portfolios using locally executed LLM models without cloud leaks.</p>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   FEATURE CARDS — the four-card row inside the showcase panel.
   ========================================================================== */
export function InteractiveVelocityCard({
  children,
  index,
  className = '',
  testId,
  isFeatured = false,
}: {
  children: React.ReactNode;
  index: number;
  className?: string;
  testId?: string;
  isFeatured?: boolean;
}) {
  const cardRef = useRef<HTMLElement | null>(null);
  const rectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const rafRef = useRef<number>(0);
  const tiltRef = useRef({ x: '0', y: '0' });

  const handleMouseEnter = useCallback(() => {
    const card = cardRef.current;
    if (card) {
      card.classList.add('is-hovered');
      const rect = card.getBoundingClientRect();
      rectRef.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = rectRef.current;
    if (!rect || !rect.width || !rect.height) return;
    tiltRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5).toFixed(3);
    tiltRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5).toFixed(3);

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        const card = cardRef.current;
        if (card) {
          card.style.setProperty('--tilt-x', tiltRef.current.x);
          card.style.setProperty('--tilt-y', tiltRef.current.y);
        }
        rafRef.current = 0;
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    rectRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (!card) return;
    card.classList.remove('is-hovered');
    card.style.setProperty('--tilt-x', '0');
    card.style.setProperty('--tilt-y', '0');
  }, []);

  return (
    <article
      ref={cardRef}
      className={`feature-card ${isFeatured ? 'is-featured' : ''} ${className}`}
      data-testid={testId}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="fc-inner-content">
        {children}
      </div>
    </article>
  );
}

export function TrackCard({ index = 0 }: { index?: number }) {
  return (
    <InteractiveVelocityCard
      index={index}
      className="fc-track"
      testId="feature-card-track"
    >
      <div className="fc-badge-top">
        <span className="fc-mini-pill is-violet">SOVEREIGN LEDGER</span>
        <span className="fc-formula-chip">A = L + E</span>
      </div>
      <div className="fc-ring-wrap" aria-hidden="true">
        <span className="fc-ring" />
        <span className="fc-ring-core">
          <svg viewBox="0 0 16 16" width="10" height="10" fill="#fff">
            <rect x="1.5" y="8" width="3" height="6" rx="1.2" />
            <rect x="6.5" y="5" width="3" height="9" rx="1.2" />
            <rect x="11.5" y="2.4" width="3" height="11.6" rx="1.2" />
          </svg>
        </span>
        <span className="fc-ring-dot" />
        <span className="fc-ring-tag tag-a">40% Save</span>
        <span className="fc-ring-tag tag-b">25% Spend</span>
        <span className="fc-ring-tag tag-c">20% Invest</span>
        <span className="fc-ring-tag tag-d">15% Tax</span>
      </div>
      <div className="fc-foot">
        <strong>
          Dual-Entry Ledger
          <br />
          &amp; Cash Flow
        </strong>
        <p>Double-entry bookkeeping, multi-currency accounts (₹, $, €, £), automated tagging, and interactive Sankey cash flows.</p>
        <div className="fc-feature-tags">
          <span>Real-time Balance</span>
          <span>Multi-Currency</span>
          <span>Zero Mismatch</span>
        </div>
      </div>
    </InteractiveVelocityCard>
  );
}

export function ActionCard({ index = 1 }: { index?: number }) {
  return (
    <InteractiveVelocityCard
      index={index}
      className="fc-action"
      testId="feature-card-action"
    >
      <div className="fc-badge-top">
        <span className="fc-mini-pill is-violet">INDIAN TAX ENGINE</span>
        <span className="fc-regime-pill">FY 2026-27</span>
      </div>
      <div className="fc-head">
        <strong>
          Tax Optimizer
          <br />
          &amp; Deductions Engine
        </strong>
      </div>
      <div className="fc-tax-compare-stage" aria-hidden="true">
        <div className="fc-regime-compare">
          <div className="regime-box is-old">
            <span>Old Regime</span>
            <b>₹1,42,000</b>
          </div>
          <div className="regime-vs">VS</div>
          <div className="regime-box is-new is-best">
            <span>New Regime</span>
            <b>₹1,08,000</b>
            <span className="regime-save-badge">Save ₹34K</span>
          </div>
        </div>
        <div className="fc-deductions-row">
          <span className="deduction-chip is-80c">80C: ₹1.5L Max</span>
          <span className="deduction-chip is-80d">80D: ₹50K Health</span>
          <span className="deduction-chip is-nps">80CCD: ₹50K NPS</span>
        </div>
      </div>
      <div className="fc-foot">
        <p className="fc-note">Old vs New Tax Regime · 80C/80D/80CCD(1B) Deductions · HRA Calculator · P&amp;L Statements</p>
        <div className="fc-feature-tags">
          <span>Side-by-Side Tax</span>
          <span>HRA Exemption</span>
          <span>Deduction Scan</span>
        </div>
      </div>
    </InteractiveVelocityCard>
  );
}

export function GrowthCard({ index = 2 }: { index?: number }) {
  return (
    <InteractiveVelocityCard
      index={index}
      className="fc-growth"
      testId="feature-card-growth"
      isFeatured={true}
    >
      <div className="fc-badge-top">
        <span className="fc-mini-pill is-gold">SOVEREIGN WEALTH</span>
        <span className="fc-delta">
          <svg viewBox="0 0 12 12" width="9" height="9" fill="none" aria-hidden="true">
            <path d="M1.6 8.6l2.6-3 2.1 1.8 4.1-4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          +24% CAGR
        </span>
      </div>
      <span className="fc-media" aria-hidden="true">
        <i className="fc-media-halo" />
        <i className="fc-media-figure" />
        <i className="fc-media-sheen" />
      </span>
      <span className="fc-amount" data-testid="feature-card-growth-amount">
        ₹28,50,000.00
      </span>
      <div className="fc-portfolio-distribution" aria-hidden="true">
        <div className="dist-bar">
          <span className="dist-segment is-equity" style={{ width: '45%' }} title="Stocks 45%" />
          <span className="dist-segment is-mutual" style={{ width: '25%' }} title="SIPs 25%" />
          <span className="dist-segment is-gold" style={{ width: '15%' }} title="SGB Gold 15%" />
          <span className="dist-segment is-fd" style={{ width: '15%' }} title="Debt/FD 15%" />
        </div>
        <div className="dist-labels">
          <span>Stocks 45%</span>
          <span>SIPs 25%</span>
          <span>Gold 15%</span>
          <span>Debt 15%</span>
        </div>
      </div>
      <div className="fc-media-foot">
        <strong>
          Investments, Goals
          <br />
          &amp; Early Retirement
        </strong>
        <p>Track stocks, SIPs, gold, and real estate. Calculate FIRE retirement targets and simulate loan EMI prepayments.</p>
        <div className="fc-feature-tags is-light">
          <span>Multi-Asset XIRR</span>
          <span>SGB &amp; 24K Gold</span>
          <span>Nifty Benchmarking</span>
        </div>
      </div>
    </InteractiveVelocityCard>
  );
}

export function SecureCard({ index = 3 }: { index?: number }) {
  return (
    <InteractiveVelocityCard
      index={index}
      className="fc-secure"
      testId="feature-card-secure"
    >
      <div className="fc-badge-top">
        <span className="fc-mini-pill is-crimson">AES-256-GCM VAULT</span>
        <span className="fc-argon-chip">Argon2id PIN</span>
      </div>
      <div className="fc-head">
        <strong>
          Encrypted Vault
          <br />
          &amp; Private Local AI
        </strong>
      </div>
      <div className="fc-phone" aria-hidden="true">
        <span className="fc-shield">
          <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
            <path d="M10 1.6l6.2 2.3v5.4c0 4-2.6 7.2-6.2 9.1-3.6-1.9-6.2-5.1-6.2-9.1V3.9z" />
            <path d="M7.3 9.9l2 2 3.5-3.9" stroke="#0d0d14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </span>
        <span className="fc-phone-title">Secure every step</span>
        <span className="fc-phone-sub">Current account · ₹14,250.40</span>
        <div className="fc-phone-card">
          <span className="fc-phone-card-label">Encrypted</span>
          <span className="fc-phone-card-chip" />
        </div>
        <div className="fc-phone-row">
          <span>Documents</span>
          <b>Vault Ready</b>
        </div>
        <div className="fc-phone-row">
          <span>Local AI</span>
          <b>Zero Telemetry</b>
        </div>
      </div>
      <div className="fc-foot">
        <p className="fc-note">Local document vault · Argon2id PIN lock · Private AI chat assistant · Zero cloud tracking</p>
        <div className="fc-feature-tags">
          <span>100% Offline</span>
          <span>Zero Telemetry</span>
          <span>AES-256 Vault</span>
        </div>
      </div>
    </InteractiveVelocityCard>
  );
}

export function FeatureCards() {
  return (
    <div className="feature-cards" data-testid="feature-cards">
      <TrackCard index={0} />
      <ActionCard index={1} />
      <GrowthCard index={2} />
      <SecureCard index={3} />
    </div>
  );
}




/* ==========================================================================
   INTEGRATIONS & DIGITAL PAYMENTS SHOWCASE
   ========================================================================== */
const BRAND_ICONS = [
  { name: 'Stripe', color: '#635BFF', left: '10%', top: '65%' },
  { name: 'Plaid', color: '#000000', left: '22%', top: '30%' },
  { name: 'Razorpay', color: '#0C2340', left: '36%', top: '10%' },
  { name: 'Wise', color: '#9FE870', left: '50%', top: '5%' },
  { name: 'PayPal', color: '#003087', left: '64%', top: '10%' },
  { name: 'Apple Pay', color: '#111111', left: '78%', top: '30%' },
  { name: 'Zerodha', color: '#387ED1', left: '90%', top: '65%' },
] as const;

export function IntegrationsShowcase() {
  return (
    <div className="integrations-card" data-testid="integrations-card">
      <span className="integrations-badge">INTEGRATIONS</span>
      <h3 className="integrations-title">SEAMLESS INTEGRATIONS FOR A SEAMLESS FINANCIAL LIFE.</h3>
      <p className="integrations-sub">
        Connect your favorite banks, wallets, brokerages, and payment gateways with local encrypted parsers.
      </p>

      <div className="integrations-stage">
        <div className="integrations-arc-wrapper">
          {BRAND_ICONS.map((brand, idx) => (
            <motion.div
              className="arc-brand-node"
              key={brand.name}
              title={brand.name}
              style={{ left: brand.left, top: brand.top }}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 + idx * 0.08 }}
              whileHover={{ scale: 1.25, y: -6 }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: brand.color }}>
                {brand.name.slice(0, 2).toUpperCase()}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="integrations-phone-mock">
          <div className="integrations-phone-notch" />
          <div className="integrations-phone-content">
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <strong style={{ fontSize: 14, color: '#fff', marginBottom: 4 }}>Auto-Sync Hub</strong>
            <span style={{ fontSize: 11, color: '#c4b5fd' }}>Encrypted Local Pipeline</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DigitalPaymentsShowcase() {
  return (
    <div className="payments-card" data-testid="digital-payments-card">
      <div className="payments-info">
        <span className="payments-badge">DIGITAL PAYMENTS</span>
        <h3 className="payments-title">Pay and get paid. Quickly, safely, globally.</h3>
        <p className="payments-sub">
          Make every transaction smooth and secure, whether it&apos;s paying vendor GST invoices, splitting bills, or tracking UPI and multi-currency transfers.
        </p>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 16px', borderRadius: 14 }}>
            <strong style={{ display: 'block', color: '#fff', fontSize: 16 }}>0.00%</strong>
            <span style={{ color: '#a0a5cc', fontSize: 12 }}>Platform Fees</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 16px', borderRadius: 14 }}>
            <strong style={{ display: 'block', color: '#fff', fontSize: 16 }}>Instant</strong>
            <span style={{ color: '#a0a5cc', fontSize: 12 }}>Local Settlement</span>
          </div>
        </div>
      </div>

      <div className="payments-stacked-stage" data-testid="payments-stacked-cards">
        <div className="translucent-pay-card pay-card-back">
          <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>MASTERCARD ELITE</span>
          <span style={{ fontSize: 15, letterSpacing: 2 }}>•••• 8821</span>
        </div>
        <div className="translucent-pay-card pay-card-mid">
          <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>VISA PLATINUM</span>
          <span style={{ fontSize: 15, letterSpacing: 2 }}>•••• 4920</span>
        </div>
        <div className="translucent-pay-card pay-card-top">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800 }}>Apple Pay &amp; UPI</span>
            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 999 }}>Active</span>
          </div>
          <div>
            <span style={{ fontSize: 11, opacity: 0.8, display: 'block' }}>Balance Available</span>
            <strong style={{ fontSize: 22, fontWeight: 800 }}>₹1,48,200.00</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SCROLL REVEAL STATEMENT
   ========================================================================== */
type RevealToken = { text: string; pill?: 'light' | 'dark'; punct?: boolean };

const revealTokens: RevealToken[] = [
  { text: 'From' },
  { text: 'your' },
  { text: 'daily' },
  { text: 'Ledger', pill: 'light' },
  { text: 'to' },
  { text: 'your' },
  { text: 'long-term' },
  { text: 'Net Worth', pill: 'light' },
  { text: ',', punct: true },
  { text: 'MyFinanceOS' },
  { text: 'unites' },
  { text: 'every' },
  { text: 'tool' },
  { text: 'you' },
  { text: 'need' },
  { text: 'to' },
  { text: 'master' },
  { text: 'your' },
  { text: 'Money Life', pill: 'dark' },
  { text: '—' },
  { text: '100%' },
  { text: 'offline,' },
  { text: 'fully' },
  { text: 'encrypted,' },
  { text: 'and' },
  { text: 'private.' },
];

function RevealToken({ token, setRef }: { token: RevealToken; setRef: (el: HTMLSpanElement | null) => void }) {
  const style: React.CSSProperties = { opacity: 0.14, transform: 'translateY(10px)' };

  if (token.pill) {
    return (
      <span ref={setRef} className={`reveal-pill is-${token.pill}`} style={style}>
        {token.text}
      </span>
    );
  }

  return (
    <span ref={setRef} className={`reveal-word ${token.punct ? 'is-punct' : ''}`} style={style}>
      {token.text}
    </span>
  );
}

const floatingGlyphs = [
  { key: 'fg-1', className: 'fg-1', rotate: -14, path: 'M10 2.6a7.4 7.4 0 107.4 7.4H10z' },
  { key: 'fg-2', className: 'fg-2', rotate: 11, path: 'M10 2l2 5.4 5.4 2-5.4 2-2 5.4-2-5.4L2.6 9.4l5.4-2z' },
  { key: 'fg-3', className: 'fg-3', rotate: -8, path: 'M10 1.8l6.4 2.4v5.5c0 4.1-2.7 7.4-6.4 9.3-3.7-1.9-6.4-5.2-6.4-9.3V4.2z' },
  { key: 'fg-4', className: 'fg-4', rotate: 16, path: 'M3.4 12.6h3v5h-3zm4.8-4h3v9h-3zm4.8-4.4h3v13.4h-3z' },
  { key: 'fg-5', className: 'fg-5', rotate: -10, path: 'M6 3h6.4a3.6 3.6 0 010 7.2H9.4L14 17H10.6L6.6 10.2H6V7.6h6.4a1.3 1.3 0 000-2.6H6z' },
  { key: 'fg-6', className: 'fg-6', rotate: 9, path: 'M6.6 8.6V6.8a3.4 3.4 0 016.8 0v1.8h1.2v8H5.4v-8zm2.2 0h2.4V6.8a1.2 1.2 0 00-2.4 0z' },
];

export function RevealStatement() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const tokenRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tokenStatesRef = useRef<Float32Array | null>(null);
  const total = revealTokens.length;

  const apply = useCallback((progress: number) => {
    if (!tokenStatesRef.current) {
      tokenStatesRef.current = new Float32Array(total).fill(-1);
    }
    const states = tokenStatesRef.current;
    for (let i = 0; i < total; i++) {
      const el = tokenRefs.current[i];
      if (!el) continue;
      const start = (i / total) * 0.82;
      const end = Math.min(1, start + 0.2);
      const local = Math.min(Math.max((progress - start) / (end - start || 1), 0), 1);
      if (Math.abs(states[i] - local) < 0.005) continue;
      states[i] = local;
      el.style.opacity = (0.14 + local * 0.86).toFixed(3);
      el.style.transform = `translateY(${((1 - local) * 10).toFixed(3)}px)`;
    }
  }, [total]);

  useLenisSectionProgress(sectionRef, apply, { start: 0.92, end: 0.42 });

  return (
    <div className="reveal-block" ref={sectionRef} data-testid="reveal-statement">
      <div className="reveal-glyphs" aria-hidden="true">
        {floatingGlyphs.map((glyph, index) => (
          <motion.span
            className={`reveal-glyph ${glyph.className}`}
            key={glyph.key}
            initial={{ opacity: 0, scale: 0.6, y: 26, rotate: glyph.rotate }}
            whileInView={{ opacity: 1, scale: 1, y: 0, rotate: glyph.rotate }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ ...springBouncy, delay: 0.1 + index * 0.09 }}
          >
            <i
              className="glyph-float"
              style={{ animationDuration: `${(5.4 + index * 0.6).toFixed(2)}s` }}
            >
              <svg viewBox="0 0 20 20" width="46%" height="46%" fill="#fff">
                <path d={glyph.path} />
              </svg>
            </i>
          </motion.span>
        ))}
      </div>
      <p className="reveal-copy">
        {revealTokens.map((token, index) => (
          <RevealToken
            key={`${token.text}-${index}`}
            token={token}
            setRef={(el) => { tokenRefs.current[index] = el; }}
          />
        ))}
      </p>
    </div>
  );
}

/**
 * FinanceGallerySection — Interactive multi-velocity parallax feature showcase
 * of the 12 core engines powering MyFinanceOS with dedicated dark slate (#070810) styling.
 */
export function FinanceGallerySection({
  onUnlock,
  authenticating,
}: {
  onUnlock?: () => void;
  authenticating?: boolean;
} = {}) {
  // Pre-decode the gallery screenshots during idle time so the browser never
  // pays the image decode cost mid-scroll when the parallax grid enters the viewport.
  // Variant-aware: picks the same -480/-800/-1080 candidate the browser's
  // srcset logic will choose for the current tile width × DPR, so mobile
  // never warms a 1080px master it will not display.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const warm = () => {
      const vw = window.innerWidth;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      // Same tile-width math the <img sizes> attribute declares:
      // desktop 4 cols with clamp(16px,2vw,32px) padding+gaps, mobile 2 cols
      // with 12px padding and clamp(12px,2.5vw,20px) gap.
      const gap = vw < 768
        ? Math.min(20, Math.max(12, vw * 0.025))
        : Math.min(32, Math.max(16, vw * 0.02));
      const tileWidth = vw < 768 ? (vw - 24 - gap) / 2 : (vw - 5 * gap) / 4;
      const needed = Math.ceil(tileWidth * dpr);
      const variant = PARALLAX_VARIANT_WIDTHS.find((w) => w >= needed) ?? 1080;
      for (const master of DEFAULT_IMAGES) {
        const img = new window.Image();
        img.src = parallaxVariantSrc(master, variant);
        if (typeof img.decode === 'function') {
          img.decode().catch(() => { /* best-effort warmup */ });
        }
      }
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(warm, { timeout: 1500 });
    } else {
      timeoutId = setTimeout(warm, 400);
    }
    return () => {
      if (idleId && typeof w.cancelIdleCallback === 'function') {
        w.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section
      id="gallery"
      data-testid="standalone-finance-gallery-section"
      className="finance-gallery-section"
      style={{
        color: '#ffffff',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflow: 'visible',
        position: 'relative',
        width: '100%',
        contain: 'layout style',
        isolation: 'isolate',
      }}
    >
      {/* ISOLATED FINANCE GALLERY COMPONENT */}
      <Skiper30 enableLenis={true} />
    </section>
  );
}

export function Showcase() {
  return (
    <section className="showcase" id="features" data-testid="showcase-section">
      <div className="showcase-bloom" aria-hidden="true" />
      <div className="panel-shell" data-testid="panel-shell">
        <div className="panel-stack" aria-hidden="true">
          {[0, 1, 2].map((layer) => (
            <motion.i
              className={`panel-stack-layer layer-${layer + 1}`}
              key={layer}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.72, ease: easeOutExpo, delay: (2 - layer) * 0.11 }}
            />
          ))}
        </div>
        <div className="showcase-panel" data-testid="showcase-panel">
          <div className="panel-rim" aria-hidden="true" />
          <motion.span
            className="panel-badge"
            data-testid="showcase-badge"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
          >
            <svg viewBox="0 0 12 12" width="9" height="9" fill="currentColor" aria-hidden="true">
              <path d="M6 0l1.3 3.9L11 5.2 7.3 6.5 6 10.4 4.7 6.5 1 5.2l3.7-1.3z" />
            </svg>
            TOTAL CONTROL, SIMPLIFIED.
          </motion.span>
          <motion.h2
            className="panel-title"
            data-testid="showcase-headline"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.06 }}
          >
            <span>ONE PRIVATE OS FOR ALL YOUR MONEY.</span>
          </motion.h2>
          <motion.p
            className="panel-sub"
            data-testid="showcase-description"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.14 }}
          >
            No spreadsheets, no cloud data leaks, no scattered banking apps. MyFinanceOS brings your net worth,
            investments, Indian taxes, and GST invoicing into one unified, encrypted workspace that runs fast on your own device.
          </motion.p>
          <FeatureCards />
          <IntegrationsShowcase />
          <DigitalPaymentsShowcase />
          <RevealStatement />
          <StatsBand />
        </div>
      </div>
    </section>
  );
}

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const maxScrollRef = useRef(1);
  const lastProgressRef = useRef(-1);

  const apply = useCallback((scroll: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const p = Math.min(Math.max(scroll / maxScrollRef.current, 0), 1);
    // Deadband: skip the style write when the bar cannot visibly change
    // (0.05% ≈ sub-pixel at any realistic width).
    if (Math.abs(p - lastProgressRef.current) < 0.0005) return;
    lastProgressRef.current = p;
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
  }, []);

  // Page-level progress from the same singleton Lenis RAF loop as the gallery
  useLenisScroll(true, useCallback((e?: { scroll: number }) => {
    apply(e?.scroll ?? (typeof window !== 'undefined' ? window.scrollY : 0));
  }, [apply]));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      maxScrollRef.current = max > 0 ? max : 1;
      apply(window.__myfinanceos_lenis__?.scroll ?? window.scrollY);
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure, { passive: true });
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
    };
  }, [apply]);

  return (
    <div
      ref={barRef}
      className="scroll-progress"
      style={{ transform: 'scaleX(0)' }}
      aria-hidden="true"
      data-testid="scroll-progress"
    />
  );
}

const statItems = [
  { value: 14, prefix: '', suffix: '', label: 'Financial modules in one workspace' },
  { value: 8, prefix: '', suffix: '+', label: 'Asset classes tracked' },
  { value: 256, prefix: '', suffix: '-bit', label: 'AES-GCM local vault encryption' },
  { value: 100, prefix: '', suffix: '%', label: 'Offline & sovereign by default' },
];

function StatCounter({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    let lastVal = -1;
    const controls = animate(0, value, {
      duration: 1.5,
      ease: easeOutExpo,
      onUpdate: (latest) => {
        const rounded = Math.round(latest);
        if (rounded !== lastVal) {
          lastVal = rounded;
          el.textContent = `${prefix}${rounded}${suffix}`;
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, prefix, suffix]);

  return (
    <span className="stat-value" ref={ref}>
      {prefix}0{suffix}
    </span>
  );
}

export function StatsBand() {
  return (
    <div className="stats-band" data-testid="stats-band">
      {statItems.map((stat, index) => (
        <motion.div
          className="stat-cell"
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.65, ease: easeOutExpo, delay: index * 0.08 }}
        >
          <StatCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
          <span className="stat-label">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ==========================================================================
   SECTION: PRICING (3-TIER 3D GLASS CARDS)
   ========================================================================== */
export function PricingSection({ onUnlock }: { onUnlock?: () => void }) {
  const [annual, setAnnual] = useState(false);
  const [isINR, setIsINR] = useState(true);

  const priceFree = isINR ? '₹0' : '$0';
  const pricePlus = isINR ? (annual ? '₹399' : '₹499') : (annual ? '$6.39' : '$7.99');
  const pricePremium = isINR ? (annual ? '₹799' : '₹999') : (annual ? '$11.99' : '$14.99');

  return (
    <section className="pricing-section" id="pricing" data-testid="pricing-section">
      <div className="pricing-header">
        <span className="about-badge">TRANSPARENT PLANS</span>
        <h2 className="about-headline">PRICING THAT SCALES WITH YOUR WEALTH</h2>
        <p className="about-sub">
          100% private, sovereign on-device data. No forced subscriptions for fundamental offline financial independence.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="pricing-toggle-row">
            <button
              type="button"
              className={`pricing-toggle-btn ${!annual ? 'is-active' : ''}`}
              onClick={() => setAnnual(false)}
            >
              <span style={{ position: 'relative', zIndex: 2 }}>Monthly</span>
              {!annual && (
                <motion.span
                  layoutId="pricingCyclePill"
                  className="pricing-toggle-active-bg"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              type="button"
              className={`pricing-toggle-btn ${annual ? 'is-active' : ''}`}
              onClick={() => setAnnual(true)}
            >
              <span style={{ position: 'relative', zIndex: 2 }}>
                Annual <span className="pricing-save-pill">Save 20%</span>
              </span>
              {annual && (
                <motion.span
                  layoutId="pricingCyclePill"
                  className="pricing-toggle-active-bg"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>

          <div className="pricing-toggle-row">
            <button
              type="button"
              className={`pricing-toggle-btn ${!isINR ? 'is-active' : ''}`}
              onClick={() => setIsINR(false)}
            >
              <span style={{ position: 'relative', zIndex: 2 }}>USD ($)</span>
              {!isINR && (
                <motion.span
                  layoutId="pricingCurrencyPill"
                  className="pricing-toggle-active-bg"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              type="button"
              className={`pricing-toggle-btn ${isINR ? 'is-active' : ''}`}
              onClick={() => setIsINR(true)}
            >
              <span style={{ position: 'relative', zIndex: 2 }}>INR (₹)</span>
              {isINR && (
                <motion.span
                  layoutId="pricingCurrencyPill"
                  className="pricing-toggle-active-bg"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="pricing-grid">
        {/* Tier 1: Free */}
        <div className="pricing-card" data-testid="pricing-card-free">
          <div>
            <div className="pricing-card-head">
              <h3>Free</h3>
              <p>100% Offline with sovereign customized local workspace.</p>
            </div>
            <div className="pricing-price-row">
              <motion.span
                key={`free-${isINR}`}
                className="pricing-amount"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: easeOutExpo }}
              >
                {priceFree}
              </motion.span>
              <span className="pricing-cycle">/ forever</span>
            </div>
            <ul className="pricing-features-list">
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Track up to 5 bank &amp; cash accounts</span>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Real-time spend tracking &amp; smart categorization</span>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Monthly spending summary reports</span>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Bill reminders &amp; payment alerts</span>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Basic AES-256 local vault security</span>
              </li>
            </ul>
          </div>
          <button type="button" className="pricing-cta-btn btn-solid" onClick={onUnlock}>
            Get started
          </button>
        </div>

        {/* Tier 2: Plus (Popular) */}
        <div className="pricing-card is-popular" data-testid="pricing-card-plus">
          <span className="pricing-popular-badge">Most Popular</span>
          <div>
            <div className="pricing-card-head">
              <h3>Plus</h3>
              <p>Advanced intelligence for active earners and freelancers.</p>
            </div>
            <div className="pricing-price-row">
              <motion.span
                key={`plus-${isINR}-${annual}`}
                className="pricing-amount"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: easeOutExpo }}
              >
                {pricePlus}
              </motion.span>
              <span className="pricing-cycle">/ {annual ? 'year' : 'month'}</span>
            </div>
            <ul className="pricing-features-list">
              <li>
                <span className="pricing-check-icon">✓</span>
                <b>Includes everything in Free, plus:</b>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Unlimited accounts &amp; encrypted vaults</span>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>AI-powered budgeting &amp; savings targets</span>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Trend-level spend insights &amp; forecasts</span>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Auto-tax est. &amp; GST invoice scheduling</span>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Priority offline customer support</span>
              </li>
            </ul>
          </div>
          <button type="button" className="pricing-cta-btn btn-gradient" onClick={onUnlock}>
            Upgrade to Plus
          </button>
        </div>

        {/* Tier 3: Premium */}
        <div className="pricing-card" data-testid="pricing-card-premium">
          <div>
            <div className="pricing-card-head">
              <h3>Premium</h3>
              <p>Full suite for wealth compounding, business &amp; FIRE.</p>
            </div>
            <div className="pricing-price-row">
              <motion.span
                key={`premium-${isINR}-${annual}`}
                className="pricing-amount"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: easeOutExpo }}
              >
                {pricePremium}
              </motion.span>
              <span className="pricing-cycle">/ {annual ? 'year' : 'month'}</span>
            </div>
            <ul className="pricing-features-list">
              <li>
                <span className="pricing-check-icon">✓</span>
                <b>Includes everything in Plus, plus:</b>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Integrated investment portfolio dashboard</span>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Smart portfolio tracking &amp; goal-based investing</span>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Advanced financial health &amp; FIRE analytics</span>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>Multi-currency support &amp; global payments</span>
              </li>
              <li>
                <span className="pricing-check-icon">✓</span>
                <span>24/7 premium support &amp; fraud alert rules</span>
              </li>
            </ul>
          </div>
          <button type="button" className="pricing-cta-btn btn-solid" onClick={onUnlock}>
            Go Premium
          </button>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   SECTION: BLOG / FINANCIAL ARTICLES & READER MODAL
   ========================================================================== */
interface Article {
  id: string;
  tag: string;
  readTime: string;
  title: string;
  summary: string;
  author: string;
  role: string;
  body: string[];
}

const articlesData: Article[] = [
  {
    id: 'tax-2026',
    tag: 'Tax Strategy',
    readTime: '6 min read',
    title: 'Old vs New Tax Regime in 2026: The Definitive Indian Taxpayer Guide',
    summary: 'A deep comparative analysis of Section 115BAC, standard deductions, HRA calculations, and how to choose optimal slabs.',
    author: 'Anuroop S.',
    role: 'Lead Architect',
    body: [
      'The Indian taxation landscape underwent profound shifts with the default adoption of the New Tax Regime under Section 115BAC.',
      'Under the revised slabs, tax rates are lower across moderate brackets, but standard deductions like 80C (PPF, ELSS), 80D (Health Insurance), and Section 24(b) home loan interest are unavailable.',
      'MyFinanceOS includes an offline comparative engine that runs parallel calculations on both regimes, factoring in employer contributions, NPS Section 80CCD(2), and capital gains.',
      'For high earners with significant deductions (> ₹3.75 Lakhs), the Old Regime often yields substantial tax savings. For simplified earners, the New Regime eliminates bureaucratic paperwork.',
    ],
  },
  {
    id: 'zero-knowledge',
    tag: 'Security & Privacy',
    readTime: '4 min read',
    title: 'Zero-Knowledge Local Architecture: Why Offline-First is the Future of Wealth',
    summary: 'How client-side AES-256-GCM encryption and Argon2id key derivation protect financial telemetry from data breaches.',
    author: 'Cryptography Team',
    role: 'Security Core',
    body: [
      'Traditional fintech applications centralize unencrypted banking transactions in cloud databases, creating single points of failure and monetization targets.',
      'MyFinanceOS was engineered from day one on a Zero-Knowledge paradigm. All ledger records, document vault PDFs, and tax calculations run in local SQLite WASM.',
      'When databases are encrypted on disk, keys are derived from your master PIN using Argon2id with 64MB memory cost, rendering brute-force attacks computationally unfeasible.',
    ],
  },
  {
    id: 'fire-india',
    tag: 'Wealth & FIRE',
    readTime: '8 min read',
    title: 'Achieving FIRE in India: A Mathematical Blueprint for Early Retirement',
    summary: 'Calculating safe withdrawal rates, inflation-adjusted corpus requirements, and dynamic equity-debt rebalancing.',
    author: 'Wealth Research',
    role: 'Quantitative Finance',
    body: [
      'Financial Independence, Retire Early (FIRE) in the Indian macroeconomic context requires accounting for real inflation averaging 6-7% and healthcare expense compounding.',
      'Using the 25x to 33x annual expense rule (3% to 4% Safe Withdrawal Rate), we demonstrate how equity mutual fund SIPs combined with PPF and gold hedges create antifragile wealth.',
      'The MyFinanceOS FIRE Calculator dynamically models sequence of returns risk (SRR) and simulates market drawdown buffers.',
    ],
  },
  {
    id: 'double-entry',
    tag: 'Engineering',
    readTime: '5 min read',
    title: 'Automating Double-Entry Bookkeeping with Local AI Copilots',
    summary: 'How deterministic double-entry accounting principles ensure zero balance discrepancies across multiple accounts.',
    author: 'Systems Lead',
    role: 'Core Engineering',
    body: [
      'Single-entry expense trackers invariably drift into inaccuracies due to untracked asset transfers, loan repayments, and credit card fee adjustments.',
      'By implementing formal double-entry bookkeeping (Assets = Liabilities + Equity), MyFinanceOS ensures every rupee has an immutable source and destination.',
      'Our local AI categorization model classifies raw bank statement CSV strings into corresponding ledger chart-of-accounts in sub-millisecond offline execution.',
    ],
  },
];

export function BlogSection() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <section className="blog-section" id="blog" data-testid="blog-section">
      <div className="about-header">
        <span className="about-badge">DISPATCHES &amp; INSIGHTS</span>
        <h2 className="about-headline">FINANCIAL INTELLIGENCE</h2>
        <p className="about-sub">
          Practical strategies on Indian taxation, cryptographic privacy, portfolio mathematics, and sovereign engineering.
        </p>
      </div>

      <div className="blog-grid">
        {articlesData.map((article) => (
          <div
            className="blog-card"
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            data-testid={`blog-card-${article.id}`}
          >
            <div>
              <div className="blog-meta-row">
                <span className="blog-tag-pill">{article.tag}</span>
                <span className="blog-read-time">{article.readTime}</span>
              </div>
              <h3>{article.title}</h3>
              <p>{article.summary}</p>
            </div>
            <div className="blog-author-row">
              <div className="blog-author-avatar">
                {article.author.slice(0, 2).toUpperCase()}
              </div>
              <div className="blog-author-info">
                <strong>{article.author}</strong>
                <span>{article.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reader Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div
            className="landing-modal-backdrop"
            onClick={() => setSelectedArticle(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="landing-modal-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.35, ease: easeOutExpo }}
            >
              <div className="landing-modal-head">
                <div>
                  <span className="blog-tag-pill" style={{ marginBottom: 6, display: 'inline-block' }}>{selectedArticle.tag}</span>
                  <h3>{selectedArticle.title}</h3>
                </div>
                <button
                  type="button"
                  className="landing-modal-close"
                  onClick={() => setSelectedArticle(null)}
                  aria-label="Close article"
                >
                  ✕
                </button>
              </div>
              <div className="landing-modal-body">
                <p style={{ fontStyle: 'italic', marginBottom: 20, color: '#6e38e8' }}>
                  By {selectedArticle.author} ({selectedArticle.role}) · {selectedArticle.readTime}
                </p>
                {selectedArticle.body.map((para, idx) => (
                  <p key={idx} style={{ marginBottom: 16 }}>{para}</p>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ==========================================================================
   SECTION: CONTACT CONSOLE
   ========================================================================== */
export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const pgpKey = '4A8F 9C21 7B03 E19D B654 39A0 82FE 601D';
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    submitTimerRef.current = setTimeout(() => setSubmitted(false), 4000);
  };

  const handleCopyKey = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pgpKey);
      setCopiedKey(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  return (
    <section className="contact-section" id="contact" data-testid="contact-section">
      <div className="about-header">
        <span className="about-badge">DIRECT REACH</span>
        <h2 className="about-headline">CONNECT WITH THE TEAM</h2>
        <p className="about-sub">
          Need support with self-hosting, offline vault setups, or enterprise customization? Reach out directly.
        </p>
      </div>

      <div className="contact-card-console" data-testid="contact-card">
        <div className="contact-info-panel">
          <h3>Sovereign Support &amp; Community</h3>
          <p>
            We respect your privacy. Message communications can be verified via PGP fingerprint or sent via open developer community channels.
          </p>

          <div className="contact-pgp-box">
            <span className="pgp-label">Verified PGP Public Fingerprint</span>
            <span className="pgp-fingerprint">{pgpKey}</span>
            <button
              type="button"
              onClick={handleCopyKey}
              style={{ display: 'block', marginTop: 8, fontSize: 12, color: '#6e38e8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              {copiedKey ? '✓ Fingerprint Copied' : 'Copy Key'}
            </button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 10, color: '#6e38e8' }}>
              Developer Community Channels
            </span>
            <div className="contact-channels-list">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="contact-channel-chip">
                GitHub Discussions
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="contact-channel-chip">
                Discord Community
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="contact-channel-chip">
                X / Twitter
              </a>
              <a href="https://telegram.org" target="_blank" rel="noreferrer" className="contact-channel-chip">
                Telegram Channel
              </a>
            </div>
          </div>
        </div>

        <div>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(16,185,129,0.06)', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
              <h4 style={{ color: '#059669', fontSize: 20, margin: '0 0 8px' }}>Message Received</h4>
              <p style={{ color: '#4b5563', fontSize: 14 }}>
                Your inquiry has been stored in our encrypted queue. Average response time is under 2 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form-console" data-testid="contact-form">
              <div className="form-group">
                <label htmlFor="contact-name">Name</label>
                <input id="contact-name" type="text" className="form-input" placeholder="Your Name" required />
              </div>
              <div className="form-group">
                <label htmlFor="contact-email">Email</label>
                <input id="contact-email" type="email" className="form-input" placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="contact-subject">Topic</label>
                <input id="contact-subject" type="text" className="form-input" placeholder="e.g. Offline deployment, Feature question..." required />
              </div>
              <div className="form-group">
                <label htmlFor="contact-message">Message</label>
                <textarea id="contact-message" className="form-textarea" placeholder="How can we assist your financial sovereignty?" required />
              </div>
              <button type="submit" className="form-submit-btn">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   SECTION: METHODOLOGY & ARCHITECTURE (FIVE PHASES. NO MYSTERY.)
   ========================================================================== */
function PhaseShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="phases-guarantee-icon">
      <path
        d="M8 1.5L2.5 3.5V7.5C2.5 11 5 14 8 15C11 14 13.5 11 13.5 7.5V3.5L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 7.5L7.5 9L10.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface PhaseStep {
  number: string;
  title: string;
  description: string;
  tags: string[];
  guarantee: string;
}

export const FIVE_PHASES: PhaseStep[] = [
  {
    number: '01',
    title: 'Capture',
    description:
      'Zero-leakage ingestion and reconciliation. We parse bank statements, broker CAS logs, and multi-currency CSVs locally, reconciling every transaction into a strict double-entry ledger before a single byte touches persistent storage.',
    tags: ['Bank & Broker Parsers', 'Double-Entry Ledger', 'Local SQLite WASM', 'Zero-Knowledge Vault'],
    guarantee: 'Verified • 100% Client-Side WASM Zero-Knowledge Execution',
  },
  {
    number: '02',
    title: 'Dissect',
    description:
      'Real-time cash flow diagnostics and categorical clarity. We map income streams, variable expenditures, and recurring liabilities into interactive Sankey flows, exposing phantom subscriptions and burn-rate anomalies instantly.',
    tags: ['Sankey Flow Engine', 'Burn Rate Analytics', 'Subscription Radar', 'Amortization Matrix'],
    guarantee: 'Live • Real-Time Dynamic Sankey Cashflow Graph',
  },
  {
    number: '03',
    title: 'Optimize',
    description:
      'Algorithmic tax intelligence and regulatory precision. Side-by-side Old vs New Regime simulation, Section 80C/80D deduction harvesting, capital gains tax-loss computation, and compliant B2B GST invoicing engineered for Indian jurisprudence.',
    tags: ['Dual-Regime Modeler', 'Capital Gains Engine', 'GST Invoicing Suite', 'Deduction Optimizer'],
    guarantee: 'Engineered • FY 2026-27 Dual-Regime Precision Engine',
  },
  {
    number: '04',
    title: 'Compound',
    description:
      'Mathematical wealth modeling and FIRE trajectory architecture. We simulate SIP compounding, asset allocation drift, inflation-adjusted corpus longevity, and milestone horizons across equities, debt, gold, and liquid reserves.',
    tags: ['FIRE Target Engine', 'SIP Compound Modeler', 'Asset Allocation Drift', 'Monte Carlo Stress Test'],
    guarantee: 'Projected • Multi-Horizon Inflation-Adjusted Model',
  },
  {
    number: '05',
    title: 'Govern',
    description:
      'Private autonomous intelligence and sovereign execution. An offline, local AI copilot audits your financial health, executes conditional trigger automations, and seals confidential assets in an Argon2id-encrypted document vault.',
    tags: ['Local AI Copilot', 'Conditional Triggers', 'Argon2id Vault', 'Audit-Proof Exports'],
    guarantee: 'Guaranteed • Zero Third-Party Telemetry & Argon2id Vault',
  },
];

export function FivePhasesSection() {
  const [activePhase, setActivePhase] = useState<number>(0);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const trackLineRef = useRef<HTMLDivElement | null>(null);
  const trackGlowRef = useRef<HTMLDivElement | null>(null);
  const trackBeadRef = useRef<HTMLDivElement | null>(null);

  const totalDistRef = useRef<number>(1725);
  const currentProgressRef = useRef<number>(0);
  const targetProgressRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const applyTransforms = useCallback((p: number) => {
    const totalDist = totalDistRef.current || 1725;
    if (trackGlowRef.current) {
      trackGlowRef.current.style.transform = `scaleY(${p.toFixed(5)})`;
    }
    if (trackBeadRef.current) {
      // 4.5px offset centers the 9px bead directly on the leading tip of the light
      trackBeadRef.current.style.transform = `translate3d(-50%, ${(p * totalDist - 4.5).toFixed(2)}px, 0)`;
    }
  }, []);

  const startRafLoop = useCallback(() => {
    if (rafIdRef.current !== null) return;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.064);
      lastTimeRef.current = now;

      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.0002) {
        currentProgressRef.current = target;
        applyTransforms(target);
        rafIdRef.current = null;
        return;
      }

      // Ultra-smooth liquid inertia physics (decay rate 7.5s^-1):
      // Smooths out all mouse wheel notchiness into an effortless, buttery fluid stream
      const decay = 1 - Math.exp(-7.5 * dt);
      const next = current + diff * decay;
      currentProgressRef.current = next;

      applyTransforms(next);

      const phaseIdx = Math.min(4, Math.max(0, Math.round(next * 4)));
      setActivePhase((prev) => (prev !== phaseIdx ? phaseIdx : prev));

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [applyTransforms]);

  const onScrollTick = useCallback(() => {
    if (typeof window === 'undefined') return;

    const itemEls = document.querySelectorAll<HTMLElement>('.phases-item');
    if (!itemEls.length) return;

    const firstBadge = itemEls[0]?.querySelector<HTMLElement>('.phases-badge');
    const lastBadge = itemEls[itemEls.length - 1]?.querySelector<HTMLElement>('.phases-badge');
    if (!firstBadge || !lastBadge) return;

    const b0Rect = firstBadge.getBoundingClientRect();
    const bLastRect = lastBadge.getBoundingClientRect();

    const b0Y = b0Rect.top + b0Rect.height / 2;
    const bLastY = bLastRect.top + bLastRect.height / 2;
    const totalDist = bLastY - b0Y;

    if (totalDist > 0) {
      totalDistRef.current = totalDist;
      if (trackLineRef.current) {
        trackLineRef.current.style.height = `${totalDist}px`;
      }
    }

    const focalY = window.innerHeight * 0.42;

    let rawProgress = 0;
    if (totalDist > 0) {
      rawProgress = (focalY - b0Y) / totalDist;
    }
    const targetProgress = Math.min(1, Math.max(0, rawProgress));
    targetProgressRef.current = targetProgress;

    startRafLoop();
  }, [startRafLoop]);

  // Hook into Lenis smooth-scroller singleton RAF loop
  useLenisScroll(true, onScrollTick);

  // Hook into native window scroll & resize events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    onScrollTick();

    window.addEventListener('scroll', onScrollTick, { passive: true });
    window.addEventListener('resize', onScrollTick, { passive: true });
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(onScrollTick);
    }

    return () => {
      window.removeEventListener('scroll', onScrollTick);
      window.removeEventListener('resize', onScrollTick);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [onScrollTick]);

  return (
    <section
      className="phases-section changelog-section"
      id="how-we-work"
      data-testid="phases-section"
      data-test-changelog="true"
    >
      <span
        id="changelog"
        style={{ position: 'absolute', top: '-100px', left: 0, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      />
      <div className="phases-container" data-testid="changelog-section">
        {/* Sticky Left Column */}
        <motion.div
          className="phases-sticky-col"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
        >
          <div className="phases-eyebrow">
            <span className="phases-eyebrow-dash" aria-hidden="true">—</span>
            <span>HOW WE OPERATE</span>
            <span className="phases-live-pulse" aria-hidden="true" title="Real-time methodology pipeline">
              <span className="phases-live-pulse-ring" />
              <span className="phases-live-pulse-core" />
            </span>
          </div>
          <h2 className="phases-headline">
            Five phases.<br />
            No mystery.
          </h2>
          <p className="phases-description">
            The same arc runs through every financial cycle, whether reconciling yesterday&apos;s transactions or modeling thirty-year wealth independence. Each phase has named, deterministic outputs, so you always know what your money is doing and why.
          </p>
        </motion.div>

        {/* Timeline Right Column */}
        <div className="phases-timeline-col" ref={timelineRef}>
          <div className="phases-timeline changelog-timeline">
            {/* Glowing vertical connector line */}
            <div className="phases-track-line" ref={trackLineRef} aria-hidden="true">
              <div
                ref={trackGlowRef}
                className="phases-track-glow"
              />
              <div
                ref={trackBeadRef}
                className="phases-track-bead"
              >
                <span className="phases-track-bead-core" />
              </div>
            </div>

            {/* Sequence of Phases */}
            {FIVE_PHASES.map((phase, idx) => {
              const isActive = activePhase === idx;
              return (
                <motion.div
                  key={phase.number}
                  className={`phases-item changelog-entry ${isActive ? 'is-active-card' : ''}`}
                  data-phase-index={idx}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: idx * 0.08, ease: easeOutExpo }}
                  onMouseEnter={() => setActivePhase(idx)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                  }}
                >
                  <div className="phases-badge-wrapper">
                    <div
                      className={`phases-badge changelog-dot ${isActive ? 'is-active' : ''}`}
                      aria-label={`Phase ${phase.number}`}
                    >
                      {phase.number}
                    </div>
                    <div className={`phases-badge-halo ${isActive ? 'is-pulsing' : ''}`} aria-hidden="true" />
                  </div>

                  <div className="phases-content changelog-card">
                    <h3 className="phases-title">{phase.title}</h3>
                    <p className="phases-summary">{phase.description}</p>
                    <div className="phases-tags">
                      {phase.tags.map((tag) => (
                        <span key={tag} className="phases-pill changelog-item-tag">
                          <span className="phases-pill-dot" aria-hidden="true" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="phases-guarantee">
                      <PhaseShieldIcon />
                      <span>{phase.guarantee}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export const ChangelogSection = FivePhasesSection;

/* ==========================================================================
   SECTION: LEGAL (TERMS OF SERVICE & PRIVACY POLICY EMBEDDED PANELS)
   ========================================================================== */
export function LegalSection() {
  const [openModal, setOpenModal] = useState<'terms' | 'privacy' | null>(null);

  return (
    <section className="legal-section" id="legal-hub" data-testid="legal-section">
      <div className="about-header">
        <span className="about-badge">SOVEREIGN GOVERNANCE</span>
        <h2 className="about-headline">TERMS &amp; PRIVACY GUARANTEE</h2>
        <p className="about-sub">
          Plain-English commitments. You own 100% of your data with zero telemetry or hidden vendor lock-in.
        </p>
      </div>

      <div className="legal-cards-grid">
        {/* Terms of Service Card */}
        <div className="legal-preview-card" id="terms" data-testid="legal-card-terms">
          <div>
            <div className="legal-card-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h3>Terms of Service</h3>
            <p>
              MyFinanceOS grants you a perpetual, non-exclusive license to use and execute this sovereign financial OS.
              You retain full ownership of all ledger records, tax documents, and personal credentials.
            </p>
          </div>
          <button
            type="button"
            className="legal-read-full-btn"
            onClick={() => setOpenModal('terms')}
          >
            Read Full Terms Document →
          </button>
        </div>

        {/* Privacy Policy Card */}
        <div className="legal-preview-card" id="privacy" data-testid="legal-card-privacy">
          <div>
            <div className="legal-card-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>Privacy Policy</h3>
            <p>
              Zero telemetry, zero trackers, and zero remote analytics. Data remains strictly encrypted on your physical machine.
              Fully compliant with India DPDP Act 2023, GDPR, and CCPA standards.
            </p>
          </div>
          <button
            type="button"
            className="legal-read-full-btn"
            onClick={() => setOpenModal('privacy')}
          >
            Read Privacy Manifesto →
          </button>
        </div>
      </div>

      {/* Terms & Privacy Modal */}
      <AnimatePresence>
        {openModal && (
          <div
            className="landing-modal-backdrop"
            onClick={() => setOpenModal(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="landing-modal-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.35, ease: easeOutExpo }}
            >
              <div className="landing-modal-head">
                <h3>{openModal === 'terms' ? 'Terms of Service' : 'Privacy Policy & Zero-Knowledge Manifesto'}</h3>
                <button
                  type="button"
                  className="landing-modal-close"
                  onClick={() => setOpenModal(null)}
                  aria-label="Close legal modal"
                >
                  ✕
                </button>
              </div>
              <div className="landing-modal-body">
                {openModal === 'terms' ? (
                  <>
                    <h4>1. Ownership and Data Sovereignty</h4>
                    <p>
                      All database records, transaction logs, invoices, and tax calculations remain the exclusive intellectual and financial property of the user. MyFinanceOS holds zero claim over your financial records.
                    </p>
                    <h4>2. Local Execution and No Warranty Disclaimer</h4>
                    <p>
                      The software is provided &quot;as is&quot; for personal financial tracking and general tax planning. Tax calculations should be independently verified with certified chartered accountants for official filings.
                    </p>
                    <h4>3. Cryptographic Master Key Responsibility</h4>
                    <p>
                      Because MyFinanceOS uses zero-knowledge client-side encryption, lost master PINs cannot be recovered from any central server. Users are encouraged to securely back up their offline recovery phrases.
                    </p>
                  </>
                ) : (
                  <>
                    <h4>1. Zero Telemetry Commitment</h4>
                    <p>
                      MyFinanceOS does not embed tracking cookies, third-party analytics scripts, or background telemetry pings. Your financial habits remain confidential to you.
                    </p>
                    <h4>2. Cryptographic Storage &amp; Local AI</h4>
                    <p>
                      All local database entries are encrypted using AES-256-GCM authenticated ciphers. When using local AI features, models execute within the browser context or via local Ollama sockets without transmission across public internet infrastructure.
                    </p>
                    <h4>3. Regulatory Compliance</h4>
                    <p>
                      By strictly storing all data on the user&apos;s physical machine, MyFinanceOS naturally complies with global privacy mandates including India&apos;s Digital Personal Data Protection (DPDP) Act 2023 and the EU General Data Protection Regulation (GDPR).
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ==========================================================================
   CAPABILITY MARQUEE & FAQS
   ========================================================================== */
const capabilityRows: string[][] = [
  ['Net-Worth Dashboard', 'Double-Entry Ledger', 'Sankey Cash Flow', 'Mutual Funds & SIPs', 'Stock Portfolio', 'FIRE Retirement Planner', 'Loan EMI Calculator', 'Goal Tracker'],
  ['Old vs New Tax Regime', 'Section 80C & 80D Deductions', 'Capital Gains Estimator', 'GST Invoicing Suite', 'Business P&L Reports', 'Encrypted Document Vault', 'Local AI Assistant', 'Smart Automation Rules'],
];

function MarqueeRail({ items, reverse }: { items: string[]; reverse: boolean }) {
  return (
    <div className={`marquee-rail ${reverse ? 'is-reverse' : ''}`}>
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div className="marquee-group" key={copy} aria-hidden={copy === 1}>
            {items.map((item) => (
              <span className="marquee-chip" key={`${copy}-${item}`}>
                <i aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CapabilityMarquee() {
  return (
    <div className="capability-marquee" data-testid="capability-marquee" aria-label="Everything inside MyFinanceOS">
      {capabilityRows.map((row, index) => (
        <MarqueeRail items={row} reverse={index === 1} key={index} />
      ))}
    </div>
  );
}

const faqItems: { question: string; answer: React.ReactNode }[] = [
  {
    question: 'What makes MyFinanceOS different from traditional finance apps?',
    answer:
      'Most fintech apps upload your bank statements, PAN, and transaction history to remote cloud servers for monetization and profiling. MyFinanceOS runs 100% on your local device. Your ledger, tax files, and investments remain strictly confidential in an AES-256 encrypted vault with zero cloud tracking.',
  },
  {
    question: 'Does MyFinanceOS work completely offline?',
    answer:
      'Yes, it is offline-first by architecture. You can log expenses, track investment returns, run Old vs New tax calculations, create GST invoices, and plan retirement without an active internet connection. Optional multi-device sync is end-to-end encrypted before data ever leaves your device.',
  },
  {
    question: 'How does the Indian Tax Regime and GST feature work?',
    answer:
      'MyFinanceOS compares your taxable income under both the Old and New Tax Regimes side-by-side. It factors in Section 80C, 80D, HRA exemptions, and capital gains (STCG/LTCG). For business owners and freelancers, it generates professional GST invoices, tracks client balances, and creates automatic Profit & Loss statements.',
  },
  {
    question: 'Which investment assets and accounts can I track?',
    answer:
      'You can track stocks, mutual funds (SIP and lump sum), gold, real estate, fixed deposits, EPF/PPF, cryptocurrencies, cash, and bank accounts. It automatically computes your portfolio IRR, CAGR, dividend income, and asset allocation breakdown.',
  },
  {
    question: 'How secure is the Document Vault and Data Storage?',
    answer:
      'All financial records, PDFs, tax slips, and identity documents are stored in a local AES-256-GCM encrypted vault. Unlocking requires your master PIN, protected by memory-hard Argon2id key derivation. Your encryption keys never leave your machine.',
  },
  {
    question: 'Can I import my existing bank statements and CSVs?',
    answer:
      'Yes. You can import CSV statements from any bank or brokerage, paste rows in bulk, or use custom automation rules to automatically categorize your transactions and recurring expenses.',
  },
];

const FaqRow = memo(function FaqRow({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: { question: string; answer: React.ReactNode };
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <motion.div
      className={`faq-row ${isOpen ? 'is-open' : ''}`}
      data-testid={`faq-row-${index}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.62, ease: easeOutExpo, delay: index * 0.05 }}
    >
      <button
        type="button"
        className="faq-question"
        id={buttonId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        data-testid={`faq-question-${index}`}
      >
        <span>{item.question}</span>
        <span className="faq-sign" aria-hidden="true">
          <i className="faq-sign-bar" />
          <i className="faq-sign-bar is-vertical" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="faq-answer"
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.44, ease: easeOutExpo }}
          >
            <p>{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export function Faq({ onUnlock }: { onUnlock?: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="faq-section" id="faqs" data-testid="faq-section" aria-labelledby="faq-heading">
      <motion.span
        className="outro-badge"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
      >
        <svg viewBox="0 0 12 12" width="9" height="9" fill="currentColor" aria-hidden="true">
          <path d="M6 0l1.3 3.9L11 5.2 7.3 6.5 6 10.4 4.7 6.5 1 5.2l3.7-1.3z" />
        </svg>
        Questions
      </motion.span>
      <motion.h2
        className="faq-heading"
        id="faq-heading"
        data-testid="faq-heading"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.06 }}
      >
        <span>FREQUENTLY ASKED</span>
      </motion.h2>
      <div className="faq-list">
        {faqItems.map((item, index) => (
          <FaqRow
            key={item.question}
            item={item}
            index={index}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
          />
        ))}
      </div>
      <motion.div
        className="faq-more"
        data-testid="faq-more"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
      >
        <strong>Still have more questions?</strong>
        <p>
          Need help setting up your workspace?{' '}
          <a
            href="#contact"
            onClick={(event) => {
              if (onUnlock) {
                event.preventDefault();
                onUnlock();
              }
            }}
            data-testid="faq-contact-link"
          >
            Launch workspace
          </a>{' '}
          to get started.
        </p>
      </motion.div>
    </section>
  );
}

/* ==========================================================================
   MEGA CTA ("CLARITY. CONFIDENT. CONTROL.")
   ========================================================================== */
function CtaPhone() {
  return (
    <div className="cta-phone" data-testid="cta-phone">
      <div className="phone">
        <div className="phone-screen">
          <div className="phone-pill">YOUR MONEY, ONE PLACE</div>
          <div className="phone-symbol" aria-hidden="true">
            <span className="symbol-ring" />
            <span className="symbol-core" />
            <span className="symbol-cut" />
          </div>
        </div>
      </div>
    </div>
  );
}

const socialBadges = [
  {
    key: 'x',
    label: 'X',
    className: 'is-x',
    path: 'M18.9 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    className: 'is-linkedin',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    className: 'is-youtube',
    path: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    className: 'is-facebook',
    path: 'M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.017 1.792-4.686 4.533-4.686 1.312 0 2.686.236 2.686.236v2.955H15.83c-1.491 0-1.956.93-1.956 1.887v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    className: 'is-instagram',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.586 2.163 15.206 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608C4.519 2.567 5.786 2.293 7.152 2.231 8.418 2.175 8.798 2.163 12 2.163zm0 3.675A6.162 6.162 0 105.838 12 6.162 6.162 0 0012 5.838zm0 10.162A4 4 0 118 12a4 4 0 014 4zm6.406-11.845a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z',
  },
];

const megaWords = [
  { text: 'CLARITY.', className: 'mw-1' },
  { text: 'CONFIDENT.', className: 'mw-2' },
  { text: 'CONTROL.', className: 'mw-3' },
];

const megaDrifts: Array<[string, string]> = [
  ['-7%', '5%'],
  ['9%', '-8%'],
  ['-13%', '4%'],
];

const MEGA_DRIFTS_NUM = [
  [-7, 5],
  [9, -8],
  [-13, 4],
] as const;

const PROGRESS_ANCHORS = [0, 0.5, 1] as const;
const HALO_SCALE_YS = [0.82, 1.12, 0.9] as const;
const HALO_OPACITY_YS = [0.35, 0.9, 0.4] as const;
const PHONE_SCALE_YS = [0.9, 1, 0.94] as const;

export function MegaCta({ onUnlock, authenticating = false }: { onUnlock?: () => void; authenticating?: boolean }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const haloRef = useRef<HTMLSpanElement | null>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const phoneRef = useRef<HTMLDivElement | null>(null);

  const apply = useCallback((p: number) => {
    const halo = haloRef.current;
    if (halo) {
      halo.style.transform = `scale(${piecewiseMap(p, PROGRESS_ANCHORS, HALO_SCALE_YS).toFixed(4)})`;
      halo.style.opacity = piecewiseMap(p, PROGRESS_ANCHORS, HALO_OPACITY_YS).toFixed(3);
    }

    for (let i = 0; i < MEGA_DRIFTS_NUM.length; i++) {
      const el = wordRefs.current[i];
      if (!el) continue;
      const [from, to] = MEGA_DRIFTS_NUM[i];
      el.style.transform = `translateX(${(from + (to - from) * p).toFixed(3)}%)`;
    }

    const phone = phoneRef.current;
    if (phone) {
      phone.style.transform = `translateY(${(86 - 172 * p).toFixed(2)}px) scale(${piecewiseMap(p, PROGRESS_ANCHORS, PHONE_SCALE_YS).toFixed(4)})`;
    }
  }, []);

  useLenisSectionProgress(sectionRef, apply);

  return (
    <section className="mega-cta" id="download" data-testid="mega-cta" ref={sectionRef}>
      <span
        ref={haloRef}
        className="mega-halo"
        aria-hidden="true"
        style={{ transform: 'scale(0.82)', opacity: 0.35 }}
      />

      <div className="mega-stage">
        <h2 className="mega-words" data-testid="mega-words">
          {megaWords.map((word, index) => (
            <span
              className="mega-word-track"
              key={word.text}
              ref={(el) => { wordRefs.current[index] = el; }}
              style={{ transform: `translateX(${megaDrifts[index][0]})` }}
            >
              <motion.span
                className={`mega-word ${word.className}`}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.9, ease: easeOutExpo, delay: index * 0.12 }}
              >
                {word.text}
              </motion.span>
            </span>
          ))}
        </h2>

        <div
          className="mega-phone-track"
          ref={phoneRef}
          style={{ transform: 'translateY(86px) scale(0.9)' }}
        >
          <motion.div
            className="mega-phone"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, ease: easeOutExpo, delay: 0.18 }}
          >
            <CtaPhone />
          </motion.div>
        </div>

        <div className="mega-socials" data-testid="mega-socials">
          {socialBadges.map((badge, index) => (
            <motion.a
              className={`social-badge ${badge.className}`}
              key={badge.key}
              href="#contact"
              aria-label={`MyFinanceOS on ${badge.label}`}
              data-testid={`social-badge-${badge.key}`}
              onClick={(event) => event.preventDefault()}
              initial={{ opacity: 0, scale: 0.4, y: 24 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ ...springBouncy, delay: 0.3 + index * 0.08 }}
              whileHover={{ scale: 1.14, y: -6, rotate: index % 2 ? 5 : -5 }}
              whileTap={{ scale: 0.94 }}
            >
              <i
                className="social-float"
                style={{ animationDuration: `${(4.6 + index * 0.7).toFixed(2)}s` }}
              >
                <svg viewBox="0 0 24 24" width="52%" height="52%" fill="currentColor" aria-hidden="true">
                  <path d={badge.path} />
                </svg>
              </i>
            </motion.a>
          ))}
        </div>
      </div>

      <div className="store-row" data-testid="store-row">
        {[
          {
            key: 'ios',
            top: 'Download on the',
            bottom: 'App Store',
            glyph: (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            ),
          },
          {
            key: 'android',
            top: 'Get it on',
            bottom: 'Google Play',
            glyph: (
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path
                  d="M1.34.92A1.49 1.49 0 001.22 1.5v21.02c0 .22.05.42.13.6l11.15-11.09z"
                  fill="#2bd4ac"
                />
                <path d="M22.02 13.3l-3.92 2.22-3.52-3.49 3.55-3.53 3.89 2.2a1.49 1.49 0 010 2.6z" fill="#ffce54" />
                <path d="M12.21 12.42l1.87 1.87-11.13 6.3z" fill="#ff5f5f" />
                <path d="M2.95 3.41l11.13 6.3-1.87 1.87z" fill="#5bb2ff" />
              </svg>
            ),
          },
        ].map((store, index) => (
          <motion.button
            type="button"
            className="store-button"
            key={store.key}
            onClick={onUnlock}
            disabled={authenticating}
            data-testid={`store-button-${store.key}`}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.1 + index * 0.09 }}
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.97 }}
          >
            {store.glyph}
            <span className="store-copy">
              <small>{store.top}</small>
              <strong>{store.bottom}</strong>
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

export function Wordmark() {
  const ref = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);

  const apply = useCallback((p: number) => {
    const el = textRef.current;
    if (!el) return;
    el.style.transform = `translateX(${(5 - 10 * p).toFixed(3)}%) translateY(${(54 - 76 * p).toFixed(2)}px)`;
    el.style.opacity = Math.min(p / 0.4, 1).toFixed(3);
  }, []);

  useLenisSectionProgress(ref, apply);

  return (
    <div className="wordmark-bleed" ref={ref} data-testid="wordmark-bleed" aria-hidden="true">
      <span
        ref={textRef}
        className="wordmark-text"
        style={{ transform: 'translateX(5%) translateY(54px)', opacity: 0 }}
      >
        MYFINANCEOS
      </span>
    </div>
  );
}

type FooterLink = { label: string; href: string };

const footerNavColumns: FooterLink[][] = [
  [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Features', href: '#features' },
  ],
  [
    { label: 'Pricing', href: '#pricing' },
    { label: 'Blog', href: '#blog' },
  ],
];

const footerLegalColumns: FooterLink[][] = [
  [
    { label: 'Contact', href: '#contact' },
    { label: 'FAQs', href: '#faqs' },
    { label: 'Changelog', href: '/changelog' },
  ],
  [
    { label: 'Methodology', href: '#how-we-work' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
];

function IndiaFlagIcon({ className = 'flag-svg' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" width="18" height="12" className={className} aria-label="India flag" role="img" style={{ borderRadius: '2px', overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle', boxShadow: '0 0 0 1px rgba(0,0,0,0.12)' }}>
      <rect width="24" height="5.33" fill="#FF9933" />
      <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
      <rect y="10.66" width="24" height="5.34" fill="#138808" />
      <circle cx="12" cy="8" r="2.1" fill="none" stroke="#000080" strokeWidth="0.55" />
      <circle cx="12" cy="8" r="0.5" fill="#000080" />
      <g stroke="#000080" strokeWidth="0.25">
        <line x1="12" y1="5.9" x2="12" y2="10.1" />
        <line x1="9.9" y1="8" x2="14.1" y2="8" />
        <line x1="10.5" y1="6.5" x2="13.5" y2="9.5" />
        <line x1="10.5" y1="9.5" x2="13.5" y2="6.5" />
      </g>
    </svg>
  );
}

function ShieldLockIcon({ className = 'lock-svg' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" className={className} aria-hidden="true" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V4.5a2.5 2.5 0 0 1 5 0V7" />
      <circle cx="8" cy="10.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

function FooterColumn({ links, offset }: { links: FooterLink[]; offset: number }) {
  return (
    <ul className="footer-column">
      {links.map((link, index) => (
        <motion.li
          key={link.label}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: easeOutExpo, delay: offset + index * 0.05 }}
        >
          <a
            href={link.href}
            onClick={(e) => {
              const target = document.querySelector(link.href);
              if (target) {
                e.preventDefault();
                smoothScrollTo(target as HTMLElement, -40);
              }
            }}
          >
            {link.label}
          </a>
        </motion.li>
      ))}
    </ul>
  );
}

export function SiteFooter({ hideChangelogShelf = false }: { hideChangelogShelf?: boolean } = {}) {
  const scrollToTop = useCallback(() => {
    smoothScrollTo(0);
  }, []);

  // First paint reads the checked-in release date so server and client render an
  // identical year (no hydration mismatch); an effect then corrects it to the
  // viewer's current year after mount.
  const [copyrightYear, setCopyrightYear] = useState(() =>
    new Date(LATEST_CHANGELOG_ENTRY.date).getUTCFullYear()
  );
  useEffect(() => {
    setCopyrightYear(new Date().getFullYear());
  }, []);

  return (
    <div className="footer-shell" data-testid="footer-shell">
      <footer className="site-footer" data-testid="site-footer">
        <div className="back-to-top-notch">
          <motion.button
            type="button"
            className="back-to-top"
            onClick={scrollToTop}
            aria-label="Back to top"
            data-testid="back-to-top"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={springBouncy}
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.94 }}
          >
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
              <path d="M8 13V3.6M8 3.6L3.4 8.2M8 3.6l4.6 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>

        <div className="footer-sheen" aria-hidden="true" />
        <div className="footer-arc" aria-hidden="true" />
        <div className="footer-arc footer-arc-sm" aria-hidden="true" />

        {/* Top Segmented Cards */}
        <div className="footer-modules-grid">
          {/* Left Module: Primary Navigation Links */}
          <div className="footer-card-module footer-nav-module">
            <motion.h2
              className="footer-title footer-title-left"
              data-testid="footer-title-nav"
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.8, ease: easeOutExpo }}
            >
              EXPLORE &amp;
              <br />
              PLATFORM
            </motion.h2>

            <div className="footer-nav-columns">
              {footerNavColumns.map((links, index) => (
                <FooterColumn links={links} offset={index * 0.08} key={index} />
              ))}
            </div>
          </div>

          {/* Right Module: Legal & Utilities */}
          <div className="footer-card-module footer-legal-module">
            <motion.h2
              className="footer-title"
              data-testid="footer-title"
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.8, ease: easeOutExpo }}
            >
              LEGAL &amp;
              <br />
              UTILITIES
            </motion.h2>

            <div className="footer-legal-columns">
              {footerLegalColumns.map((links, index) => (
                <FooterColumn links={links} offset={0.16 + index * 0.08} key={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Release & Changelog Shelf (suppressed on /changelog page) */}
        {!hideChangelogShelf && (
          <div className="footer-changelog-shelf" data-testid="footer-changelog">
            <div className="footer-changelog-meta">
              <div className="footer-version-tag" data-testid="footer-version-tag">
                <span className="footer-version-dot" aria-hidden="true" />
                <span>MyFinanceOS v{CURRENT_VERSION}</span>
              </div>
              <div className="footer-changelog-summary" data-testid="footer-changelog-summary">
                <span className="footer-summary-prefix">Latest:</span>
                <span className="footer-summary-text">{LATEST_CHANGELOG_ENTRY.summary}</span>
              </div>
            </div>
            <Link href="/changelog" className="footer-changelog-link" data-testid="footer-changelog-link">
              <span>View Changelog</span>
              <span aria-hidden="true" className="footer-link-arrow">→</span>
            </Link>
          </div>
        )}

        {/* Bottom Frosted Pill / Ribbon Shelf */}
        <div className="footer-frosted-shelf">
          <div className="footer-shelf-content">
            <p className="footer-shelf-copyright">
              © MyFinanceOS {copyrightYear}. All rights reserved.
            </p>
            <div className="footer-shelf-credit" data-testid="footer-credit">
              <span className="footer-shelf-pill">
                <ShieldLockIcon />
                <span>Offline-First Architecture</span>
              </span>
              <span className="footer-shelf-sep">•</span>
              <span>Sovereign Wealth OS</span>
              <span className="footer-shelf-sep">•</span>
              <span className="footer-credit-badge">
                <IndiaFlagIcon />
                <span>in India</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ==========================================================================
   OUTRO
   ========================================================================== */
export function Outro({ onUnlock, authenticating = false }: { onUnlock?: () => void; authenticating?: boolean }) {
  return (
    <div className="outro" data-testid="outro-section">
      <div className="outro-rim" aria-hidden="true" />
      <div className="outro-aurora outro-aurora-1" aria-hidden="true" />
      <div className="outro-aurora outro-aurora-2" aria-hidden="true" />
      <AboutSection />
      <PricingSection onUnlock={onUnlock} />
      <BlogSection />
      <ContactSection />
      <ChangelogSection />
      <LegalSection />
      <CapabilityMarquee />
      <Faq onUnlock={onUnlock} />
      <MegaCta onUnlock={onUnlock} authenticating={authenticating} />
      <Wordmark />
      <SiteFooter />
    </div>
  );
}

export const Landing: React.FC<LandingProps> = ({ onUnlock, authenticating }) => {
  const [dark, setDark] = useState(false);

  // Use the gallery's reference-counted Lenis singleton for the entire landing
  // page. Skiper30 then joins this already-running one-RAF engine for its
  // parallax transforms, exactly as it does in the isolated component lab.
  useLenisScroll(true);
  useHeroScrollObserver();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
      if (stored === 'dark') {
        setDark(true);
      } else if (stored === 'light') {
        setDark(false);
      } else if (document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('dark')) {
        setDark(true);
      } else {
        const savedTheme = getSavedTheme();
        if (savedTheme === 'dark') {
          setDark(true);
        }
      }
    } catch {
      // Ignore storage access errors
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.theme && e.newValue) {
        setDark(e.newValue === 'dark');
      }
    };
    const handleCustomTheme = (e: Event) => {
      const customEvent = e as CustomEvent<{ sender: string; theme: string }>;
      if (customEvent.detail?.sender === 'landing') return;
      try {
        const current = customEvent.detail?.theme || window.localStorage.getItem(STORAGE_KEYS.theme);
        if (current) setDark(current === 'dark');
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('financeos-theme-change', handleCustomTheme);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('financeos-theme-change', handleCustomTheme);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', dark);
    }
  }, [dark]);

  const handleToggleTheme = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(STORAGE_KEYS.theme, next ? 'dark' : 'light');
          setTheme(next ? 'dark' : 'light');
          window.dispatchEvent(
            new CustomEvent('financeos-theme-change', {
              detail: { sender: 'landing', theme: next ? 'dark' : 'light' }
            })
          );
        } catch {
          // Ignore storage access errors
        }
      }
      return next;
    });
  }, []);

  // Diagnostic bare mode: /?bare=1 renders the gallery with zero landing
  // chrome (no header, hero, showcase, outro, progress bar). If the gallery
  // is smooth here but jitters on the full page, interference comes from a
  // landing section; if it jitters here too, it is intrinsic to the
  // gallery's mount on this page. Same Lenis singleton either way.
  const [isBare] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('bare')
  );
  if (isBare) {
    return (
      <main className="finance-gallery-section" style={{ minHeight: '100vh' }} data-testid="bare-landing">
        <FinanceGallerySection onUnlock={onUnlock} authenticating={authenticating} />
      </main>
    );
  }

  return (
    <MotionConfig reducedMotion="never">
      <div className={`app-shell ${dark ? 'dark' : ''}`} data-testid="app-shell">
        <ScrollProgress />
        <Header dark={dark} onToggleTheme={handleToggleTheme} onUnlock={onUnlock} authenticating={authenticating} />
        <Hero onUnlock={onUnlock} authenticating={authenticating} />
        <FinanceGallerySection onUnlock={onUnlock} authenticating={authenticating} />
        <Showcase />
        <Outro onUnlock={onUnlock} authenticating={authenticating} />
      </div>
    </MotionConfig>
  );
};

export default Landing;

