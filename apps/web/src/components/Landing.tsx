import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import '../styles/emergent-landing.css';
import { getSavedTheme, setTheme } from '@financeos/ui';

interface LandingProps {
  onUnlock?: () => void;
}

const navItems = ['Home', 'About', 'Features', 'Pricing', 'Blog', 'Careers'];
const easeOutExpo = [0.16, 1, 0.3, 1] as const;
const springBouncy = { type: 'spring', stiffness: 240, damping: 20 } as const;

export function Logo() {
  return (
    <a className="logo" href="#home" data-testid="brand-logo" aria-label="MyFinanceOS home">
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

export function Header({ dark, onToggleTheme, onUnlock }: { dark: boolean; onToggleTheme: () => void; onUnlock?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className="site-header" data-testid="main-header">
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
            if (onUnlock) {
              e.preventDefault();
              onUnlock();
            }
          }}
          data-testid="contact-button"
        >
          Contact us
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
              onClick={() => setMenuOpen(false)}
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
              if (onUnlock) {
                e.preventDefault();
                onUnlock();
              }
            }}
            data-testid="mobile-nav-contact"
          >
            Contact us
          </a>
        </nav>
      </div>
    </header>
  );
}

export function PhoneMockup() {
  return (
    <motion.div
      className="phone-glow parallax-item"
      data-parallax="0.6"
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
          transition={{ duration: 0.6, delay: 0.22 }}
        >
          <motion.div
            className="phone-pill"
            data-testid="phone-label"
            initial={{ opacity: 0, y: -10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.28 }}
          >
            JOIN THE FUTURE
          </motion.div>
          <motion.div
            className="phone-symbol"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.7, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%' }}
            transition={{ ...springBouncy, delay: 0.32 }}
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
      className="finance-card balance-card parallax-item"
      data-parallax="2.4"
      data-testid="balance-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.18 }}
    >
      <span className="card-kicker">Your Balance</span>
      <strong>$80<span className="obscured">...</span></strong>
      <span className="gain">+20.8%</span>
    </motion.div>
  );
}

export function WeeklyCard() {
  return (
    <motion.div
      className="weekly-wrap parallax-item"
      data-parallax="3"
      data-testid="weekly-spend-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.24 }}
    >
      <div className="finance-card weekly-card">
        <span className="weekly-amount">$27.40K <span className="weekly-per">/ week</span></span>
        <span className="pay-chip" data-testid="pay-chip">Pay</span>
      </div>
    </motion.div>
  );
}

