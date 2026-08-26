import React from 'react';
import {
  ShieldCheck,
  X,
  Check,
  Lock,
  Cpu,
  Database,
  EyeOff,
  Zap,
  Key,
  Shield,
  Server,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { LandingSectionHeader } from './primitives/index.js';

interface ComparisonRow {
  dimension: string;
  dimensionSub: string;
  legacyTitle: string;
  legacyDesc: string;
  legacyTag: string;
  sovereignTitle: string;
  sovereignDesc: string;
  sovereignTag: string;
  icon: React.ReactNode;
  iconColor: string;
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    dimension: 'Data Custody & Storage',
    dimensionSub: 'Where your records live',
    legacyTitle: 'Vendor Cloud Servers',
    legacyDesc: 'Your financial records sit in plaintext on multi-tenant cloud servers, vulnerable to server leaks, employee snooping, and corporate data harvesting.',
    legacyTag: 'Plaintext Cloud Database',
    sovereignTitle: 'Local-First + E2E Cloud Sync',
    sovereignDesc: 'Your device is the primary database. Data is encrypted client-side with AES-256 before syncing to Supabase, keeping it unreadable to servers.',
    sovereignTag: 'AES-256 Client Encrypted',
    icon: <Database size={18} />,
    iconColor: '#06b6d4'
  },
  {
    dimension: 'Encryption Key Ownership',
    dimensionSub: 'Who can decrypt your data',
    legacyTitle: 'Vendor-Managed Keys',
    legacyDesc: 'The cloud company holds the decryption keys on their servers and can inspect, aggregate, or comply with third-party data requests without your knowledge.',
    legacyTag: 'Company Holds The Key',
    sovereignTitle: 'Hardware PIN Key Derivation',
    sovereignDesc: 'Your private PIN derives your master AES-256-GCM key directly in device memory (PBKDF2/Argon2id). The PIN never leaves your hardware.',
    sovereignTag: 'PIN Never Leaves Hardware',
    icon: <Lock size={18} />,
    iconColor: '#10b981'
  },
  {
    dimension: 'Surveillance & Privacy',
    dimensionSub: 'How your activity is handled',
    legacyTitle: 'SMS & Email Scraping',
    legacyDesc: 'Continuous background reading of private bank SMS alerts, credit card statements, and email receipts to build advertising and lending profiles.',
    legacyTag: 'SMS & Email Scraping',
    sovereignTitle: 'Zero-Knowledge Isolation',
    sovereignDesc: 'Zero ad trackers, zero email scrapers, and zero account aggregator data broker feeds. Your financial activity is mathematically private.',
    sovereignTag: 'Zero Trackers or Snooping',
    icon: <EyeOff size={18} />,
    iconColor: '#34d399'
  },
  {
    dimension: 'Speed & Computation',
    dimensionSub: 'How numbers calculate',
    legacyTitle: '400ms – 2,500ms API Roundtrips',
    legacyDesc: 'Every tax recalculation and ledger entry must roundtrip through remote cloud servers with frustrating network lag and loading spinners.',
    legacyTag: 'Server Network Lag',
    sovereignTitle: '0 ms Local Execution Loop',
    sovereignDesc: 'Section 115BAC tax comparisons, multi-account ledgers, and XIRR return calculations compute in sub-millisecond cycles directly on your device.',
    sovereignTag: '0 ms Instant Local Speed',
    icon: <Cpu size={18} />,
    iconColor: '#67e8f9'
  },
  {
    dimension: 'Vendor Lock-in & Portability',
    dimensionSub: 'Your freedom to leave',
    legacyTitle: 'Proprietary Lock-in / SaaS Paywalls',
    legacyDesc: 'Export features are restricted or gated behind recurring monthly subscription paywalls; proprietary databases designed to prevent migration.',
    legacyTag: 'Paywalled Exports',
    sovereignTitle: 'Open-Source & 1-Click JSON/CSV',
    sovereignDesc: 'You own 100% of your data forever. Instant unencrypted or encrypted export to standard CSV/Excel and JSON anytime with zero fees.',
    sovereignTag: '100% Free & Open Data',
    icon: <Zap size={18} />,
    iconColor: '#f59e0b'
  }
];

