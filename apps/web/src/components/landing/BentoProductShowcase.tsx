import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Store,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Sparkles,
  ChevronRight,
  Sliders,
  DollarSign
} from 'lucide-react';

interface ShowcaseStep {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: ShowcaseStep[] = [
  {
    id: 'wallet',
    badge: 'Wallet',
    title: 'Secure Crypto Management',
    description:
      'Store, send, and receive multiple assets with ease. Enjoy top-notch security and a user-friendly interface.',
    icon: <Wallet size={18} />
  },
  {
    id: 'payments',
    badge: 'Payments',
    title: 'Fast, Secure, Global',
    description:
      'Quickly process global crypto transactions with robust security and efficiency.',
    icon: <CreditCard size={18} />
  },
  {
    id: 'commerce',
    badge: 'Commerce',
    title: 'Empower Your Store',
    description:
      'Manage your online business seamlessly, accepting various cryptocurrencies with low fees.',
    icon: <Store size={18} />
  },
  {
    id: 'subscriptions',
    badge: 'Subscriptions',
    title: 'Automate Revenue',
    description:
      'Easily set up and manage recurring billing with flexible subscription options.',
    icon: <RefreshCw size={18} />
  }
];

export const BentoProductShowcase: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  return (
    <div className="l-section" style={{ paddingTop: '3rem', paddingBottom: '6rem' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div className="l-badge-pill">
          <Sparkles size={14} color="#c4b5fd" />
          <span>BRIDGING WEB2 AND WEB3</span>
        </div>
        <h2 className="l-section-title" style={{ maxWidth: '820px', margin: '0 auto 1rem' }}>
          End-to-end universal payment solution for cryptocurrencies and fiat
        </h2>
        <p className="l-section-subtitle" style={{ margin: '0 auto' }}>
          Streamlining the payment process from start to finish.
        </p>
      </div>

      {/* 2-Column Deep Dive Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'start'
        }}
      >
        {/* Left Column: 4 Timeline Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {STEPS.map((s, idx) => {
            const isActive = idx === activeStepIndex;
            return (
              <div
                key={s.id}
                onClick={() => setActiveStepIndex(idx)}
                style={{
                  padding: '1.5rem 1.75rem',
                  borderRadius: '18px',
                  background: isActive ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: isActive ? '1px solid rgba(168, 85, 247, 0.45)' : '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 10px 30px rgba(139, 92, 246, 0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: isActive ? '#a855f7' : 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {s.icon}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: isActive ? '#c4b5fd' : 'var(--l-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}
                  >
                    {s.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--l-text-secondary)', margin: 0 }}>
                  {s.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: isActive ? '#c4b5fd' : 'var(--l-text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    marginTop: '0.85rem'
                  }}
                >
                  Learn more <ChevronRight size={14} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Dynamic Interactive UI Stage */}
        <div
          className="l-glass-card"
          style={{
            minHeight: '520px',
            padding: '2rem',
            background: '#0c0c14',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {/* STEP 1: Secure Crypto Management Balance & Feed (00:15 - 00:17) */}
          {activeStepIndex === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Balance Card */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--l-text-muted)', fontWeight: 600 }}>
                    Total Available Balance
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }} className="l-num">
                    $142,850.00
                  </div>
                </div>
                <div
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '9999px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#34d399',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <TrendingUp size={14} /> +1.18%
                </div>
              </div>

              {/* Transactions Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--l-text-muted)', textTransform: 'uppercase' }}>
                  Recent Transactions
                </div>

                {[
                  { icon: '₿', name: 'BTC Received', hash: '0x3a9...8f', amount: '+$2,320.00', color: '#f59e0b' },
                  { icon: 'Ł', name: 'LTC Swapped', hash: '0x1b4...2c', amount: '+$516.43', color: '#38bdf8' },
                  { icon: '◎', name: 'SOL Sent', hash: '0x7e8...9a', amount: '-$185.00', color: '#a855f7' },
                  { icon: '₮', name: 'USDT Received', hash: '0x99c...4f', amount: '+$1,000.00', color: '#10b981' }
                ].map((tx, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: `${tx.color}22`,
                          color: tx.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900
                        }}
                      >
                        {tx.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>{tx.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--l-text-muted)' }}>{tx.hash}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }} className="l-num">
                      {tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Checkout & Connected Payment Rails (00:18 - 00:19) */}
          {activeStepIndex === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Order Receipt Card */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Order #12853</span>
                  <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 700 }}>VERIFIED</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--l-text-secondary)' }}>
                    <span>1x Fat Coin 3000X</span>
                    <span className="l-num">$87.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--l-text-secondary)' }}>
                    <span>1x Fat Coin 1500X</span>
                    <span className="l-num">$43.85</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--l-text-muted)', fontSize: '0.78rem' }}>
                    <span>Tax & Network Gas</span>
                    <span className="l-num">$16.64</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#ffffff', fontSize: '1.1rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.5rem' }}>
                    <span>Total Due</span>
                    <span className="l-num" style={{ color: '#c4b5fd' }}>$147.49</span>
                  </div>
                </div>
              </div>

              {/* Connecting Tree Lines down to Payment Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '2px', height: '18px', background: '#a855f7', boxShadow: '0 0 10px #a855f7' }} />
              </div>

              {/* Payment Methods */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid #a855f7',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                    ₿ Cryptocurrencies (BTC, ETH, SOL, LTC)
                  </span>
                  <CheckCircle2 size={16} color="#c084fc" />
                </div>
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'var(--l-text-secondary)',
                    fontSize: '0.85rem'
                  }}
                >
                  <span>💳 Card or Apple Pay (Visa, MC)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Store Management & Animated Drag/Drop Upload (00:20 - 00:24) */}
          {activeStepIndex === 2 && (
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Product Store Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { name: 'Fat Coin 3000X', price: '$87.00', rating: '5.0 (15 reviews)' },
                  { name: 'Fat Coin 1500X', price: '$43.85', rating: '4.9 (24 reviews)' }
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '1rem'
                    }}
                  >
                    <div style={{ width: '100%', height: '70px', background: 'linear-gradient(135deg, #1f1b3c 0%, #0e0d1a 100%)', borderRadius: '8px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', fontWeight: 900 }}>
                      BOX #{i + 1}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#c4b5fd', fontWeight: 800 }} className="l-num">{item.price}</div>
                    <div style={{ fontSize: '0.7rem', color: '#fef08a', marginTop: '0.2rem' }}>★ {item.rating}</div>
                  </div>
                ))}
              </div>

              {/* Interactive Drag and Drop Upload Modal */}
              <div
                style={{
                  background: 'rgba(18, 16, 30, 0.95)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  boxShadow: '0 15px 40px rgba(0,0,0,0.8)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Change Logo / Media</span>
                  <span style={{ fontSize: '0.7rem', color: '#c4b5fd', background: 'rgba(168, 85, 247, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    PNG, SVG, JPG
                  </span>
                </div>

                <div
                  style={{
                    border: '2px dashed rgba(168, 85, 247, 0.4)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: 'rgba(139, 92, 246, 0.04)',
                    position: 'relative'
                  }}
                >
                  <Upload size={24} color="#a855f7" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 600 }}>
                    Drag and drop file here, or <span style={{ color: '#c4b5fd', textDecoration: 'underline' }}>browse</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--l-text-muted)', marginTop: '0.25rem' }}>
                    Maximum file size: 25MB
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Subscription Node Graph & Recurring Billing (00:25 - 00:26) */}
          {activeStepIndex === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>Recurring Subscriptions Engine</span>
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>● 100% AUTOMATED</span>
              </div>

              {/* Node 1 */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>Prem 18 Tier</span>
                    <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '4px', fontWeight: 800 }}>
                      ACTIVE
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--l-text-muted)', marginTop: '0.2rem' }}>
                    Next charge: 16:08 24 Jul, 2026 • Daily Cycle
                  </div>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }} className="l-num">
                  $18.00 / mo
                </div>
              </div>

              {/* Node 2 */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>BIGPT Premium AI</span>
                    <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '4px', fontWeight: 800 }}>
                      ACTIVE
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--l-text-muted)', marginTop: '0.2rem' }}>
                    Next charge: 22:08 30 May, 2026 • Monthly Cycle
                  </div>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }} className="l-num">
                  $29.99 / mo
                </div>
              </div>

              {/* Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '0.85rem', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#c4b5fd', fontWeight: 600 }}>Monthly Recurring (MRR)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }} className="l-num">$47,990</div>
                </div>
                <div style={{ padding: '0.85rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#67e8f9', fontWeight: 600 }}>Churn Rate</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }} className="l-num">0.12%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
