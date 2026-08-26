import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { LandingButton } from './primitives/index.js';
import { LandingNavbar } from './LandingNavbar.js';
import { useCanvasVisibility } from './hooks/useCanvasVisibility.js';
import {
  HeroStardustCanvas,
  HeroPlanetCanvas,
  HeroNotificationCluster,
  DEFAULT_HERO_NOTIFICATIONS
} from './hero/index.js';

interface LandingHeroProps {
  onUnlock: () => void;
  onExploreClick?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onUnlock, onExploreClick }) => {
  const { containerRef: heroSectionRef, isVisible } = useCanvasVisibility(0.01);
  const [mousePos, setMousePos] = useState({ targetX: 0, targetY: 0 });

  // Smooth Mouse move parallax listener throttled via requestAnimationFrame
  useEffect(() => {
    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window;
        const normX = (e.clientX / innerWidth - 0.5) * 2;
        const normY = (e.clientY / innerHeight - 0.5) * 2;
        setMousePos({ targetX: normX, targetY: normY });
        rafId = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (onExploreClick) {
      onExploreClick();
    }
  };

  return (
    <div
      ref={heroSectionRef}
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--l-bg-void, #07080d)',
        paddingBottom: '3rem'
      }}
    >
      {/* Background Animated Stardust Canvas */}
      <HeroStardustCanvas isVisible={isVisible} />

      {/* Top Ambient Corona Glow */}
      <div className="l-ambient-top-glow" />

      {/* Top Fixed Header Navigation */}
      <LandingNavbar
        onUnlock={onUnlock}
        onNavigateSection={handleNavigateSection}
      />

      {/* Hero Content Area */}
      <div className="l-section" style={{ textAlign: 'center', paddingTop: '8rem', paddingBottom: '2.5rem' }}>
        {/* Main Display Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
            fontSize: 'clamp(2.75rem, 6.5vw, 5.25rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
            margin: '0 auto 1.35rem',
            maxWidth: '1020px',
            color: '#ffffff'
          }}
        >
          Your entire financial life.
          <br />
          <span style={{ color: '#67e8f9' }}>100% Private.</span>{' '}
          <span style={{ color: '#ffffff', fontWeight: 700 }}>Deeply Indian.</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)',
            lineHeight: 1.65,
            color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.84))',
            maxWidth: '780px',
            margin: '0 auto 2.5rem'
          }}
        >
          The private, all-in-one finance app built for Indian wealth. Compare Old vs New Tax Regimes (Sec 115BAC), track UPI and bank cash flows, grow your investments, and sync across all your devices with end-to-end encryption.
        </p>

        {/* Dual Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '1.25rem',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '1.75rem',
            position: 'relative',
            zIndex: 15
          }}
        >
          {/* Primary Launch Vault Button */}
          <LandingButton
            type="button"
            onClick={onUnlock}
            variant="primary"
            size="md"
            icon={<ArrowRight size={18} />}
            ariaLabel="Launch Sovereign Vault"
          >
            Launch Sovereign Vault
          </LandingButton>

          {/* Secondary Explore Live Sandbox Button */}
          <LandingButton
            type="button"
            onClick={() => handleNavigateSection('products-showcase')}
            variant="glass"
            size="md"
            icon={<Sparkles size={17} color="#67e8f9" />}
            ariaLabel="Explore Interactive Modules"
          >
            Explore Interactive Modules
          </LandingButton>
        </div>

        {/* Sovereign Trust Strip */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.4rem 1.1rem',
            borderRadius: '9999px',
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'var(--l-neo-inset)',
            fontSize: '0.78rem',
            color: 'var(--l-text-secondary, #94a3b8)',
            marginBottom: '2.5rem',
            position: 'relative',
            zIndex: 15
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
              display: 'inline-block'
            }}
          />
          <span style={{ fontWeight: 600, color: '#ffffff' }}>End-to-End Encrypted</span>
          <span>·</span>
          <span>Zero Ad Tracking</span>
          <span>·</span>
          <span className="l-num">0 ms</span>
          <span>Instant Speed</span>
        </div>

        {/* 3D Particle Planet with Orbital Streamer & Floating Live Transactions */}
        <div
          style={{
            position: 'relative',
            maxWidth: '1040px',
            margin: '0 auto',
            minHeight: '480px',
            transformStyle: 'preserve-3d'
          }}
        >
          <HeroPlanetCanvas
            isVisible={isVisible}
            mouseTargetX={mousePos.targetX}
            mouseTargetY={mousePos.targetY}
          />

          {/* Floating 3D Financial Telemetry Badges */}
          <HeroNotificationCluster
            notifications={DEFAULT_HERO_NOTIFICATIONS}
            mouseTargetX={mousePos.targetX}
            mouseTargetY={mousePos.targetY}
          />
        </div>
      </div>
    </div>
  );
};
