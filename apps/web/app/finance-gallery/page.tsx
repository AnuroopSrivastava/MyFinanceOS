'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skiper30 } from '../../src/components/ui/skiper-ui/skiper30';

export default function FinanceGalleryDevPage() {
  const [scrollStats, setScrollStats] = useState({ scrollY: 0, fps: 60 });

  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;
    let animId: number;

    const calculateFps = (now: number) => {
      frameCount++;
      if (now - lastTime >= 500) {
        fps = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;
        setScrollStats({
          scrollY: Math.round(window.scrollY),
          fps,
        });
      }
      animId = requestAnimationFrame(calculateFps);
    };

    animId = requestAnimationFrame(calculateFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <main
      style={{
        background: '#070810',
        color: '#ffffff',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* Dev Diagnostic Floating HUD */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 9999,
          background: 'rgba(13, 14, 27, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(192, 132, 252, 0.3)',
          borderRadius: 12,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 12,
          fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span>Lenis Active</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>FPS: </span>
          <span style={{ color: scrollStats.fps >= 55 ? '#10b981' : '#f59e0b' }}>{scrollStats.fps}</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>ScrollY: </span>
          <span>{scrollStats.scrollY}px</span>
        </div>
        <Link
          href="/"
          style={{
            color: '#c084fc',
            textDecoration: 'none',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            paddingLeft: 12,
          }}
        >
          ← Return to Landing
        </Link>
      </div>

      {/* Top Test Section (Scroll Entry Verification) */}
      <section
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
        <h1
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
        </h1>
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
      </section>

      {/* ISOLATED FINANCE GALLERY COMPONENT */}
      <Skiper30 enableLenis={true} />

      {/* Bottom Test Section (Scroll Exit & Reverse Scroll Verification) */}
      <section
        style={{
          padding: '100px 24px 140px',
          maxWidth: 900,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            fontWeight: 700,
            marginBottom: 16,
            color: '#ffffff',
          }}
        >
          Exit Boundary Verified
        </h2>
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
            if (window.__myfinanceos_lenis__) {
              window.__myfinanceos_lenis__.scrollTo(0);
            } else {
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
      </section>
    </main>
  );
}
