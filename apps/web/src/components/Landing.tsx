import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
} from 'framer-motion';
import '../styles/emergent-landing.css';
import { getSavedTheme, setTheme } from '@financeos/ui';
import { STORAGE_KEYS } from '@financeos/shared';
import { DEFAULT_IMAGES, Skiper30 } from './ui/skiper-ui/skiper30';
import { useLenisScroll } from '../hooks/useLenisScroll';

function smoothScrollTo(target: string | number | HTMLElement, offset: number = 0) {
  if (typeof window === 'undefined') return;
  try {
    const isJsdom = typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('jsdom');
    if (isJsdom) return;
    if (window.__myfinanceos_lenis__) {
      if (typeof target === 'number') {
        window.__myfinanceos_lenis__.scrollTo(target, { offset });
      } else if (typeof target === 'string') {
        const el = document.querySelector(target);
        if (el) {
          window.__myfinanceos_lenis__.scrollTo(el as HTMLElement, { offset });
        }
      } else if (target instanceof HTMLElement) {
        window.__myfinanceos_lenis__.scrollTo(target, { offset });
      }
      return;
    }
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: 'smooth' });
    } else if (typeof target === 'string') {
      const el = document.querySelector(target);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    } else if (target instanceof HTMLElement) {
      const top = target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  } catch {
    // Graceful fallback for test environments or legacy browsers
  }
}

interface LandingProps {
  onUnlock?: () => void;
  authenticating?: boolean;
}

/**
 * Piecewise linear map with clamping — same interpolation contract as
 * framer-motion's useTransform(progress, xs, ys), driven manually so every
 * scroll-linked style write happens inside the gallery's single Lenis RAF tick.
 */
function piecewiseMap(progress: number, xs: number[], ys: number[]): number {
  if (progress <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (progress <= xs[i]) {
      const t = (progress - xs[i - 1]) / (xs[i] - xs[i - 1] || 1);
      return ys[i - 1] + t * (ys[i] - ys[i - 1]);
    }
  }
  return ys[ys.length - 1];
}

type LenisViewportAnchors = { start: number; end: number };

const SECTION_ANCHORS: LenisViewportAnchors = { start: 1, end: 0 };

/**
 * Pause every decorative CSS animation (hero aurora/lens/glare blurs, outro
 * drifts, marquee, floats) while their section is off-screen. CSS animations
 * keep running forever otherwise — blended blur layers re-composite every
 * frame even when invisible, which starves the gallery's Lenis scroll.
 * `animation-play-state: paused` freezes in place and resumes losslessly.
 */
const ANIMATION_PAUSE_SELECTOR = 'main.hero, section#gallery, section.showcase, div.outro';

function useOffscreenAnimationPause() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(ANIMATION_PAUSE_SELECTOR));
    if (!targets.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const isGallery = el.matches('section#gallery');
          if (entry.isIntersecting) {
            entry.target.removeAttribute('data-anim-paused');
            el.classList.remove('section-hidden');
            if (el.matches('main.hero')) {
              document.body.classList.remove('past-hero');
            }
          } else {
            entry.target.setAttribute('data-anim-paused', 'true');
            // Drop retained layers/filters of fully off-screen sections so the
            // gallery renders with the standalone page's clean raster budget.
            if (!isGallery) {
              el.classList.add('section-hidden');
            }
            if (el.matches('main.hero')) {
              document.body.classList.add('past-hero');
            }
          }
        }
      },
      { rootMargin: '15% 0px 15% 0px' }
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, []);
}

/**
 * Scroll-linked driver that subscribes to the gallery's reference-counted
 * Lenis singleton (the exact engine behind /finance-gallery and Skiper30)
 * instead of spinning up a separate framer-motion useScroll loop.
 *
 * progress = 0 when the target's start edge crosses `start` fraction of the
 * viewport; progress = 1 when the target's end edge crosses `end` fraction.
 * Layout metrics are cached on mount/resize (offsetTop walk, identical to
 * Skiper30's measure) so no scroll frame ever triggers a forced reflow.
 */
