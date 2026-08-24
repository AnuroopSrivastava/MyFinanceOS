import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@financeos/ui';
import { dbService } from '@financeos/database';
import { formatRupee } from '@financeos/shared';
import {
  Search, LayoutDashboard, Landmark, TrendingUp, Percent,
  Briefcase, Network, Sparkles, Settings, Target, Lock,
  Download, Plus, Calculator, Zap, Command
} from 'lucide-react';
import { useDbVersion } from '../hooks/useDbSync.js';

type ActivePage = 'dashboard' | 'ledger' | 'investments' | 'tax' | 'business' | 'sankey' | 'ai' | 'settings' | 'planner' | 'vault' | 'automation' | 'reports';

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
  const dbVersion = useDbVersion();
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
      { id: 'nav-dashboard', label: 'Mission Control Dashboard', group: 'Pages', icon: <LayoutDashboard size={16} />, action: () => onNavigate('dashboard'), keywords: 'home overview networth'},
      { id: 'nav-ledger', label: 'Banking & Ledger', group: 'Pages', icon: <Landmark size={16} />, action: () => onNavigate('ledger'), keywords: 'transactions bank account'},
      { id: 'nav-investments', label: 'Portfolio & Investments', group: 'Pages', icon: <TrendingUp size={16} />, action: () => onNavigate('investments'), keywords: 'portfolio stocks mutual funds fd gold nps US stocks crypto bonds'},
      {id: 'nav-tax', label: 'Tax & GST Suite', group: 'Pages', icon: <Percent size={16} />, action: () => onNavigate('tax'), keywords: 'income tax regime tds 80c capital gains itr'},
      { id: 'nav-business', label: 'Business Suite', group: 'Pages', icon: <Briefcase size={16} />, action: () => onNavigate('business'), keywords: 'gst invoice inventory contacts payroll profit loss'},
      { id: 'nav-planner', label: 'Investment Planner', group: 'Pages', icon: <Target size={16} />, action: () => onNavigate('planner'), keywords: 'fire sip goal emi calculator'},
      { id: 'nav-vault', label: 'Encrypted Document Vault', group: 'Pages', icon: <Lock size={16} />, action: () => onNavigate('vault'), keywords: 'documents pan aadhaar tax property insurance encrypted'},
      { id: 'nav-automation', label: 'Automation Rules & Reminders', group: 'Pages', icon: <Zap size={16} />, action: () => onNavigate('automation'), keywords: 'auto categorize rules recurring sip emi reminder'},
      { id: 'nav-reports', label: '1-Click Executive Reports', group: 'Pages', icon: <Download size={16} />, action: () => onNavigate('reports'), keywords: 'report pdf csv excel annual monthly audit'},
      { id: 'nav-sankey', label: 'Sankey Cash Flow', group: 'Pages', icon: <Network size={16} />, action: () => onNavigate('sankey'), keywords: 'money flow diagram visual'},
      { id: 'nav-ai', label: 'AI Financial Assistant', group: 'Pages', icon: <Sparkles size={16} />, action: () => onNavigate('ai'), keywords: 'chat query ask question advisor'},
      { id: 'nav-settings', label: 'Settings', group: 'Pages', icon: <Settings size={16} />, action: () => onNavigate('settings'), keywords: 'theme profile backup export'},

      // Actions
      { id: 'act-lock', label: 'Lock Vault (In-Memory)', group: 'Actions', icon: <Lock size={16} />, action: () => onAction('lock'), keywords: 'logout secure close'},
      { id: 'act-export', label: 'Export Emergency JSON Backup', group: 'Actions', icon: <Download size={16} />, action: () => onAction('export'), keywords: 'download backup save json'},
      { id: 'act-add-tx', label: 'Add New Transaction', group: 'Actions', icon: <Plus size={16} />, action: () => { onNavigate('ledger'); onAction('add-transaction'); }, keywords: 'income expense entry new'},
      { id: 'act-add-account', label: 'Add Bank Account', group: 'Actions', icon: <Landmark size={16} />, action: () => { onNavigate('ledger'); onAction('add-account'); }, keywords: 'new bank savings current'},
      { id: 'act-emi', label: 'Open EMI Calculator', group: 'Actions', icon: <Calculator size={16} />, action: () => { onNavigate('planner'); onAction('emi-calculator'); }, keywords: 'loan home car education amortization'},
    ];

    // Recent transactions
    try {
      const recentTx = dbService.getTransactions().slice(0, 5);
      recentTx.forEach(tx => {
        items.push({
          id: `tx-${tx.id}`,
          label: `${tx.description} — ${formatRupee(tx.amount)}`,
          group: 'Recent Data',
          icon: <Zap size={16} />,
          action: () => onNavigate('ledger'),
          keywords: `${tx.category} ${tx.date}`
        });
      });
    } catch { /* DB might be locked */ }

    return items;
  }, [onNavigate, onAction, dbVersion]);

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
        className="command-palette-overlay"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'var(--overlay-scrim)', backdropFilter: 'blur(6px)',
          zIndex: 9999, animation: 'fadeIn 0.15s ease'
        }}
      />

      {/* Palette Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        style={{
          position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '560px', maxWidth: '90vw', maxHeight: '60vh',
          background: 'var(--bg-panel)',
          backgroundImage: 'var(--neo-convex-grad)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--border-color)',
          borderTop: 'var(--neo-bevel-top)',
          borderBottom: 'var(--neo-bevel-bottom)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--neo-raised-lg), 0 30px 80px rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'slideDown 0.2s ease-out'
        }}
      >

        {/* Search Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)', padding: 'var(--spacing-075) var(--spacing-1)',
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--neo-inset-sm)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="command-results-list"
            aria-activedescendant={flatResults[selectedIndex] ? `command-item-${flatResults[selectedIndex].id}` : undefined}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions, or transactions..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 'var(--font-base)', fontFamily: 'var(--font-body)'
            }}
          />
          <kbd style={{ padding: 'var(--spacing-02) var(--spacing-04)', background: 'var(--bg-panel)', borderRadius: '4px', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-raised-sm)' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div
          id="command-results-list"
          role="listbox"
          style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-05)' }}
        >
          {Object.entries(groupedResults).map(([group, items]) => (
            <div key={group} role="group" aria-label={group}>
              <div className="type-label-upper" style={{ color: 'var(--text-muted)', padding: 'var(--spacing-04) var(--spacing-05)' }}>{group}</div>
              {items.map(item => {
                runningIndex++;
                const idx = runningIndex;
                const isSelected = selectedIndex === idx;
                return (
                  <Button
                    key={item.id}
                    id={`command-item-${item.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => { item.action(); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--spacing-06)',
                      padding: 'var(--spacing-05) var(--spacing-075)', borderRadius: 'var(--radius-sm)',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: isSelected ? 'var(--bg-secondary)' : 'transparent',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: 'var(--font-sm)', fontFamily: 'var(--font-body)',
                      fontVariantNumeric: 'tabular-nums', fontFeatureSettings: 'tnum 1',
                      transition: 'background 0.1s'
                    }}
                  >
                    <span style={{ color: isSelected ? 'var(--accent-1)' : 'var(--text-muted)', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    {isSelected && (
                      <span style={{ fontSize: 'var(--font-2xs)', color: 'var(--text-muted)' }}>↵</span>
                    )}
                  </Button>
                );
              })}
            </div>
          ))}

          {flatResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2)', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 'var(--spacing-2)',
          padding: 'var(--spacing-05)', borderTop: '1px solid var(--border-color)',
          fontSize: 'var(--font-2xs)', color: 'var(--text-muted)'
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
