'use client';

import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export interface ChangelogSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  ariaLabel?: string;
}

export const ChangelogSearchBar: React.FC<ChangelogSearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search releases, features, or fixes...',
  ariaLabel = 'Search releases by feature, fix, or keyword'
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName || '';
      if (e.key === '/' && document.activeElement !== inputRef.current && !['INPUT', 'TEXTAREA'].includes(activeTag)) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onClear();
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClear]);

  return (
    <div className="changelog-search-wrap">
      <label htmlFor="changelog-search-input" className="sr-only">
        {ariaLabel}
      </label>
      <Search
        size={16}
        className="changelog-search-icon"
        aria-hidden="true"
      />
      <input
        id="changelog-search-input"
        ref={inputRef}
        type="search"
        role="searchbox"
        className="changelog-search-input"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {!value && (
        <kbd className="changelog-search-kbd" aria-hidden="true">
          /
        </kbd>
      )}
      {value && (
        <button
          type="button"
          className="changelog-search-clear"
          onClick={onClear}
          aria-label="Clear search input"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default ChangelogSearchBar;
