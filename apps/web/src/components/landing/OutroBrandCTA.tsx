import React, { useRef, useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Lock, Zap } from 'lucide-react';

interface OutroBrandCTAProps {
  onUnlock: () => void;
}

export const OutroBrandCTA: React.FC<OutroBrandCTAProps> = ({ onUnlock }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const size = 380;
    canvas.width = size;
    canvas.height = size;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;

      const time = Date.now() * 0.001;

      // Radial background glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 170);
      bgGrad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
      bgGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.12)');
      bgGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 170, 0, Math.PI * 2);
      ctx.fill();

      // Outer Arc (Rotating Clockwise)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, 140, 0.3, Math.PI * 1.6);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Arrow head at end of outer arc
      const head1X = Math.cos(Math.PI * 1.6) * 140;
      const head1Y = Math.sin(Math.PI * 1.6) * 140;
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(head1X, head1Y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Inner Arc (Rotating Counter-Clockwise)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-time * 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, 105, 1.2, Math.PI * 2.1);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrow head at end of inner arc
      const head2X = Math.cos(Math.PI * 2.1) * 105;
      const head2Y = Math.sin(Math.PI * 2.1) * 105;
      ctx.fillStyle = '#818cf8';
      ctx.beginPath();
      ctx.arc(head2X, head2Y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Center Monogram Glow Disc
      const centerGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 55);
      centerGrad.addColorStop(0, '#c084fc');
      centerGrad.addColorStop(0.5, '#7e22ce');
      centerGrad.addColorStop(1, '#3b0764');
      ctx.fillStyle = centerGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw 'S' in center
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', cx, cy + 2);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="l-section" style={{ paddingTop: '4rem', paddingBottom: '6rem', textAlign: 'center' }}>
      <div
        className="l-glass-card"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 5rem) 2rem',
          background: 'linear-gradient(180deg, rgba(17, 16, 28, 0.95) 0%, rgba(7, 7, 12, 0.98) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.9), 0 0 50px rgba(168, 85, 247, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Animated Brand Canvas */}
        <div style={{ position: 'relative', width: '380px', height: '380px', maxWidth: '100%', marginBottom: '1.5rem' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />

          {/* Floating Badges */}
          <div
            className="l-floating-badge"
            style={{
              position: 'absolute',
              top: '18%',
              left: '5%',
              padding: '0.4rem 0.8rem',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid #f59e0b',
              borderRadius: '9999px',
              color: '#fef08a',
              fontSize: '0.75rem',
              fontWeight: 800
            }}
          >
            ₿ Bitcoin
          </div>

          <div
            className="l-floating-badge"
            style={{
              position: 'absolute',
              bottom: '18%',
              right: '5%',
              padding: '0.4rem 0.8rem',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              borderRadius: '9999px',
              color: '#bae6fd',
              fontSize: '0.75rem',
              fontWeight: 800,
              animationDelay: '1.5s'
            }}
          >
            Ξ Ethereum
          </div>

          <div
            className="l-floating-badge"
            style={{
              position: 'absolute',
              top: '25%',
              right: '8%',
              padding: '0.4rem 0.8rem',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid #a855f7',
              borderRadius: '9999px',
              color: '#e9d5ff',
              fontSize: '0.75rem',
              fontWeight: 800,
              animationDelay: '2.5s'
            }}
          >
            ◎ Solana
          </div>
        </div>

        <h2
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
            color: '#ffffff',
            marginBottom: '1rem',
            maxWidth: '720px'
          }}
        >
          Ready to experience the future of finance?
        </h2>

        <p
          style={{
            fontSize: 'clamp(1rem, 1.6vw, 1.2rem)',
            lineHeight: 1.65,
            color: 'var(--l-text-secondary)',
            maxWidth: '620px',
            marginBottom: '2.5rem'
          }}
        >
          Join thousands of merchants, investors, and businesses enjoying frictionless zero-knowledge payments and autonomous multi-asset custody.
        </p>

        <button
          type="button"
          onClick={onUnlock}
          style={{
            padding: '1rem 2.75rem',
            borderRadius: '9999px',
            fontSize: '1.05rem',
            fontWeight: 800,
            background: '#ffffff',
            color: '#07070a',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            boxShadow: '0 0 40px rgba(255, 255, 255, 0.4), 0 10px 30px rgba(0, 0, 0, 0.6)',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Get Started Now
          <ArrowRight size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c4b5fd', fontSize: '0.82rem', fontWeight: 600 }}>
            <ShieldCheck size={16} /> 100% Zero-Knowledge
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c4b5fd', fontSize: '0.82rem', fontWeight: 600 }}>
            <Lock size={16} /> AES-256 Vault Encryption
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c4b5fd', fontSize: '0.82rem', fontWeight: 600 }}>
            <Zap size={16} /> Instant On-Device Execution
          </div>
        </div>
      </div>
    </div>
  );
};
