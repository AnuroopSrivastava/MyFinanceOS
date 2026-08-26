import React from 'react';
import { ArrowRight, ShieldCheck, Lock, Zap } from 'lucide-react';
import { LandingButton } from './primitives/index.js';
import { useCanvasVisibility } from './hooks/useCanvasVisibility.js';
import { BrandMonogramCanvas } from './outro/index.js';

interface OutroBrandCTAProps {
  onUnlock: () => void;
}

export const OutroBrandCTA: React.FC<OutroBrandCTAProps> = ({ onUnlock }) => {
  const { containerRef, isVisible } = useCanvasVisibility(0.05);

  return (
    <section
      ref={containerRef}
      className="l-section"
      aria-label="Brand Call To Action"
      style={{ paddingTop: '4rem', paddingBottom: '6rem', textAlign: 'center' }}
    >
      <div
        className="l-glass-card"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 5rem) 2rem',
          background: 'linear-gradient(180deg, rgba(15, 20, 34, 0.95) 0%, rgba(7, 8, 14, 0.98) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.9), 0 0 50px rgba(6, 182, 212, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Animated Brand Canvas & Floating Status Pills */}
        <div style={{ position: 'relative', width: '420px', height: '420px', maxWidth: '100%', marginBottom: '1.5rem' }}>
          <BrandMonogramCanvas isVisible={isVisible} />

          {/* Floating Badges */}
          <div
            className="l-floating-badge"
            style={{
              position: 'absolute',
              top: '15%',
              left: '4%',
              padding: '0.4rem 0.85rem',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid #06b6d4',
              borderRadius: '9999px',
              color: '#67e8f9',
              fontSize: '0.75rem',
              fontWeight: 800,
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)'
            }}
          >
            🔒 Zero-Knowledge Vault
          </div>

          <div
            className="l-floating-badge"
            style={{
              position: 'absolute',
              bottom: '15%',
              right: '4%',
              padding: '0.4rem 0.85rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '9999px',
              color: '#34d399',
              fontSize: '0.75rem',
              fontWeight: 800,
              animationDelay: '1.5s',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            ₹ UPI 2.0 & NetBanking
          </div>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
            color: '#ffffff',
            marginBottom: '1rem',
            maxWidth: '740px'
          }}
        >
          Ready to take full control of your money, taxes & wealth?
        </h2>

        <p
          style={{
            fontSize: 'clamp(1rem, 1.6vw, 1.2rem)',
            lineHeight: 1.65,
            color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.82))',
            maxWidth: '640px',
            marginBottom: '2.5rem'
          }}
        >
          Join Indian professionals, freelancers, and business owners managing their finances with unmatched clarity, speed, and end-to-end encrypted privacy.
        </p>

        <LandingButton
          type="button"
          onClick={onUnlock}
          variant="primary"
          size="lg"
          icon={<ArrowRight size={19} />}
          ariaLabel="Launch Sovereign Vault"
        >
          Launch Sovereign Vault
        </LandingButton>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', marginTop: '2.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#67e8f9', fontSize: '0.84rem', fontWeight: 600 }}>
            <ShieldCheck size={16} color="#10b981" /> 100% Zero-Knowledge Privacy
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#67e8f9', fontSize: '0.84rem', fontWeight: 600 }}>
            <Lock size={16} color="#06b6d4" /> End-to-End Cloud Sync
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#67e8f9', fontSize: '0.84rem', fontWeight: 600 }}>
            <Zap size={16} color="#38bdf8" /> Instant 0ms Local Speed
          </div>
        </div>
      </div>
    </section>
  );
};
