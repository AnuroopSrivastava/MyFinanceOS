import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabsProps {
  /** Tab items */
  tabs: TabItem[];
  /** Active tab ID */
  activeTab: string;
  /** Change handler */
  onChange: (tabId: string) => void;
  /** Variant */
  variant?: 'line' | 'pill' | 'segmented' | 'scrollable';
  /** Full width */
  fullWidth?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Render panel content */
  children?: (tabId: string) => React.ReactNode;
  /** Panel className */
  panelClassName?: string;
}

const variantStyles = {
  line: {
    container: { borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 0 },
    tab: (active: boolean) => ({
      padding: '0.75rem 1.25rem',
      borderBottom: active ? '2px solid var(--accent-1)' : '2px solid transparent',
      marginBottom: '-1px',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      background: 'transparent',
      fontWeight: active ? 600 : 500,
      transition: 'color 0.2s, border-color 0.2s',
    }),
  },
  pill: {
    container: { display: 'flex', gap: '0.35rem', background: 'var(--bg-secondary)', padding: '0.35rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-inset-sm)' },
    tab: (active: boolean) => ({
      padding: '0.5rem 1.15rem',
      borderRadius: 'var(--radius-pill)',
      background: active ? 'var(--accent-grad)' : 'transparent',
      color: active ? 'var(--text-on-action)' : 'var(--text-secondary)',
      fontWeight: active ? 650 : 500,
      boxShadow: active ? 'var(--neo-raised-sm), var(--shadow-glow)' : 'none',
      border: active ? 'var(--neo-bevel-top)' : 'none',
      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
    }),
  },
  segmented: {
    container: { display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-inset-sm)' },
    tab: (active: boolean, _index: number, _length: number) => ({
      padding: '0.55rem 1.15rem',
      borderRadius: 'calc(var(--radius-sm) - 2px)',
      background: active ? 'var(--bg-panel)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      fontWeight: active ? 650 : 500,
      boxShadow: active ? 'var(--neo-raised-sm)' : 'none',
      borderLeft: active ? '1px solid var(--border-color)' : '1px solid transparent',
      borderRight: active ? '1px solid var(--border-color)' : '1px solid transparent',
      borderBottom: active ? '1px solid var(--border-color)' : '1px solid transparent',
      borderTop: active ? 'var(--neo-bevel-top)' : '1px solid transparent',
      transition: 'all 0.18s ease',
    }),
  },
  scrollable: {
    container: { display: 'flex', gap: '0.5rem', overflowX: 'auto' as const, paddingBottom: '0.5rem', scrollbarWidth: 'none' as const, WebkitOverflowScrolling: 'touch' as const },
    tab: (active: boolean) => ({
      padding: '0.5rem 1rem',
      borderRadius: '12px',
      background: active ? 'var(--bg-secondary)' : 'transparent',
      color: active ? 'var(--accent-1)' : 'var(--text-secondary)',
      fontWeight: active ? 650 : 500,
      boxShadow: active ? 'var(--neo-raised-sm)' : 'none',
      border: active ? '1px solid var(--accent-1)' : '1px solid transparent',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      minHeight: '44px',
      transition: 'all 0.18s ease',
    }),
  },
};

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'line',
  fullWidth = false,
  className = '',
  style,
  children,
  panelClassName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState({ left: 0, right: 0 });

  useEffect(() => {
    if (variant !== 'scrollable' || !containerRef.current) return;
    const container = containerRef.current;
    const activeElement = container.querySelector('[data-active="true"]');
    if (activeElement) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();
      if (elementRect.left < containerRect.left || elementRect.right > containerRect.right) {
        activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }
  }, [activeTab, variant]);

  const vStyles = variantStyles[variant];
  const isScrollable = variant === 'scrollable';

  const handleTablistKeyDown = (e: React.KeyboardEvent) => {
    const enabledTabs = tabs.filter(t => !t.disabled);
    if (enabledTabs.length === 0) return;
    const currentIndex = enabledTabs.findIndex(t => t.id === activeTab);

    let nextTabId: string | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % enabledTabs.length;
      nextTabId = enabledTabs[nextIndex].id;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
      nextTabId = enabledTabs[prevIndex].id;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextTabId = enabledTabs[0].id;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextTabId = enabledTabs[enabledTabs.length - 1].id;
    }

    if (nextTabId) {
      onChange(nextTabId);
      const nextBtn = containerRef.current?.querySelector<HTMLButtonElement>(`#${nextTabId}-tab`);
      nextBtn?.focus();
    }
  };

  const TabButton = ({ tab, index }: { tab: TabItem; index: number }) => {
    const isActive = tab.id === activeTab;
    const computedTabStyle = vStyles.tab(isActive, index, tabs.length);
    return (
      <button
        ref={tab.id === activeTab && isScrollable ? (el) => { if (el) el.setAttribute('data-active', 'true'); } : undefined}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={`${tab.id}-panel`}
        id={`${tab.id}-tab`}
        tabIndex={isActive ? 0 : -1}
        disabled={tab.disabled}
        onClick={() => !tab.disabled && onChange(tab.id)}
        style={{
          border: 'none',
          ...computedTabStyle,
          fontSize: '0.875rem',
          fontFamily: 'var(--font-body)',
          cursor: tab.disabled ? 'not-allowed' : 'pointer',
          opacity: tab.disabled ? 0.5 : 1,
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          ...(variant === 'line' && fullWidth ? { flex: 1, justifyContent: 'center' } : {}),
        }}
      >
        {tab.icon && <span style={{ display: 'flex' }}>{React.isValidElement(tab.icon) ? React.cloneElement(tab.icon, { size: 16 } as Record<string, unknown>) : tab.icon}</span>}
        <span>{tab.label}</span>
        {tab.badge !== undefined && (
          <span style={{
            background: tab.id === activeTab ? 'var(--accent-strong)' : 'var(--surface-tint-strong)',
            padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-pill)', fontSize: '0.65rem', fontWeight: 700,
          }}>
            {tab.badge}
          </span>
        )}
      </button>
    );
  };

  const panelContent = children ? children(activeTab) : null;

  return (
    <div className={className} style={{ ...style }}>
      <div
        ref={containerRef}
        role="tablist"
        onKeyDown={handleTablistKeyDown}
        aria-label="Navigation Tabs"
        style={{
          ...vStyles.container,
          ...(isScrollable ? { msOverflowStyle: 'none' as const, scrollbarWidth: 'none' as const } : {}),
        }}
      >
        {tabs.map((tab, i) => (
          <TabButton key={tab.id} tab={tab} index={i} />
        ))}
      </div>
      {panelContent && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            id={`${activeTab}-panel`}
            role="tabpanel"
            aria-labelledby={`${activeTab}-tab`}
            tabIndex={0}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={panelClassName}
            style={{ marginTop: '1.5rem' }}
          >
            {panelContent}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
