import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LandingGlassCard, LandingStepIndicator } from './primitives/index.js';
import { useCanvasVisibility } from './hooks/useCanvasVisibility.js';
import {
  DirectLocalRoutingStage,
  SlabSimulatorStage,
  DottedGlobeCanvas
} from './value/index.js';

export interface ValuePillar {
  step: string;
  stepNum: number;
  metric: string;
  metricLabel: string;
  headline: string;
  description: string;
}

export const VALUE_PILLARS: ValuePillar[] = [
  {
    step: '[ 01 / 03 ]',
    stepNum: 1,
    metric: '100%',
    metricLabel: 'private & end-to-end encrypted',
    headline: 'Your Financial Life Stays 100% Private',
    description:
      'Say goodbye to finance apps that read your private bank SMS alerts or sell your data to lenders. With client-side AES-256 encryption and private Supabase cloud sync, your records remain strictly yours.'
  },
  {
    step: '[ 02 / 03 ]',
    stepNum: 2,
    metric: '0 ms',
    metricLabel: 'instant calculation speed',
    headline: 'Instant Tax & Investment Math',
    description:
      'Compare Old vs New Tax Regimes (Section 115BAC), calculate capital gains tax, and watch your net worth recalculate in real-time right in your browser with zero loading lag.'
  },
  {
    step: '[ 03 / 03 ]',
    stepNum: 3,
    metric: '₹0',
    metricLabel: 'free with 1-click Excel/CSV exports',
    headline: 'All Your Indian Wealth in One Place',
    description:
      'Bring your Direct Mutual Funds, Indian Equities, Sovereign Gold Bonds, EPF/PPF, Fixed Deposits, and Bank Accounts together in one clear dashboard with instant 1-click CSV/JSON exports anytime.'
  }
];

export const ValueCarousel: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { containerRef, isVisible } = useCanvasVisibility(0.05);

  // Auto-progression timer with smooth progress ring animation (6.5 seconds per slide)
  useEffect(() => {
    setProgress(0);
    const duration = 6500;
    const intervalTime = 50;
    const stepIncrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      if (isPaused || !isVisible) return;
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((s) => (s + 1) % VALUE_PILLARS.length);
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeStep, isPaused, isVisible]);

  const p = VALUE_PILLARS[activeStep];

  return (
    <div
      ref={containerRef}
      className="l-section"
      role="region"
      aria-roledescription="carousel"
      aria-label="Sovereign Architecture Pillars"
      style={{ paddingTop: '3rem', paddingBottom: '5.5rem' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <LandingGlassCard
        variant="featured"
        padding="lg"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'center'
        }}
      >
        {/* Left Column: Narrative Content & Timer Controls */}
        <div aria-live="polite">
          {/* Header Row: Step Pill + Step Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#67e8f9',
                letterSpacing: '0.06em'
              }}
            >
              <span style={{ color: 'var(--l-text-muted, #94a3b8)' }}>{p.step}</span>
              <span>SOVEREIGN PILLAR</span>
            </div>

            {/* Step Selection Buttons with 44px min tap target */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev === 0 ? VALUE_PILLARS.length - 1 : prev - 1))}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                aria-label="Previous step"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev + 1) % VALUE_PILLARS.length)}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                aria-label="Next step"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Metric Highlight */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                fontSize: 'clamp(2.75rem, 5vw, 4.25rem)',
                fontWeight: 900,
                lineHeight: 1,
                color: '#ffffff',
                letterSpacing: '-0.04em',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.75rem'
              }}
              className="l-num"
            >
              <span style={{ color: '#67e8f9', fontWeight: 900 }}>
                {p.metric}
              </span>
            </div>
            <div style={{ fontSize: '0.92rem', color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.84))', marginTop: '0.35rem', fontWeight: 600 }}>
              {p.metricLabel}
            </div>
          </div>

          {/* Headline & Description */}
          <h3
            style={{
              fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
              fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '0.85rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}
          >
            {p.headline}
          </h3>
          <p style={{ fontSize: '0.96rem', lineHeight: 1.7, color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.82))', marginBottom: '2rem' }}>
            {p.description}
          </p>

          {/* 3-Step Pill Progress Indicators */}
          <LandingStepIndicator
            totalSteps={VALUE_PILLARS.length}
            activeStep={activeStep}
            progress={progress}
            onSelectStep={setActiveStep}
            stepLabels={VALUE_PILLARS.map((item, idx) => `Go to pillar ${idx + 1}: ${item.headline}`)}
          />
        </div>

        {/* Right Column: Visual Interactive Graphic per Step */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '340px',
            position: 'relative'
          }}
        >
          {activeStep === 0 && <DirectLocalRoutingStage />}
          {activeStep === 1 && <SlabSimulatorStage />}
          {activeStep === 2 && <DottedGlobeCanvas isVisible={isVisible} />}
        </div>
      </LandingGlassCard>
    </div>
  );
};
