import React from 'react';
import {
  Network,
  Lock,
  Calculator,
  Target,
  FileSpreadsheet,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
  PieChart
} from 'lucide-react';

const ADDITIONAL_FEATURES = [
  {
    id: 'sankey',
    icon: <Network size={22} />,
    color: '#06b6d4',
    title: 'Sankey Cash Flow Visualizer',
    description:
      'Map your entire financial bloodstream. Visually trace income pipelines branching into household expenses, debt service, tax deductions, and investment capital.'
  },
  {
    id: 'vault',
    icon: <Lock size={22} />,
    color: '#a855f7',
    title: 'Zero-Knowledge Document Vault',
    description:
      'Store property deeds, insurance policies, and tax receipts locally with AES-256 client encryption. No external server ever holds your private records.'
  },
  {
    id: 'emi',
    icon: <Calculator size={22} />,
    color: '#3b82f6',
    title: 'EMI Amortization & Prepayments',
    description:
      'Model loan repayment trajectories with lump-sum and monthly prepayment simulations to calculate exact interest savings and tenure reductions.'
  },
  {
    id: 'goals',
    icon: <Target size={22} />,
    color: '#10b981',
    title: 'Goal Milestones & Emergency Fund',
    description:
      'Track 6-month liquid runway buffers, house down-payments, and children education funds with dynamic priority scoring and automated savings tags.'
  },
  {
    id: 'reports',
    icon: <FileSpreadsheet size={22} />,
    color: '#f59e0b',
    title: 'P&L Reports & Net Worth Trends',
    description:
      'Comprehensive financial reporting with historical net worth charts, asset allocation heatmaps, and 1-click export to standard CSV/JSON formats.'
  },
  {
    id: 'ai-copilot',
    icon: <MessageSquare size={22} />,
    color: '#ec4899',
    title: 'Contextual AI Financial Co-Pilot',
    description:
      'Ask natural language queries regarding your spending velocity, tax liability headroom, and investment compounding directly on your private vault.'
  }
];

export const AllFeaturesGrid: React.FC = () => {
  return (
    <div className="l-section" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="l-badge-pill">
          <Sparkles size={14} color="#c4b5fd" />
          <span>Extensible Ecosystem</span>
        </div>
        <h2 className="l-section-title">The Complete Operating System for Total Financial Control</h2>
        <p className="l-section-subtitle" style={{ margin: '0 auto' }}>
          Every module is built from first principles for uncompromising depth and responsiveness.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {ADDITIONAL_FEATURES.map((f) => (
          <div
            key={f.id}
            className="l-glass-card"
            style={{
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '210px'
            }}
          >
            <div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: `rgba(255, 255, 255, 0.04)`,
                  border: `1px solid rgba(255, 255, 255, 0.08)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: f.color,
                  marginBottom: '1.15rem'
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--l-text-secondary)' }}>
                {f.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
