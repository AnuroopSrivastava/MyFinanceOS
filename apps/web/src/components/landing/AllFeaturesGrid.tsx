import React from 'react';
import {
  Network,
  Lock,
  Calculator,
  Target,
  FileSpreadsheet,
  MessageSquare,
  Zap,
  Layers,
  ShieldCheck,
  Cpu,
  Key
} from 'lucide-react';
import {
  LandingSectionHeader,
  LandingAllocationBar,
  LandingCapabilityCard,
  LandingSpecPill
} from './primitives/index.js';

export const AllFeaturesGrid: React.FC = () => {
  return (
    <div className="l-section" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <LandingSectionHeader
        title="Everything you need to master your personal & business wealth"
        subtitle="Engineered for speed, clarity, and complete privacy — with zero ads and zero data harvesting."
        style={{ marginBottom: '3.5rem' }}
      />

      <div className="l-bento-capabilities-grid">
        {/* ========================================================
            FLAGSHIP 1 (SPAN 6): Sankey Cash Flow Visualizer
           ======================================================== */}
        <LandingCapabilityCard
          variant="featured"
          icon={<Network size={22} />}
          iconColor="#06b6d4"
          iconBg="rgba(6, 182, 212, 0.16)"
          iconBorder="rgba(6, 182, 212, 0.4)"
          badgeText="FLAGSHIP VISUALIZER"
          badgeVariant="cyan"
          title="Visual Cash Flow & Money Stream Map"
          description="See the complete journey of every rupee. Visually trace your monthly salary branching into household expenses, Section 115BAC tax deductions, equity SIPs, and emergency savings."
        >
          {/* Schematic Diagram Preview */}
          <div className="l-bento-preview-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--l-text-muted, #94a3b8)', fontWeight: 600 }}>
                Monthly Inflow Stream
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#34d399' }} className="l-num">
                ₹2,45,000 / mo
              </span>
            </div>

            {/* Visual multi-corridor flow bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <LandingAllocationBar label="Wealth & SIPs" amount="₹1.03L" pct={42} color="#06b6d4" />
              <LandingAllocationBar label="Living & EMI" amount="₹68.6K" pct={28} color="#10b981" />
              <LandingAllocationBar label="Tax & Cess" amount="₹44.1K" pct={18} color="#f59e0b" />
            </div>
          </div>
        </LandingCapabilityCard>

        {/* ========================================================
            FLAGSHIP 2 (SPAN 6): Zero-Knowledge Sovereign Vault
           ======================================================== */}
        <LandingCapabilityCard
          variant="featured"
          icon={<Lock size={22} />}
          iconColor="#10b981"
          iconBg="rgba(16, 185, 129, 0.16)"
          iconBorder="rgba(16, 185, 129, 0.4)"
          badgeText="END-TO-END ENCRYPTED"
          badgeVariant="emerald"
          title="Private Document & Asset Vault"
          description="Keep your property papers, insurance policies, and tax documents safely encrypted on your device and backed up securely. Your security PIN is the only key."
        >
          {/* Cryptographic Stack Preview */}
          <div className="l-bento-preview-box">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              <LandingSpecPill
                icon={<Key size={16} color="#06b6d4" />}
                title="PBKDF2"
                subtitle="100k Iterations"
              />
              <LandingSpecPill
                icon={<ShieldCheck size={16} color="#10b981" />}
                title="AES-256-GCM"
                subtitle="Authenticated"
              />
              <LandingSpecPill
                icon={<Cpu size={16} color="#f59e0b" />}
                title="IndexedDB"
                subtitle="0ms Local Read"
              />
            </div>
          </div>
        </LandingCapabilityCard>

        {/* ========================================================
            SUPPORTING MODULES (SPAN 4)
           ======================================================== */}
        {/* Module 1: EMI Amortization */}
        <LandingCapabilityCard
          variant="compact"
          icon={<Calculator size={20} />}
          iconColor="#3b82f6"
          iconBg="rgba(59, 130, 246, 0.15)"
          iconBorder="rgba(59, 130, 246, 0.35)"
          tag="Debt Optimization"
          title="EMI & Prepayments"
          description="Calculate home and car loan EMIs, and see how extra prepayments save you lakhs in interest and reduce loan tenure."
        />

        {/* Module 2: Goal Milestones */}
        <LandingCapabilityCard
          variant="compact"
          icon={<Target size={20} />}
          iconColor="#14b8a6"
          iconBg="rgba(20, 184, 166, 0.15)"
          iconBorder="rgba(20, 184, 166, 0.35)"
          tag="Runway Buffer"
          title="Goal Milestones & Runway"
          description="Track your 6-month emergency fund buffer, house down payments, and education goals with dynamic progress rings."
        />

        {/* Module 3: Reports & Statements */}
        <LandingCapabilityCard
          variant="compact"
          icon={<FileSpreadsheet size={20} />}
          iconColor="#f59e0b"
          iconBg="rgba(245, 158, 11, 0.15)"
          iconBorder="rgba(245, 158, 11, 0.35)"
          tag="Financial Statements"
          title="P&L Reports & Net Worth"
          description="Clear visual statements of your profit & loss, net worth trajectory, and instant 1-click Excel/CSV downloads."
        />

        {/* Module 4: AI Financial Co-Pilot */}
        <LandingCapabilityCard
          variant="compact"
          icon={<MessageSquare size={20} />}
          iconColor="#06b6d4"
          iconBg="rgba(6, 182, 212, 0.15)"
          iconBorder="rgba(6, 182, 212, 0.35)"
          tag="Private AI Assistant"
          title="Private AI Co-Pilot"
          description="Ask questions in simple English about your monthly spending trends, upcoming tax liabilities, and savings rate."
        />

        {/* Module 5: Smart Rule Engine */}
        <LandingCapabilityCard
          variant="compact"
          icon={<Zap size={20} />}
          iconColor="#eab308"
          iconBg="rgba(234, 179, 8, 0.15)"
          iconBorder="rgba(234, 179, 8, 0.35)"
          tag="Smart Automation"
          title="Automation & Rule Engine"
          description="Create simple rules to automatically categorize bank transfers, recurring UPI subscriptions, and salary allocations."
        />

        {/* Module 6: Multi-Profile Entity Vault */}
        <LandingCapabilityCard
          variant="compact"
          icon={<Layers size={20} />}
          iconColor="#6366f1"
          iconBg="rgba(99, 102, 241, 0.15)"
          iconBorder="rgba(99, 102, 241, 0.35)"
          tag="Multiple Profiles"
          title="Personal, Spouse & Business"
          description="Switch seamlessly between Personal, Spouse, and Business accounts with separate PIN access and clean isolation."
        />
      </div>
    </div>
  );
};
