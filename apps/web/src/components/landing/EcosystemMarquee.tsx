import React from 'react';
import {
  Calculator,
  BookOpen,
  TrendingUp,
  Receipt,
  Split,
  Flame,
  Zap,
  Target,
  ShieldCheck,
  Percent,
  BarChart3,
  Sparkles,
  Users,
  Lock,
  Database,
  Cpu
} from 'lucide-react';
import { LandingMarqueeChip } from './primitives/index.js';

interface ProjectFeatureItem {
  name: string;
  tag: string;
  subtext?: string;
  color: string;
  icon: React.ReactNode;
}

// All 16 core capabilities present in MyFinanceOS in a single continuous ticker banner
const ALL_PROJECT_FEATURES: ProjectFeatureItem[] = [
  {
    name: 'Section 115BAC Tax Optimizer',
    tag: 'New vs Old Regime',
    color: '#06b6d4',
    icon: <Calculator size={14} />
  },
  {
    name: 'Multi-Account Double-Entry Ledger',
    tag: 'Bank, UPI, Cards, Cash',
    color: '#10b981',
    icon: <BookOpen size={14} />
  },
  {
    name: 'Investments & XIRR Portfolio',
    tag: 'Mutual Funds & Stocks',
    color: '#14b8a6',
    icon: <TrendingUp size={14} />
  },
  {
    name: 'GST Invoicing & Merchant POS',
    tag: 'B2B & B2C Invoicing',
    color: '#f59e0b',
    icon: <Receipt size={14} />
  },
  {
    name: 'Interactive Sankey Cash Flow',
    tag: 'Visual Money Flow',
    color: '#8b5cf6',
    icon: <Split size={14} />
  },
  {
    name: 'FIRE & Step-Up SIP Simulator',
    tag: 'Retirement Planner',
    color: '#f97316',
    icon: <Flame size={14} />
  },
  {
    name: 'Rule-Based Smart Automation',
    tag: 'AutoPay & Categorization',
    color: '#ec4899',
    icon: <Zap size={14} />
  },
  {
    name: 'Milestone Goal Tracker',
    tag: '6-Mo Emergency Runway',
    color: '#34d399',
    icon: <Target size={14} />
  },
  {
    name: 'Zero-Knowledge Document Vault',
    tag: 'Client-Side AES-256',
    color: '#3b82f6',
    icon: <ShieldCheck size={14} />
  },
  {
    name: 'Loan EMI & Prepayment Planner',
    tag: 'Interest Reduction Plan',
    color: '#06b6d4',
    icon: <Percent size={14} />
  },
  {
    name: 'Comprehensive P&L & Balance Sheet',
    tag: '1-Click Excel / CSV Export',
    color: '#10b981',
    icon: <BarChart3 size={14} />
  },
  {
    name: 'Private On-Device AI Co-Pilot',
    tag: 'Natural Language Vault AI',
    color: '#a855f7',
    icon: <Sparkles size={14} />
  },
  {
    name: 'Multi-Entity Profile Vault',
    tag: 'Personal, Spouse & Business',
    color: '#6366f1',
    icon: <Users size={14} />
  },
  {
    name: 'Supabase E2E Encrypted Sync',
    tag: 'Zero Plaintext Custody',
    color: '#22c55e',
    icon: <Lock size={14} />
  },
  {
    name: '100% Free Data Portability',
    tag: 'Open JSON / CSV Restore',
    color: '#fbbf24',
    icon: <Database size={14} />
  },
  {
    name: '0 ms Local Execution Loop',
    tag: 'Instant Sub-Millisecond Speed',
    color: '#67e8f9',
    icon: <Cpu size={14} />
  }
];

export const EcosystemMarquee: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        padding: '0.85rem 0',
        background: 'linear-gradient(180deg, rgba(8, 11, 20, 0.96) 0%, rgba(5, 7, 12, 0.98) 100%)',
        overflow: 'hidden',
        borderTop: '1px solid rgba(6, 182, 212, 0.18)',
        borderBottom: '1px solid rgba(6, 182, 212, 0.18)',
        boxShadow: '0 4px 25px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Top Ambient Glow Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '1px',
          background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.75) 0%, rgba(16, 185, 129, 0.4) 45%, transparent 85%)',
          boxShadow: '0 0 14px rgba(6, 182, 212, 0.8)'
        }}
      />

      {/* Left Edge Smooth Gradient Mask */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '200px',
          background: 'linear-gradient(to right, var(--l-bg-void, #07080d) 30%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />

      {/* Right Edge Smooth Gradient Mask */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '200px',
          background: 'linear-gradient(to left, var(--l-bg-void, #07080d) 30%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />

      {/* Single Continuous Moving Banner Ribbon (Smooth Left-to-Right) */}
      <div className="l-marquee-track-ltr">
        {[...ALL_PROJECT_FEATURES, ...ALL_PROJECT_FEATURES].map((item, idx) => (
          <LandingMarqueeChip
            key={`ticker-${idx}`}
            name={item.name}
            tag={item.tag}
            color={item.color}
            icon={item.icon}
          />
        ))}
      </div>
    </div>
  );
};
