import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';

interface ValuePillar {
  step: string;
  metric: string;
  metricLabel: string;
  title: string;
  description: string;
}

const PILLARS: ValuePillar[] = [
  {
    step: '01 / 03',
    metric: '100x',
    metricLabel: 'cheaper than traditional payments',
    title: 'Zero Overhead & Decentralized Rails',
    description:
      'Eliminate intermediary merchant fees and processor markups. Our direct on-chain and local-first ledger routing slashes processing costs by orders of magnitude.'
  },
  {
    step: '02 / 03',
    metric: '5x',
    metricLabel: 'faster than credit cards',
    title: 'Sub-Second Settlement Speeds',
    description:
      'Avoid 3-day bank settlement holding periods. Instant transaction validation and zero-knowledge local verification guarantee real-time balance reconciliation.'
  },
  {
    step: '03 / 03',
    metric: '100%',
    metricLabel: 'global cross-border availability',
    title: 'Sovereign Multi-Currency Custody',
    description:
      'Access frictionless cross-border payments across 35+ cryptocurrencies and 25+ fiat currencies with client-side zero-knowledge security.'
  }
];

export const ValueCarousel: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const globeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto progression with timer
  useEffect(() => {
    setProgress(0);
    const duration = 6000;
    const intervalTime = 50;
    const stepIncrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((s) => (s + 1) % PILLARS.length);
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeStep]);

  // Stage 3 Globe Canvas
  useEffect(() => {
    if (activeStep !== 2) return;
    const canvas = globeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const size = 320;
    canvas.width = size;
    canvas.height = size;
    const radius = 95;

    // Dotted Sphere
    const dots: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 350; i++) {
      const y = 1 - (i / 349) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = i * 2.39996;
      dots.push({ x: Math.cos(theta) * r * radius, y: y * radius, z: Math.sin(theta) * r * radius });
    }

    let rotY = 0;
    const render = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;

      // Glow behind
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius * 1.3);
      g.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Sphere Silhouette
      ctx.fillStyle = '#0e0e18';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Dual Crossing Orbital Rings
      const t = Date.now() * 0.0015;

      // Ring 1 (Tilted forward-left)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.35, radius * 0.45, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Traveling photon 1
      const p1x = Math.cos(t) * radius * 1.35;
      const p1y = Math.sin(t) * radius * 0.45;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p1x, p1y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Ring 2 (Tilted forward-right)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.35, radius * 0.45, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Traveling photon 2
      const p2x = Math.cos(-t * 1.2) * radius * 1.35;
      const p2y = Math.sin(-t * 1.2) * radius * 0.45;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(p2x, p2y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Rotate Dots
      rotY += 0.008;
      const cos = Math.cos(rotY);
      const sin = Math.sin(rotY);

      for (const d of dots) {
        const x = d.x * cos + d.z * sin;
        const z = -d.x * sin + d.z * cos;
        if (z > -radius * 0.8) {
          const alpha = (z + radius) / (radius * 2);
          ctx.fillStyle = `rgba(192, 132, 252, ${Math.max(0.1, alpha * 0.85)})`;
          ctx.beginPath();
          ctx.arc(cx + x, cy + d.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeStep]);

  const current = PILLARS[activeStep];

  return (
    <div className="l-section" style={{ paddingTop: '4rem', paddingBottom: '5rem' }}>
      <div
        className="l-glass-card"
        style={{
          padding: 'clamp(2rem, 4vw, 3.5rem)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(145deg, rgba(17, 17, 27, 0.95) 0%, rgba(8, 8, 14, 0.98) 100%)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3.5rem',
            alignItems: 'center'
          }}
        >
          {/* Left Column: Metric & Step Progress */}
          <div>
            {/* Step Counter with Circular SVG Progress Ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ position: 'relative', width: '38px', height: '38px' }}>
                <svg width="38" height="38" viewBox="0 0 38 38" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="19"
                    cy="19"
                    r="15"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="19"
                    cy="19"
                    r="15"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeDasharray={94.2}
                    strokeDashoffset={94.2 - (94.2 * progress) / 100}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#c4b5fd'
                  }}
                >
                  {activeStep + 1}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {PILLARS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveStep(idx);
                      setProgress(0);
                    }}
                    style={{
                      background: idx === activeStep ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: idx === activeStep ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '0.35rem 0.75rem',
                      color: idx === activeStep ? '#ffffff' : 'var(--l-text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {p.step}
                  </button>
                ))}
              </div>
            </div>

            {/* Giant Dynamic Metric */}
            <div
              style={{
                fontSize: 'clamp(3.75rem, 8vw, 6.5rem)',
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: '-0.04em',
                color: '#ffffff',
                marginBottom: '0.75rem'
              }}
              className="l-num"
            >
              {current.metric}
            </div>

            <div
              style={{
                fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)',
                fontWeight: 700,
                color: '#c4b5fd',
                marginBottom: '1.75rem',
                lineHeight: 1.3
              }}
            >
              {current.metricLabel}
            </div>

            <p
              style={{
                fontSize: '1rem',
                lineHeight: 1.65,
                color: 'var(--l-text-secondary)',
                maxWidth: '460px'
              }}
            >
              {current.description}
            </p>
          </div>

          {/* Right Column: 3D Interactive Stage Component */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '380px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              overflow: 'hidden',
              padding: '2rem'
            }}
          >
            {/* STAGE 1: 3D Animated Seesaw Balance Scale (00:08 - 00:10) */}
            {activeStep === 0 && (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Glow behind fulcrum */}
                <div
                  style={{
                    position: 'absolute',
                    width: '180px',
                    height: '180px',
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
                    filter: 'blur(20px)'
                  }}
                />

                {/* Tilting Seesaw Lever Bar */}
                <div
                  className="l-seesaw-bar"
                  style={{
                    position: 'relative',
                    width: '280px',
                    height: '12px',
                    background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #8b5cf6 100%)',
                    borderRadius: '6px',
                    boxShadow: '0 0 25px rgba(168, 85, 247, 0.5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    padding: '0 10px'
                  }}
                >
                  {/* Left Side: Heavy Stack of Gold Coins */}
                  <div
                    style={{
                      transform: 'translateY(-8px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    {[0, 1, 2, 3].map((c) => (
                      <div
                        key={c}
                        style={{
                          width: '44px',
                          height: '12px',
                          background: 'linear-gradient(180deg, #fbbf24 0%, #b45309 100%)',
                          borderRadius: '50%',
                          border: '1px solid #fef08a',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                        }}
                      />
                    ))}
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fef08a', marginTop: '4px' }}>
                      Legacy 3.5%
                    </div>
                  </div>

                  {/* Right Side: Glowing Lightweight Purple Sphere */}
                  <div
                    style={{
                      transform: 'translateY(-14px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 30%, #c084fc 0%, #7e22ce 65%, #3b0764 100%)',
                        boxShadow: '0 0 30px rgba(168, 85, 247, 0.9), inset 0 0 10px rgba(255, 255, 255, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '1.2rem'
                      }}
                    >
                      S
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#c4b5fd', marginTop: '4px' }}>
                      Sellix 0%
                    </div>
                  </div>
                </div>

                {/* Triangular Fulcrum Base */}
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '28px solid transparent',
                    borderRight: '28px solid transparent',
                    borderBottom: '50px solid #2e1065',
                    marginTop: '-2px',
                    filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.8))',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '46px',
                      left: '-40px',
                      width: '80px',
                      height: '8px',
                      background: '#1e1b4b',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            )}

            {/* STAGE 2: Glowing Dark Titanium Card & Floating Coin Badges (00:11 - 00:12) */}
            {activeStep === 1 && (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Floating Coin Badges on the Left */}
                <div style={{ position: 'absolute', left: '15px', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 5 }}>
                  <div
                    className="l-floating-badge"
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid #f59e0b',
                      borderRadius: '9999px',
                      color: '#fef08a',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    ₿ BTC 0.05
                  </div>
                  <div
                    className="l-floating-badge"
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid #a855f7',
                      borderRadius: '9999px',
                      color: '#e9d5ff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      animationDelay: '1.2s'
                    }}
                  >
                    ◎ SOL 4.5
                  </div>
                  <div
                    className="l-floating-badge"
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      borderRadius: '9999px',
                      color: '#bae6fd',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      animationDelay: '2.4s'
                    }}
                  >
                    Ł LTC 12.0
                  </div>
                </div>

                {/* Dark Metallic Card */}
                <div
                  style={{
                    width: '260px',
                    height: '160px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #181824 0%, #0a0a10 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(168, 85, 247, 0.25)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: 'rotate(-4deg)'
                  }}
                >
                  {/* Neon Purple Double-Chevron Beam Cutting Across */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '2.5rem',
                      fontWeight: 900,
                      color: '#c084fc',
                      textShadow: '0 0 20px #a855f7, 0 0 40px #a855f7',
                      letterSpacing: '-6px'
                    }}
                  >
                    &gt;&gt;
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em' }}>
                      SELLIX
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 700 }}>TITANIUM</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.12em', fontFamily: 'monospace' }}>
                      590 3732 ••••
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.65rem', color: 'var(--l-text-muted)' }}>
                      <span>EXP 09/28</span>
                      <span>CVV 299</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3: 3D Dotted World Globe with Dual Crossing Neon Orbital Rings (00:13 - 00:14) */}
            {activeStep === 2 && (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <canvas ref={globeCanvasRef} style={{ width: '320px', height: '320px' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
