import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useInteractiveCardSystem } from './components/ui/InteractiveCard.js';

import { SaveStatusPopup } from './components/SaveStatusPopup.js';

import { DocumentVaultView } from './components/DocumentVaultView.js';
import { AutomationView } from './components/AutomationView.js';
import { ReportsView } from './components/ReportsView.js';

import {
  LayoutDashboard, Landmark, TrendingUp, Percent,
  Briefcase, Network, Sparkles, Settings, LogOut, Lock,
  Users, Calendar, Target, ChevronDown, UploadCloud, Menu, X,
  CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Zap, FileSpreadsheet
} from 'lucide-react';

type ActivePage = 'dashboard' | 'ledger' | 'investments' | 'tax' | 'business' | 'sankey' | 'ai' | 'settings' | 'planner' | 'vault' | 'automation' | 'reports';

const PAGE_TITLES: Record<ActivePage, string> = {
  dashboard: 'Mission Control',
  ledger: 'Banking & Ledger',
  investments: 'Portfolio & Investments',
  tax: 'Tax & GST Suite',
  business: 'Business Suite',
  sankey: 'Sankey Cash Flow',
  planner: 'Investment Planner',
  vault: 'Encrypted Vault',
  automation: 'Automation Rules',
  reports: '1-Click Reports',
  ai: 'AI Financial Assistant',
  settings: 'Settings'
};