function useLenisSectionProgress(
  targetRef: React.RefObject<HTMLElement | null>,
  apply: (progress: number) => void,
  anchors: LenisViewportAnchors = SECTION_ANCHORS
) {
  const applyRef = useRef(apply);
  const metricsRef = useRef({ top: 0, height: 0, vh: 900 });
  const lastProgressRef = useRef(-1);

  useEffect(() => {
    applyRef.current = apply;
  }, [apply]);

  const measure = useCallback(() => {
    const el = targetRef.current;
    if (!el || typeof window === 'undefined') return;
    let top = 0;
    let curr: HTMLElement | null = el;
    while (curr) {
      top += curr.offsetTop;
      curr = curr.offsetParent as HTMLElement | null;
    }
    metricsRef.current = { top, height: el.offsetHeight, vh: window.innerHeight };
  }, [targetRef]);

  const update = useCallback((e?: { scroll: number }) => {
    const { top, height, vh } = metricsRef.current;
    const scroll = e?.scroll ?? (typeof window !== 'undefined' ? window.scrollY : 0);
    const span = height + (anchors.start - anchors.end) * vh;
    if (span <= 0) return;
    const progress = Math.min(Math.max((scroll - top + anchors.start * vh) / span, 0), 1);
    if (Math.abs(progress - lastProgressRef.current) < 0.0005) return;
    lastProgressRef.current = progress;
    applyRef.current(progress);
  }, [anchors.start, anchors.end]);

  useLenisScroll(true, update);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const remeasure = () => {
      measure();
      lastProgressRef.current = -1;
      update();
    };
    remeasure();
    window.addEventListener('resize', remeasure, { passive: true });
    window.addEventListener('load', remeasure, { passive: true });
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(remeasure);
    }
    const timer = setTimeout(remeasure, 150);
    return () => {
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('load', remeasure);
      clearTimeout(timer);
    };
  }, [measure, update]);
}

const navItems = ['Home', 'About', 'Features', 'Pricing', 'Blog', 'Careers'];
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
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);
  const scrolledRef = useRef(false);
  const hiddenRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let accumulatedDown = 0;
    let accumulatedUp = 0;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const isScrolled = y > 20;
        if (scrolledRef.current !== isScrolled) {
          scrolledRef.current = isScrolled;
          setScrolled(isScrolled);
        }

        const diff = y - lastYRef.current;
        lastYRef.current = y;

        if (y < 120) {
          if (hiddenRef.current) {
            hiddenRef.current = false;
            setHidden(false);
          }
          accumulatedDown = 0;
          accumulatedUp = 0;
          ticking = false;
          return;
        }

        if (diff > 0) {
          accumulatedDown += diff;
          accumulatedUp = 0;
          if (accumulatedDown > 60 && y > 300) {
            if (!hiddenRef.current) {
              hiddenRef.current = true;
              setHidden(true);
            }
          }
        } else if (diff < 0) {
          accumulatedUp += Math.abs(diff);
          accumulatedDown = 0;
          if (accumulatedUp > 16) {
            if (hiddenRef.current) {
              hiddenRef.current = false;
              setHidden(false);
            }
          }
        }
        ticking = false;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
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
      className={`site-header ${scrolled ? 'is-scrolled' : ''} ${hidden && !menuOpen ? 'is-retracted' : ''}`}
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
            100% OFFLINE &amp; PRIVATE
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
      <div className="card-kicker-row">
        <span className="card-kicker">Your Balance</span>
        <span className="card-live-badge">Encrypted</span>
      </div>
      <strong className="balance-amount">
        <span className="balance-curr">₹</span>18,42,250<span className="balance-cents">.00</span>
      </strong>
      <div className="balance-gain-row">
        <span className="gain">
          <svg className="gain-icon" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          +18.4%
        </span>
        <span className="gain-period">total net worth</span>
      </div>
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
        <span className="weekly-amount">
          <span className="weekly-curr">₹</span>14.20K <span className="weekly-per">/ week</span>
        </span>
        <span className="pay-chip" data-testid="pay-chip">Pay</span>
      </div>
    </motion.div>
  );
}

