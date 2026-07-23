import React, { useState, useEffect } from 'react';
import { dbService } from '@financeos/database';
import { GlobalDateRange } from './utils/dateFilter.js';
import { getSavedTheme, setTheme } from '@financeos/ui';
import { Login } from './components/Login.js';
import { Setup } from './components/Setup.js';
import { DashboardView } from './components/DashboardView.js';
import { LedgerView } from './components/LedgerView.js';
import { InvestmentsView } from './components/InvestmentsView.js';
import { TaxView } from './components/TaxView.js';
import { BusinessView } from './components/BusinessView.js';
import { SankeyView } from './components/SankeyView.js';
import { AIChatView } from './components/AIChatView.js';
import { SettingsView } from './components/SettingsView.js';
import { InvestmentPlanner } from './components/InvestmentPlanner/index.js';



import {
  LayoutDashboard, Landmark, TrendingUp, Percent,
  Briefcase, Network, Sparkles, Settings, LogOut, Lock,
  Users, Calendar, Target, ChevronDown
} from 'lucide-react';

type ActivePage = 'dashboard' | 'ledger' | 'investments' | 'tax' | 'business' | 'sankey' | 'ai' | 'settings' | 'planner';

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [dateRange, setDateRange] = useState<GlobalDateRange>({ startDate: null, endDate: null, label: 'All Time' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeProfileId, setActiveProfileId] = useState<string>('');

  const [syncTrigger, setSyncTrigger] = useState(0);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string } | null>(null);

  const showToastAlert = (title: string, message: string) => {
    setToast({ show: true, title, message });
    setTimeout(() => setToast(null), 5000);
  };



  const profiles = dbService.isInitialized() && isUnlocked ? dbService.getProfiles() : [];
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const handleProfileSwitch = (targetId: string) => {
    setActiveProfileId(targetId);
  };



  useEffect(() => {
    // Apply saved theme variables on startup
    const theme = getSavedTheme();
    setTheme(theme);

    // Bootstrap from filesystem to ensure cross-platform sync
    dbService.syncDatabaseState().then(() => {
      setIsInitialized(dbService.isInitialized());
      setIsBooting(false);
    }).catch(() => {
      setIsInitialized(dbService.isInitialized());
      setIsBooting(false);
    });
  }, []);

  useEffect(() => {
    let cleanup = () => { };
    if (isUnlocked) {
      cleanup = dbService.listenForSync(() => {
        setSyncTrigger(prev => prev + 1);
        showToastAlert('Data Synced', 'Database updated in real-time from external mode.');
      });
    }
    return () => cleanup();
  }, [isUnlocked]);

  const handleUnlock = () => {
    setIsUnlocked(true);
    const profiles = dbService.getProfiles();
    if (profiles.length > 0) {
      setActiveProfileId(profiles[0].id); // Default to admin profile id
    }
  };

  const handleSetupComplete = () => {
    setIsInitialized(true);
    handleUnlock();
  };

  const handleLock = () => {
    dbService.lock();
    setIsUnlocked(false);
  };

  // Switch pages helper
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardView key={`${activeProfileId}_${syncTrigger}`} activeProfileId={activeProfileId} dateRange={dateRange} />;
      case 'ledger': return <LedgerView key={`${activeProfileId}_${syncTrigger}`} activeProfileId={activeProfileId} dateRange={dateRange} />;
      case 'investments': return <InvestmentsView key={`${activeProfileId}_${syncTrigger}`} activeProfileId={activeProfileId} />;
      case 'tax': return <TaxView key={`${activeProfileId}_${syncTrigger}`} activeProfileId={activeProfileId} />;
      case 'business': return <BusinessView key={`${activeProfileId}_${syncTrigger}`} activeProfileId={activeProfileId} dateRange={dateRange} />;
      case 'sankey': return <SankeyView key={`${activeProfileId}_${syncTrigger}`} activeProfileId={activeProfileId} dateRange={dateRange} />;
      case 'ai': return <AIChatView key={`${activeProfileId}_${syncTrigger}`} activeProfileId={activeProfileId} />;
      case 'planner': return <InvestmentPlanner key={`${activeProfileId}_${syncTrigger}`} activeProfileId={activeProfileId} />;
      case 'settings': return (
        <SettingsView
          key={`${activeProfileId}_${syncTrigger}`}
          activeProfileId={activeProfileId}
          onActiveProfileChange={(id) => setActiveProfileId(id)}
        />
      );
      default: return <DashboardView key={`${activeProfileId}_${syncTrigger}`} activeProfileId={activeProfileId} dateRange={dateRange} />;
    }
  };

  // 0. Booting phase
  if (isBooting) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem', minWidth: '300px' }}>
          <img src="/logo.png" alt="MyFinanceOS Logo" style={{ width: '56px', height: '56px', borderRadius: '50%', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} />
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>MyFinanceOS</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Synchronizing Secure Vault...</p>
        </div>
      </div>
    );
  }

  // 1. Setup view (First boot check)
  if (!isInitialized) {
    return <Setup onSetupComplete={handleSetupComplete} />;
  }

  // 2. Lock screen PIN entry
  if (!isUnlocked) {
    return <Login onUnlock={handleUnlock} />;
  }

  // 3. Main Unlocked Dashboard Workspace
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <aside className="glass-panel responsive-sidebar" style={{
        width: '240px',
        padding: '1.5rem 1rem',
        margin: '0.75rem',
        marginRight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        borderRadius: 'var(--radius-md) 0px 0px var(--radius-md)',
        borderRight: 'none',
        flexShrink: 0
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem' }}>
          <img src="/logo.png" alt="MyFinanceOS Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }} />
          <span style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>MyFinanceOS</span>
        </div>

        {/* Links list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
            { id: 'ledger', label: 'Banking & Ledger', icon: <Landmark size={18} /> },
            { id: 'investments', label: 'Investments', icon: <TrendingUp size={18} /> },
            { id: 'tax', label: 'Indian Tax Engine', icon: <Percent size={18} /> },
            { id: 'business', label: 'Business Slabs', icon: <Briefcase size={18} /> },
            { id: 'sankey', label: 'Sankey Flow', icon: <Network size={18} /> },
            { id: 'planner', label: 'Investment Planner', icon: <Target size={18} /> },
            { id: 'ai', label: 'AI Assistent', icon: <Sparkles size={18} /> },
            { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
          ].map(page => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id as ActivePage)}
              className="btn btn-secondary"
              style={{
                justifyContent: 'flex-start',
                padding: '0.65rem 0.8rem',
                fontSize: '0.85rem',
                border: 'none',
                background: activePage === page.id ? 'var(--accent-grad)' : 'transparent',
                color: activePage === page.id ? '#fff' : 'var(--text-secondary)'
              }}
            >
              {page.icon}
              <span>{page.label}</span>
            </button>
          ))}
        </nav>

        {/* Lock session */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <Users size={12} />
              <span>Active Profile</span>
            </div>
            {profiles.length > 0 ? (
              <select
                value={activeProfileId}
                onChange={(e) => handleProfileSwitch(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  padding: '0.3rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '0.2rem',
                  outline: 'none'
                }}
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#111' }}>
                    {p.name} ({p.relationship})
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '0.85rem' }}>No Profile</span>
            )}
          </div>
          <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none', padding: '0.65rem 0.8rem' }} onClick={handleLock}>
            <LogOut size={18} color="var(--error)" />
            <span style={{ color: 'var(--error)' }}>Lock Vault</span>
          </button>
        </div>

      </aside>

      {/* Main Content Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

        {/* Header */}
        <header className="glass-panel" style={{
          margin: '0.75rem',
          marginBottom: 0,
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          borderRadius: '0px var(--radius-md) 0px 0px',
          borderLeft: 'none',
          overflow: 'visible',
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Global Date Filter */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.4rem', background: 'var(--accent-1)', color: '#000', fontWeight: 600 }}
              >
                <Calendar size={14} />
                <span>{dateRange.label}</span>
                <ChevronDown size={14} />
              </button>

              {showDatePicker && (
                <div className="glass-panel" style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  zIndex: 100,
                  minWidth: '200px'
                }}>
                  {(() => {
                    let earliest = new Date();
                    const checkDate = (dString: string) => {
                      const d = new Date(dString);
                      if (!isNaN(d.getTime()) && d < earliest) earliest = d;
                    };
                    dbService.getTransactions().forEach(t => checkDate(t.date));
                    dbService.getInvoices().forEach(i => checkDate(i.date));
                    dbService.getRegister().forEach(r => checkDate(r.date));

                    const options = [
                      { label: 'This Week', getRange: () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return { startDate: d.toISOString().split('T')[0], endDate: null, label: 'This Week' }; } },
                      { label: 'This Month', getRange: () => { const d = new Date(); d.setDate(1); return { startDate: d.toISOString().split('T')[0], endDate: null, label: 'This Month' }; } },
                      { label: 'This Year', getRange: () => { const d = new Date(new Date().getFullYear(), 0, 1); return { startDate: d.toISOString().split('T')[0], endDate: null, label: 'This Year' }; } },
                      { label: 'Last Year', getRange: () => { const d = new Date(new Date().getFullYear() - 1, 0, 1); const e = new Date(new Date().getFullYear() - 1, 11, 31); return { startDate: d.toISOString().split('T')[0], endDate: e.toISOString().split('T')[0], label: 'Last Year' }; } },
                      { label: 'All Time', getRange: () => ({ startDate: null, endDate: null, label: 'All Time' }) }
                    ];

                    return options.map(opt => {
                      const range = opt.getRange();
                      let isDisabled = false;
                      // If the range ends before the earliest data, disable it
                      if (range.endDate) {
                        const end = new Date(range.endDate);
                        if (end < earliest) isDisabled = true;
                      }

                      return (
                        <button
                          key={opt.label}
                          className="btn btn-secondary"
                          style={{
                            justifyContent: 'flex-start',
                            border: 'none',
                            background: dateRange.label === opt.label ? 'rgba(255,255,255,0.1)' : 'transparent',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.8rem',
                            opacity: isDisabled ? 0.4 : 1,
                            cursor: isDisabled ? 'not-allowed' : 'pointer'
                          }}
                          disabled={isDisabled}
                          onClick={() => {
                            setDateRange(range);
                            setShowDatePicker(false);
                          }}
                        >
                          {opt.label} {isDisabled && <span style={{ fontSize: '0.65rem', marginLeft: 'auto' }}>(No data)</span>}
                        </button>
                      );
                    });
                  })()}

                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0', paddingTop: '0.5rem' }}>
                    <div style={{ padding: '0 0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Custom Range</div>
                    <div style={{ display: 'flex', gap: '0.4rem', padding: '0 0.5rem' }}>
                      <input type="date" className="form-input" style={{ fontSize: '0.75rem', padding: '0.2rem', width: '110px' }} value={customStart} onChange={e => setCustomStart(e.target.value)} />
                      <input type="date" className="form-input" style={{ fontSize: '0.75rem', padding: '0.2rem', width: '110px' }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ width: 'calc(100% - 1rem)', margin: '0.5rem auto 0', padding: '0.3rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        setDateRange({ startDate: customStart || null, endDate: customEnd || null, label: customStart ? `${customStart} to ${customEnd || 'Now'}` : 'Custom' });
                        setShowDatePicker(false);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Encrypted session active</span>
            </div>
          </div>
        </header>

        {/* Core Screen Content */}
        <main style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
          {renderPage()}
        </main>

      </div>



      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px',
          background: 'rgba(20, 20, 20, 0.95)', border: '1px solid var(--accent-1)',
          borderRadius: 'var(--radius-md)', padding: '1rem', width: '320px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 10000,
          animation: 'slideIn 0.3s ease-out', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-1)' }}>⚡ {toast.title}</span>
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>×</button>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>{toast.message}</p>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;
