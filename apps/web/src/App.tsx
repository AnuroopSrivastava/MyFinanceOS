import React, { useState, useEffect } from 'react';
import { dbService } from '@financeos/database';
import { authSession } from '@financeos/auth';
import { GlobalDateRange } from './utils/dateFilter.js';
import { getSavedTheme, setTheme } from '@financeos/ui';
import { Landing } from './components/Landing.js';
import { DashboardView } from './components/DashboardView.js';
import { LedgerView } from './components/LedgerView.js';
import { InvestmentsView } from './components/InvestmentsView.js';
import { TaxView } from './components/TaxView.js';
import { BusinessView } from './components/BusinessView.js';
import { SankeyView } from './components/SankeyView.js';
import { AIChatView } from './components/AIChatView.js';
import { SettingsView } from './components/SettingsView.js';
import { InvestmentPlanner } from './components/InvestmentPlanner/index.js';
import { CommandPalette } from './components/CommandPalette.js';

import {
  LayoutDashboard, Landmark, TrendingUp, Percent,
  Briefcase, Network, Sparkles, Settings, LogOut, Lock,
  Users, Calendar, Target, ChevronDown, UploadCloud, Menu, X
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const [syncTrigger, setSyncTrigger] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
    const cleanup = dbService.onUnsavedChangeStatus((status) => {
      setHasUnsavedChanges(status);
    });
    return () => cleanup();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Ctrl+K command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Apply saved theme variables on startup
    const theme = getSavedTheme();
    setTheme(theme);

    // Bootstrap from filesystem to ensure cross-platform sync
    dbService.syncDatabaseState().then(() => {
      if (authSession.isAuthenticated()) {
        dbService.unlock().then((success) => {
          if (success) {
            setIsInitialized(true);
            setIsUnlocked(true);
            const profiles = dbService.getProfiles();
            if (profiles.length > 0) {
              setActiveProfileId(profiles[0].id);
            }
          } else {
            setIsInitialized(dbService.isInitialized());
          }
          setIsBooting(false);
        }).catch(() => {
          setIsInitialized(dbService.isInitialized());
          setIsBooting(false);
        });
      } else {
        setIsInitialized(dbService.isInitialized());
        setIsBooting(false);
      }
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
      setActiveProfileId(profiles[0].id);
    }
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

  // 1. Lock screen / Landing
  if (!isUnlocked) {
    return <Landing onUnlock={handleUnlock} />;
  }

  // 2. Main Unlocked Dashboard Workspace
  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            zIndex: 999
          }} 
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`glass-panel responsive-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{
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

        {/* Logo & Mobile Close Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/logo.png" alt="MyFinanceOS Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }} />
            <span style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>MyFinanceOS</span>
          </div>
          {isMobileMenuOpen && (
            <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          )}
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
            { id: 'ai', label: 'AI Assistant', icon: <Sparkles size={18} /> },
            { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
          ].map(page => (
            <button
              key={page.id}
              onClick={() => {
                if (hasUnsavedChanges && activePage !== page.id) {
                  const confirmLeave = window.confirm('You have unsaved changes that are still syncing to the cloud. Are you sure you want to change pages?');
                  if (!confirmLeave) return;
                }
                setActivePage(page.id as ActivePage);
                setIsMobileMenuOpen(false);
              }}
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
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '0px var(--radius-md) 0px 0px',
          borderLeft: 'none',
          overflow: 'visible',
          zIndex: 50
        }}>
          {/* Mobile Hamburger Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-color)' }}
            >
              <Menu size={18} />
            </button>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {hasUnsavedChanges && (
              <button
                className="btn animate-fade-in"
                onClick={() => {
                  dbService.syncToCloud().then(() => showToastAlert('Cloud Sync', 'Saved to Google Drive'));
                }}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.4rem', background: '#3b82f6', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}
              >
                <UploadCloud size={14} />
                <span>Save to Cloud</span>
              </button>
            )}

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
                <div className="glass-panel animate-fade-in" style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  zIndex: 100,
                  minWidth: '200px',
                  background: '#1a1b26',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)'
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

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(page) => {
          setActivePage(page as ActivePage);
          setIsCommandPaletteOpen(false);
        }}
        onAction={(action) => {
          if (action === 'lock') handleLock();
          else if (action === 'export') {
            const raw = dbService.getRawDb();
            const blob = new Blob([raw], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `financeos_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          setIsCommandPaletteOpen(false);
        }}
      />

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
