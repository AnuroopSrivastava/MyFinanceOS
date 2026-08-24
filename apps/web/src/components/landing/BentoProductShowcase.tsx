import React, { useState } from 'react';
import {
  Landmark,
  Percent,
  Briefcase,
  Target,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers,
  Sparkles,
  Sliders,
  DollarSign
} from 'lucide-react';

export const BentoProductShowcase: React.FC = () => {
  // Card 2 interactive tax comparator state
  const [incomeLakhs, setIncomeLakhs] = useState<number>(24);
  const oldRegimeTax = Math.round(incomeLakhs * 100000 * 0.175);
  const newRegimeTax = Math.round(incomeLakhs * 100000 * 0.145);
  const taxSavings = Math.max(0, oldRegimeTax - newRegimeTax);

  // Card 3 interactive entity toggle
  const [activeEntity, setActiveEntity] = useState<'pvt' | 'consulting'>('pvt');

  return (
    <div className="l-section" id="features-deepdive" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div className="l-badge-pill">
          <Layers size={14} color="#c4b5fd" />
          <span>End-to-End Financial Intelligence</span>
        </div>
        <h2 className="l-section-title">Autonomous Financial Solutions for Personal Wealth & Business</h2>
        <p className="l-section-subtitle" style={{ margin: '0 auto' }}>
          Consolidate your entire financial universe from day-to-day cash flow to corporate multi-entity taxes and 30-year FIRE compounding.
        </p>
      </div>

      {/* Stacked Showcase Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* CARD 1: Double-Entry Banking & Portfolio */}
        <div
          className="l-glass-card"
          style={{
            padding: 'clamp(1.5rem, 3.5vw, 3rem)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center'
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.3rem 0.75rem',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                color: '#c7d2fe',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '1rem'
              }}
            >
              <Landmark size={14} />
              <span>BANKING & PORTFOLIO</span>
            </div>
            <h3 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, color: '#ffffff', marginBottom: '0.85rem' }}>
              Precision Banking, Ledger & Multi-Asset Intelligence
            </h3>
            <p style={{ fontSize: '0.98rem', lineHeight: 1.6, color: 'var(--l-text-secondary)', marginBottom: '1.5rem' }}>
              A robust double-entry system with zero data loss. Track savings, credit cards, demat accounts, and investments across 12 asset classes with real-time XIRR and dividend yields.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#e2e8f0' }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span>Multi-account reconciliation (HDFC, ICICI, SBI, Axis)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#e2e8f0' }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span>Equities, Mutual Funds, Gold SGB, NPS & EPF valuation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#e2e8f0' }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span>1-Click CSV & Excel statement ingestion</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Mini-App 1 */}
          <div
            style={{
              background: 'rgba(11, 11, 18, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '1.5rem',
              boxShadow: '0 15px 35px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--l-text-muted)', textTransform: 'uppercase' }}>
                  Total Net Worth
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff' }} className="l-num">
                  ₹48,50,200
                </div>
              </div>
              <span
                style={{
                  padding: '0.3rem 0.75rem',
                  background: 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '9999px',
                  color: '#34d399',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                +14.2% YoY
              </span>
            </div>

            {/* Sparkline Bar Graph */}
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', gap: '6px', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              {[35, 48, 55, 72, 60, 85, 100].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    background: i === 6 ? '#a855f7' : i === 5 ? '#6366f1' : 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '4px'
                  }}
                />
              ))}
            </div>

            {/* Live Feed Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>TechCorp Salary</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--l-text-muted)' }}>HDFC Bank • Income</div>
                </div>
                <div style={{ fontWeight: 800, color: '#34d399' }} className="l-num">+ ₹1,85,000</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>HDFC Home Loan EMI</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--l-text-muted)' }}>Auto-Debit • Expense</div>
                </div>
                <div style={{ fontWeight: 800, color: '#f43f5e' }} className="l-num">- ₹48,500</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>Zerodha Nifty SIP</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--l-text-muted)' }}>Investments • Index Fund</div>
                </div>
                <div style={{ fontWeight: 800, color: '#c4b5fd' }} className="l-num">- ₹25,000</div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Automated Tax Optimization Suite */}
        <div
          className="l-glass-card"
          style={{
            padding: 'clamp(1.5rem, 3.5vw, 3rem)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center'
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.3rem 0.75rem',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                color: '#67e8f9',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '1rem'
              }}
            >
              <Percent size={14} />
              <span>TAX & GST SUITE</span>
            </div>
            <h3 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, color: '#ffffff', marginBottom: '0.85rem' }}>
              Real-Time FY26 Tax Optimization & Capital Gains
            </h3>
            <p style={{ fontSize: '0.98rem', lineHeight: 1.6, color: 'var(--l-text-secondary)', marginBottom: '1.5rem' }}>
              Automatically calculates optimal tax liability by comparing Old vs New tax regimes under updated slabs. Model 80C/80D headroom, STCG/LTCG capital gains, and TDS Form 26AS.
            </p>

            {/* Interactive Slider */}
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--l-text-secondary)', fontWeight: 600 }}>Gross Annual Income:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#67e8f9' }} className="l-num">₹{incomeLakhs} Lakhs</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="2"
                value={incomeLakhs}
                onChange={(e) => setIncomeLakhs(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Interactive Live Mini-App 2: Comparison Nodes */}
          <div
            style={{
              background: 'rgba(11, 11, 18, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '1.5rem',
              boxShadow: '0 15px 35px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c4b5fd', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              FY26 REGIME COMPARISON SIMULATION
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {/* New Regime (Optimal) */}
              <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid #10b981', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>NEW REGIME (OPTIMAL)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '0.3rem 0' }} className="l-num">
                  ₹{newRegimeTax.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#a7f3d0' }}>Lower Baseline Slabs</div>
              </div>

              {/* Old Regime */}
              <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--l-text-muted)', fontWeight: 700 }}>OLD REGIME</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f43f5e', margin: '0.3rem 0' }} className="l-num">
                  ₹{oldRegimeTax.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--l-text-muted)' }}>Includes 80C & 80D</div>
              </div>
            </div>

            {/* Savings Banner */}
            <div
              style={{
                padding: '0.75rem',
                background: 'rgba(16, 185, 129, 0.18)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '10px',
                color: '#34d399',
                fontSize: '0.85rem',
                fontWeight: 700,
                textAlign: 'center'
              }}
            >
              ✓ New Regime Saves You ₹{taxSavings.toLocaleString('en-IN')} Annually
            </div>
          </div>
        </div>

        {/* CARD 3: Business Suite & Multi-Entity OS */}
        <div
          className="l-glass-card"
          style={{
            padding: 'clamp(1.5rem, 3.5vw, 3rem)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center'
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.3rem 0.75rem',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                color: '#fde68a',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '1rem'
              }}
            >
              <Briefcase size={14} />
              <span>COMMERCIAL SUITE</span>
            </div>
            <h3 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, color: '#ffffff', marginBottom: '0.85rem' }}>
              Multi-Entity Enterprise Ledgers & GST Invoicing
            </h3>
            <p style={{ fontSize: '0.98rem', lineHeight: 1.6, color: 'var(--l-text-secondary)', marginBottom: '1.5rem' }}>
              Operate multiple businesses with independent corporate tax tier slabs, commercial GST billing, inventory registers, and real-time Profit & Loss balance sheets.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveEntity('pvt')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: activeEntity === 'pvt' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: activeEntity === 'pvt' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeEntity === 'pvt' ? '#ffffff' : 'var(--l-text-muted)',
                  cursor: 'pointer'
                }}
              >
                Apex Innovations Pvt Ltd
              </button>
              <button
                type="button"
                onClick={() => setActiveEntity('consulting')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: activeEntity === 'consulting' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: activeEntity === 'consulting' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeEntity === 'consulting' ? '#ffffff' : 'var(--l-text-muted)',
                  cursor: 'pointer'
                }}
              >
                Srivastava Design Studio (Prop.)
              </button>
            </div>
          </div>

          {/* Interactive Live Mini-App 3: macOS Dark Window Mockup */}
          <div
            style={{
              background: 'rgba(11, 11, 18, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 45px rgba(0,0,0,0.8)'
            }}
          >
            {/* macOS Window Title Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.65rem 1rem', background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--l-text-muted)', marginLeft: 'auto', fontWeight: 600 }}>
                {activeEntity === 'pvt' ? 'Entity: Apex Innovations (GSTIN: 27AABCA1234F1Z5)' : 'Entity: Srivastava Design (GSTIN: 27XYZAB5678Q1Z2)'}
              </div>
            </div>

            {/* Window Content */}
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>Commercial Corporate Slabs</span>
                <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9', borderRadius: '4px', fontWeight: 600 }}>
                  GST Compliant
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0.75rem', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <span>Tier 1 (Up to ₹5 Lakhs)</span>
                  <strong style={{ color: '#34d399' }}>0% Exemption</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0.75rem', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <span>Tier 2 (₹5L - ₹10L)</span>
                  <strong style={{ color: '#c7d2fe' }}>10% Corporate Slab</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0.75rem', background: 'rgba(244, 63, 94, 0.12)', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <span>Tier 3 (Above ₹10L)</span>
                  <strong style={{ color: '#fda4af' }}>20% Tier Slab</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: FIRE Lab & Compounding Automation */}
        <div
          className="l-glass-card"
          style={{
            padding: 'clamp(1.5rem, 3.5vw, 3rem)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center'
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.3rem 0.75rem',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                color: '#e9d5ff',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '1rem'
              }}
            >
              <Target size={14} />
              <span>FIRE LAB & AUTOMATION</span>
            </div>
            <h3 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, color: '#ffffff', marginBottom: '0.85rem' }}>
              FIRE Compounding Simulations & Autonomous Triggers
            </h3>
            <p style={{ fontSize: '0.98rem', lineHeight: 1.6, color: 'var(--l-text-secondary)', marginBottom: '1.5rem' }}>
              Simulate Lean, Standard, and Fat FIRE milestones with SIP step-up compounding. Combine financial goals with event-driven automation rules.
            </p>
          </div>

          {/* Interactive Live Mini-App 4: Node Workflow */}
          <div
            style={{
              background: 'rgba(11, 11, 18, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '1.5rem',
              boxShadow: '0 15px 35px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c4b5fd' }}>AUTOMATION WORKFLOW NODE</span>
              <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '4px', fontWeight: 700 }}>
                ● Active
              </span>
            </div>

            {/* Workflow Nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
              <div style={{ padding: '0.8rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.68rem', color: '#c4b5fd', fontWeight: 700 }}>TRIGGER EVENT</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Salary Inflow &gt; ₹1,50,000</div>
              </div>

              <div style={{ textAlign: 'center', color: '#a855f7', fontSize: '0.9rem', lineHeight: 1 }}>↓</div>

              <div style={{ padding: '0.8rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700 }}>AUTONOMOUS ACTION</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Allocate 30% to Index SIP + 10% Gold SGB</div>
              </div>
            </div>

            {/* FIRE Milestone Preview */}
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--l-text-muted)' }}>Target FIRE Corpus</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#34d399' }} className="l-num">₹2.50 Cr</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--l-text-muted)' }}>Target Year</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#c4b5fd' }} className="l-num">2038</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
