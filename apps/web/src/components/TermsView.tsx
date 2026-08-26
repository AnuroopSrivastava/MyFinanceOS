'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ShieldCheck, Scale, ArrowLeft, AlertTriangle, CheckCircle2,
  Building2, Percent, Target, FileSpreadsheet, Lock, HelpCircle
} from 'lucide-react';

import { getSavedTheme, AppTheme } from '@financeos/ui';

export interface TermsViewProps {
  onBack?: () => void;
  showNav?: boolean;
}

export const TermsView: React.FC<TermsViewProps> = ({ onBack, showNav = true }) => {
  const [activeSection, setActiveSection] = useState('license');
  const [theme, setTheme] = useState<AppTheme>('glass-cyan');

  useEffect(() => {
    setTheme(getSavedTheme());
  }, []);

  const sections = [
    { id: 'license', label: '1. Software License & Scope', icon: <FileText size={16} /> },
    { id: 'disclaimer', label: '2. Financial & Tax Disclaimer', icon: <Scale size={16} /> },
    { id: 'sovereignty', label: '3. Data Ownership & Sovereignty', icon: <ShieldCheck size={16} /> },
    { id: 'business-terms', label: '4. Commercial & GST Invoicing', icon: <Building2 size={16} /> },
    { id: 'calculations', label: '5. Computational Models & Projections', icon: <Percent size={16} /> },
    { id: 'security-resp', label: '6. User Key & Backup Duties', icon: <Lock size={16} /> },
    { id: 'warranty', label: '7. Warranty & Limitation of Liability', icon: <AlertTriangle size={16} /> },
    { id: 'jurisdiction', label: '8. Governing Law & Jurisdiction', icon: <HelpCircle size={16} /> }
  ];

  return (
    <div
      data-theme={theme}
      data-testid="terms-view"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary, #090d16)',
        color: 'var(--text-primary, #f8fafc)',
        fontFamily: 'var(--font-body, system-ui, -apple-system, sans-serif)',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* Ambient background glows */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          right: '10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, var(--accent-glow, rgba(6, 182, 212, 0.15)) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-15%',
          left: '10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Top sticky navigation bar */}
      {showNav && (
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'var(--bg-panel, rgba(15, 23, 42, 0.85))',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: 'var(--text-secondary, #94a3b8)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={14} />
                Back to Workspace
              </button>
            ) : (
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: 'var(--text-secondary, #94a3b8)',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  transition: 'all 0.2s'
                }}
              >
                <ArrowLeft size={14} />
                Back to App
              </Link>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <img src="/logo.png" alt="MyFinanceOS" width={28} height={28} loading="lazy" decoding="async" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
              <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>MyFinanceOS</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              href="/privacy"
              style={{
                color: 'var(--text-secondary, #94a3b8)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.35rem 0.75rem',
                borderRadius: '6px'
              }}
            >
              Privacy Policy →
            </Link>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                background: 'var(--badge-indigo-bg, rgba(99, 102, 241, 0.15))',
                color: 'var(--badge-indigo-text, #818cf8)',
                border: '1px solid var(--badge-indigo-border, rgba(99, 102, 241, 0.3))',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Scale size={13} />
              User Sovereign License
            </span>
          </div>
        </nav>
      )}

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem 6rem', position: 'relative', zIndex: 1 }}>
        {/* Header Hero */}
        <header
          style={{
            background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
            borderRadius: '24px',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            padding: '2.5rem',
            marginBottom: '2.5rem',
            boxShadow: 'var(--shadow-lg, 0 20px 40px rgba(0,0,0,0.4))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ maxWidth: '720px' }}>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, margin: '0 0 0.75rem 0', fontFamily: 'var(--font-display, inherit)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Terms of Service &<br />
                <span style={{ color: 'var(--color-asset-mf, #818cf8)' }}>User Sovereignty Agreement</span>
              </h1>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6, margin: 0 }}>
                Please review the terms governing your use of MyFinanceOS. By unlocking, initializing, or operating the application, you agree to these terms governing computational client-side software usage.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '220px', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>Legal Highlights</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--success, #10b981)" /> 100% User Data Ownership
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--success, #10b981)" /> No SEBI / CA Advisory Role
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--success, #10b981)" /> Local Passcode Responsibility
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--success, #10b981)" /> Commercial Export Freedom
              </div>
            </div>
          </div>
        </header>

        {/* Layout: Sidebar + Main Content */}
        <div className="responsive-stack" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Quick Jump Sidebar */}
          <aside
            style={{
              position: 'sticky',
              top: '80px',
              background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
              borderRadius: '16px',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', padding: '0.4rem 0.6rem', textTransform: 'uppercase' }}>
              Terms Navigation
            </div>
            {sections.map(s => {
              const isActive = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(s.id);
                    const el = document.getElementById(s.id);
                    if (el) {
                      const offset = 90;
                      const bodyRect = document.body.getBoundingClientRect().top;
                      const elementRect = el.getBoundingClientRect().top;
                      const elementPosition = elementRect - bodyRect;
                      const offsetPosition = elementPosition - offset;
                      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                    }
                  }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#fff' : 'var(--text-secondary, #94a3b8)',
                    background: isActive ? 'var(--badge-indigo-bg, rgba(99,102,241,0.12))' : 'transparent',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                    boxShadow: isActive ? 'var(--neo-inset-sm)' : 'none'
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-terms-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '12%',
                        bottom: '12%',
                        width: '3px',
                        borderRadius: '2px',
                        background: 'var(--color-asset-mf, #818cf8)',
                        boxShadow: '0 0 10px var(--color-asset-mf, #818cf8)'
                      }}
                    />
                  )}
                  <span style={{ color: isActive ? 'var(--color-asset-mf, #818cf8)' : 'inherit', display: 'flex', alignItems: 'center' }}>{s.icon}</span>
                  <span>{s.label}</span>
                </a>
              );
            })}
          </aside>

          {/* Core Terms Articles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Section 1 */}
            <section
              id="license"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <FileText size={22} color="var(--color-asset-mf, #818cf8)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>1. Software License & Scope of Use</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                MyFinanceOS grants you a non-exclusive, revocable, personal, and commercial software license to install, execute, and utilize the application for organizing your personal and business financial accounts.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={16} color="var(--success, #10b981)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span><strong>Personal & Enterprise Readiness:</strong> You may manage personal accounts and multiple commercial entities, invoices, and inventory records.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={16} color="var(--success, #10b981)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span><strong>Zero Mandatory Subscription Locks:</strong> Your local database remains accessible regardless of external network availability.</span>
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section
              id="disclaimer"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <Scale size={22} color="var(--color-asset-gold, #f59e0b)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>2. Financial, Legal & Tax Advisory Disclaimer</h2>
              </div>
              <div style={{ background: 'var(--badge-amber-bg, rgba(245, 158, 11, 0.1))', border: '1px solid var(--badge-amber-border, rgba(245, 158, 11, 0.3))', borderRadius: '12px', padding: '1rem 1.25rem', margin: '0.5rem 0 1rem 0' }}>
                <strong style={{ color: 'var(--color-asset-gold, #f59e0b)' }}>CRITICAL NOTICE:</strong> MyFinanceOS is a computational software tool, NOT a certified Chartered Accountant (CA), certified tax practitioner, or SEBI-registered Investment Advisor (RIA).
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                All calculations provided in the application—including Old vs New Indian Tax Regime estimates (FY 2025–26 / AY 2026–27), 80C/80D standard deduction headrooms, STCG/LTCG capital gains estimations, corporate tax slabs, GST output tax summaries, FIRE milestones, and XIRR returns—are mathematical models for estimation and planning purposes only.
              </p>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                You must consult with a licensed Chartered Accountant or financial professional before filing tax returns with the Income Tax Department of India or making irreversible investment decisions.
              </p>
            </section>

            {/* Section 3 */}
            <section
              id="sovereignty"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <ShieldCheck size={22} color="var(--success, #10b981)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>3. Data Ownership & Unencumbered Sovereignty</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                You own 100% of all intellectual property, data records, financial ledger entries, tax schedules, uploaded documents, and business inventories entered into MyFinanceOS.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={16} color="var(--success, #10b981)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span><strong>No Platform Vendor Lock-In:</strong> You may export raw JSON or structured CSV backups of your database at any time without fees.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={16} color="var(--success, #10b981)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span><strong>Zero Commercial Exploitation:</strong> We do not assert any copyright or commercial license claims over your financial statements or generated reports.</span>
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section
              id="business-terms"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <Building2 size={22} color="var(--accent-1, #06b6d4)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>4. Commercial Entities & GST Invoicing Terms</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                When generating GST tax invoices, commercial Profit & Loss statements, or inventory records:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
                <div style={{ background: 'var(--bg-secondary, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary, #fff)', marginBottom: '0.3rem' }}>GSTIN & HSN Compliance</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>
                    You are solely responsible for ensuring the accuracy of GSTIN numbers, HSN/SAC codes, CGST/SGST/IGST tax rates, and reverse charge applicability under the GST Act 2017.
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary, #fff)', marginBottom: '0.3rem' }}>Commercial Record Retention</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>
                    Statutory record keeping obligations (e.g. 6-8 years under Companies Act & Income Tax rules) require maintaining regular offline JSON backups.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section
              id="calculations"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <Percent size={22} color="var(--color-asset-stocks, #10b981)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>5. Computational Models & Projections</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                Calculations for SIP compounding with annual step-ups, FIRE corpus trajectories, and EMI prepayment interest savings assume constant mathematical inputs and do not guarantee future market returns, inflation rates, or interest rates.
              </p>
            </section>

            {/* Section 6 */}
            <section
              id="security-resp"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <Lock size={22} color="var(--color-asset-gold, #f59e0b)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>6. User Key & Backup Duties</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                Because MyFinanceOS maintains zero server copies of your database, you assume full responsibility for:
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={16} color="var(--success, #10b981)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span><strong>Passcode Custody:</strong> Storing your master AES-256 encryption passcode in a reliable credential manager.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={16} color="var(--success, #10b981)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span><strong>Periodic Offline Backups:</strong> Generating periodic JSON exports prior to clearing browser data or changing client hardware.</span>
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section
              id="warranty"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <AlertTriangle size={22} color="var(--error, #ef4444)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>7. Warranty & Limitation of Liability</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                The software is provided on an "AS IS" and "AS AVAILABLE" basis, without warranties of any kind, either express or implied, including but not limited to merchantability, fitness for a particular tax or financial purpose, or non-infringement.
              </p>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                In no event shall the authors or copyright holders be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from the use, inability to use, loss of local passcodes, or computational discrepancies in tax filings.
              </p>
            </section>

            {/* Section 8 */}
            <section
              id="jurisdiction"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <HelpCircle size={22} color="var(--accent-1, #06b6d4)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>8. Governing Law & Jurisdiction</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                These terms and any disputes related to software execution shall be governed by and construed in accordance with the laws of the <strong>Republic of India</strong>, with exclusive jurisdiction subject to the courts located in <strong>Bengaluru, Karnataka, India</strong>.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: '4rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            color: 'var(--text-muted, #64748b)',
            fontSize: '0.85rem'
          }}
        >
          <div>© 2026 MyFinanceOS. Premium Local-First Financial Operating System.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/" style={{ color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none' }}>Home</Link>
            <Link href="/privacy" style={{ color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none' }}>Privacy Policy</Link>
            <a href="#license" style={{ color: 'var(--accent-1, #38bdf8)', textDecoration: 'none' }}>Top ↑</a>
          </div>
        </footer>
      </main>
    </div>
  );
};
