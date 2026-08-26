import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbService } from '@financeos/database';
import { authSession } from '@financeos/auth';
import { GlobalDateRange } from './utils/dateFilter.js';
import { Button, DateRangePicker, getSavedTheme, setTheme, useInteractiveCardSystem, useToast, CommandPalette, type CommandItem, Toaster } from '@financeos/ui';
import { Landing } from './components/Landing.js';
import { PinGuard } from './components/PinGuard.js';
import { ProfileSetupGuard } from './components/ProfileSetupGuard.js';
import { DashboardView } from './components/DashboardView.js';
import { LedgerView } from './components/LedgerView.js';
import { InvestmentsView } from './components/InvestmentsView.js';
import { TaxView } from './components/TaxView.js';
import { BusinessView } from './components/BusinessView.js';
import { SankeyView } from './components/SankeyView.js';
import { AIChatView } from './components/AIChatView.js';
import { SettingsView } from './components/SettingsView.js';
import { InvestmentPlanner } from './components/InvestmentPlanner/index.js';
import { SaveStatusPopup } from './components/SaveStatusPopup.js';
import { DocumentVaultView } from './components/DocumentVaultView.js';
import { AutomationView } from './components/AutomationView.js';
import { ReportsView } from './components/ReportsView.js';

import { useDbVersion } from './hooks/useDbSync.js';
import {
  LayoutDashboard, Landmark, TrendingUp, Percent,
  Briefcase, Network, Sparkles, Settings, LogOut, Lock,
  Users, Calendar, Target, ChevronDown, UploadCloud, Menu, X,
  CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Zap, FileSpreadsheet,
  Calculator, Download, Plus
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
  const dbVersion = useDbVersion();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsPin, setNeedsPin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [dateRange, setDateRange] = useState<GlobalDateRange>({ startDate: null, endDate: null, label: 'All Time' });
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const [syncTrigger, setSyncTrigger] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSavedBadge, setShowSavedBadge] = useState(false);

  const { toast, toasts } = useToast();

  const profiles = isUnlocked && dbService.isUnlocked() ? dbService.getProfiles() : [];
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  // Sync profile to database service synchronously so getters are scoped
  if (activeProfileId) {
    dbService.setSessionProfile(activeProfileId);
  }

  useEffect(() => {
    if (isUnlocked && dbService.isUnlocked()) {
      const profs = dbService.getProfiles();
      if (profs.length > 0) {
        if (!activeProfileId || !profs.some(p => p.id === activeProfileId)) {
          setActiveProfileId(profs[0].id);
        }
      } else if (activeProfileId) {
        setActiveProfileId('');
      }
    }
  }, [isUnlocked, dbVersion, activeProfileId]);

  const commandPaletteItems: import('@financeos/ui').CommandItem[] = [
    { id: 'nav-dashboard', label: 'Mission Control Dashboard', group: 'Pages', icon: <LayoutDashboard size={16} />, action: () => { setActivePage('dashboard'); setIsCommandPaletteOpen(false); }, keywords: 'home overview networth' },
    { id: 'nav-ledger', label: 'Banking & Ledger', group: 'Pages', icon: <Landmark size={16} />, action: () => { setActivePage('ledger'); setIsCommandPaletteOpen(false); }, keywords: 'transactions bank account' },
    { id: 'nav-investments', label: 'Portfolio & Investments', group: 'Pages', icon: <TrendingUp size={16} />, action: () => { setActivePage('investments'); setIsCommandPaletteOpen(false); }, keywords: 'portfolio stocks mutual funds fd gold nps US stocks crypto bonds' },
    { id: 'nav-tax', label: 'Tax & GST Suite', group: 'Pages', icon: <Percent size={16} />, action: () => { setActivePage('tax'); setIsCommandPaletteOpen(false); }, keywords: 'income tax regime tds 80c capital gains itr' },
    { id: 'nav-business', label: 'Business Suite', group: 'Pages', icon: <Briefcase size={16} />, action: () => { setActivePage('business'); setIsCommandPaletteOpen(false); }, keywords: 'gst invoice inventory contacts payroll profit loss' },
    { id: 'nav-planner', label: 'Investment Planner', group: 'Pages', icon: <Target size={16} />, action: () => { setActivePage('planner'); setIsCommandPaletteOpen(false); }, keywords: 'fire sip goal emi calculator' },
    { id: 'nav-vault', label: 'Encrypted Document Vault', group: 'Pages', icon: <ShieldCheck size={16} />, action: () => { setActivePage('vault'); setIsCommandPaletteOpen(false); }, keywords: 'documents pan aadhaar tax property insurance encrypted' },
    { id: 'nav-automation', label: 'Automation Rules & Reminders', group: 'Pages', icon: <Zap size={16} />, action: () => { setActivePage('automation'); setIsCommandPaletteOpen(false); }, keywords: 'auto categorize rules recurring sip emi reminder' },
    { id: 'nav-reports', label: '1-Click Executive Reports', group: 'Pages', icon: <FileSpreadsheet size={16} />, action: () => { setActivePage('reports'); setIsCommandPaletteOpen(false); }, keywords: 'report pdf csv excel annual monthly audit' },
    { id: 'nav-sankey', label: 'Sankey Cash Flow', group: 'Pages', icon: <Network size={16} />, action: () => { setActivePage('sankey'); setIsCommandPaletteOpen(false); }, keywords: 'money flow diagram visual' },
    { id: 'nav-ai', label: 'AI Financial Assistant', group: 'Pages', icon: <Sparkles size={16} />, action: () => { setActivePage('ai'); setIsCommandPaletteOpen(false); }, keywords: 'chat query ask question advisor' },
    { id: 'nav-settings', label: 'Settings', group: 'Pages', icon: <Settings size={16} />, action: () => { setActivePage('settings'); setIsCommandPaletteOpen(false); }, keywords: 'theme profile backup export' },
    { id: 'act-lock', label: 'Lock Vault', group: 'Actions', icon: <Lock size={16} />, action: () => { handleLock(); setIsCommandPaletteOpen(false); }, keywords: 'logout secure close' },
    { id: 'act-export', label: 'Export Full Backup', group: 'Actions', icon: <Download size={16} />, action: () => { 
        const raw = dbService.getRawDb();
        const blob = new Blob([raw], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `financeos_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsCommandPaletteOpen(false);
      }, keywords: 'download backup save json' },
    { id: 'act-add-tx', label: 'Add New Transaction', group: 'Actions', icon: <Plus size={16} />, action: () => { setActivePage('ledger'); setIsCommandPaletteOpen(false); }, keywords: 'income expense entry new' },
    { id: 'act-add-account', label: 'Add Bank Account', group: 'Actions', icon: <Landmark size={16} />, action: () => { setActivePage('ledger'); setIsCommandPaletteOpen(false); }, keywords: 'new bank savings current' },
    { id: 'act-emi', label: 'Open EMI Calculator', group: 'Actions', icon: <Calculator size={16} />, action: () => { setActivePage('planner'); setIsCommandPaletteOpen(false); }, keywords: 'loan home car education amortization' },
  ];

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

    const initialize = async () => {
      try {
        const hasAuthParam = typeof window !== 'undefined' && (
          window.location.search.includes('code=') ||
          window.location.hash.includes('access_token=') ||
          window.location.hash.includes('error=')
        );
        const timeoutMs = hasAuthParam ? 5000 : 1500;
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
        const authPromise = authSession.isAuthenticated();
        const isAuthResult = await Promise.race([authPromise, timeoutPromise]);
        const isAuth = isAuthResult === true;
        setIsAuthenticated(isAuth);

        if (isAuth) {
          const unlockResult = await dbService.unlock();
          const initialized = await dbService.isInitialized();
          setIsInitialized(initialized);

          if (unlockResult === true) {
            setIsUnlocked(true);
            setNeedsPin(false);
            const profs = dbService.getProfiles();
            if (profs.length > 0) {
              setActiveProfileId(profs[0].id);
            }
          } else if (unlockResult === 'needs_pin' || initialized) {
            setNeedsPin(true);
          }
        } else {
          const initialized = await dbService.isInitialized();
          setIsInitialized(initialized);
        }
      } catch (err) {
        console.error('Error during app boot initialization:', err);
        try {
          const initialized = await dbService.isInitialized();
          setIsInitialized(initialized);
        } catch {
          setIsInitialized(false);
        }
      }
    };

    initialize();
  }, []);

  // Listen for Supabase OAuth session changes
  useEffect(() => {
    const unsubscribe = authSession.onAuthStateChange(async (session) => {
      if (session) {
        setIsAuthenticated(true);
        const unlockResult = await dbService.unlock();
        const initialized = await dbService.isInitialized();
        setIsInitialized(initialized);

        if (unlockResult === true) {
          setIsUnlocked(true);
          setNeedsPin(false);
          const profs = dbService.getProfiles();
          if (profs.length > 0) {
            setActiveProfileId(profs[0].id);
          }
        } else if (unlockResult === 'needs_pin' || initialized) {
          setNeedsPin(true);
        }
      } else {
        setIsAuthenticated(false);
        setIsUnlocked(false);
        setNeedsPin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let cleanup = () => { };
    if (isUnlocked) {
      cleanup = dbService.listenForSync(() => {
        setSyncTrigger(prev => prev + 1);
        toast.success('Vault Synchronized', 'Changes synchronized across browser tabs.');
      });
    }
    return () => cleanup();
  }, [isUnlocked]);

  const handlePinVerify = async (pin: string): Promise<boolean> => {
    authSession.setSessionPin(pin);
    const success = await dbService.unlock();
    if (success === true) {
      setIsUnlocked(true);
      setNeedsPin(false);
      setIsInitialized(true);
      const profs = dbService.getProfiles();
      if (profs.length > 0) {
        setActiveProfileId(profs[0].id);
      }
      return true;
    }
    return false;
  };

  const handlePinSuccess = () => {
    setIsUnlocked(true);
    setNeedsPin(false);
    setIsInitialized(true);
    const profs = dbService.getProfiles();
    if (profs.length > 0) {
      setActiveProfileId(profs[0].id);
    }
  };

  const handleSetupComplete = (profileId: string) => {
    setIsInitialized(true);
    setIsUnlocked(true);
    setNeedsPin(false);
    setActiveProfileId(profileId);
  };

  const handleUnlock = async () => {
    try {
      const isAuth = await authSession.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        const unlockResult = await dbService.unlock();
        const initialized = await dbService.isInitialized();
        setIsInitialized(initialized);

        if (unlockResult === true) {
          setIsUnlocked(true);
          setNeedsPin(false);
          const profs = dbService.getProfiles();
          if (profs.length > 0) {
            setActiveProfileId(profs[0].id);
          }
        } else if (unlockResult === 'needs_pin' || initialized) {
          setNeedsPin(true);
        }
      }
    } catch (err) {
      console.error('Failed to unlock database:', err);
    }
  };

  const handleLock = () => {
    dbService.lock();
    setIsUnlocked(false);
    setNeedsPin(true);
  };

  // Switch pages helper
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardView key={`${activeProfileId}`} activeProfileId={activeProfileId} dateRange={dateRange} />;
      case 'ledger': return <LedgerView key={`${activeProfileId}`} activeProfileId={activeProfileId} dateRange={dateRange} />;
      case 'investments': return <InvestmentsView key={`${activeProfileId}`} activeProfileId={activeProfileId} />;
      case 'tax': return <TaxView key={`${activeProfileId}`} activeProfileId={activeProfileId} />;
      case 'business': return <BusinessView key={`${activeProfileId}`} activeProfileId={activeProfileId} dateRange={dateRange} />;
      case 'sankey': return <SankeyView key={`${activeProfileId}`} activeProfileId={activeProfileId} dateRange={dateRange} />;
      case 'ai': return <AIChatView key={`${activeProfileId}`} activeProfileId={activeProfileId} />;
      case 'planner': return <InvestmentPlanner key={`${activeProfileId}`} activeProfileId={activeProfileId} />;
      case 'vault': return <DocumentVaultView key={`${activeProfileId}`} profileId={activeProfileId} />;
      case 'automation': return <AutomationView key={`${activeProfileId}`} profileId={activeProfileId} />;
      case 'reports': return <ReportsView key={`${activeProfileId}`} profileId={activeProfileId} />;
      case 'settings': return (
        <SettingsView
          key={`${activeProfileId}`}
          activeProfileId={activeProfileId}
          onActiveProfileChange={(id: string) => {
            setActiveProfileId(id);
          }}
        />
      );
      default: return <DashboardView key={`${activeProfileId}`} activeProfileId={activeProfileId} dateRange={dateRange} />;
    }
  };

  // 1. Unauthenticated landing screen
  if (!isAuthenticated && !isUnlocked) {
    return <Landing onUnlock={handleUnlock} />;
  }

  // 2. Authenticated but needs PIN verification to decrypt database
  if (needsPin && !isUnlocked) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <PinGuard
          profile={activeProfile || { id: 'p1', name: 'Treasury Admin', role: 'Admin', relationship: 'Self', isNomineeProvided: true }}
          onSuccess={handlePinSuccess}
          overrideVerify={handlePinVerify}
        />
      </div>
    );
  }

  // 3. Authenticated but uninitialized profile setup
  if (isAuthenticated && !isInitialized && !isUnlocked) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <ProfileSetupGuard onComplete={handleSetupComplete} />
      </div>
    );
  }

  // 4. Authenticated fallback (prompt for PIN or setup, never show Landing when authenticated)
  if (!isUnlocked) {
    if (isAuthenticated) {
      if (!isInitialized) {
        return (
          <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
            <ProfileSetupGuard onComplete={handleSetupComplete} />
          </div>
        );
      }
      return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
          <PinGuard
            profile={activeProfile || { id: 'p1', name: 'Treasury Admin', role: 'Admin', relationship: 'Self', isNomineeProvided: true }}
            onSuccess={handlePinSuccess}
            overrideVerify={handlePinVerify}
          />
        </div>
      );
    }
    return <Landing onUnlock={handleUnlock} />;
  }

  // 2. Main Unlocked Dashboard Workspace
  return (
    <div className="page-shell" style={{ position: 'relative' }}>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="responsive-sidebar-overlay"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`page-sidebar responsive-sidebar ${isMobileMenuOpen ? 'is-open' : ''}`} style={{ padding: '1.5rem 1.15rem', gap: '1.75rem' }}>

        {/* Logo & Mobile Close Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, hsl(222, 10%, 16%) 0%, hsl(222, 10%, 10%) 100%)',
              border: '1px solid hsla(0, 0%, 100%, 0.12)',
              boxShadow: 'var(--neo-raised-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px'
            }}>
              <img src="/logo.png" alt="MyFinanceOS Logo" style={{ width: '26px', height: '26px', borderRadius: '6px' }} />
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              MyFinanceOS
            </span>
          </div>
          {isMobileMenuOpen && (
            <button
              onPointerDown={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
              style={{
                background: 'hsl(222, 10%, 14%)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--neo-raised-sm)'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Links list */}
        <nav role="navigation" aria-label="Main navigation" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
          {[
            {
              title: 'Command',
              items: [
                { id: 'dashboard' as ActivePage, label: 'Mission Control', icon: <LayoutDashboard size={17} /> },
                { id: 'ledger' as ActivePage, label: 'Banking & Ledger', icon: <Landmark size={17} /> },
                { id: 'investments' as ActivePage, label: 'Investments', icon: <TrendingUp size={17} /> },
              ]
            },
            {
              title: 'Tax & Commerce',
              items: [
                { id: 'tax' as ActivePage, label: 'Tax & GST Suite', icon: <Percent size={17} /> },
                { id: 'business' as ActivePage, label: 'Business Suite', icon: <Briefcase size={17} /> },
                { id: 'planner' as ActivePage, label: 'Investment Planner', icon: <Target size={17} /> },
              ]
            },
            {
              title: 'Vault & Intelligence',
              items: [
                { id: 'vault' as ActivePage, label: 'Encrypted Vault', icon: <ShieldCheck size={17} /> },
                { id: 'automation' as ActivePage, label: 'Automation Rules', icon: <Zap size={17} /> },
                { id: 'reports' as ActivePage, label: 'Executive Reports', icon: <FileSpreadsheet size={17} /> },
                { id: 'sankey' as ActivePage, label: 'Sankey Flow', icon: <Network size={17} /> },
                { id: 'ai' as ActivePage, label: 'AI Assistant', icon: <Sparkles size={17} /> },
                { id: 'settings' as ActivePage, label: 'Settings', icon: <Settings size={17} /> }
              ]
            }
          ].map(section => (
            <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0.2rem 0.5rem 0.1rem',
                fontFamily: 'var(--font-display)'
              }}>
                {section.title}
              </div>
              {section.items.map(page => {
                const isActive = activePage === page.id;
                return (
                  <button
                    key={page.id}
                    onPointerDown={() => {
                      if (hasUnsavedChanges && activePage !== page.id) {
                        const confirmLeave = window.confirm('You have unsaved changes currently synchronizing with your vault. Do you want to leave this section anyway?');
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
                      padding: '0.55rem 0.85rem',
                      fontSize: '0.84rem',
                      fontWeight: isActive ? 700 : 500,
                      border: isActive ? '1px solid var(--border-strong, hsla(0, 0%, 100%, 0.1))' : '1px solid transparent',
                      borderRadius: '10px',
                      background: isActive ? 'hsl(222, 10%, 11%)' : 'transparent',
                      color: isActive ? 'var(--text-primary, #ffffff)' : 'var(--text-secondary, hsl(215, 20%, 65%))',
                      boxShadow: isActive ? 'var(--neo-inset-sm, inset 2px 2px 5px hsla(222, 25%, 3%, 0.85), inset -2px -2px 5px hsla(222, 15%, 20%, 0.3))' : 'none',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--surface-tint-strong)'; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        left: '0.3rem',
                        width: '3px',
                        height: '16px',
                        borderRadius: '2px',
                        background: 'var(--accent-1, #06b6d4)',
                        boxShadow: '0 0 8px var(--accent-1, #06b6d4)'
                      }} />
                    )}
                    <div style={{
                      color: isActive ? 'var(--accent-1, #06b6d4)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: isActive ? '0.35rem' : '0'
                    }}>
                      {page.icon}
                    </div>
                    <span style={{ letterSpacing: '0.01em' }}>{page.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Lock session & Profile well */}
        <div style={{
          borderTop: '1px solid var(--border-color, hsla(0,0,0,0.08))',
          paddingTop: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            padding: '0.65rem 0.85rem',
            background: 'hsl(222, 10%, 9%)',
            borderRadius: '10px',
            border: '1px solid hsla(0, 0%, 100%, 0.05)',
            boxShadow: 'var(--neo-inset-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                aria-label="Switch active profile"
                style={{
                  background: 'hsl(222, 10%, 7%)',
                  border: '1px solid hsla(0, 0%, 100%, 0.1)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  padding: '0.4rem 0.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  width: '100%',
                  outline: 'none'
                }}
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#111' }}>
                    {p.name} {p.relationship ? `(${p.relationship})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No Profile</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                justifyContent: 'center',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.55rem 0.5rem',
                background: 'hsl(222, 10%, 12%)',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxShadow: 'var(--neo-raised-sm)',
                transition: 'all 0.15s ease'
              }}
              onPointerDown={handleLock}
              title="Lock database in memory"
            >
              <Lock size={14} />
              <span>Lock</span>
            </button>
            <button
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                justifyContent: 'center',
                border: '1px solid hsla(350, 70%, 55%, 0.2)',
                borderRadius: '8px',
                padding: '0.55rem 0.5rem',
                background: 'hsla(350, 70%, 55%, 0.08)',
                cursor: 'pointer',
                color: 'var(--error, #f43f5e)',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxShadow: 'var(--neo-raised-sm)',
                transition: 'all 0.15s ease'
              }}
              onPointerDown={async () => {
                await authSession.logout();
                dbService.lock();
                setIsAuthenticated(false);
                setIsUnlocked(false);
                setNeedsPin(false);
              }}
              title="Sign out of account"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

      </aside>

      {/* Main Content Workspace */}
      <div className="page-main">

        {/* Header Bar */}
        <header role="banner" className="page-header">
          {/* Mobile Hamburger & Page Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button
              variant="secondary"
              className="mobile-menu-btn"
              onPointerDown={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ padding: '0.35rem 0.5rem', border: '1px solid var(--border-color)' }}
            >
              <Menu size={16} />
            </Button>
            <span style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.01em'
            }}>
              {PAGE_TITLES[activePage]}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'flex-end', minWidth: 0 }}>
            {/* Command Palette Spotlight Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hide-on-mobile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.38rem 0.75rem',
                background: 'hsl(222, 10%, 12%)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: 'var(--neo-inset-sm)'
              }}
              title="Open Command Palette (Ctrl+K or ⌘K)"
            >
              <Sparkles size={13} color="var(--accent-1, #06b6d4)" />
              <span>Search or Command</span>
              <kbd style={{
                background: 'hsl(222, 10%, 7%)',
                border: '1px solid hsla(0, 0%, 100%, 0.1)',
                borderRadius: '4px',
                padding: '0.1rem 0.35rem',
                fontSize: '0.7rem',
                color: 'var(--text-muted)'
              }}>
                {typeof navigator !== 'undefined' && (navigator.platform.includes('Mac') || navigator.platform.includes('iPhone') || navigator.platform.includes('iPad')) ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </button>

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
                    background: 'hsla(350, 70%, 55%, 0.15)',
                    color: 'var(--error, #f43f5e)',
                    border: '1px solid hsla(350, 70%, 55%, 0.3)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <AlertCircle size={14} />
                  <span>Save Error</span>
                </button>
              ) : hasUnsavedChanges ? (
                <button
                  className="btn animate-fade-in"
                  onPointerDown={() => {
                    dbService.syncToCloud().then(() => toast.success('Auto-Save', 'State saved to cloud'));
                  }}
                  title="Saving changes in background..."
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    gap: '0.4rem',
                    background: 'hsla(35, 90%, 55%, 0.15)',
                    color: 'var(--warning, #f59e0b)',
                    border: '1px solid hsla(35, 90%, 55%, 0.3)',
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
                  title="All feature states are automatically encrypted and saved"
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    gap: '0.4rem',
                    background: 'hsla(150, 60%, 45%, 0.12)',
                    color: 'var(--success, #10b981)',
                    border: '1px solid hsla(150, 60%, 45%, 0.25)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Encrypted & Saved</span>
                </div>
              ) : null}
            </div>

            {/* Global Date Filter */}
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              earliestDate={(() => {
                let earliest: Date | undefined;
                const checkDate = (dString: string) => {
                  const d = new Date(dString);
                  if (!isNaN(d.getTime()) && (!earliest || d < earliest)) earliest = d;
                };
                try {
                  dbService.getTransactions().forEach(t => checkDate(t.date));
                  dbService.getInvoices().forEach(i => checkDate(i.date));
                  dbService.getRegister().forEach(r => checkDate(r.date));
                } catch { }
                return earliest;
              })()}
            />

            <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success, #10b981)', boxShadow: '0 0 6px var(--success, #10b981)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Encrypted Vault Active (In Memory)</span>
            </div>
          </div>
        </header>

        {/* Core Screen Content */}
        <main className="page-content main-workspace" role="main" aria-label={PAGE_TITLES[activePage]}>
          <div className="page-content-inner">
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
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav" aria-label="Quick navigation">
          <button
            className={`mobile-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onPointerDown={() => { setActivePage('dashboard'); setIsMobileMenuOpen(false); }}
            aria-current={activePage === 'dashboard' ? 'page' : undefined}
          >
            <LayoutDashboard size={18} />
            <span>Mission</span>
          </button>
          <button
            className={`mobile-nav-item ${activePage === 'ledger' ? 'active' : ''}`}
            onPointerDown={() => { setActivePage('ledger'); setIsMobileMenuOpen(false); }}
            aria-current={activePage === 'ledger' ? 'page' : undefined}
          >
            <Landmark size={18} />
            <span>Ledger</span>
          </button>
          <button
            className={`mobile-nav-item ${activePage === 'investments' ? 'active' : ''}`}
            onPointerDown={() => { setActivePage('investments'); setIsMobileMenuOpen(false); }}
            aria-current={activePage === 'investments' ? 'page' : undefined}
          >
            <TrendingUp size={18} />
            <span>Investments</span>
          </button>
          <button
            className={`mobile-nav-item ${activePage === 'tax' ? 'active' : ''}`}
            onPointerDown={() => { setActivePage('tax'); setIsMobileMenuOpen(false); }}
            aria-current={activePage === 'tax' ? 'page' : undefined}
          >
            <Percent size={18} />
            <span>Tax</span>
          </button>
          <button
            className={`mobile-nav-item ${activePage === 'ai' ? 'active' : ''}`}
            onPointerDown={() => { setActivePage('ai'); setIsMobileMenuOpen(false); }}
            aria-current={activePage === 'ai' ? 'page' : undefined}
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

      <Toaster toasts={toasts} onClose={toast.dismiss} position="bottom-right" />

      <SaveStatusPopup
        isOpen={showSavePopup}
        onClose={() => setShowSavePopup(false)}
        saveError={saveError}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </div>
  );
};

export default App;
