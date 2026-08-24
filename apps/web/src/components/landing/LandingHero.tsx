import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Layers,
  Zap,
  CreditCard,
  Building2,
  ChevronRight
} from 'lucide-react';

interface LandingHeroProps {
  onUnlock: () => void;
  onExploreClick?: () => void;
}

interface FloatingNotification {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  amount: string;
  sub: string;
  pos: { top?: string; bottom?: string; left?: string; right?: string };
}

const NOTIFICATIONS: FloatingNotification[] = [
  {
    id: 'n1',
    icon: '₿',
    iconBg: '#f59e0b',
    title: '0.1 BTC sent to Janet',
    amount: '+$2,320.00',
    sub: 'Crypto Payout',
    pos: { top: '18%', right: '4%' }
  },
  {
    id: 'n2',
    icon: '◎',
    iconBg: '#a855f7',
    title: 'Product Bought',
    amount: '1.2 SOL • $185',
    sub: 'Store Order #4218',
    pos: { bottom: '15%', left: '3%' }
  },
  {
    id: 'n3',
    icon: '₹',
    iconBg: '#10b981',
    title: 'HDFC Salary Credited',
    amount: '+₹2,15,000',
    sub: 'Auto-Reconciled',
    pos: { bottom: '6%', right: '12%' }
  }
];

