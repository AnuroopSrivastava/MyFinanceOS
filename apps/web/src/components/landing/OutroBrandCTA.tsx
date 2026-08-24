import React from 'react';
import { ArrowRight, ShieldCheck, Lock, Sparkles, Zap } from 'lucide-react';

interface OutroBrandCTAProps {
  onUnlock: () => void;
}

export const OutroBrandCTA: React.FC<OutroBrandCTAProps> = ({ onUnlock }) => {
  return (
    <div className="l-section" style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '6rem' }}>
      <div
        className="l-glass-card"
        style={{
          padding: 'clamp(2.5rem, 6vw, 4.5rem) 1.5rem',
          background: 'linear-gradient(180deg, rgba(17, 17, 27, 0.9) 0%, rgba(6, 6, 9, 0.95) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 0 50px rgba(139, 92, 246, 0.2), 0 25px 60px rgba(0,0,0,0.9)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Ambient Radial Corona */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(99, 102, 241, 0.1) 45%, transparent 70%)',
            filter: 'blur(35px)',
            pointerEvents: 'none'
          }}
        />

        {/* 3D Rotating Brand Monogram Visual */}
        <div
          style={{
            position: 'relative',
            width: '100px',
            height: '100px',
            margin: '0 auto 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Outer Counter-Rotating Ring 1 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px dashed rgba(168, 85, 247, 0.6)',
              animation: 'lOrbitRotate 12s linear infinite'
            }}
          />

          {/* Inner Counter-Rotating Ring 2 */}
          <div
            style={{
              position: 'absolute',
              inset: '10px',
              borderRadius: '50%',
              border: '1.5px solid rgba(99, 102, 241, 0.5)',
              borderTopColor: '#34d399',
              animation: 'lOrbitRotateRev 8s linear infinite'
            }}
          />

          {/* Center Luminous Shield */}
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <ShieldCheck size={32} />
          </div>
        </div>

        {/* Headline */}
        <h2
          style={{
            fontSize: 'clamp(2rem, 4vw, 3.25rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.035em',
            color: '#ffffff',
            maxWidth: '750px',
            margin: '0 auto 1rem'
          }}
        >
          Take Absolute Control of Your Financial Destiny Today
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.15rem)',
            lineHeight: 1.6,
            color: 'var(--l-text-secondary)',
            maxWidth: '600px',
            margin: '0 auto 2.25rem'
          }}
        >
          Zero cloud data harvesting. Zero monthly subscription paywalls. Completely private,
          local-first, and encrypted on your device.
        </p>

        {/* Big CTA */}
        <button
          type="button"
          onClick={onUnlock}
          style={{
            padding: '1rem 2.5rem',
            borderRadius: '9999px',
            fontSize: '1.05rem',
            fontWeight: 800,
            background: '#ffffff',
            color: '#07070a',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 0 35px rgba(255, 255, 255, 0.4), 0 15px 35px rgba(0, 0, 0, 0.7)',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            zIndex: 2
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Launch Free Encrypted Vault
          <ArrowRight size={20} />
        </button>

        <style>{`
          @keyframes lOrbitRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes lOrbitRotateRev {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
        `}</style>
      </div>
    </div>
  );
};