export const TrustComparisonMatrix: React.FC = () => {
  return (
    <section
      id="trust-matrix"
      aria-label="Trust and Architecture Comparison"
      className="l-section"
      style={{ paddingTop: '3.5rem', paddingBottom: '5.5rem' }}
    >
      {/* Section Header */}
      <LandingSectionHeader
        badgeText="ARCHITECTURE OF TRUST"
        title="The architecture of trust: Sovereign OS vs Cloud SaaS"
        subtitle="Why local-first cryptographic custody delivers mathematical guarantees that no cloud fintech policy can match."
        style={{ marginBottom: '3rem' }}
      />

      {/* Comparison Matrix Table Card */}
      <div className="l-trust-matrix-card">
        {/* Table Column Headers */}
        <div className="l-matrix-header-grid">
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--l-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Architectural Layer
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'rgba(244, 63, 94, 0.95)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }} />
              Traditional Cloud Fintech
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--l-text-muted, #94a3b8)', fontWeight: 500 }}>
              Multi-tenant servers & shared keys
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              MyFinanceOS Sovereign Vault
            </div>
            <span style={{ fontSize: '0.72rem', color: '#67e8f9', fontWeight: 600 }}>
              End-to-End Encrypted & Private
            </span>
          </div>
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {COMPARISON_DATA.map((row, idx) => (
            <div
              key={idx}
              className="l-matrix-row-grid"
              style={{
                borderBottom: idx === COMPARISON_DATA.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.012)'
              }}
            >
              {/* Dimension Column */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingRight: '1rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '11px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: row.iconColor,
                    flexShrink: 0,
                    marginTop: '0.15rem'
                  }}
                >
                  {row.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.15rem' }}>
                    {row.dimension}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--l-text-muted, #94a3b8)', fontWeight: 500 }}>
                    {row.dimensionSub}
                  </span>
                </div>
              </div>

              {/* Legacy Column */}
              <div style={{ paddingRight: '1rem' }}>
                <div className="l-matrix-legacy-cell">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f43f5e', fontSize: '0.86rem', fontWeight: 700 }}>
                      <X size={15} strokeWidth={2.5} />
                      <span>{row.legacyTitle}</span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: '#f43f5e',
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.28)',
                        borderRadius: '6px',
                        padding: '0.1rem 0.4rem',
                        letterSpacing: '0.02em'
                      }}
                    >
                      {row.legacyTag}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', lineHeight: 1.55, color: 'var(--l-text-muted, #94a3b8)', margin: 0 }}>
                    {row.legacyDesc}
                  </p>
                </div>
              </div>

              {/* Sovereign Column */}
              <div>
                <div className="l-matrix-sovereign-cell">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.9rem', fontWeight: 800 }}>
                      <Check size={16} strokeWidth={2.5} />
                      <span>{row.sovereignTitle}</span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: '#34d399',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.28)',
                        borderRadius: '6px',
                        padding: '0.1rem 0.45rem',
                        letterSpacing: '0.02em'
                      }}
                    >
                      {row.sovereignTag}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', lineHeight: 1.55, color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.88))', margin: 0 }}>
                    {row.sovereignDesc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cryptographic Boundary Infographic Strip */}
        <div
          style={{
            padding: '1.5rem 2rem',
            background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, rgba(6, 182, 212, 0.02) 100%)',
            borderTop: '1px solid rgba(6, 182, 212, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={18} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: '0.86rem', color: '#ffffff', fontWeight: 700 }}>
                Hardware Cryptographic Isolation Guarantee
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--l-text-muted, #94a3b8)' }}>
                Decryption keys exist ephemerally in RAM and are never sent over the network
              </div>
            </div>
          </div>

          {/* Pipeline Capsules */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className="l-matrix-pipeline-step">
              <span style={{ color: '#06b6d4' }}>💻</span> Client Browser
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.8rem' }}>➔</span>
            <span className="l-matrix-pipeline-step" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.08)' }}>
              <span style={{ color: '#34d399' }}>🔒</span> AES-256-GCM
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.8rem' }}>➔</span>
            <span className="l-matrix-pipeline-step" style={{ borderColor: 'rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.08)' }}>
              <span style={{ color: '#67e8f9' }}>☁️</span> Supabase Sync (Ciphertext)
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.8rem' }}>➔</span>
            <span className="l-matrix-pipeline-step" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399', fontWeight: 700 }}>
              🛡️ 0 Plaintext Leaks
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
