import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Button } from './Button.js';

export type CommandAction = (() => void) | string;

export interface CommandItem {
  id: string;
  label: string;
  group: string;
  icon?: React.ReactNode;
  action: CommandAction;
  keywords?: string;
  shortcut?: string;
}

export interface CommandGroup {
  label: string;
  items: CommandItem[];
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items?: CommandItem[];
  groups?: CommandGroup[];
  placeholder?: string;
  title?: string;
  onSearch?: (query: string) => void;
}

const DEFAULT_GROUPS: CommandGroup[] = [
  { label: 'Navigation', items: [] },
  { label: 'Actions', items: [] },
  { label: 'Recent', items: [] },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  items = [],
  groups = DEFAULT_GROUPS,
  placeholder = 'Search commands...',
  title = 'Command Palette',
  onSearch,
}) => {
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

  const allItems = useMemo(() => {
    const itemsList: CommandItem[] = [...items];
    groups.forEach(g => {
      g.items.forEach(item => {
        itemsList.push({ ...item, group: g.label });
      });
    });
    return itemsList;
  }, [items, groups]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(item =>
      item.label.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.toLowerCase().includes(q))
    );
  }, [query, allItems]);

  const groupedResults = useMemo(() => {
    const groupsMap: Record<string, CommandItem[]> = {};
    filtered.forEach(item => {
      if (!groupsMap[item.group]) groupsMap[item.group] = [];
      groupsMap[item.group].push(item);
    });
    return groupsMap;
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
      const item = flatResults[selectedIndex];
      if (typeof item.action === 'function') {
        item.action();
      }
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  let runningIndex = -1;

  return (
    <>
      <div
        className="command-palette-overlay"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'var(--overlay-scrim)', backdropFilter: 'blur(6px)',
          zIndex: 9999, animation: 'fadeIn 0.15s ease'
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', maxWidth: '90vw', maxHeight: '70vh',
          background: 'var(--bg-panel)',
          backgroundImage: 'var(--neo-convex-grad)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--border-color)',
          borderTop: 'var(--neo-bevel-top)',
          borderBottom: 'var(--neo-bevel-bottom)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--neo-raised-lg), 0 30px 80px rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'slideDown 0.2s ease-out'
        }}
      >
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
            onChange={e => { setQuery(e.target.value); onSearch?.(e.target.value); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 'var(--font-base)', fontFamily: 'var(--font-body)'
            }}
          />
          <kbd style={{ padding: 'var(--spacing-02) var(--spacing-04)', background: 'var(--bg-panel)', borderRadius: '4px', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-raised-sm)' }}>ESC</kbd>
        </div>

        <div
          id="command-results-list"
          role="listbox"
          style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-05)' }}
        >
          {Object.entries(groupedResults).map(([group, groupItems]) => (
            <div key={group} role="group" aria-label={group}>
              <div className="type-label-upper" style={{ color: 'var(--text-muted)', padding: 'var(--spacing-04) var(--spacing-05)' }}>{group}</div>
              {groupItems.map((item, localIdx) => {
                runningIndex++;
                const idx = runningIndex;
                const isSelected = selectedIndex === idx;
                return (
                  <Button
                    key={item.id}
                    id={`command-item-${item.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (typeof item.action === 'function') item.action();
                      onClose();
                    }}
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
                    {item.icon && <span style={{ color: isSelected ? 'var(--accent-1)' : 'var(--text-muted)', flexShrink: 0 }}>{item.icon}</span>}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    {item.shortcut && <span style={{ fontSize: 'var(--font-2xs)', color: 'var(--text-muted)' }}>{item.shortcut}</span>}
                    {isSelected && <span style={{ fontSize: 'var(--font-2xs)', color: 'var(--accent-1)' }}>↵</span>}
                  </Button>
                );
              })}
            </div>
          ))}

          {flatResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2)', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', justifyContent: 'center', gap: 'var(--spacing-2)',
          padding: 'var(--spacing-05)', borderTop: '1px solid var(--border-color)',
          fontSize: 'var(--font-2xs)', color: 'var(--text-muted)'
        }}>
          <span>&uarr;&darr; Navigate</span>
          <span>&crarr; Select</span>
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

export function createCommandPalette(commands: CommandItem[], groups: CommandGroup[] = DEFAULT_GROUPS) {
  return { commands, groups };
}