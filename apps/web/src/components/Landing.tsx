import React, { useEffect } from 'react';
import { authSession } from '@financeos/auth';

import { LandingHero } from './landing/LandingHero.js';
import { EcosystemMarquee } from './landing/EcosystemMarquee.js';
import { BentoProductShowcase } from './landing/BentoProductShowcase.js';
import { TrustComparisonMatrix } from './landing/TrustComparisonMatrix.js';
import { ValueCarousel } from './landing/ValueCarousel.js';
import { AllFeaturesGrid } from './landing/AllFeaturesGrid.js';
import { MetricsInNumbers } from './landing/MetricsInNumbers.js';
import { OutroBrandCTA } from './landing/OutroBrandCTA.js';
import { LandingFaqSection } from './landing/LandingFaqSection.js';
import { LandingFooter } from './landing/LandingFooter.js';
import { LandingFeedbackCard } from './landing/primitives/index.js';
import './landing/landing.css';

interface LandingProps {
  onUnlock: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onUnlock }) => {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const checkAndProceedIfAuth = async () => {
      try {
        const hasAuthParam =
          typeof window !== 'undefined' &&
          (window.location.search.includes('code=') || window.location.hash.includes('access_token='));
        const timeoutMs = hasAuthParam ? 5000 : 2500;
        const isAuth = await Promise.race([
          authSession.isAuthenticated(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs))
        ]);
        if (isAuth) {
          onUnlock();
        }
      } catch (err) {
        console.debug('Landing auth check:', err);
      }
    };

    checkAndProceedIfAuth();

    const unsubscribeAuth = authSession.onAuthStateChange((session) => {
      if (session) {
        onUnlock();
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [onUnlock]);

  // Scroll reveal observer for smooth entry transitions
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('l-revealed');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    const revealElements = document.querySelectorAll('.l-reveal-on-scroll');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleScrollTo = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main id="main-content" className="l-root">
      {/* 1. Immersive Full-Width Hero Section */}
      <section id="hero-section" aria-label="Hero Overview">
        <LandingHero onUnlock={onUnlock} onExploreClick={() => handleScrollTo('products-showcase')} />
      </section>

      {/* 2. Seamless Infinite Ecosystem Rail Marquee */}
      <section aria-label="Supported Indian Ecosystem Rails" className="l-reveal-on-scroll">
        <EcosystemMarquee />
      </section>

      {/* 3. Bento Grid Deep-Dive with Live Mini-Apps & Persona Switcher */}
      <section id="products-showcase" aria-label="Interactive Product Showcases" className="l-reveal-on-scroll">
        <BentoProductShowcase />
      </section>

      {/* 4. The Trust Architecture Matrix: Sovereign OS vs Cloud SaaS */}
      <div className="l-reveal-on-scroll">
        <TrustComparisonMatrix />
      </div>

      {/* 5. 3-Step Value Narrative Carousel with Circular Progress */}
      <section id="value-narrative" aria-label="Core Architecture Pillars" className="l-reveal-on-scroll">
        <ValueCarousel />
      </section>

      {/* 6. Complete Extensible OS Modules */}
      <section id="all-features" aria-label="System Capabilities and Modules" className="l-reveal-on-scroll">
        <AllFeaturesGrid />
      </section>

      {/* 6. Asymmetrical "In Numbers" Telemetry Grid */}
      <section id="metrics-telemetry" aria-label="Platform Telemetry" className="l-reveal-on-scroll">
        <MetricsInNumbers />
      </section>

      {/* 7. Outro High-Converting Sovereign Vault CTA Banner */}
      <div id="outro-cta" className="l-reveal-on-scroll">
        <OutroBrandCTA onUnlock={onUnlock} />
      </div>

      {/* 8. FAQ Knowledge Base Section */}
      <LandingFaqSection className="l-reveal-on-scroll" />

      {/* 9. Help & Feedback Section */}
      <section
        id="feedback-section"
        aria-label="Feedback and Feature Requests"
        className="l-section l-reveal-on-scroll"
        style={{ paddingTop: '1rem', paddingBottom: '3.5rem' }}
      >
        <LandingFeedbackCard />
      </section>

      {/* 10. Structured Enterprise Footer */}
      <LandingFooter />
    </main>
  );
};
