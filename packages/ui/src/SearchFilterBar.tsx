import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDropdown {
  id: string;
  label?: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export interface CategoryPill {
  id: string;
  label: string;
  count?: number;
}

export interface SearchFilterBarProps {
  /** Search query state */
  searchQuery: string;
  /** Search query change handler */
  onSearchChange: (query: string) => void;
  /** Input placeholder */
  placeholder?: string;
  /** Shortcut key label (default: '/') */
  shortcutKey?: string;
  /** Dropdown filter menus */
  filters?: FilterDropdown[];
  /** Category selector pills */
  categoryPills?: CategoryPill[];
  /** Active category ID */
  activeCategory?: string;
  /** Active category change handler */
  onCategoryChange?: (categoryId: string) => void;
  /** Trailing action buttons (e.g. Export, Add) */
  actions?: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Optional ref for search input */
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search records...',
  shortcutKey = '/',
  filters = [],
  categoryPills,
  activeCategory,
  onCategoryChange,
  actions,
  className = '',
  style,
  inputRef,
}) => {
  const localInputRef = useRef<HTMLInputElement>(null);
  const resolvedRef = inputRef || localInputRef;

  return (
    <div
      className={`search-filter-bar ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        {/* Search Input Container */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            flex: '1 1 260px',
            maxWidth: '480px',
            minWidth: 0,
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={resolvedRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="search-input"
            style={{
              width: '100%',
              padding: '0.55rem 2.2rem 0.55rem 2.4rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--neo-inset-sm)',
              outline: 'none',
              transition: 'border-color var(--transition-fast)',
            }}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: '0.75rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          ) : shortcutKey ? (
            <span
              style={{
                position: 'absolute',
                right: '0.75rem',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                padding: '0.1rem 0.35rem',
                background: 'var(--bg-panel)',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                pointerEvents: 'none',
                fontFamily: 'monospace',
              }}
            >
              {shortcutKey}
            </span>
          ) : null}
        </div>

        {/* Filters and Actions Group */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            flexWrap: 'wrap',
          }}
        >
          {filters.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {f.label && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{f.label}:</span>
              )}
              <select
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                style={{
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.82rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--neo-raised-sm)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {actions && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>{actions}</div>}
        </div>
      </div>

      {/* Category Pills (if provided) */}
      {categoryPills && categoryPills.length > 0 && onCategoryChange && (
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            overflowX: 'auto',
            paddingBottom: '0.2rem',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {categoryPills.map((pill) => {
            const isActive = activeCategory === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onCategoryChange(pill.id)}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 650 : 500,
                  borderRadius: 'var(--radius-pill)',
                  border: `1px solid ${isActive ? 'var(--accent-1)' : 'var(--border-color)'}`,
                  background: isActive ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                  color: isActive ? 'var(--accent-1)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'var(--neo-raised-sm)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {pill.label}
                {pill.count !== undefined && (
                  <span style={{ marginLeft: '0.3rem', opacity: 0.7 }}>({pill.count})</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
