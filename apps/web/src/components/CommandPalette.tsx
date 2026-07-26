import React, { useState, useEffect, useRef, useMemo } from 'react';
import { dbService } from '@financeos/database';
import {
  Search, LayoutDashboard, Landmark, TrendingUp, Percent,
  Briefcase, Network, Sparkles, Settings, Target, Lock,
  Download, Plus, Calculator, Zap, Command
} from 'lucide-react';

type ActivePage = 'dashboard' | 'ledger' | 'investments' | 'tax' | 'business' | 'sankey' | 'ai' | 'settings' | 'planner';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: ActivePage) => void;
  onAction: (action: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  group: 'Pages' | 'Actions' | 'Recent Data';
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate, onAction }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      // Pages
      { id: 'nav-dashboard', label: 'Dashboard', group: 'Pages', icon: <LayoutDashboard size={16} />, action: () => onNavigate('dashboard'), keywords: 'home overview networth' },
      { id: 'nav-ledger', label: 'Banking & Ledger', group: 'Pages', icon: <Landmark size={16} />, action: () => onNavigate('ledger'), keywords: 'transactions bank account' },
      { id: 'nav-investments', label: 'Investments', group: 'Pages', icon: <TrendingUp size={16} />, action: () => onNavigate('investments'), keywords: 'stocks mutual funds fd gold nps' },
      { id: 'nav-tax', label: 'Indian Tax Engine', group: 'Pages', icon: <Percent size={16} />, action: () => onNavigate('tax'), keywords: 'income tax regime tds 80c' },
      { id: 'nav-business', label: 'Business Finance', group: 'Pages', icon: <Briefcase size={16} />, action: () => onNavigate('business'), keywords: 'gst invoice inventory contacts' },
      { id: 'nav-sankey', label: 'Sankey Flow', group: 'Pages', icon: <Network size={16} />, action: () => onNavigate('sankey'), keywords: 'money flow diagram visual' },
      { id: 'nav-planner', label: 'Investment Planner', group: 'Pages', icon: <Target size={16} />, action: () => onNavigate('planner'), keywords: 'fire sip goal emi calculator' },
      { id: 'nav-ai', label: 'AI Assistant', group: 'Pages', icon: <Sparkles size={16} />, action: () => onNavigate('ai'), keywords: 'chat query ask question' },
      { id: 'nav-settings', label: 'Settings', group: 'Pages', icon: <Settings size={16} />, action: () => onNavigate('settings'), keywords: 'theme profile backup export' },

      // Actions
      { id: 'act-lock', label: 'Lock Vault', group: 'Actions', icon: <Lock size={16} />, action: () => onAction('lock'), keywords: 'logout secure close' },
      { id: 'act-export', label: 'Export Full Backup (JSON)', group: 'Actions', icon: <Download size={16} />, action: () => onAction('export'), keywords: 'download backup save json' },
      { id: 'act-add-tx', label: 'Add New Transaction', group: 'Actions', icon: <Plus size={16} />, action: () => { onNavigate('ledger'); onAction('add-transaction'); }, keywords: 'income expense entry new' },
      { id: 'act-add-account', label: 'Add Bank Account', group: 'Actions', icon: <Landmark size={16} />, action: () => { onNavigate('ledger'); onAction('add-account'); }, keywords: 'new bank savings current' },
      { id: 'act-emi', label: 'Open EMI Calculator', group: 'Actions', icon: <Calculator size={16} />, action: () => { onNavigate('planner'); onAction('emi-calculator'); }, keywords: 'loan home car education amortization' },
    ];

    // Recent transactions
    try {
      const recentTx = dbService.getTransactions().slice(0, 5);
      recentTx.forEach(tx => {
        items.push({
          id: `tx-${tx.id}`,
          label: `${tx.description} — ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(tx.amount)}`,
          group: 'Recent Data',
          icon: <Zap size={16} />,
          action: () => onNavigate('ledger'),
          keywords: `${tx.category} ${tx.date}`
        });
      });
    } catch { /* DB might be locked */ }

    return items;
  }, [onNavigate, onAction]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      (c.keywords && c.keywords.toLowerCase().includes(q))
    );
  }, [query, commands]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filtered.forEach(c => {
      if (!groups[c.group]) groups[c.group] = [];
      groups[c.group].push(c);
    });
    return groups;
  }, [filtered]);

  const flatResults = filtered;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault();
      flatResults[selectedIndex].action();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  let runningIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          zIndex: 9999, animation: 'fadeIn 0.15s ease'
        }}
      />

      {/* Palette Modal */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '560px', maxWidth: '90vw', maxHeight: '60vh',
        background: 'rgba(18, 18, 24, 0.95)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)',
        boxShadow: '0 25px 80px rgba(0,0,0,0.7)', zIndex: 10000,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'slideDown 0.2s ease-out'
      }}>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions, or transactions..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'var(--font-body)'
            }}
          />
          <kbd style={{ padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {Object.entries(groupedResults).map(([group, items]) => (
            <div key={group}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0.4rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group}</div>
              {items.map(item => {
                runningIndex++;
                const idx = runningIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => { item.action(); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: selectedIndex === idx ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: selectedIndex === idx ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.85rem', fontFamily: 'var(--font-body)',
                      transition: 'background 0.1s'
                    }}
                  >
                    <span style={{ color: selectedIndex === idx ? 'var(--accent-1)' : 'var(--text-muted)', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    {selectedIndex === idx && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>↵</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {flatResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '1.5rem',
          padding: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '0.68rem', color: 'var(--text-muted)'
        }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { transform: translateX(-50%) translateY(-10px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
      `}</style>
    </>
  );
};
