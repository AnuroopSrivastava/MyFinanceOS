import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '@financeos/database';
import { authSession } from '@financeos/auth';
import { useGoogleLogin } from '@react-oauth/google';
import {
  ShieldCheck, ArrowRight, Database, Network, PieChart, Lock, MessageSquare,
  LayoutDashboard, Landmark, TrendingUp, Percent, Briefcase, Building2, Target, Zap,
  FileSpreadsheet, Sparkles, Settings
} from 'lucide-react';

interface LandingProps {
  onUnlock: () => void;
}

// Replaced dynamic text based on specs

// Utility hook for scroll animations
function useIntersectionObserver(ref: React.RefObject<Element>, options: IntersectionObserverInit = { threshold: 0.1 }) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        observer.unobserve(entry.target);
      }
    }, options);
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options]);
  return isIntersecting;
}

const Reveal = ({ children, delay = 0, style = {} }: { children: React.ReactNode, delay?: number, style?: React.CSSProperties }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref);
  return (
    <div ref={ref} style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      willChange: 'opacity, transform',
      width: '100%',
      ...style
    }}>
      {children}
    </div>
  );
};

// 3D Tilt Card Component
const TiltCard = ({ children, delay }: { children: React.ReactNode, delay: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const isVisible = useIntersectionObserver(cardRef);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    setRotation({ x: rotateX, y: rotateY });
  };

  return (
    <div
      ref={cardRef}
      className="glass-panel feature-card"
      style={{
        padding: '2.5rem 2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.25rem',
        transition: `transform 0.1s ease-out, box-shadow 0.3s ease, border-color 0.3s ease, opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        cursor: 'default',
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateY(-8px)`
          : (isVisible ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)' : 'translateY(40px)'),
        opacity: isVisible ? 1 : 0,
        boxShadow: isHovered ? '0 10px 40px -10px rgba(59, 130, 246, 0.15)' : 'var(--shadow-sm)',
        borderColor: isHovered ? 'var(--accent-1)' : 'var(--border-color)',
        transformStyle: 'preserve-3d', willChange: 'transform'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setRotation({ x: 0, y: 0 }); }}
    >
      <div style={{ transform: 'translateZ(30px)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {children}
      </div>
    </div>
  );
};

// FAQ Accordion Component
const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border-color)', padding: '1.5rem 0' }}>
      <button
        onPointerDown={() => setIsOpen(!isOpen)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: 0 }}
      >
        {question}
        <span style={{
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
          transition: 'transform 0.3s ease',
          color: 'var(--accent-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>+</span>
      </button>
      <div style={{
        maxHeight: isOpen ? '200px' : '0',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isOpen ? 1 : 0,
      }}>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.6, marginBottom: 0 }}>
          {answer}
        </p>
      </div>
    </div>
  );
};

