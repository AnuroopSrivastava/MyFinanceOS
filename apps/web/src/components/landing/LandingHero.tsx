import React, { useEffect, useRef } from 'react';
import { ShieldCheck, ArrowRight, Sparkles, Lock, Zap, TrendingUp, CheckCircle } from 'lucide-react';

interface LandingHeroProps {
  onUnlock: () => void;
  onExploreClick?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onUnlock, onExploreClick }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Particle Globe Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = Math.min(width * 0.75, 520));

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = Math.min(width * 0.75, 520);
    };

    window.addEventListener('resize', handleResize);

    // Particle Globe points
    const PARTICLE_COUNT = 480;
    const radius = Math.min(width, height) * 0.38;
    const particles: { x: number; y: number; z: number; baseAlpha: number }[] = [];

    // Fibonacci sphere distribution for uniform 3D sphere points
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y = 1 - (i / (PARTICLE_COUNT - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      // Higher brightness at upper hemisphere (simulating top corona light)
      const baseAlpha = 0.25 + Math.max(0, y) * 0.65;

      particles.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        baseAlpha
      });
    }

    let angleY = 0;
    let angleX = 0.25; // Slight top tilt perspective

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2 + 30;

      // 1. Draw Background Corona Halo
      const coronaGrad = ctx.createRadialGradient(
        centerX,
        centerY - radius * 0.65,
        10,
        centerX,
        centerY,
        radius * 1.35
      );
      coronaGrad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
      coronaGrad.addColorStop(0.35, 'rgba(139, 92, 246, 0.25)');
      coronaGrad.addColorStop(0.7, 'rgba(99, 102, 241, 0.08)');
      coronaGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Sphere Silhouette
      const sphereGrad = ctx.createRadialGradient(
        centerX,
        centerY - radius * 0.3,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      sphereGrad.addColorStop(0, '#100e1c');
      sphereGrad.addColorStop(0.85, '#07060d');
      sphereGrad.addColorStop(1, 'rgba(139, 92, 246, 0.15)');

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Draw Orbiting Streamer Ellipse
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-0.35); // Tilt angle
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.28, radius * 0.42, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Traveling light pulse on orbit
      const pulseT = (Date.now() * 0.001) % (Math.PI * 2);
      const pulseX = Math.cos(pulseT) * radius * 1.28;
      const pulseY = Math.sin(pulseT) * radius * 0.42;

      const pulseGrad = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 16);
      pulseGrad.addColorStop(0, '#ffffff');
      pulseGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.8)');
      pulseGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pulseGrad;
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Rotate and Project 3D Particles
      angleY += 0.0045; // Rotation speed

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Sort by depth (Z) for correct painter rendering
      const projected = particles.map((p) => {
        // Y-axis rotation
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;

        // X-axis tilt
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Perspective scale
        const scale = (z2 + radius * 2) / (radius * 2.5);
        const screenX = centerX + x1;
        const screenY = centerY + y2;

        return {
          screenX,
          screenY,
          scale,
          z: z2,
          alpha: Math.max(0.08, ((z2 + radius) / (radius * 2)) * p.baseAlpha)
        };
      });

      projected.sort((a, b) => a.z - b.z);

      for (const p of projected) {
        if (p.z > -radius * 0.85) {
          ctx.beginPath();
          const dotSize = Math.max(1, p.scale * 1.8);
          ctx.arc(p.screenX, p.screenY, dotSize, 0, Math.PI * 2);
          
          if (p.z > radius * 0.3) {
            ctx.fillStyle = `rgba(192, 132, 252, ${p.alpha})`; // Front glowing violet
          } else {
            ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha * 0.6})`; // Deep muted
          }
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', paddingTop: '2rem' }}>
      {/* Top Ambient Glow */}
      <div className="l-ambient-top-glow" />

      {/* Main Container */}
      <div className="l-section" style={{ textAlign: 'center', paddingBottom: '2rem' }}>
        {/* Category Badge */}
        <div style={{ display: 'inline-flex', justifyContent: 'center' }}>
          <div className="l-badge-pill">
            <Sparkles size={14} color="#c4b5fd" />
            <span>Next-Gen Autonomous Financial OS</span>
          </div>
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.04em',
            margin: '0 auto 1.25rem',
            maxWidth: '960px',
            color: '#ffffff',
            textShadow: '0 0 40px rgba(139, 92, 246, 0.25)'
          }}
        >
          Precision Wealth & Autonomous Financial Intelligence
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)',
            lineHeight: 1.6,
            color: 'var(--l-text-secondary)',
            maxWidth: '740px',
            margin: '0 auto 2.25rem'
          }}
        >
          Local-first, zero-knowledge financial operating system. Unify double-entry bank ledgers,
          equity portfolios, FY26 automated tax regimes, multi-entity business suites, and FIRE compounding in one private vault.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '3rem',
            position: 'relative',
            zIndex: 10
          }}
        >
          <button
            type="button"
            onClick={onUnlock}
            style={{
              padding: '0.85rem 2rem',
              borderRadius: '9999px',
              fontSize: '1rem',
              fontWeight: 700,
              background: '#ffffff',
              color: '#07070a',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              boxShadow: '0 0 30px rgba(255, 255, 255, 0.35), 0 10px 25px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Launch Free Web OS
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={onUnlock}
            style={{
              padding: '0.85rem 1.85rem',
              borderRadius: '9999px',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <Lock size={16} color="#c4b5fd" />
            Unlock Encrypted Vault
          </button>
        </div>

        {/* 3D Visual Centerpiece with Floating Badges */}
        <div style={{ position: 'relative', maxWidth: '880px', margin: '0 auto', minHeight: '440px' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              maxWidth: '880px',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.8))'
            }}
          />

          {/* Floating Badge 1: Salary Income Inflow (Top Right) */}
          <div
            className="l-floating-badge"
            style={{
              position: 'absolute',
              top: '12%',
              right: '4%',
              padding: '0.75rem 1.15rem',
              background: 'rgba(13, 13, 22, 0.85)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '16px',
              boxShadow: '0 15px 35px rgba(0,0,0,0.7), 0 0 20px rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              animationDelay: '0s'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399'
              }}
            >
              <TrendingUp size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--l-text-secondary)', fontWeight: 600 }}>
                TechCorp Payroll Received
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399' }} className="l-num">
                + ₹1,85,000.00
              </div>
            </div>
          </div>

          {/* Floating Badge 2: Zerodha Auto-SIP (Bottom Left) */}
          <div
            className="l-floating-badge"
            style={{
              position: 'absolute',
              bottom: '16%',
              left: '4%',
              padding: '0.75rem 1.15rem',
              background: 'rgba(13, 13, 22, 0.85)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: '16px',
              boxShadow: '0 15px 35px rgba(0,0,0,0.7), 0 0 20px rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              animationDelay: '-2.5s'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c4b5fd'
              }}
            >
              <Zap size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--l-text-secondary)', fontWeight: 600 }}>
                Zerodha Nifty Index SIP
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#c4b5fd' }} className="l-num">
                - ₹25,000.00
              </div>
            </div>
          </div>

          {/* Floating Badge 3: FY26 Tax Optimization Alert (Bottom Center/Right) */}
          <div
            className="l-floating-badge"
            style={{
              position: 'absolute',
              bottom: '5%',
              right: '18%',
              padding: '0.65rem 1rem',
              background: 'rgba(13, 13, 22, 0.9)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              borderRadius: '14px',
              boxShadow: '0 15px 35px rgba(0,0,0,0.7), 0 0 20px rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textAlign: 'left',
              animationDelay: '-1.2s'
            }}
          >
            <CheckCircle size={16} color="#22d3ee" />
            <div style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>
              FY26 Optimal Slab: <strong style={{ color: '#22d3ee' }}>₹25,500 Saved</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