export const LandingHero: React.FC<LandingHeroProps> = ({ onUnlock, onExploreClick }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeNotifIndex, setActiveNotifIndex] = useState(0);

  // Cycle floating notification focus
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNotifIndex((prev) => (prev + 1) % NOTIFICATIONS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // 3D Particle Globe Simulation with Purple Corona and Orbital Ring
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    let height = (canvas.height = Math.min(width * 0.7, 520));

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = Math.min(width * 0.7, 520);
    };

    window.addEventListener('resize', handleResize);

    // Dotted Matrix Sphere
    const PARTICLE_COUNT = 620;
    const radius = Math.min(width, height) * 0.44;
    const particles: { x: number; y: number; z: number; baseAlpha: number }[] = [];

    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden spiral
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y = 1 - (i / (PARTICLE_COUNT - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      const baseAlpha = 0.3 + Math.max(0, y) * 0.7;

      particles.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        baseAlpha
      });
    }

    let angleY = 0;
    const angleX = 0.28;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2 + 25;

      // 1. Purple Corona Top Glow
      const coronaGrad = ctx.createRadialGradient(
        centerX,
        centerY - radius * 0.75,
        15,
        centerX,
        centerY,
        radius * 1.55
      );
      coronaGrad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
      coronaGrad.addColorStop(0.35, 'rgba(139, 92, 246, 0.22)');
      coronaGrad.addColorStop(0.7, 'rgba(99, 102, 241, 0.05)');
      coronaGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // 2. Sphere Body Silhouette
      const sphereGrad = ctx.createRadialGradient(
        centerX,
        centerY - radius * 0.35,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      sphereGrad.addColorStop(0, '#100e1e');
      sphereGrad.addColorStop(0.85, '#06060a');
      sphereGrad.addColorStop(1, 'rgba(168, 85, 247, 0.25)');

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Top glowing rim stroke
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Orbital Streamer Ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-0.32);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.32, radius * 0.44, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Traveling photon pulse on the ring
      const pulseT = (Date.now() * 0.0012) % (Math.PI * 2);
      const pulseX = Math.cos(pulseT) * radius * 1.32;
      const pulseY = Math.sin(pulseT) * radius * 0.44;

      const pulseGrad = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 20);
      pulseGrad.addColorStop(0, '#ffffff');
      pulseGrad.addColorStop(0.35, 'rgba(168, 85, 247, 0.9)');
      pulseGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pulseGrad;
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Project and Rotate 3D Matrix Particles
      angleY += 0.0042;
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const projected = particles.map((p) => {
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;

        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

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
        if (p.z > -radius * 0.88) {
          ctx.beginPath();
          const dotSize = Math.max(0.9, p.scale * 1.85);
          ctx.arc(p.screenX, p.screenY, dotSize, 0, Math.PI * 2);

          if (p.z > radius * 0.25) {
            ctx.fillStyle = `rgba(192, 132, 252, ${p.alpha * 1.1})`;
          } else {
            ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha * 0.55})`;
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
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      {/* Top Ambient Glow */}
      <div className="l-ambient-top-glow" />

      {/* Top Fixed Header Navigation */}
      <header className="l-nav-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1.05rem',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
            }}
          >
            S
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
            Sellix <span style={{ fontSize: '0.72rem', color: '#c4b5fd', fontWeight: 600 }}>OS</span>
          </span>
        </div>

        <nav className="l-nav-links">
          <button type="button" className="l-nav-link" onClick={onExploreClick}>Products</button>
          <button type="button" className="l-nav-link" onClick={onExploreClick}>Pricing</button>
          <button type="button" className="l-nav-link" onClick={onExploreClick}>Developers</button>
          <button type="button" className="l-nav-link" onClick={onExploreClick}>Resources</button>
          <button type="button" className="l-nav-link" onClick={onExploreClick}>Contact Sales</button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={onUnlock}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.4rem 0.8rem'
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={onUnlock}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: '#ffffff',
              color: '#07070a',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.25)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Get Started
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Hero Content Section */}
      <div className="l-section" style={{ textAlign: 'center', paddingTop: '7.5rem', paddingBottom: '2.5rem' }}>
        {/* Main Headline */}
        <h1
          style={{
            fontSize: 'clamp(2.75rem, 6.5vw, 5.25rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            margin: '0 auto 1.25rem',
            maxWidth: '920px',
            color: '#ffffff',
            textShadow: '0 0 40px rgba(168, 85, 247, 0.3)'
          }}
        >
          Cross-border finance
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)',
            lineHeight: 1.65,
            color: 'var(--l-text-secondary)',
            maxWidth: '720px',
            margin: '0 auto 2.5rem'
          }}
        >
          Accept payments, manage and custody your assets with ease, enjoy seamless on/off-ramping between cryptocurrencies and fiat, and explore integrated eCommerce solutions.
        </p>

        {/* Hero Call to Actions */}
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
              padding: '0.9rem 2.25rem',
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
              boxShadow: '0 0 35px rgba(255, 255, 255, 0.35), 0 10px 25px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Get Started
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={onExploreClick || onUnlock}
            style={{
              padding: '0.9rem 2rem',
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
            Contact Sales
            <ArrowRight size={16} color="#c4b5fd" />
          </button>
        </div>

        {/* 3D Particle Planet with Orbital Streamer & Floating Live Transactions */}
        <div style={{ position: 'relative', maxWidth: '960px', margin: '0 auto', minHeight: '440px' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              maxWidth: '960px',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              filter: 'drop-shadow(0 25px 60px rgba(0,0,0,0.85))'
            }}
          />

          {/* Floating Live Transaction Bubbles */}
          {NOTIFICATIONS.map((n, idx) => {
            const isHighlighted = idx === activeNotifIndex;
            return (
              <div
                key={n.id}
                className="l-floating-badge"
                style={{
                  position: 'absolute',
                  ...n.pos,
                  padding: '0.75rem 1.15rem',
                  background: isHighlighted ? 'rgba(18, 16, 30, 0.95)' : 'rgba(13, 13, 22, 0.9)',
                  border: isHighlighted
                    ? '1px solid rgba(168, 85, 247, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  boxShadow: isHighlighted
                    ? '0 15px 35px rgba(0,0,0,0.8), 0 0 25px rgba(168, 85, 247, 0.3)'
                    : '0 15px 35px rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textAlign: 'left',
                  transition: 'all 0.4s ease',
                  transform: isHighlighted ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${n.iconBg}22`,
                    border: `1px solid ${n.iconBg}66`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: n.iconBg,
                    fontWeight: 900,
                    fontSize: '1.1rem'
                  }}
                >
                  {n.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                    {n.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#c4b5fd', fontWeight: 700 }} className="l-num">
                      {n.amount}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--l-text-muted)' }}>
                      • {n.sub}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