// All 12 Features in Exact Sequence Top-to-Bottom
const FEATURE_BLOCKS = [
  {
    id: 'dashboard',
    icon: <LayoutDashboard size={24} />,
    title: 'Mission Control',
    desc: 'Get an instant, high-level overview of your entire financial universe. Aggregates live net worth, asset allocation, monthly cash flow, and automated financial health score gauges.',
    bullets: [
      'Real-time Net Worth calculation',
      'Financial Health Score gauge & tips',
      'Interactive asset allocation charts',
      'Live monthly cash flow synthesis'
    ],
    demo: (
      <div style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', minWidth: '300px', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>MISSION CONTROL</span>
          </div>
          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>+14.2% YoY</span>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Net Worth</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>₹48,50,200</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Monthly Income</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-1)' }}>₹2,15,000</div>
          </div>
          <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Expenses</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--error)' }}>₹82,400</div>
          </div>
          <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Health Score</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>94 / 100</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', height: '50px', marginTop: '0.25rem', padding: '0.5rem 0 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {[35, 50, 65, 80, 60, 90, 100].map((val, idx) => (
            <div key={idx} style={{ flex: 1, height: `${val}%`, background: idx === 6 ? 'var(--success)' : (idx === 5 ? 'var(--accent-1)' : 'rgba(59, 130, 246, 0.4)'), borderRadius: '4px', transition: 'all 0.3s' }} />
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'ledger',
    icon: <Landmark size={24} />,
    title: 'Banking & Ledger',
    desc: 'The heart of your financial OS. A powerful, double-entry capable ledger that tracks every rupee with absolute precision and military-grade encryption.',
    bullets: [
      'Multi-account balance reconciliation',
      'Automated category & tag filter engine',
      'Split transactions & recurring logs',
      'Full CSV & Excel import & export'
    ],
    demo: (
      <div style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', minWidth: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>TRANSACTION LEDGER</div>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'var(--accent-1)', color: '#fff', borderRadius: '4px', fontWeight: 600 }}>All</span>
            <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', borderRadius: '4px' }}>Income</span>
            <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', borderRadius: '4px' }}>Expenses</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>TechCorp Payroll</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>HDFC Salary • Today</div>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--success)' }}>+ ₹1,85,000</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>HDFC Home Loan EMI</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Auto-Debit • Yday</div>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--error)' }}>- ₹48,500</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Zerodha Index SIP</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Investments • 24 Jul</div>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-1)' }}>- ₹25,000</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'investments',
    icon: <TrendingUp size={24} />,
    title: 'Portfolio & Investments',
    desc: 'Consolidated asset tracking for Indian Equities, Mutual Funds, Fixed Deposits, Gold, NPS, EPF, and US Stocks with live P&L and yield analytics.',
    bullets: [
      'Real-time portfolio valuation & returns',
      'Multi-asset class allocation grid',
      'Dividend yield & CAGR tracking',
      'Nominee coverage audit'
    ],
    demo: (
      <div style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', minWidth: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Portfolio Holdings</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹34,80,000</div>
          </div>
          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderRadius: '9999px', fontWeight: 700 }}>+₹5.4L (18.3%)</span>
        </div>
        <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', gap: '2px' }}>
          <div style={{ width: '45%', background: '#38bdf8' }} title="Equities 45%" />
          <div style={{ width: '30%', background: '#c084fc' }} title="Mutual Funds 30%" />
          <div style={{ width: '15%', background: '#fbbf24' }} title="Gold 15%" />
          <div style={{ width: '10%', background: '#34d399' }} title="Debt 10%" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.2rem' }}>
          <div style={{ padding: '0.5rem 0.6rem', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', borderLeft: '3px solid #38bdf8', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Equities:</span> <strong>45% (₹15.6L)</strong>
          </div>
          <div style={{ padding: '0.5rem 0.6rem', background: 'rgba(192, 132, 252, 0.08)', borderRadius: '6px', borderLeft: '3px solid #c084fc', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Mutual Funds:</span> <strong>30% (₹10.4L)</strong>
          </div>
          <div style={{ padding: '0.5rem 0.6rem', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '6px', borderLeft: '3px solid #fbbf24', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Gold SGBs:</span> <strong>15% (₹5.2L)</strong>
          </div>
          <div style={{ padding: '0.5rem 0.6rem', background: 'rgba(52, 211, 153, 0.08)', borderRadius: '6px', borderLeft: '3px solid #34d399', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Debt & FDs:</span> <strong>10% (₹3.5L)</strong>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'tax',
    icon: <Percent size={24} />,
    title: 'Tax & GST Suite',
    desc: 'Stay ahead of tax season with real-time tax liability forecasting. Automatically calculates expected tax based on latest Indian tax slabs for Old vs New regimes.',
    bullets: [
      'Real-time Old vs New Regime comparison',
      '80C, 80D & standard deduction headroom',
      'STCG & LTCG capital gains calculator',
      'TDS & Form 26AS reconciliation'
    ],
    demo: (
      <div style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', minWidth: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>FY26 TAX REGIME COMPARISON</span>
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-1)', borderRadius: '4px' }}>Auto-Optimized</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid var(--success)', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>NEW REGIME (OPTIMAL)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>₹1,42,500</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Lower Slabs Applied</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', opacity: 0.7 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>OLD REGIME</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--error)', marginTop: '0.2rem' }}>₹1,68,000</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Includes 80C & 80D</div>
          </div>
        </div>
        <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>
          ✓ New Tax Regime Saves You ₹25,500 Annually
        </div>
      </div>
    )
  },
  {
    id: 'business',
    icon: <Briefcase size={24} />,
    title: 'Business Suite',
    desc: 'Manage multiple commercial entities, corporate tax slabs, GST invoicing, inventory stock, vendor accounts, and automated Profit & Loss statements.',
    bullets: [
      'Commercial GST invoicing & tracking',
      'Multi-entity corporate tax tier slabs',
      'Inventory stock & vendor registers',
      'Automated Commercial P&L generation'
    ],
    demo: (
      <div style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', minWidth: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Active Commercial Entity</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Apex Innovations Pvt Ltd</div>
          </div>
          <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-1)', borderRadius: '4px', fontWeight: 600 }}>GST Registered</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ padding: '0.45rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span>Slab 1 (Up to ₹5 Lakhs)</span>
            <strong style={{ color: 'var(--success)' }}>0% Tax Exemption</strong>
          </div>
          <div style={{ padding: '0.45rem 0.75rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span>Slab 2 (₹5L - ₹10L)</span>
            <strong style={{ color: 'var(--accent-1)' }}>10% Corporate Slab</strong>
          </div>
          <div style={{ padding: '0.45rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span>Slab 3 (Above ₹10L)</span>
            <strong style={{ color: 'var(--error)' }}>20% Tier Slab</strong>
          </div>
        </div>
      </div>
    )
  },

  {
    id: 'planner',
    icon: <Target size={24} />,
    title: 'Investment Planner',
    desc: 'Plot your path to Financial Independence & Early Retirement (FIRE), SIP step-up compounding, goal-based milestone tracking, and EMI loan amortization.',
    bullets: [
      'FIRE Lean / Standard / Fat target corpus math',
      'SIP compounding with annual step-up',
      'EMI loan amortization & prepayment calculator',
      'Goal-based milestone progress mapping'
    ],
    demo: (
      <div style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.95)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', minWidth: '320px' }}>
        {/* Top Header & Mode Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.55rem', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', borderRadius: '6px', fontWeight: 700, border: '1px solid rgba(52, 211, 153, 0.3)' }}>🔥 FIRE Lab</span>
            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.55rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', borderRadius: '6px', fontWeight: 600 }}>📈 SIP Step-Up</span>
            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.55rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', borderRadius: '6px', fontWeight: 600 }}>🏠 EMI Amortization</span>
          </div>
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '4px', fontWeight: 600 }}>Interactive</span>
        </div>

        {/* FIRE Goal Target Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Target FIRE Corpus</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>₹2.50 Cr <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>(Standard)</span></div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Monthly SIP + Step-Up</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>₹50,000 <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 600 }}>+10%/yr</span></div>
          </div>
        </div>

        {/* Compounding Curve Chart */}
        <div style={{ position: 'relative', width: '100%', height: '115px' }}>
          <svg viewBox="0 0 330 115" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="15" y1="95" x2="315" y2="95" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1="15" y1="60" x2="315" y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1="15" y1="20" x2="315" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

            {/* Invested Capital Line (Linear) */}
            <path d="M 15 95 L 315 65" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.6" />

            {/* Wealth Compounding Curve (Exponential) */}
            <path d="M 15 95 Q 180 90, 220 52 T 315 18 L 315 95 L 15 95 Z" fill="url(#fireGrad)" />
            <path d="M 15 95 Q 180 90, 220 52 T 315 18" stroke="#34d399" strokeWidth="3" fill="none" />

            {/* Key Milestones Dots */}
            <circle cx="15" cy="95" r="3.5" fill="#94a3b8" />
            <circle cx="170" cy="74" r="4" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="315" cy="18" r="5" fill="#34d399" className="pulse-glow-dot" stroke="#ffffff" strokeWidth="1.5" />

            {/* Labels (Strategically Anchored to avoid any overlapping) */}
            <text x="15" y="110" fill="#94a3b8" fontSize="8" textAnchor="start">Age 30 (Start)</text>
            <text x="170" y="110" fill="#38bdf8" fontSize="8" fontWeight="600" textAnchor="middle">Age 37 (₹85L)</text>
            <text x="315" y="110" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="end">Age 45 (₹2.68 Cr ✨)</text>
          </svg>
        </div>

        {/* FIRE Tiers Progress bar */}
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', paddingTop: '0.2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>✓ Lean: ₹1.5 Cr</span>
          <span style={{ color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>🎯 Standard: ₹2.5 Cr</span>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>Fat: ₹4.0 Cr (67%)</span>
        </div>
      </div>
    )
  },
  {
    id: 'vault',
    icon: <ShieldCheck size={24} />,
    title: 'Encrypted Vault',
    desc: 'Zero-knowledge document repository for PAN cards, Aadhaar files, ITR acknowledgements, health policies, and sale deeds with AES-256 local key encryption.',
    bullets: [
      'Zero-knowledge local AES-256 file vault',
      'Automated OCR document summary indexing',
      'Insurance & tax document tagging',
      'Encrypted local key storage'
    ],
    demo: (
      <div style={{ position: 'relative', padding: '1.25rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', minWidth: '300px', overflow: 'hidden' }}>
        <div className="scan-laser-line" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={16} color="var(--success)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>LOCAL AES-256 VAULT</span>
          </div>
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderRadius: '4px', fontWeight: 600 }}>Zero Knowledge</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.75rem' }}>
            <span>ITR_Acknowledgment_AY26.pdf</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Encrypted</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.75rem' }}>
            <span>Health_Policy_2026.enc</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Encrypted</span>
          </div>
        </div>
        <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--accent-1)' }}>
          OCR Index: Taxable Income ₹18,40,000 • Refund ₹24,500
        </div>
      </div>
    )
  },
  {
    id: 'automation',
    icon: <Zap size={24} />,
    title: 'Automation Rules',
    desc: 'Custom IF-THIS-THEN-THAT rules engine for auto-categorizing bank transaction descriptions, flagging high-value spends, and scheduling bill reminders.',
    bullets: [
      'Rule-based transaction auto-categorization',
      'High-value spend alert threshold flags',
      'Recurring SIP & EMI scheduled obligations',
      'One-click automated execution'
    ],
    demo: (
      <div style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', minWidth: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>AUTOMATION WORKFLOW</span>
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderRadius: '9999px', fontWeight: 600 }}>Active (148 Matched)</span>
        </div>
        <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px stroke rgba(59, 130, 246, 0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-1)', fontWeight: 700 }}>IF Description Contains ("Swiggy" | "Zomato")</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>➔ THEN Categorize: <strong>Food & Dining</strong></div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>➔ AND Attach Tag: <strong>#DailySpent</strong></div>
        </div>
      </div>
    )
  },
  {
    id: 'reports',
    icon: <FileSpreadsheet size={24} />,
    title: '1-Click Reports',
    desc: 'Generate commercial-grade PDF, Excel, and CSV executive financial statements for personal audits, CA tax filings, and bank loan applications.',
    bullets: [
      'Monthly & Annual balance sheet synthesis',
      'Print-ready PDF executive summaries',
      'Structured CSV & Excel data export',
      'Cryptographically verified hash ledger'
    ],
    demo: (
      <div style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', minWidth: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>COMMERCIAL REPORT ENGINE</span>
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderRadius: '4px', fontWeight: 700 }}>100% Ready</span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '4px', fontWeight: 700 }}>PDF REPORT</span>
          <span style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '4px', fontWeight: 700 }}>EXCEL SHEETS</span>
          <span style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderRadius: '4px', fontWeight: 700 }}>CSV BACKUP</span>
        </div>
        <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Executive Statement FY26</span>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>Download PDF ⬇</span>
        </div>
      </div>
    )
  },
  {
    id: 'sankey',
    icon: <Network size={24} />,
    title: 'Sankey Cash Flow',
    desc: 'Visualize your money in motion. Interactive Sankey diagrams map exact money paths from salary & business revenue into expense categories, investments, and net savings.',
    bullets: [
      'Dynamic visual money flow tracing',
      'Identify spending leaks instantly',
      'Customizable node grouping & paths',
      'High-res diagram export'
    ],
    demo: (
      <div style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', minWidth: '320px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>SANKEY MONEY FLOW DIAGRAM</span>
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9', borderRadius: '4px' }}>Live Tracing</span>
        </div>
        <div style={{ position: 'relative', width: '100%', height: '140px' }}>
          <svg viewBox="0 0 340 140" style={{ width: '100%', height: '100%' }}>
            {/* Left Node: Total Inflow */}
            <rect x="10" y="25" width="75" height="90" rx="8" fill="rgba(59, 130, 246, 0.2)" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="47.5" y="62" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">INCOME</text>
            <text x="47.5" y="78" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">₹2,50,000</text>

            {/* Connecting Flow Paths */}
            <path className="sankey-animated-path" d="M 85 40 C 135 40, 150 25, 195 25" stroke="#34d399" strokeWidth="6" fill="none" opacity="0.85" />
            <path className="sankey-animated-path" d="M 85 70 C 135 70, 150 70, 195 70" stroke="#38bdf8" strokeWidth="8" fill="none" opacity="0.85" />
            <path className="sankey-animated-path" d="M 85 100 C 135 100, 150 115, 195 115" stroke="#f43f5e" strokeWidth="5" fill="none" opacity="0.85" />

            {/* Right Nodes */}
            <rect x="195" y="10" width="135" height="30" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1" />
            <text x="262.5" y="29" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">SIPs ₹1,25,000 (50%)</text>

            <rect x="195" y="55" width="135" height="30" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1" />
            <text x="262.5" y="74" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">Savings ₹75,000 (30%)</text>

            <rect x="195" y="100" width="135" height="30" rx="6" fill="rgba(244, 63, 94, 0.15)" stroke="#f43f5e" strokeWidth="1" />
            <text x="262.5" y="119" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">Expenses ₹50,000 (20%)</text>
          </svg>
        </div>
      </div>
    )
  },
  {
    id: 'ai',
    icon: <Sparkles size={24} />,
    title: 'AI Financial Assistant',
    desc: 'Your private AI wealth copilot running 100% locally. Query your spending habits, analyze budget leaks, and receive tailored financial insights.',
    bullets: [
      'Natural language financial query engine',
      'Automated spending anomaly detection',
      'Tailored savings & SIP step-up advice',
      'Zero third-party data leaks'
    ],
    demo: (
      <div style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', minWidth: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} color="var(--accent-1)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-1)' }}>AI WEALTH COPILOT</span>
          </div>
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-1)', borderRadius: '4px' }}>Local Model</span>
        </div>
        <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '10px', fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
          "Your monthly savings rate hit <strong>48%</strong>! Redirecting ₹5,000 into Index SIP reaches your FIRE goal <strong>1.8 years earlier</strong>! 🚀"
        </div>
      </div>
    )
  },
  {
    id: 'settings',
    icon: <Settings size={24} />,
    title: 'Settings',
    desc: 'Complete control over your financial workspace. Configure local storage, manage personal Google Drive sync, customize themes, and export raw backups.',
    bullets: [
      'Personal Google Drive appData sync',
      'Complete JSON database backup & restore',
      'Custom theme & aesthetic switching',
      'Profile & security preference management'
    ],
    demo: (
      <div style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', minWidth: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>SYSTEM & CLOUD SYNC</span>
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderRadius: '9999px', fontWeight: 700 }}>● Connected</span>
        </div>
        <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Google Drive appData Sync</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Synced 2 mins ago • 4.8 MB</div>
          </div>
          <div style={{ width: '36px', height: '20px', background: 'var(--accent-1)', borderRadius: '10px', position: 'relative' }}>
            <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-1)', border: '1px solid var(--accent-1)', borderRadius: '4px', fontWeight: 600 }}>Dark Space ✓</span>
          <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', borderRadius: '4px' }}>OLED Black</span>
          <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', borderRadius: '4px' }}>Backup JSON</span>
        </div>
      </div>
    )
  }
];