export function ExpenseCard() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const bars = [42, 65, 54, 88, 48, 72, 38];
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
          <span className="expense-curr">₹</span>24,850<span className="expense-cents">.00</span>
        </strong>
        <span className="expense-trend-pill" title="Down 14.8% vs budget">
          ↓ 14.8%
        </span>
      </div>
      <div className="bar-chart-wrap">
        <div className="bar-chart" data-testid="expense-chart">
          {bars.map((height, index) => {
            const isPeak = index === 3;
            return (
              <div key={index} className={`bar-col ${isPeak ? 'is-peak' : ''}`}>
                {isPeak && <span className="bar-peak-pill">₹1.8k</span>}
                <motion.i
                  style={{ height: `${height}%`, transformOrigin: 'bottom' }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.44 + index * 0.05 }}
                />
                <span className="bar-day-label">{days[index]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export function Hero({ onUnlock, authenticating = false }: { onUnlock?: () => void; authenticating?: boolean }) {
  const heroRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const [ctaHover, setCtaHover] = useState(false);

  const isTickingRef = useRef(false);

  const requestTick = useCallback(() => {
    if (isTickingRef.current) return;
    isTickingRef.current = true;

    const tick = () => {
      const stage = stageRef.current;
      if (!stage) {
        isTickingRef.current = false;
        return;
      }

      // Viewport culling: stop mouse parallax when hero has scrolled out of view
      if (typeof window !== 'undefined' && window.scrollY > (heroRef.current?.offsetHeight || 900)) {
        isTickingRef.current = false;
        return;
      }

      const factor = 0.045;
      const dx = targetRef.current.x - currentRef.current.x;
      const dy = targetRef.current.y - currentRef.current.y;

      currentRef.current.x += dx * factor;
      currentRef.current.y += dy * factor;

      stage.style.setProperty('--px', currentRef.current.x.toFixed(4));
      stage.style.setProperty('--py', currentRef.current.y.toFixed(4));

      if (Math.abs(dx) > 0.0002 || Math.abs(dy) > 0.0002) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        currentRef.current.x = targetRef.current.x;
        currentRef.current.y = targetRef.current.y;
        stage.style.setProperty('--px', currentRef.current.x.toFixed(4));
        stage.style.setProperty('--py', currentRef.current.y.toFixed(4));
        isTickingRef.current = false;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleHeroMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (typeof window !== 'undefined' && window.scrollY > 900) return;
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    targetRef.current = {
      x: Math.max(-0.6, Math.min(0.6, nx)),
      y: Math.max(-0.6, Math.min(0.6, ny))
    };
    requestTick();
  }, [requestTick]);

  const handleHeroLeave = useCallback(() => {
    targetRef.current = { x: 0, y: 0 };
    requestTick();
  }, [requestTick]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
          <div className="mini-card-top">
            <span className="card-kicker">SIP &amp; Yield</span>
            <span className="mini-card-badge">Live</span>
          </div>
          <strong className="mini-card-amount">
            <span className="mini-plus">+</span>
            <span className="mini-curr">₹</span>12,450<span className="mini-cents">.00</span>
          </strong>
          <span className="mini-subtext">Monthly portfolio payout</span>
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
          A complete platform for managing spend, payments, investments, Indian tax regimes, GST invoicing, and forecasting—all in one encrypted sovereign workspace.
        </motion.p>
        <div className="cta-row" data-testid="hero-cta-group">
          <motion.button
            className="primary-cta"
            type="button"
            onClick={onUnlock}
            disabled={authenticating}
            data-testid="hero-get-started-button"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...springBouncy, delay: 0.35 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onHoverStart={() => setCtaHover(true)}
            onHoverEnd={() => setCtaHover(false)}
          >
            {authenticating ? 'Connecting' : 'Get started'}
            {authenticating ? (
              <CtaSpinner />
            ) : (
              <motion.span animate={{ x: ctaHover ? 6 : 0 }} transition={springBouncy}>→</motion.span>
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
      </section>
      <div className="hero-seam" aria-hidden="true" data-testid="hero-seam" />
    </main>
  );
}

export const partnerLogos: { text: string; mark?: React.ReactNode; strong?: boolean }[] = [
  {
    text: '100% Offline-First',
    strong: true,
    mark: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
      </svg>
    ),
  },
  {
    text: 'AES-256 Encrypted',
    mark: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M12 1.4l2.15 6.45L20.6 10l-6.45 2.15L12 18.6l-2.15-6.45L3.4 10l6.45-2.15z" />
        <circle cx="12" cy="10" r="2.1" fillOpacity=".45" />
      </svg>
    ),
  },
  {
    text: 'Old vs New Tax Regime',
    mark: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5.5" />
        <rect x="8.5" y="8.5" width="7" height="7" rx="2.2" fillOpacity=".35" />
      </svg>
    ),
  },
  {
    text: 'GST Invoicing Suite',
    mark: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M12 2.3l8.4 4.85v9.7L12 21.7 3.6 16.85v-9.7z" />
        <path d="M12 7.4l3.9 2.25v4.5L12 16.4 8.1 14.15v-4.5z" fillOpacity=".35" />
      </svg>
    ),
  },
  {
    text: 'Multi-Asset Wealth & FIRE',
    mark: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M4 6.6A2.6 2.6 0 016.6 4H16a4 4 0 014 4v9.4A2.6 2.6 0 0117.4 20H8a4 4 0 01-4-4z" />
      </svg>
    ),
  },
  {
    text: 'Private Local AI',
    strong: true,
    mark: (
      <svg viewBox="0 0 26 24" width="23" height="20" fill="currentColor" aria-hidden="true">
        <circle cx="9" cy="12" r="6.2" />
        <circle cx="17" cy="12" r="6.2" fillOpacity=".5" />
      </svg>
    ),
  },
];

export function LogoCloud() {
  return (
    <div className="logo-cloud" data-testid="logo-cloud" aria-label="Core architecture highlights">
      {partnerLogos.map((logo, index) => (
        <motion.span
          className={`logo-cloud-item ${logo.strong ? 'is-strong' : ''}`}
          key={`${logo.text}-${index}`}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: easeOutExpo, delay: index * 0.05 }}
        >
          {logo.mark}
          <span>{logo.text}</span>
        </motion.span>
      ))}
    </div>
  );
}