const App: React.FC = () => {
  useInteractiveCardSystem();
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSavedBadge, setShowSavedBadge] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string } | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToastAlert = (title: string, message: string) => {
    setToast({ show: true, title, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  };

  const profiles = dbService.isInitialized() && isUnlocked ? dbService.getProfiles() : [];
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  // Sync profile to database service synchronously so getters are scoped
  if (activeProfileId) {
    dbService.setSessionProfile(activeProfileId);
  }

  const handleProfileSwitch = (targetId: string) => {
    if (hasUnsavedChanges || saveError) {
      setShowSavePopup(true);
    }
    setActiveProfileId(targetId);
  };

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, [activePage, isUnlocked]);

  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cleanupUnsaved = dbService.onUnsavedChangeStatus((status) => {
      setHasUnsavedChanges(status);
      if (!status) {
        setShowSavedBadge(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setShowSavedBadge(false), 3000);
      }
    });
    const cleanupError = dbService.onSaveErrorStatus((err) => {
      setSaveError(err);
      if (err) {
        setShowSavePopup(true);
      }
    });
    return () => {
      cleanupUnsaved();
      cleanupError();
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
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
      case 'vault': return <DocumentVaultView key={`${activeProfileId}_${syncTrigger}`} profileId={activeProfileId} />;
      case 'automation': return <AutomationView key={`${activeProfileId}_${syncTrigger}`} profileId={activeProfileId} />;
      case 'reports': return <ReportsView key={`${activeProfileId}_${syncTrigger}`} profileId={activeProfileId} />;
      case 'settings': return (
        <SettingsView
          key={`${activeProfileId}_${syncTrigger}`}
          activeProfileId={activeProfileId}
          onActiveProfileChange={(id) => {
            setActiveProfileId(id);
            setSyncTrigger(prev => prev + 1);
          }}
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
          className="responsive-sidebar-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`responsive-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{
        width: '260px',
        padding: '1.5rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        background: 'rgba(10, 10, 12, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        flexShrink: 0,
        zIndex: 1000,
        overflowY: 'auto'
      }}>

        {/* Logo & Mobile Close Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo.png" alt="MyFinanceOS Logo" style={{ width: '30px', height: '30px', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }} />
            <span style={{ fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#fff' }}>MyFinanceOS</span>
          </div>
          {isMobileMenuOpen && (
            <button
              onPointerDown={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Links list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {[
            { id: 'dashboard', label: 'Mission Control', icon: <LayoutDashboard size={18} /> },
            { id: 'ledger', label: 'Banking & Ledger', icon: <Landmark size={18} /> },
            { id: 'investments', label: 'Portfolio & Investments', icon: <TrendingUp size={18} /> },
            { id: 'tax', label: 'Tax & GST Suite', icon: <Percent size={18} /> },
            { id: 'business', label: 'Business Suite', icon: <Briefcase size={18} /> },
            { id: 'planner', label: 'Investment Planner', icon: <Target size={18} /> },
            { id: 'vault', label: 'Encrypted Vault', icon: <ShieldCheck size={18} /> },
            { id: 'automation', label: 'Automation Rules', icon: <Zap size={18} /> },
            { id: 'reports', label: '1-Click Reports', icon: <FileSpreadsheet size={18} /> },
            { id: 'sankey', label: 'Sankey Cash Flow', icon: <Network size={18} /> },
            { id: 'ai', label: 'AI Financial Assistant', icon: <Sparkles size={18} /> },
            { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
          ].map(page => (
            <button
              key={page.id}
              onPointerDown={() => {
                if (hasUnsavedChanges && activePage !== page.id) {
                  const confirmLeave = window.confirm('You have unsaved changes that are still syncing to the cloud. Are you sure you want to change pages?');
                  if (!confirmLeave) return;
                }
                setActivePage(page.id as ActivePage);
                setIsMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                justifyContent: 'flex-start',
                padding: '0.65rem 1rem',
                fontSize: '0.875rem',
                fontWeight: activePage === page.id ? 500 : 400,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: activePage === page.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: activePage === page.id ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
              }}
            >
              <div style={{
                color: activePage === page.id ? 'var(--accent-1)' : 'rgba(255, 255, 255, 0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {page.icon}
              </div>
              <span style={{ letterSpacing: '0.01em' }}>{page.label}</span>
            </button>
          ))}
        </nav>

        {/* Lock session */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              {activeProfile?.avatar ? (
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={activeProfile.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <Users size={12} />
              )}
              <span>Active Profile</span>
            </div>
            {profiles.length > 0 ? (
              <select
                value={activeProfileId}
                onChange={(e) => handleProfileSwitch(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  padding: '0.4rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '0.2rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#111' }}>
                    {p.name} {p.relationship ? `(${p.relationship})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '0.85rem' }}>No Profile</span>
            )}
          </div>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              justifyContent: 'flex-start', border: 'none', padding: '0.65rem 0.8rem',
              background: 'transparent', cursor: 'pointer',
              color: 'var(--error)', opacity: 0.9, transition: 'opacity 0.2s',
              fontSize: '0.85rem'
            }}
            onPointerDown={handleLock}
          >
            <LogOut size={16} />
            <span>Lock Vault</span>
          </button>
        </div>

      </aside>

      {/* Main Content Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

        {/* Header */}
        <header style={{
          padding: '0.65rem 1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(10, 10, 12, 0.4)',
          backdropFilter: 'blur(20px)',
          zIndex: 50
        }}>
          {/* Mobile Hamburger Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary mobile-menu-btn"
              onPointerDown={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ padding: '0.35rem 0.5rem', border: '1px solid var(--border-color)' }}
            >
              <Menu size={16} />
            </button>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {PAGE_TITLES[activePage]}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
            {/* Live Auto-Save Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {saveError ? (
                <button
                  className="btn animate-fade-in"
                  onPointerDown={() => setShowSavePopup(true)}
                  title="Click to view error and retry"
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    gap: '0.4rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <AlertCircle size={14} />
                  <span>Save Not Done</span>
                </button>
              ) : hasUnsavedChanges ? (
                <button
                  className="btn animate-fade-in"
                  onPointerDown={() => {
                    dbService.syncToCloud().then(() => showToastAlert('Auto-Save', 'State saved to cloud'));
                  }}
                  title="Saving changes in background..."
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    gap: '0.4rem',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={14} className="spin" />
                  <span>Saving...</span>
                </button>
              ) : showSavedBadge ? (
                <div
                  className="animate-fade-in"
                  title="All feature states are automatically saved"
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    gap: '0.4rem',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Auto-Saved</span>
                </div>
              ) : null}
            </div>

            {/* Global Date Filter */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-primary"
                onPointerDown={() => setShowDatePicker(!showDatePicker)}
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
                          onPointerDown={() => {
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0 0.5rem' }}>
                      <input type="date" className="form-input" style={{ fontSize: '0.75rem', padding: '0.2rem', width: '110px' }} value={customStart} onChange={e => setCustomStart(e.target.value)} />
                      <input type="date" className="form-input" style={{ fontSize: '0.75rem', padding: '0.2rem', width: '110px' }} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ width: 'calc(100% - 1rem)', margin: '0.5rem auto 0', padding: '0.3rem', fontSize: '0.8rem' }}
                      onPointerDown={() => {
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

            <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Encrypted session active</span>
            </div>
          </div>
        </header>

        {/* Core Screen Content */}
        <main className="main-workspace" style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', background: 'transparent' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ height: '100%' }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav">
          <button
            className={`mobile-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onPointerDown={() => { setActivePage('dashboard'); setIsMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>Control</span>
          </button>
          <button
            className={`mobile-nav-item ${activePage === 'ledger' ? 'active' : ''}`}
            onPointerDown={() => { setActivePage('ledger'); setIsMobileMenuOpen(false); }}
          >
            <Landmark size={18} />
            <span>Ledger</span>
          </button>
          <button
            className={`mobile-nav-item ${activePage === 'investments' ? 'active' : ''}`}
            onPointerDown={() => { setActivePage('investments'); setIsMobileMenuOpen(false); }}
          >
            <TrendingUp size={18} />
            <span>Wealth</span>
          </button>
          <button
            className={`mobile-nav-item ${activePage === 'tax' ? 'active' : ''}`}
            onPointerDown={() => { setActivePage('tax'); setIsMobileMenuOpen(false); }}
          >
            <Percent size={18} />
            <span>Tax</span>
          </button>
          <button
            className={`mobile-nav-item ${activePage === 'ai' ? 'active' : ''}`}
            onPointerDown={() => { setActivePage('ai'); setIsMobileMenuOpen(false); }}
          >
            <Sparkles size={18} />
            <span>AI</span>
          </button>
          <button
            className={`mobile-nav-item ${isMobileMenuOpen ? 'active' : ''}`}
            onPointerDown={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={18} />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '5%',
          background: 'rgba(20, 20, 20, 0.95)', border: '1px solid var(--accent-1)',
          borderRadius: 'var(--radius-md)', padding: '1rem', width: '90%', maxWidth: '320px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 10000,
          animation: 'slideIn 0.3s ease-out', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} />
              {toast.title}
            </span>
            <button onPointerDown={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>{toast.message}</p>
        </div>
      )}

      {/* Save Status Warning / Error Popup */}
      <SaveStatusPopup
        isOpen={showSavePopup}
        onClose={() => setShowSavePopup(false)}
        saveError={saveError}
        hasUnsavedChanges={hasUnsavedChanges}
      />

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