export const Landing: React.FC<LandingProps> = ({ onUnlock }) => {
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    setIsSendingFeedback(true);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '',
          subject: 'New Feedback for MyFinanceOS',
          message: feedbackText
        })
      });
      if (response.ok) {
        setFeedbackSent(true);
        setFeedbackText('');
      } else {
        alert('Failed to send feedback. Please try again.');
      }
    } catch (error) {
      alert('An error occurred while sending feedback.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoRes.json();
        authSession.login(tokenResponse.access_token, userInfo);
        const success = await dbService.unlock();
        if (success) {
          onUnlock();
        } else {
          setError('Failed to load database from Google Drive.');
        }
      } catch (err) {
        setError('Error authenticating with Google.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Google Login Failed'),
    scope: 'https://www.googleapis.com/auth/drive.appdata profile email',
  });

  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i, size: Math.random() * 60 + 20, left: Math.random() * 100, top: Math.random() * 100,
    duration: Math.random() * 20 + 15, delay: Math.random() * -20,
  }));

  const scrollToHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('how-it-works');
    if (el) {
      const navHeight = 70;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = Math.max(0, elementPosition - navHeight);

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)',
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Ambient Mouse Tracker Glow */}
      <div style={{
        position: 'fixed', top: mousePos.y, left: mousePos.x, width: '600px', height: '600px',
        background: 'radial-gradient(circle, hsla(186, 100%, 50%, 0.05) 0%, transparent 60%)',
        transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 0, transition: 'opacity 0.3s ease',
      }} />

      {/* Floating Particles */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.left}%`, top: `${p.top}%`, width: `${p.size}px`, height: `${p.size}px`,
            background: 'linear-gradient(135deg, hsla(203, 100%, 50%, 0.1), hsla(186, 100%, 45%, 0.1))',
            borderRadius: '50%', filter: 'blur(20px)',
            animation: `float-particle ${p.duration}s infinite ease-in-out alternate`, animationDelay: `${p.delay}s`
          }} />
        ))}
      </div>

      {/* Animated Background Gradients */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '50%',
        background: 'radial-gradient(circle, hsla(203, 100%, 50%, 0.1) 0%, transparent 60%)',
        filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'pulse 8s infinite alternate'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '50%',
        background: 'radial-gradient(circle, hsla(186, 100%, 45%, 0.08) 0%, transparent 60%)',
        filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'pulse 10s infinite alternate-reverse'
      }} />

      {/* Navigation Bar */}
      <nav className="animate-fade-in responsive-nav" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--accent-grad)', padding: '2px', borderRadius: '50%', display: 'flex' }}>
            <img src="/logo.png" alt="MyFinanceOS Logo" style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid var(--bg-primary)' }} />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            MyFinanceOS
          </h1>
        </div>
        <div className="responsive-flex-wrap" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <a href="#how-it-works" onClick={scrollToHowItWorks} className="nav-link">How It Works</a>
            <a href="/privacy.html" className="nav-link">Privacy</a>
            <a href="/terms.html" className="nav-link">Terms</a>
          </div>
          <button onPointerDown={() => login()} className="btn btn-secondary nav-signin-btn" disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Sign In'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="responsive-hero-main" style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', position: 'relative', zIndex: 1, width: '100%'
      }}>

        <Reveal delay={0.1}>
          <div className="privacy-badge">
            <ShieldCheck size={16} color="var(--accent-1)" />
            <span>Privacy-First Finance System for India 🇮🇳</span>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <h2 className="hero-title">
            All Your Money.<br />
            <span className="hero-title-gradient">
              One Secure Workspace.
            </span>
          </h2>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="hero-description">
            A comprehensive, local-first operating system for your wealth.
            Track income, expenses, taxes, and investments with absolute privacy—syncing directly to your personal Drive. We never see your data.
          </p>
        </Reveal>

        {error && (
          <Reveal delay={0.4}>
            <div style={{ color: 'var(--error)', fontSize: '0.95rem', marginBottom: '2rem', background: 'var(--error-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', maxWidth: '450px', margin: '0 auto 2rem', border: '1px solid var(--error)' }}>
              {error}
            </div>
          </Reveal>
        )}

        <Reveal delay={0.4}>
          <button
            onPointerDown={() => login()}
            className="btn btn-primary shimmer-btn hero-cta-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Connecting to Vault...
              </div>
            ) : (
              <>
                Get Started with Google
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </Reveal>

        {/* Trust Section */}
        <Reveal delay={0.5}>
          <div className="trust-badges-container">
            <div className="trust-badge-item">
              <ShieldCheck size={16} color="#10b981" /> <span>100% Local-First</span>
            </div>
            <div className="trust-badge-item">
              <Lock size={16} color="#38bdf8" /> <span>AES-256 Encryption</span>
            </div>
            <div className="trust-badge-item">
              <Target size={16} color="#818cf8" /> <span>India-Ready Tax & SIP</span>
            </div>
            <div className="trust-badge-item">
              <Building2 size={16} color="#f59e0b" /> <span>Personal + Business</span>
            </div>
          </div>
        </Reveal>

        {/* Feature Grid Highlights */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1100px', width: '100%', marginTop: '6rem', position: 'relative', zIndex: 1
        }}>
          {[
            { icon: <Database size={28} />, title: "Your Private Vault", desc: "Data is stored strictly in your personal Google Drive 'appDataFolder'. We have no access to it." },
            { icon: <Network size={28} />, title: "Full Ledger System", desc: "Track accounts, income, and expenses with a robust double-entry accounting foundation." },
            { icon: <PieChart size={28} />, title: "Investment Planning", desc: "Advanced tools to track stocks, mutual funds, and plot your path to financial independence." }
          ].map((feature, i) => (
            <TiltCard key={i} delay={i * 0.1}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.05)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-1)', border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 700 }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>{feature.desc}</p>
            </TiltCard>
          ))}
        </div>

        {/* Comprehensive How It Works & Core Features Section (Merged from About Page) */}
        <section id="how-it-works" style={{ width: '100%', maxWidth: '1200px', margin: '8rem auto 0', textAlign: 'left', position: 'relative', zIndex: 1 }}>
          <Reveal delay={0.1}>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                How It Works
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '650px', margin: '0 auto', lineHeight: 1.7 }}>
                Dive deep into the core features of MyFinanceOS. See exactly how our powerful, local-first tools work together to give you complete control over your wealth.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            {FEATURE_BLOCKS.map((block, i) => (
              <Reveal key={block.id} delay={0.1}>
                <div className="glass-panel feature-block-card" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '3.5rem',
                  alignItems: 'center',
                  padding: '3rem',
                  borderRadius: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'box-shadow 0.3s ease, border-color 0.3s ease'
                }}
                  onMouseOver={e => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                    e.currentTarget.style.borderColor = 'var(--accent-1)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div className="feature-text-content" style={{ order: i % 2 === 0 ? 1 : 2, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        background: 'var(--bg-secondary)', width: '48px', height: '48px', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-1)',
                        border: '1px solid var(--border-color)', flexShrink: 0
                      }}>
                        {block.icon}
                      </div>
                      <h3 style={{ fontSize: '1.8rem', color: 'var(--accent-1)', margin: 0, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                        {block.title}
                      </h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, margin: 0 }}>
                      {block.desc}
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {block.bullets.map((bullet, idx) => (
                        <li key={idx} style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.98rem' }}>
                          <span style={{ color: 'var(--accent-1)', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="feature-demo-content" style={{ order: i % 2 === 0 ? 2 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="demo-container">
                      {block.demo}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Data Usage Transparency Section */}
        <Reveal style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="glass-panel feature-card landing-section-panel" style={{
            background: 'var(--bg-panel)',
            borderTop: '1px solid var(--border-color)', textAlign: 'left',
            zIndex: 1, position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.3s ease, border-color 0.3s ease'
          }}
            onMouseOver={e => {
              e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
              e.currentTarget.style.borderColor = 'var(--accent-1)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.borderTopColor = 'var(--border-color)';
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'var(--accent-grad)', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
              <Lock size={24} color="var(--accent-1)" style={{ filter: 'drop-shadow(0 0 8px hsla(186, 100%, 50%, 0.5))' }} />
              Privacy & Security Guarantee
            </h3>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong>Zero Server Storage:</strong> Your financial data is never stored on our servers. You retain 100% ownership and control over your information at all times.</li>
              <li><strong>Google Drive Sync:</strong> We request the restricted <code>drive.appdata</code> scope solely to create and sync a hidden <code>financeos_db.json</code> file directly inside your personal Google Drive.</li>
              <li><strong>Isolated Access:</strong> Our application can only access its own specific configuration file. We physically cannot see, read, or modify any of your other personal Google Drive files.</li>
            </ul>
          </div>
        </Reveal>

        {/* FAQ Section */}
        <Reveal style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div className="faq-section-container">
            <h2 className="faq-title">Frequently Asked Questions</h2>
            <div className="glass-panel faq-card-panel">
              <FaqItem
                question="Is MyFinanceOS free to use?"
                answer="Yes! Because we don't host your data on our servers, our infrastructure costs are extremely low, allowing us to provide this tool to you completely free of charge."
              />
              <FaqItem
                question="What happens if I lose access to my Google account?"
                answer="Since your data is stored exclusively in your Google Drive, your financial data is tied to your Google Account. We recommend ensuring you have proper recovery methods set up on your Google Account."
              />
              <FaqItem
                question="Can I export my data?"
                answer="Absolutely. You own your data. We provide built-in tools to easily export your entire financial history to standard formats like CSV and JSON."
              />
            </div>
          </div>
        </Reveal>

        {/* Help & Feedback Section */}
        <Reveal style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div className="glass-panel feedback-section-panel">
            <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontWeight: 700 }}>
              <MessageSquare size={22} color="var(--accent-1)" />
              Help & Feedback
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Have a question or a feature request? Let us know!
            </p>

            {feedbackSent ? (
              <div className="animate-fade-in" style={{ padding: '1rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)', display: 'inline-block' }}>
                Thanks! Your feedback has been securely submitted.
              </div>
            ) : (
              <div className="feedback-form-container">
                <textarea
                  className="form-input"
                  placeholder="How can we help you improve MyFinanceOS?"
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  style={{ resize: 'vertical', width: '100%', borderRadius: '1rem' }}
                  disabled={isSendingFeedback}
                />
                <button
                  className="btn btn-secondary feedback-submit-btn"
                  onPointerDown={handleFeedbackSubmit}
                  disabled={isSendingFeedback || !feedbackText.trim()}
                >
                  {isSendingFeedback ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            )}
          </div>
        </Reveal>

      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-links-container">
          <a href="#how-it-works" onClick={scrollToHowItWorks} className="footer-link">How It Works</a>
          <span className="footer-dot">•</span>
          <button onPointerDown={() => setActiveLegalModal('privacy')} className="footer-btn">Privacy Policy</button>
          <span className="footer-dot">•</span>
          <button onPointerDown={() => setActiveLegalModal('terms')} className="footer-btn">Terms of Service</button>
        </div>
        <div className="footer-copyright">
          © {new Date().getFullYear()} MyFinanceOS. All rights reserved.
        </div>
      </footer>

      {/* Interactive Smooth Glassmorphism Legal Modal */}
      {activeLegalModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(7, 9, 14, 0.85)',
          backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', animation: 'fadeInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(15, 23, 42, 0.95)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)', overflow: 'hidden'
          }}>
            {/* Modal Top Bar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.3rem', borderRadius: '12px' }}>
                <button
                  onPointerDown={() => setActiveLegalModal('privacy')}
                  style={{
                    padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, border: 'none',
                    borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                    background: activeLegalModal === 'privacy' ? 'var(--accent-grad)' : 'transparent',
                    color: activeLegalModal === 'privacy' ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  🛡️ Privacy Policy
                </button>
                <button
                  onPointerDown={() => setActiveLegalModal('terms')}
                  style={{
                    padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, border: 'none',
                    borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                    background: activeLegalModal === 'terms' ? 'var(--accent-grad)' : 'transparent',
                    color: activeLegalModal === 'terms' ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  📜 Terms of Service
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <a
                  href={activeLegalModal === 'privacy' ? '/privacy.html' : '/terms.html'}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.8rem', color: 'var(--accent-1)', textDecoration: 'none', fontWeight: 600 }}
                >
                  Open Page ↗
                </a>
                <button
                  onPointerDown={() => setActiveLegalModal(null)}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff',
                    borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer',
                    fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body Scroll Area */}
            <div style={{ padding: '2rem 2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {activeLegalModal === 'privacy' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      🛡️
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Privacy Policy & Security Guarantee</h2>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Last Updated: July 2026 • Local-First Architecture Guarantee</p>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '0.88rem', lineHeight: 1.6, color: '#e2e8f0' }}>
                    🔒 <strong>Zero Server Storage Promise:</strong> MyFinanceOS does not run central servers that collect, store, inspect, or sell your account balances, salary details, portfolios, or tax records.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-1)' }}>1. Local-First Computing Model</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      All mathematical models, Net Worth aggregates, XIRR returns, tax slab comparisons, and Sankey money flow graphics execute locally on your machine. Your data remains strictly on your device.
                    </p>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-1)' }}>2. Personal Google Drive Sync (`appDataFolder`)</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      When cloud sync is active, MyFinanceOS reads and writes a single file (<code>financeos_db.json</code>) inside your personal Google Drive application data folder. Our software physically cannot view, read, or alter any of your other Google Drive files.
                    </p>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-1)' }}>3. AES-256 On-Device Vault Encryption</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      Database payloads can be locked with a custom passcode using AES-256 GCM encryption. Your secret key is never sent across any network.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      📜
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Terms of Service</h2>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Last Updated: July 2026 • User Data Sovereignty License</p>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '0.88rem', lineHeight: 1.6, color: '#e2e8f0' }}>
                    👑 <strong>User Sovereignty:</strong> You own 100% of your data. MyFinanceOS is a client-side computation tool designed to help you organize and plan your financial life.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-2)' }}>1. Financial & Tax Advice Disclaimer</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      MyFinanceOS is a computational software tool, NOT a certified Chartered Accountant (CA) or SEBI-registered advisor. Calculations regarding Old vs New Tax Regimes, GST billing, and FIRE milestones are for modeling purposes.
                    </p>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-2)' }}>2. User Backup Responsibilities</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      Because we do not store your data on remote servers, we cannot restore lost passcodes or deleted files if you clear your browser storage or delete your Google Drive backup. Use built-in 1-click JSON exports for offline safety.
                    </p>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-2)' }}>3. Software License & Warranty</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      The software is provided "AS IS" without warranties of any kind. Developers shall not be liable for direct or indirect damages resulting from software use or tax calculation variances.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1) translate(0, 0); opacity: 0.8; }
          100% { transform: scale(1.1) translate(20px, 20px); opacity: 1; }
        }
        @keyframes pulse-badge { 
          0% { box-shadow: 0 0 10px hsla(186, 100%, 50%, 0.15); border-color: hsla(186, 100%, 50%, 0.3); } 
          100% { box-shadow: 0 0 30px hsla(186, 100%, 50%, 0.5); border-color: hsla(186, 100%, 50%, 0.8); } 
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.2; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-100px) translateX(50px) rotate(180deg); opacity: 0.2; }
        }
        .shimmer-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
          transform: skewX(-20deg); animation: shimmer 4s infinite;
        }
        @keyframes shimmer {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }

        /* Landing Page Enhanced Layout & Typography */
        .responsive-hero-main {
          padding: 4.5rem 2rem 3.5rem;
        }
        .privacy-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(59, 130, 246, 0.08);
          padding: 0.5rem 1.25rem;
          border-radius: 3rem;
          border: 1px solid rgba(59, 130, 246, 0.25);
          margin-bottom: 1.75rem;
          font-size: 0.85rem;
          color: var(--accent-1);
          font-weight: 600;
          white-space: nowrap;
          max-width: 100%;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
          backdrop-filter: blur(8px);
        }
        .hero-title {
          font-size: clamp(2.2rem, 6vw, 4.75rem);
          font-weight: 800;
          line-height: 1.12;
          margin-bottom: 1.5rem;
          font-family: var(--font-display);
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .hero-title-gradient {
          background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 40%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-description {
          font-size: clamp(0.95rem, 3.2vw, 1.2rem);
          color: rgba(226, 232, 240, 0.82);
          max-width: 660px;
          margin: 0 auto 2.5rem;
          line-height: 1.6;
        }
        .hero-cta-btn {
          padding: 1rem 2.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 3rem;
          gap: 0.75rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 10px 30px -5px rgba(16, 185, 129, 0.4), 0 0 20px rgba(56, 189, 248, 0.2);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .hero-cta-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 14px 35px -5px rgba(16, 185, 129, 0.5), 0 0 25px rgba(56, 189, 248, 0.3);
        }
        .trust-badges-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1.25rem;
          margin-top: 2.75rem;
          color: rgba(226, 232, 240, 0.75);
          font-size: 0.875rem;
          font-weight: 500;
        }
        .trust-badge-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          padding: 0.45rem 1rem;
          border-radius: 2rem;
          backdrop-filter: blur(6px);
          transition: all 0.2s ease;
        }
        .trust-badge-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }

        /* Responsive Overrides */
        .responsive-nav {
          padding: 1.25rem 2.5rem;
        }
        .nav-links-desktop {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: var(--text-primary);
        }
        .nav-signin-btn {
          padding: 0.5rem 1.5rem;
          font-size: 0.875rem;
          border-radius: 2rem;
        }
        @media (max-width: 768px) {
          .responsive-nav {
            padding: 0.75rem 1.25rem;
            flex-direction: row !important;
            justify-content: space-between !important;
            gap: 0 !important;
          }
          .nav-links-desktop {
            display: none !important;
          }
          .responsive-flex-wrap {
            gap: 0.5rem !important;
          }
          .nav-signin-btn {
            padding: 0.4rem 1.1rem;
            font-size: 0.8rem;
          }
          .responsive-hero-main {
            padding: 2.25rem 1.25rem 2rem;
          }
          .hero-title {
            margin-bottom: 1rem;
          }
          .hero-description {
            margin-bottom: 1.75rem;
            padding: 0 0.5rem;
          }
          .feature-text-content {
            order: 1 !important;
          }
          .feature-demo-content {
            order: 2 !important;
          }
        }
        /* Section Panels & Containers */
        .landing-section-panel {
          margin-top: 5rem;
          max-width: 800px;
          width: 100%;
          padding: 2.25rem 2.5rem;
          border-radius: 1.5rem;
        }
        .faq-section-container {
          max-width: 800px;
          width: 100%;
          margin-top: 5rem;
          text-align: left;
          z-index: 1;
          position: relative;
        }
        .faq-title {
          font-size: clamp(1.4rem, 4vw, 2.25rem);
          font-weight: 800;
          margin-bottom: 2rem;
          text-align: center;
          font-family: var(--font-display);
        }
        .faq-card-panel {
          padding: 0.5rem 2rem;
          border-radius: 1.5rem;
        }
        .feedback-section-panel {
          margin-top: 5rem;
          max-width: 800px;
          width: 100%;
          padding: 2.25rem 2.5rem;
          background: linear-gradient(180deg, hsla(224, 20%, 14%, 0.5) 0%, hsla(224, 20%, 10%, 0.8) 100%);
          text-align: center;
          z-index: 1;
          position: relative;
          border-radius: 1.5rem;
        }
        .feedback-form-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 520px;
          margin: 0 auto;
          text-align: left;
        }
        .feedback-submit-btn {
          align-self: flex-end;
          padding: 0.6rem 1.75rem;
          border-radius: 2rem;
        }

        /* Footer Responsive Styles */
        .landing-footer {
          padding: 2.5rem 1.5rem 2rem;
          text-align: center;
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-muted);
          font-size: 0.875rem;
          position: relative;
          z-index: 10;
          margin-top: 5rem;
        }
        .footer-links-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }
        .footer-link, .footer-btn {
          color: var(--text-muted);
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .footer-link:hover, .footer-btn:hover {
          color: var(--text-primary);
        }
        .footer-dot {
          color: rgba(255, 255, 255, 0.2);
          font-size: 0.75rem;
        }
        .footer-copyright {
          color: rgba(226, 232, 240, 0.5);
          font-size: 0.8rem;
        }

        @media (max-width: 768px) {
          .landing-section-panel, .feedback-section-panel {
            margin-top: 3rem;
            padding: 1.5rem 1.25rem;
            border-radius: 1rem;
          }
          .faq-section-container {
            margin-top: 3rem;
          }
          .faq-title {
            margin-bottom: 1.25rem;
          }
          .faq-card-panel {
            padding: 0 1.25rem;
            border-radius: 1rem;
          }
          .feedback-submit-btn {
            width: 100%;
            align-self: stretch;
            padding: 0.75rem;
          }
        }
        @media (max-width: 640px) {
          .landing-footer {
            padding: 1.75rem 1rem 1.5rem;
            margin-top: 3rem;
          }
          .footer-links-container {
            gap: 0.75rem 1.25rem;
          }
          .footer-dot {
            display: none;
          }
          .footer-link, .footer-btn {
            font-size: 0.825rem;
          }
        }
        @media (max-width: 480px) {
          .privacy-badge {
            padding: 0.4rem 0.85rem;
            font-size: 0.75rem;
            margin-bottom: 1.25rem;
          }
          .hero-cta-btn {
            padding: 0.85rem 1.85rem;
            font-size: 1rem;
            width: 100%;
            max-width: 320px;
            justify-content: center;
          }
        }

        /* Feature Block Demos CSS */
        .demo-container {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          border-radius: 1rem;
          width: 100%;
          max-width: 450px;
          height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
          overflow: hidden;
        }

        /* Dashboard Animation */
        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 15px;
          height: 150px;
        }
        .bar {
          width: 36px;
          background: linear-gradient(0deg, var(--accent-1) 0%, #00ffcc 100%);
          border-radius: 4px 4px 0 0;
          animation: grow-bar 3s ease-in-out infinite alternate;
        }
        .bar:nth-child(1) { height: 20%; animation-delay: 0s; }
        .bar:nth-child(2) { height: 50%; animation-delay: 0.2s; }
        .bar:nth-child(3) { height: 80%; animation-delay: 0.4s; }
        .bar:nth-child(4) { height: 40%; animation-delay: 0.6s; }
        .bar:nth-child(5) { height: 100%; animation-delay: 0.8s; }

        @keyframes grow-bar {
          0% { transform: scaleY(0.2); transform-origin: bottom; opacity: 0.5; }
          100% { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
        }

        /* Ledger Animation */
        .ledger-list {
          width: 85%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ledger-row {
          background: rgba(255,255,255,0.05);
          padding: 14px 18px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          animation: slide-in 4s infinite;
          opacity: 0;
          transform: translateX(50px);
          font-size: 0.95rem;
        }
        .ledger-row:nth-child(1) { animation-delay: 0s; }
        .ledger-row:nth-child(2) { animation-delay: 1.5s; }
        .ledger-row:nth-child(3) { animation-delay: 3s; }
        .amount-pos { color: #00ffcc; font-weight: bold; }
        .amount-neg { color: #ff4a4a; font-weight: bold; }

        @keyframes slide-in {
          0% { opacity: 0; transform: translateX(50px); }
          20%, 80% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(-50px); }
        }

        /* Investments Animation: Diversification Matrix */
        .matrix-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          width: 240px;
        }
        .matrix-cell {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px 5px;
          text-align: center;
          font-size: 0.7rem;
          color: var(--text-secondary);
          position: relative;
          overflow: hidden;
          animation: matrix-pulse 6s infinite alternate;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .matrix-cell span {
          font-size: 1rem;
          font-weight: 700;
        }
        .matrix-cell.cell-1 { border-color: var(--accent-1); color: var(--accent-1); animation-delay: 0s; }
        .matrix-cell.cell-2 { border-color: #00ffcc; color: #00ffcc; animation-delay: 0.5s; }
        .matrix-cell.cell-3 { border-color: #a855f7; color: #a855f7; animation-delay: 1s; }
        .matrix-cell.cell-4 { border-color: #fbbf24; color: #fbbf24; animation-delay: 1.5s; }
        .matrix-cell.cell-5 { border-color: #f43f5e; color: #f43f5e; animation-delay: 2s; }
        .matrix-cell.cell-6 { border-color: #3b82f6; color: #3b82f6; animation-delay: 2.5s; }

        @keyframes matrix-pulse {
          0%, 40% { transform: scale(1); box-shadow: 0 0 0 transparent; opacity: 0.6; }
          50% { transform: scale(1.08); box-shadow: inset 0 0 15px currentColor; opacity: 1; text-shadow: 0 0 8px currentColor; }
          60%, 100% { transform: scale(1); box-shadow: 0 0 0 transparent; opacity: 0.6; }
        }

        /* Tax Engine Animation */
        .tax-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
          padding: 2rem;
          border-radius: 1rem;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.2);
          animation: float 4s ease-in-out infinite;
        }
        .tax-number {
          font-size: 2.5rem;
          font-weight: bold;
          color: var(--accent-1);
          margin: 1rem 0;
        }
        .tax-number::after {
          content: '₹0';
          animation: count-up 3s ease-out infinite;
        }

        @keyframes count-up {
          0% { content: '₹12,450'; opacity: 0.5; }
          50% { content: '₹9,200'; }
          100% { content: '₹4,100'; color: #00ffcc; text-shadow: 0 0 10px #00ffcc; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        /* Business Slabs Animation */
        .slab-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
          perspective: 1000px;
          align-items: center;
        }
        .slab-layer {
          padding: 12px;
          background: linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 500;
          text-align: center;
          transform: rotateX(25deg);
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          animation: float-slab 4s ease-in-out infinite alternate;
          backdrop-filter: blur(4px);
        }
        .slab-layer.tier-1 { border: 1px solid rgba(255,255,255,0.2); animation-delay: 0s; width: 140px; }
        .slab-layer.tier-2 { border: 1px solid var(--accent-1); animation-delay: 0.3s; width: 170px; }
        .slab-layer.tier-3 { border: 1px solid #00ffcc; animation-delay: 0.6s; width: 200px; }

        @keyframes float-slab {
          0% { transform: rotateX(25deg) translateY(0) scale(1); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
          100% { transform: rotateX(10deg) translateY(-15px) scale(1.05); box-shadow: 0 20px 35px rgba(0,255,204,0.2); border-color: #00ffcc; color: #00ffcc; }
        }

        /* Sankey Animation */
        .sankey-svg {
          width: 100%;
          height: 100%;
        }
        .sankey-line {
          fill: none;
          stroke: var(--accent-1);
          stroke-width: 4;
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: flow 3s linear infinite;
          opacity: 0.6;
        }
        .sankey-line:nth-child(2) { stroke: #00ffcc; animation-delay: -1s; }
        .sankey-line:nth-child(3) { stroke: #ff4a4a; animation-delay: -2s; }

        @keyframes flow {
          to { stroke-dashoffset: 0; opacity: 1; }
        }

        /* Investment Animation */
        .invest-graph {
          width: 90%;
          height: 70%;
        }
        .invest-axis {
          fill: none;
          stroke: var(--border-color);
          stroke-width: 2;
        }
        .invest-curve {
          fill: none;
          stroke: var(--accent-1);
          stroke-width: 4;
          stroke-linecap: round;
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: draw-curve 4s ease-in-out infinite;
          filter: drop-shadow(0 0 8px rgba(0,255,204,0.5));
        }
        @keyframes draw-curve {
          0% { stroke-dashoffset: 400; }
          50%, 100% { stroke-dashoffset: 0; }
        }

        /* AI Animation */
        .chat-bubble {
          background: var(--bg-primary);
          border: 1px solid var(--accent-1);
          padding: 1rem 1.5rem;
          border-radius: 1.5rem 1.5rem 1.5rem 0;
          box-shadow: 0 10px 20px rgba(0,255,204,0.1);
          animation: pop-in 2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate;
        }
        @keyframes pop-in {
          0% { transform: scale(0.8) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        /* Settings Animation */
        .gears-container {
          position: relative;
          width: 130px;
          height: 130px;
        }
        .gear {
          border-radius: 50%;
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gear-large {
          width: 70px;
          height: 70px;
          border: 12px dashed var(--accent-1);
          top: 10px;
          left: 10px;
          animation: spin-gear 8s linear infinite;
        }
        .gear-small {
          width: 45px;
          height: 45px;
          border: 8px dashed var(--text-secondary);
          bottom: 15px;
          right: 15px;
          animation: spin-gear-reverse 6s linear infinite;
        }
        .gear::after {
          content: '';
          position: absolute;
          background: var(--bg-secondary);
          border: 4px solid var(--accent-1);
          border-radius: 50%;
        }
        .gear-large::after { width: 28px; height: 28px; }
        .gear-small::after { width: 18px; height: 18px; border-color: var(--text-secondary); }

        @keyframes spin-gear {
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-gear-reverse {
          100% { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
};
