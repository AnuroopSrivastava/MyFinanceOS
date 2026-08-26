import React, { useState } from 'react';
import {
  Wallet,
  FileCheck2,
  TrendingUp,
  Store,
  RefreshCw,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { LandingSectionHeader } from './primitives/index.js';
import {
  TaxGstShowcaseStage,
  LedgerCashflowShowcaseStage,
  InvestmentsWealthShowcaseStage,
  MerchantCommerceShowcaseStage,
  AutomationRulesShowcaseStage
} from './showcase/index.js';

export interface FeatureModule {
  id: string;
  badge: string;
  badgeTag: string;
  title: string;
  headline: string;
  description: string;
  keyPoints: string[];
  icon: React.ReactNode;
}

export const SHOWCASE_MODULES: FeatureModule[] = [
  {
    id: 'tax_gst',
    badge: 'Tax & GST Suite',
    badgeTag: 'FY 2024-26 Ready',
    title: 'Income Tax & GST Optimizer',
    headline: 'Old vs New Tax Regime Comparator & Real-Time Savings',
    description:
      'Seamlessly calculate Section 80C, 80D, home loan interest, and standard exemptions. Compare Old vs New Tax Regimes side-by-side with capital gains (LTCG/STCG) and Section 87A rebate calculations.',
    keyPoints: [
      'Dual-Regime Instant Visual Comparator',
      'GSTR-1 & GSTR-3B GST Invoicing Support',
      'Section 87A, 80C, 80D & NPS Headroom Planners',
      '1-Click Tax Filing Summary CSV/JSON Export'
    ],
    icon: <FileCheck2 size={18} />
  },
  {
    id: 'ledger_cashflow',
    badge: 'All Accounts Ledger',
    badgeTag: 'Double-Entry',
    title: 'Universal Cash Flow & UPI Accounts',
    headline: 'Instant Multi-Account Ledger for Banks, UPI & Cards',
    description:
      'Bring your HDFC, SBI, ICICI accounts, UPI transfers, credit card payments, cash reserves, and crypto assets into one unified, easy-to-read financial ledger.',
    keyPoints: [
      'Instant UPI 2.0, IMPS & NEFT Categorization',
      'Double-Entry Debit & Credit Precision',
      'Multi-Currency Support (INR ₹, USD $, EUR €, Crypto)',
      'Fast, Encrypted Storage with Supabase Cloud Sync'
    ],
    icon: <Wallet size={18} />
  },
  {
    id: 'investments_assets',
    badge: 'Investments & Wealth',
    badgeTag: 'XIRR & Real Returns',
    title: 'Investments & Net Worth Tracker',
    headline: 'Stocks, Mutual Funds, Gold, PPF & Real Returns',
    description:
      'Track your entire net worth in real-time. Calculate true annualized returns (XIRR), check your 6-month emergency fund runway, and see exactly where your savings go.',
    keyPoints: [
      'Live MF & Direct Equity XIRR Benchmarking',
      'Sovereign Gold Bonds, FD & EPF/PPF Trackers',
      'Emergency Fund 6-Month Liquid Runway Meter',
      'Visual Flow from Salary to Investments'
    ],
    icon: <TrendingUp size={18} />
  },
  {
    id: 'business_commerce',
    badge: 'Invoicing & POS',
    badgeTag: 'Invoicing & POS',
    title: 'Small Business & Freelancer Invoicing',
    headline: 'Product Catalog, GST Invoices & Instant Billing',
    description:
      'Manage inventory, issue professional GST-compliant tax invoices, create instant UPI QR codes for payments, and track gross profit margins.',
    keyPoints: [
      'Product Showcase with Instant GST Calculation',
      'Custom Company Logo & Invoice Branding',
      'Live QR & UPI Payment Settlement',
      'Automated Order Receipts with CGST / SGST / IGST'
    ],
    icon: <Store size={18} />
  },
  {
    id: 'automation_subscriptions',
    badge: 'Smart Rules & SIPs',
    badgeTag: '100% Automated',
    title: 'Recurring Revenue & Rule Engine',
    headline: 'Automated EMI Schedules, SIP Trajectories & Bills',
    description:
      'Set up smart rules to automatically organize recurring UPI subscriptions, loan EMI prepayments, and monthly salary split-allocations effortlessly.',
    keyPoints: [
      'Visual Subscription & Recurring Expense Tracker',
      'Upcoming Auto-Debit & Bill Alerts',
      'Loan Prepayment Interest Savings Calculator',
      'Custom Automatic Tagging Rules'
    ],
    icon: <RefreshCw size={18} />
  }
];

export const BentoProductShowcase: React.FC = () => {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState<'salaried' | 'freelance' | 'founder'>('salaried');
  const activeModule = SHOWCASE_MODULES[activeModuleIndex];

  const handleSelectPersona = (persona: 'salaried' | 'freelance' | 'founder') => {
    setSelectedPersona(persona);
    if (persona === 'salaried') setActiveModuleIndex(0); // Tax & GST
    else if (persona === 'freelance') setActiveModuleIndex(3); // Business & Storefront
    else if (persona === 'founder') setActiveModuleIndex(2); // Investments & Wealth
  };

  return (
    <div className="l-section" style={{ paddingTop: '3.5rem', paddingBottom: '6rem' }}>
      {/* Section Header */}
      <LandingSectionHeader
        title="End-to-end operating system for personal wealth & business"
        subtitle="Streamlining Indian tax compliance, multi-rail cash flows, investment analytics, and GST business invoicing from first principles."
        style={{ marginBottom: '2.5rem' }}
      />

      {/* Interactive Persona Quick Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
          flexWrap: 'wrap',
          marginBottom: '3rem'
        }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--l-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.35rem' }}>
          Explore For:
        </span>
        {[
          { id: 'salaried' as const, label: '💼 Salaried HNI (Tax & SIPs)' },
          { id: 'freelance' as const, label: '⚡ Freelancer & GST Consultant' },
          { id: 'founder' as const, label: '🚀 Tech Founder & Angel Investor' }
        ].map((p) => {
          const isSelected = selectedPersona === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPersona(p.id)}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '9999px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                background: isSelected ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#ffffff' : 'var(--l-text-secondary, rgba(255, 255, 255, 0.82))',
                boxShadow: isSelected ? '0 0 20px rgba(6, 182, 212, 0.3), var(--l-neo-inset)' : 'none'
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* 2-Column Deep Dive Interactive Feature Arena */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.25fr)',
          gap: 'clamp(1.75rem, 3.5vw, 3.5rem)',
          alignItems: 'start'
        }}
        className="l-showcase-arena"
      >
        {/* Left Column: Interactive Module Tabs with Micro-Timeline Connectors */}
        <div
          role="tablist"
          aria-label="Feature module showcases"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}
        >
          {/* Vertical Glowing Connector Line */}
          <div
            style={{
              position: 'absolute',
              left: '32px',
              top: '24px',
              bottom: '24px',
              width: '2px',
              background: 'linear-gradient(180deg, #06b6d4 0%, rgba(6, 182, 212, 0.2) 100%)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />

          {SHOWCASE_MODULES.map((m, idx) => {
            const isActive = idx === activeModuleIndex;
            return (
              <button
                type="button"
                role="tab"
                id={`tab-${m.id}`}
                aria-controls={`panel-${m.id}`}
                aria-selected={isActive}
                tabIndex={0}
                key={m.id}
                onClick={() => setActiveModuleIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveModuleIndex((idx + 1) % SHOWCASE_MODULES.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveModuleIndex((idx - 1 + SHOWCASE_MODULES.length) % SHOWCASE_MODULES.length);
                  }
                }}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  padding: '1.35rem 1.65rem',
                  paddingLeft: '4.25rem',
                  borderRadius: '18px',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.14) 0%, rgba(15, 22, 36, 0.95) 100%)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isActive
                    ? '1px solid rgba(6, 182, 212, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  width: '100%',
                  transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive
                    ? '0 12px 35px rgba(6, 182, 212, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    : 'none',
                  transform: isActive ? 'translateX(6px)' : 'none'
                }}
              >
                {/* Milestone Node Dot / Icon Badge */}
                <div
                  style={{
                    position: 'absolute',
                    left: '18px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: isActive ? '#06b6d4' : 'rgba(255, 255, 255, 0.06)',
                    color: isActive ? '#07080d' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive ? '0 0 16px rgba(6, 182, 212, 0.7)' : 'none',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {m.icon}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: isActive ? '#67e8f9' : 'var(--l-text-muted, #94a3b8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}
                  >
                    {m.badge}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: isActive ? '#34d399' : 'rgba(255,255,255,0.7)',
                      background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent'
                    }}
                  >
                    {m.badgeTag}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
                    fontSize: '1.18rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    marginBottom: '0.4rem',
                    letterSpacing: '-0.015em'
                  }}
                >
                  {m.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.86rem',
                    lineHeight: 1.55,
                    color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.82))',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: isActive ? 4 : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {m.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: isActive ? '#67e8f9' : 'var(--l-text-muted, #94a3b8)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginTop: '0.75rem'
                  }}
                >
                  <span>Interactive Live Demo</span>
                  <ChevronRight size={13} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Dynamic Deep-Dive Visual Stage */}
        <div
          className="l-glass-card l-sticky-showcase-stage"
          role="tabpanel"
          id={`panel-${activeModule.id}`}
          aria-labelledby={`tab-${activeModule.id}`}
          style={{
            position: 'sticky',
            top: '90px',
            minHeight: '560px',
            padding: 'clamp(1.5rem, 3vw, 2.25rem)',
            background: 'linear-gradient(160deg, #0d111d 0%, #07080e 100%)',
            border: '1px solid rgba(6, 182, 212, 0.32)',
            boxShadow:
              '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(6, 182, 212, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Top Window Bar with Status Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '1rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginLeft: '0.5rem',
                  letterSpacing: '0.02em'
                }}
              >
                FinanceOS // {activeModule.badge}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
              <span>LIVE ENGINE</span>
            </div>
          </div>

          {/* Active Modular Showcase Stage */}
          {activeModuleIndex === 0 && <TaxGstShowcaseStage />}
          {activeModuleIndex === 1 && <LedgerCashflowShowcaseStage />}
          {activeModuleIndex === 2 && <InvestmentsWealthShowcaseStage />}
          {activeModuleIndex === 3 && <MerchantCommerceShowcaseStage />}
          {activeModuleIndex === 4 && <AutomationRulesShowcaseStage />}

          {/* Bottom Interactive Feature Action Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '1rem',
              marginTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--l-text-muted, #94a3b8)',
                fontSize: '0.75rem'
              }}
            >
              <ShieldCheck size={14} color="#06b6d4" />
              <span>AES-256 Client-Side Encrypted • Zero Data Sharing</span>
            </div>
            <div style={{ color: '#67e8f9', fontSize: '0.8rem', fontWeight: 700 }}>
              Module {activeModuleIndex + 1} of {SHOWCASE_MODULES.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