/* ==========================================================================
   SECTION: ABOUT / HOW IT ALL COMES TOGETHER
   ========================================================================== */
export function AboutSection() {
  const [activePill, setActivePill] = useState<'spending' | 'growth' | 'tax' | 'invoicing' | 'vault'>('spending');

  const pillDetails = {
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
  };

  const activeInfo = pillDetails[activePill];

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
            Spending
          </button>
          <span>to confident</span>
          <button
            type="button"
            className={`together-pill-btn pill-light ${activePill === 'growth' ? 'is-active' : ''}`}
            onClick={() => setActivePill('growth')}
          >
            Growth
          </button>
          <span>, our platform unites</span>
          <button
            type="button"
            className={`together-pill-btn pill-dark ${activePill === 'tax' ? 'is-active' : ''}`}
            onClick={() => setActivePill('tax')}
          >
            Tax Planning
          </button>
          <span>,</span>
          <button
            type="button"
            className={`together-pill-btn pill-dark ${activePill === 'invoicing' ? 'is-active' : ''}`}
            onClick={() => setActivePill('invoicing')}
          >
            Invoicing
          </button>
          <span>, and</span>
          <button
            type="button"
            className={`together-pill-btn pill-light ${activePill === 'vault' ? 'is-active' : ''}`}
            onClick={() => setActivePill('vault')}
          >
            Local Vault
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#6e38e8' }}>● SYSTEM MODULE ACTIVE</span>
              <span style={{ fontSize: 11, background: 'rgba(110,50,230,0.1)', padding: '2px 8px', borderRadius: 999 }}>Local SQLite WASM</span>
            </div>
            <div style={{ padding: '12px 14px', background: 'rgba(110,50,230,0.06)', borderRadius: 12, marginBottom: 10, fontSize: 13 }}>
              <b>Status:</b> Zero telemetry packets transmitted
            </div>
            <div style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: 12, fontSize: 13, color: '#059669' }}>
              <b>Cryptographic state:</b> AES-256-GCM authenticated
            </div>
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
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    const card = cardRef.current;
    if (card) {
      const rect = card.getBoundingClientRect();
      rectRef.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const card = cardRef.current;
    const rect = rectRef.current;
    if (!card || !rect) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    card.style.setProperty('--tilt-x', nx.toFixed(3));
    card.style.setProperty('--tilt-y', ny.toFixed(3));
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    setHovered(false);
    rectRef.current = null;
    if (!card) return;
    card.style.setProperty('--tilt-x', '0');
    card.style.setProperty('--tilt-y', '0');
  }, []);

  return (
    <article
      ref={cardRef}
      className={`feature-card ${isFeatured ? 'is-featured' : ''} ${className} ${hovered ? 'is-hovered' : ''}`}
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
export function IntegrationsShowcase() {
  const brandIcons = [
    { name: 'Stripe', color: '#635BFF', left: '10%', top: '65%' },
    { name: 'Plaid', color: '#000000', left: '22%', top: '30%' },
    { name: 'Razorpay', color: '#0C2340', left: '36%', top: '10%' },
    { name: 'Wise', color: '#9FE870', left: '50%', top: '5%' },
    { name: 'PayPal', color: '#003087', left: '64%', top: '10%' },
    { name: 'Apple Pay', color: '#111111', left: '78%', top: '30%' },
    { name: 'Zerodha', color: '#387ED1', left: '90%', top: '65%' },
  ];

  return (
    <div className="integrations-card" data-testid="integrations-card">
      <span className="integrations-badge">INTEGRATIONS</span>
      <h3 className="integrations-title">SEAMLESS INTEGRATIONS FOR A SEAMLESS FINANCIAL LIFE.</h3>
      <p className="integrations-sub">
        Connect your favorite banks, wallets, brokerages, and payment gateways with local encrypted parsers.
      </p>

      <div className="integrations-stage">
        <div className="integrations-arc-wrapper">
          {brandIcons.map((brand, idx) => (
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
  const total = revealTokens.length;

  const apply = useCallback((progress: number) => {
    for (let i = 0; i < total; i++) {
      const el = tokenRefs.current[i];
      if (!el) continue;
      const start = (i / total) * 0.82;
      const end = Math.min(1, start + 0.2);
      const local = Math.min(Math.max((progress - start) / (end - start || 1), 0), 1);
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
 * FinanceGallerySection — Exact standalone parallax gallery environment
 * copied from http://localhost:3000/finance-gallery with dedicated dark slate (#070810) styling.
 */
export function FinanceGallerySection() {
  // Pre-decode the gallery screenshots during idle time so the browser never
  // pays the JPEG decode cost mid-scroll when the parallax grid enters the
  // viewport (the standalone page decodes at load; the landing reaches the
  // gallery only after scrolling, which otherwise causes an entry hitch).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const warm = () => {
      for (const src of DEFAULT_IMAGES) {
        const img = new window.Image();
        img.src = src;
        if (typeof img.decode === 'function') {
          img.decode().catch(() => { /* best-effort warmup */ });
        }
      }
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    let timer: number | undefined;
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(warm, { timeout: 1500 });
    } else {
      timer = window.setTimeout(warm, 400);
    }
    return () => { if (timer) window.clearTimeout(timer); };
  }, []);

  return (
    <section
      id="gallery"
      data-testid="standalone-finance-gallery-section"
      style={{
        background: '#070810',
        color: '#ffffff',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        minHeight: '100vh',
        overflowX: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Top Test Section (Scroll Entry Verification) */}
      <div
        style={{
          padding: '120px 24px 80px',
          maxWidth: 1100,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(147, 51, 234, 0.15)',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            color: '#c084fc',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          Isolated Component Lab
        </div>
        <h2
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 20,
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          MyFinanceOS Skiper30 Parallax Engine
        </h2>
        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            color: '#94a3b8',
            maxWidth: 680,
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}
        >
          Dedicated isolated environment for testing multi-velocity parallax physics, Lenis interpolation, and zero-jitter GPU compositing across all scroll velocities.
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          <span>↓ Scroll down to enter the multi-velocity parallax grid</span>
        </div>
      </div>

      {/* ISOLATED FINANCE GALLERY COMPONENT */}
      <Skiper30 enableLenis={true} />

      {/* Bottom Test Section (Scroll Exit & Reverse Scroll Verification) */}
      <div
        style={{
          padding: '100px 24px 140px',
          maxWidth: 900,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h3
          style={{
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            fontWeight: 700,
            marginBottom: 16,
            color: '#ffffff',
          }}
        >
          Exit Boundary Verified
        </h3>
        <p
          style={{
            color: '#94a3b8',
            fontSize: 16,
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          Smooth entry and exit transition boundaries verified. Scroll back up to test reverse motion interpolation and momentum deceleration.
        </p>
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.__myfinanceos_lenis__) {
              window.__myfinanceos_lenis__.scrollTo(0);
            } else if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          style={{
            padding: '12px 28px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: '#ffffff',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
          }}
        >
          ↑ Scroll to Top
        </button>
      </div>
    </section>
  );
}

export function Showcase() {
  return (
    <section className="showcase" id="features" data-testid="showcase-section">
      <div className="showcase-mesh" aria-hidden="true" />
      <div className="showcase-bloom" aria-hidden="true" />
      <div className="showcase-seam" aria-hidden="true" />
      <LogoCloud />
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

  const apply = useCallback((scroll: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const p = Math.min(Math.max(scroll / maxScrollRef.current, 0), 1);
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
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.5,
      ease: easeOutExpo,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span className="stat-value" ref={ref}>
      {prefix}
      {display}
      {suffix}
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
              Monthly
            </button>
            <button
              type="button"
              className={`pricing-toggle-btn ${annual ? 'is-active' : ''}`}
              onClick={() => setAnnual(true)}
            >
              Annual <span className="pricing-save-pill">Save 20%</span>
            </button>
          </div>

          <div className="pricing-toggle-row">
            <button
              type="button"
              className={`pricing-toggle-btn ${!isINR ? 'is-active' : ''}`}
              onClick={() => setIsINR(false)}
            >
              USD ($)
            </button>
            <button
              type="button"
              className={`pricing-toggle-btn ${isINR ? 'is-active' : ''}`}
              onClick={() => setIsINR(true)}
            >
              INR (₹)
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
              <span className="pricing-amount">{priceFree}</span>
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
              <span className="pricing-amount">{pricePlus}</span>
              <span className="pricing-cycle">/ month</span>
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
              <span className="pricing-amount">{pricePremium}</span>
              <span className="pricing-cycle">/ month</span>
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
   SECTION: CAREERS & APPLICATION MODAL
   ========================================================================== */
interface JobRole {
  id: string;
  dept: string;
  location: string;
  title: string;
  desc: string;
}

const jobRoles: JobRole[] = [
  {
    id: 'rust-wasm',
    dept: 'Engineering',
    location: 'Remote · Global',
    title: 'Staff Rust & WASM Performance Engineer',
    desc: 'Optimize local SQLite WASM bindings, memory-hard Argon2id key derivation, and sub-millisecond financial calculation graphs.',
  },
  {
    id: 'ui-motion',
    dept: 'Design',
    location: 'Remote',
    title: 'Senior UI/UX Motion & 3D Designer',
    desc: 'Craft silky Framer Motion physical physics, 3D CSS perspective cards, and delightful micro-interactions for complex financial tools.',
  },
  {
    id: 'security-crypto',
    dept: 'Security',
    location: 'Remote',
    title: 'Applied Cryptography & Vault Security Lead',
    desc: 'Audit client-side AES-256-GCM pipelines, zero-knowledge export protocols, and local memory security against side-channel analysis.',
  },
  {
    id: 'tax-systems',
    dept: 'Domain Systems',
    location: 'Remote · India',
    title: 'Financial Intelligence & Tax Systems Specialist',
    desc: 'Model Indian Income Tax regimes, GST rules, capital gains indexation, and retirement SIP compounding math.',
  },
];

export function CareersSection() {
  const [selectedJob, setSelectedJob] = useState<JobRole | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      setSelectedJob(null);
    }, 2000);
  };

  return (
    <section className="careers-section" id="careers" data-testid="careers-section">
      <div className="about-header">
        <span className="about-badge">JOIN THE CORE MISSION</span>
        <h2 className="about-headline">BUILD THE SOVEREIGN WEALTH OS</h2>
        <p className="about-sub">
          We are crafting high-craft, offline-first software that returns privacy and control back to individuals and small businesses.
        </p>
      </div>

      <div className="careers-grid">
        {jobRoles.map((role) => (
          <div className="career-card" key={role.id} data-testid={`career-card-${role.id}`}>
            <div>
              <div className="career-card-top">
                <span className="career-dept-pill">{role.dept}</span>
                <span className="career-loc-pill">{role.location}</span>
              </div>
              <h3>{role.title}</h3>
              <p>{role.desc}</p>
            </div>
            <button
              type="button"
              className="career-apply-btn"
              onClick={() => setSelectedJob(role)}
            >
              Apply now →
            </button>
          </div>
        ))}
      </div>

      {/* Application Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div
            className="landing-modal-backdrop"
            onClick={() => setSelectedJob(null)}
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
                  <span className="career-dept-pill" style={{ marginBottom: 6, display: 'inline-block' }}>{selectedJob.dept}</span>
                  <h3>Apply: {selectedJob.title}</h3>
                </div>
                <button
                  type="button"
                  className="landing-modal-close"
                  onClick={() => setSelectedJob(null)}
                  aria-label="Close application"
                >
                  ✕
                </button>
              </div>
              <div className="landing-modal-body">
                {appliedSuccess ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: 44, marginBottom: 16 }}>🎉</div>
                    <h4 style={{ fontSize: 22, color: '#10b981', margin: '0 0 8px' }}>Application Transmitted</h4>
                    <p>Thank you for reaching out. We review candidate repositories and design portfolios promptly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleApplySubmit} className="contact-form-console">
                    <div className="form-group">
                      <label htmlFor="app-name">Full Name</label>
                      <input id="app-name" type="text" className="form-input" placeholder="e.g. Priya Sharma" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="app-email">Email Address</label>
                      <input id="app-email" type="email" className="form-input" placeholder="priya@example.com" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="app-url">GitHub, Portfolio or LinkedIn URL</label>
                      <input id="app-url" type="url" className="form-input" placeholder="https://github.com/..." required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="app-note">Why are you passionate about offline sovereign software?</label>
                      <textarea id="app-note" className="form-textarea" placeholder="Tell us about a project or system you loved building..." required />
                    </div>
                    <button type="submit" className="form-submit-btn">
                      Submit Application
                    </button>
                  </form>
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
   SECTION: CONTACT CONSOLE
   ========================================================================== */
export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const pgpKey = '4A8F 9C21 7B03 E19D B654 39A0 82FE 601D';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const handleCopyKey = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pgpKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
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
   SECTION: 404 ERROR 3D PLAYGROUND ("CANNOT BE FOUNDED")
   ========================================================================== */
export function Error404Section() {
  const boxRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    box.style.transform = `rotateX(${-ny * 35}deg) rotateY(${nx * 45}deg)`;
  };

  const handleMouseLeave = () => {
    const box = boxRef.current;
    if (!box) return;
    box.style.transform = `rotateX(16deg) rotateY(-18deg)`;
  };

  return (
    <section className="error-404-section" id="error-404" data-testid="error-404-section">
      <div className="error-404-card" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <div className="error-404-stage">
          <div className="isometric-404-box" ref={boxRef}>
            <span className="isometric-404-text">404</span>
          </div>
        </div>

        <h3 className="error-cannot-founded">CANNOT BE FOUNDED.</h3>
        <p className="error-404-desc">
          The requested coordinate drifted outside your sovereign ledger matrix. Don&apos;t worry—your financial assets and local encrypted vaults remain 100% secure.
        </p>

        <button
          type="button"
          className="error-return-btn"
          onClick={(e) => {
            e.preventDefault();
            const home = document.querySelector('#home');
            if (home) {
              smoothScrollTo(home as HTMLElement);
            } else {
              smoothScrollTo(0);
            }
          }}
          data-testid="error-return-home-btn"
        >
          <span>← Return to Safe Harbor</span>
        </button>
      </div>
    </section>
  );
}

/* ==========================================================================
   SECTION: CHANGELOG TIMELINE
   ========================================================================== */
export function ChangelogSection() {
  const releases = [
    {
      version: 'v2.4.0',
      tag: 'Latest Release',
      date: 'August 2026',
      title: 'Multi-Regime Tax Engine 2026-27 & Sankey Cash Flows',
      items: [
        { type: 'Feature', text: 'Side-by-side Old vs New Tax Regime interactive deduction modeler.' },
        { type: 'Feature', text: 'Real-time Sankey cash flow visualization across income streams.' },
        { type: 'Security', text: 'Upgraded vault key derivation to memory-hard Argon2id with zero-trust validation.' },
      ],
    },
    {
      version: 'v2.3.2',
      tag: 'Maintenance',
      date: 'July 2026',
      title: 'GST Invoicing Suite & Automated PDF Dispatch',
      items: [
        { type: 'Feature', text: 'Compliant B2B GST tax invoice generation with HSN/SAC code lookup.' },
        { type: 'Perf', text: 'Reduced WASM database startup latency by 45%.' },
        { type: 'Fix', text: 'Resolved multi-currency decimal rounding in forex ledger entries.' },
      ],
    },
    {
      version: 'v2.2.0',
      tag: 'Major',
      date: 'May 2026',
      title: 'Local AI Financial Copilot Integration',
      items: [
        { type: 'Feature', text: 'Offline Ollama / WebLLM integration for private natural language financial insights.' },
        { type: 'Feature', text: 'SIP compound interest & FIRE retirement target timeline simulator.' },
      ],
    },
  ];

  return (
    <section className="changelog-section" id="changelog" data-testid="changelog-section">
      <div className="about-header">
        <span className="about-badge">CONTINUOUS EVOLUTION</span>
        <h2 className="about-headline">PRODUCT CHANGELOG</h2>
        <p className="about-sub">
          Track updates, security enhancements, and new financial modules released to the sovereign core.
        </p>
      </div>

      <div className="changelog-timeline">
        {releases.map((rel) => (
          <div className="changelog-entry" key={rel.version}>
            <div className="changelog-dot" />
            <div className="changelog-card">
              <div className="changelog-card-top">
                <span className="changelog-ver-badge">{rel.version} ({rel.tag})</span>
                <span className="changelog-date">{rel.date}</span>
              </div>
              <h4>{rel.title}</h4>
              <ul className="changelog-items-list">
                {rel.items.map((it, idx) => (
                  <li key={idx}>
                    <span className="changelog-item-tag">{it.type}</span>
                    <span>{it.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

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

function FaqRow({
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
}

export function Faq({ onUnlock }: { onUnlock?: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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

export function MegaCta({ onUnlock, authenticating = false }: { onUnlock?: () => void; authenticating?: boolean }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const haloRef = useRef<HTMLSpanElement | null>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const phoneRef = useRef<HTMLDivElement | null>(null);

  const apply = useCallback((p: number) => {
    const halo = haloRef.current;
    if (halo) {
      halo.style.transform = `scale(${piecewiseMap(p, [0, 0.5, 1], [0.82, 1.12, 0.9]).toFixed(4)})`;
      halo.style.opacity = piecewiseMap(p, [0, 0.5, 1], [0.35, 0.9, 0.4]).toFixed(3);
    }

    for (let i = 0; i < megaDrifts.length; i++) {
      const el = wordRefs.current[i];
      if (!el) continue;
      const from = parseFloat(megaDrifts[i][0]);
      const to = parseFloat(megaDrifts[i][1]);
      el.style.transform = `translateX(${(from + (to - from) * p).toFixed(3)}%)`;
    }

    const phone = phoneRef.current;
    if (phone) {
      phone.style.transform = `translateY(${(86 - 172 * p).toFixed(2)}px) scale(${piecewiseMap(p, [0, 0.5, 1], [0.9, 1, 0.94]).toFixed(4)})`;
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
    { label: 'Careers', href: '#careers' },
  ],
];

const footerLegalColumns: FooterLink[][] = [
  [
    { label: 'Contact', href: '#contact' },
    { label: 'FAQs', href: '#faqs' },
    { label: '404 Error', href: '#error-404' },
  ],
  [
    { label: 'Changelog', href: '#changelog' },
    { label: 'Terms of Service', href: '#terms' },
    { label: 'Privacy Policy', href: '#privacy' },
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

export function SiteFooter() {
  const scrollToTop = useCallback(() => {
    if (typeof window === 'undefined') return;
    const reduced =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
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

        {/* Bottom Frosted Pill / Ribbon Shelf */}
        <div className="footer-frosted-shelf">
          <div className="footer-shelf-content">
            <p className="footer-shelf-copyright">
              © MyFinanceOS {new Date().getFullYear()}. All rights reserved.
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
      <CareersSection />
      <ContactSection />
      <Error404Section />
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
  useOffscreenAnimationPause();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
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
      // Ignore storage access errors
    }
  }, []);

  const handleToggleTheme = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(STORAGE_KEYS.theme, next ? 'dark' : 'light');
          setTheme(next ? 'dark' : 'light');
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
      <main style={{ background: '#070810', minHeight: '100vh' }} data-testid="bare-landing">
        <FinanceGallerySection />
      </main>
    );
  }

  return (
    <div className={`app-shell ${dark ? 'dark' : ''}`} data-testid="app-shell">
      <ScrollProgress />
      <Header dark={dark} onToggleTheme={handleToggleTheme} onUnlock={onUnlock} authenticating={authenticating} />
      <Hero onUnlock={onUnlock} authenticating={authenticating} />
      <FinanceGallerySection />
      <Showcase />
      <Outro onUnlock={onUnlock} authenticating={authenticating} />
    </div>
  );
};

export default Landing;