export function ExpenseCard() {
  const bars = [44, 67, 58, 76, 52, 70, 40];
  return (
    <motion.div
      className="finance-card expense-card parallax-item"
      data-parallax="2.6"
      data-testid="expense-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.34 }}
    >
      <div className="expense-top">
        <span>Total expenses</span>
        <span className="tiny-dots">•••</span>
      </div>
      <strong>$6,850</strong>
      <div className="bar-chart" data-testid="expense-chart">
        {bars.map((height, index) => (
          <motion.i
            key={index}
            style={{ height: `${height}%`, transformOrigin: 'bottom' }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.44 + index * 0.05 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function Hero({ onUnlock }: { onUnlock?: () => void }) {
  const heroRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  const handleHeroMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    // Normalized smooth coordinates from center [-0.5, 0.5]
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    targetRef.current = {
      x: Math.max(-0.6, Math.min(0.6, nx)),
      y: Math.max(-0.6, Math.min(0.6, ny))
    };
  }, []);

  const handleHeroLeave = useCallback(() => {
    // Silky inertia glide back to rest position (0, 0)
    targetRef.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let active = true;

    const tick = () => {
      if (!active) return;
      // Ultra-smooth physical inertia damping factor
      const factor = 0.055;
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * factor;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * factor;

      stage.style.setProperty('--px', currentRef.current.x.toFixed(4));
      stage.style.setProperty('--py', currentRef.current.y.toFixed(4));

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <main
      className="hero"
      id="home"
      data-testid="hero-section"
      ref={heroRef}
      onMouseMove={handleHeroMove}
      onMouseLeave={handleHeroLeave}
    >
      <div className="hero-glare" aria-hidden="true" />
      <motion.div className="light light-top" initial={{ opacity: 0 }} animate={{ opacity: 0.68 }} transition={{ duration: 1.2, delay: 0.05 }} />
      <motion.div className="light light-cyan" initial={{ opacity: 0 }} animate={{ opacity: 0.58 }} transition={{ duration: 1.2, delay: 0.1 }} />
      <motion.div className="light light-left" initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} transition={{ duration: 1.2, delay: 0.15 }} />
      <motion.div className="light light-right" initial={{ opacity: 0 }} animate={{ opacity: 0.58 }} transition={{ duration: 1.2, delay: 0.2 }} />
      <motion.div className="light light-center" initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ duration: 1.2, delay: 0.12 }} />
      <motion.div className="streak streak-one" initial={{ opacity: 0, scaleX: 0.7 }} animate={{ opacity: 0.5, scaleX: 1 }} transition={{ duration: 1.0, delay: 0.2 }} />
      <motion.div className="streak streak-two" initial={{ opacity: 0, scaleX: 0.7 }} animate={{ opacity: 0.25, scaleX: 1 }} transition={{ duration: 1.0, delay: 0.28 }} />
      <motion.div
        className="glass-frame"
        data-testid="glass-frame"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.08 }}
      />
      <div
        className="visual-stage"
        data-testid="visual-stage"
        ref={stageRef}
      >
        <BalanceCard />
        <WeeklyCard />
        <motion.div
          className="finance-card mini-card parallax-item"
          data-parallax="3.4"
          data-testid="mini-amount-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <span className="card-kicker">Dividend</span>
          <strong>+ $240.5</strong>
        </motion.div>
        <PhoneMockup />
        <ExpenseCard />
      </div>
      <section className="hero-copy" aria-labelledby="hero-headline">
        <h1 id="hero-headline" data-testid="hero-headline">
          <motion.span
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.12 }}
          >
            SMARTER FINANCE
          </motion.span>
          <motion.b
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.2 }}
          >
            MADE SIMPLE
          </motion.b>
        </h1>
        <motion.p
          data-testid="hero-description"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: easeOutExpo, delay: 0.28 }}
        >
          A complete platform for managing spend, payments, investments, and
          <br className="desktop-break" /> forecasting—all in one place.
        </motion.p>
        <div className="cta-row" data-testid="hero-cta-group">
          <motion.button
            className="primary-cta"
            type="button"
            onClick={onUnlock}
            data-testid="hero-get-started-button"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...springBouncy, delay: 0.35 }}
          >
            Get started <span>→</span>
          </motion.button>
          <motion.button
            className="secondary-cta"
            type="button"
            onClick={onUnlock}
            data-testid="hero-download-button"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...springBouncy, delay: 0.42 }}
          >
            Download now
          </motion.button>
        </div>
      </section>
    </main>
  );
}

export const Landing: React.FC<LandingProps> = ({ onUnlock }) => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const stored = window.localStorage.getItem('nefin-theme');
      if (stored === 'dark') {
        setDark(true);
      } else if (stored === 'light') {
        setDark(false);
      } else {
        const savedTheme = getSavedTheme();
        if (savedTheme === 'dark') {
          setDark(true);
        }
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }, []);

  const handleToggleTheme = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('nefin-theme', next ? 'dark' : 'light');
          setTheme(next ? 'dark' : 'light');
        } catch {
          // Ignore storage access errors
        }
      }
      return next;
    });
  }, []);

  return (
    <div className={`app-shell ${dark ? 'dark' : ''}`} data-testid="app-shell">
      <Header dark={dark} onToggleTheme={handleToggleTheme} onUnlock={onUnlock} />
      <Hero onUnlock={onUnlock} />
    </div>
  );
};

export default Landing;
