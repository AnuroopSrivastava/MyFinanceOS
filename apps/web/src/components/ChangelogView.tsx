'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from 'react';
import { Filter, ChevronDown, ChevronUp, Milestone } from 'lucide-react';
import {
  getSavedTheme,
  setTheme as setGlobalTheme,
  FilterPillGroup,
  ReleaseCard,
  type FilterPillOption
} from '@financeos/ui';
import {
  CHANGELOG_ENTRIES,
  STORAGE_KEYS,
  getReleaseMilestones,
  type ReleaseMilestone
} from '@financeos/shared';
import '../styles/emergent-landing.css';
import { SiteFooter } from './Landing';
import { smoothScrollTo } from '../hooks/useLenisScroll';
import { useHeaderScrollPhysics } from '../hooks/useHeaderScrollPhysics';
import { PublicHeader } from './PublicHeader';
import { ChangelogSearchBar } from './ChangelogSearchBar';
import { ChangelogMetaStrip } from './ChangelogMetaStrip';

export interface ChangelogViewProps {
  onBack?: () => void;
  showNav?: boolean;
}

const CATEGORY_NAMES = [
  'All',
  'Features',
  'Improvements',
  'Bug Fixes',
  'UI/UX',
  'Performance',
  'Security'
];

export const ChangelogView: React.FC<ChangelogViewProps> = ({ onBack, showNav = true }) => {
  const [dark, setDark] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredQuery = useDeferredValue(searchQuery);
  const [copyAnnouncement, setCopyAnnouncement] = useState<string>('');
  const [highlightedVersion, setHighlightedVersion] = useState<string | null>(null);
  const [activeMilestone, setActiveMilestone] = useState<string>(CHANGELOG_ENTRIES[0]?.version || '1.1.1');
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(() => {
    // Latest release is always expanded by default
    const latest = CHANGELOG_ENTRIES[0]?.version;
    return new Set(latest ? [latest] : []);
  });

  const milestones: ReleaseMilestone[] = useMemo(() => getReleaseMilestones(CHANGELOG_ENTRIES), []);
  const activeReleaseIndexRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
      if (stored === 'dark') {
        setDark(true);
      } else if (stored === 'light') {
        setDark(false);
      } else if (document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('dark')) {
        setDark(true);
      } else {
        const savedTheme = getSavedTheme();
        if (savedTheme === 'dark') {
          setDark(true);
        }
      }
    } catch {
      // Ignore storage access errors
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.theme && e.newValue) {
        setDark(e.newValue === 'dark');
      }
    };
    const handleCustomTheme = (e: Event) => {
      const customEvent = e as CustomEvent<{ sender: string; theme: string }>;
      if (customEvent.detail?.sender === 'changelog') return;
      try {
        const current = customEvent.detail?.theme || window.localStorage.getItem(STORAGE_KEYS.theme);
        if (current) setDark(current === 'dark');
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('financeos-theme-change', handleCustomTheme);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('financeos-theme-change', handleCustomTheme);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', dark);
    }
  }, [dark]);

  // Butter-smooth Lenis scroll integration and directional header retraction
  const { headerRef } = useHeaderScrollPhysics();

  // Handle URL hash navigation for direct release links (e.g. /changelog#1.0.0 or #v1.0.0)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHash = () => {
      const rawHash = window.location.hash.replace(/^#/, '');
      if (!rawHash) return;
      const cleanVersion = rawHash.startsWith('v') ? rawHash.slice(1) : rawHash;

      // Ensure target version is expanded
      setExpandedVersions((prev) => new Set([...prev, cleanVersion]));
      setHighlightedVersion(cleanVersion);
      setActiveMilestone(cleanVersion);

      const targetEl =
        document.getElementById(`v${cleanVersion}`) ||
        document.getElementById(`release-${cleanVersion}`);

      if (targetEl) {
        setTimeout(() => {
          smoothScrollTo(targetEl, -80);
        }, 120);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(STORAGE_KEYS.theme, next ? 'dark' : 'light');
          setGlobalTheme(next ? 'dark' : 'light');
          window.dispatchEvent(
            new CustomEvent('financeos-theme-change', {
              detail: { sender: 'changelog', theme: next ? 'dark' : 'light' }
            })
          );
        } catch {
          // Ignore storage access errors
        }
      }
      return next;
    });
  }, []);

  const handleCopyLink = useCallback((version: string) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}#v${version}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopyAnnouncement(`Direct link to release v${version} copied to clipboard.`);
        setTimeout(() => {
          setCopyAnnouncement('');
        }, 2200);
      })
      .catch(() => {
        // Clipboard access fallback
      });
  }, []);

  const toggleExpand = useCallback((version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  }, []);

  // Shared search predicate — used by both filteredReleases and categoryPillOptions
  const matchesSearch = useCallback((entry: typeof CHANGELOG_ENTRIES[0], query: string) => {
    if (!query) return true;
    return (
      entry.version.toLowerCase().includes(query) ||
      entry.summary.toLowerCase().includes(query) ||
      (entry.subsystems && entry.subsystems.some((s) => s.toLowerCase().includes(query))) ||
      entry.changes.some(
        (c) =>
          c.category.toLowerCase().includes(query) ||
          c.items.some((item) => item.toLowerCase().includes(query))
      )
    );
  }, []);

  // Filtered releases based on category and search query (deferred for responsiveness)
  const filteredReleases = useMemo(() => {
    const query = deferredQuery.toLowerCase().trim();
    return CHANGELOG_ENTRIES.filter((entry) => {
      if (!matchesSearch(entry, query)) return false;
      if (selectedCategory === 'All') return true;
      return entry.changes.some((c) => c.category === selectedCategory && c.items.length > 0);
    });
  }, [deferredQuery, selectedCategory, matchesSearch]);

  // Compute live item counts for category filter pills
  const categoryPillOptions: FilterPillOption<string>[] = useMemo(() => {
    const query = deferredQuery.toLowerCase().trim();
    const baseReleases = CHANGELOG_ENTRIES.filter((entry) => {
      return matchesSearch(entry, query);
    });

    return CATEGORY_NAMES.map((name) => {
      if (name === 'All') {
        return { id: 'All', label: 'All', count: baseReleases.length };
      }
      const count = baseReleases.filter((entry) =>
        entry.changes.some((c) => c.category === name && c.items.length > 0)
      ).length;
      return { id: name, label: name, count };
    });
  }, [deferredQuery, matchesSearch]);

  const isAllExpanded = useMemo(() => {
    return filteredReleases.length > 0 && filteredReleases.every((entry) => expandedVersions.has(entry.version));
  }, [filteredReleases, expandedVersions]);

  const toggleExpandAll = useCallback(() => {
    setExpandedVersions((prev) => {
      const allExpanded = filteredReleases.length > 0 && filteredReleases.every((entry) => prev.has(entry.version));
      if (allExpanded) {
        const latest = CHANGELOG_ENTRIES[0]?.version;
        return new Set(latest ? [latest] : []);
      }
      return new Set(CHANGELOG_ENTRIES.map((e) => e.version));
    });
  }, [filteredReleases]);

  const handleJumpToMilestone = useCallback((version: string) => {
    setActiveMilestone(version);
    setExpandedVersions((prev) => new Set([...prev, version]));
    const targetEl = document.getElementById(`v${version}`);
    if (targetEl) {
      smoothScrollTo(targetEl, -90);
    }
  }, []);

  // Keyboard navigation shortcuts (J/K next/prev release, E toggle expand)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName || '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const nextIndex = Math.min(activeReleaseIndexRef.current + 1, filteredReleases.length - 1);
        activeReleaseIndexRef.current = nextIndex;
        const target = filteredReleases[nextIndex];
        if (target) {
          handleJumpToMilestone(target.version);
        }
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const prevIndex = Math.max(activeReleaseIndexRef.current - 1, 0);
        activeReleaseIndexRef.current = prevIndex;
        const target = filteredReleases[prevIndex];
        if (target) {
          handleJumpToMilestone(target.version);
        }
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        const current = filteredReleases[activeReleaseIndexRef.current];
        if (current) {
          toggleExpand(current.version);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [filteredReleases, handleJumpToMilestone, toggleExpand]);

  // Scroll spy: synchronize active milestone rail highlighting as user scrolls through releases
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const cards = filteredReleases
      .map((entry) => document.getElementById(`v${entry.version}`))
      .filter(Boolean) as HTMLElement[];
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          const topEntry = visibleEntries.reduce((prev, curr) =>
            Math.abs(curr.boundingClientRect.top) < Math.abs(prev.boundingClientRect.top) ? curr : prev
          );
          const versionId = topEntry.target.id.replace(/^v/, '');
          setActiveMilestone(versionId);
          const idx = filteredReleases.findIndex((e) => e.version === versionId);
          if (idx !== -1) {
            activeReleaseIndexRef.current = idx;
          }
        }
      },
      {
        rootMargin: '-10% 0px -65% 0px',
        threshold: [0, 0.25, 0.5]
      }
    );

    cards.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredReleases]);

  return (
      <div
        className={`app-shell ${dark ? 'dark' : ''}`}
        data-testid="changelog-view"
        style={{ minHeight: '100vh', position: 'relative' }}
      >
        {/* Landing Page Styled Header & Mobile Drawer */}
        {showNav && (
          <PublicHeader
            dark={dark}
            onToggleTheme={handleToggleTheme}
            onBack={onBack}
            activeRoute="/changelog"
            headerRef={headerRef}
          />
        )}

        {/* Dual-Theme Changelog Shell */}
        <div className="changelog-shell">
          {/* Ambient Glows */}
          <div className="changelog-ambient-glow changelog-ambient-1" aria-hidden="true" />
          <div className="changelog-ambient-glow changelog-ambient-2" aria-hidden="true" />

          {/* Hero Content Area */}
          <section className="changelog-container">
            {/* Title */}
            <h1
              className="changelog-title"
            >
              What&apos;s New in MyFinanceOS
            </h1>

            {/* Subtitle */}
            <p
              className="changelog-subtitle"
            >
              Local-first privacy, sovereign on-device data, and continuous product evolution.
              Track every release, system improvement, performance milestone, and security upgrade.
            </p>

            {/* High-Density Inline Meta Strip & Sovereign Offline Notice */}
            <ChangelogMetaStrip />

            {/* Screen reader live region for search results and copy announcements */}
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0
              }}
            >
              {copyAnnouncement || `${filteredReleases.length} ${filteredReleases.length === 1 ? 'release' : 'releases'} displayed.`}
            </div>

            {/* Search Box, Filter Pills, and Global Controls */}
            <div className="changelog-search-section">
              {/* Search Bar with Clear Button */}
              <ChangelogSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />

              {/* Controls Row: Category Pills with Counts & Global Toggle */}
              <div className="changelog-controls-row">
                <FilterPillGroup
                  options={categoryPillOptions}
                  selected={selectedCategory}
                  onChange={(cat) => setSelectedCategory(cat)}
                  ariaLabel="Filter releases by category"
                  pillClassName="changelog-filter-pill"
                />

                <button
                  type="button"
                  className="changelog-toggle-all-btn"
                  onClick={toggleExpandAll}
                  aria-label={isAllExpanded ? 'Collapse all release details' : 'Expand all release details'}
                >
                  {isAllExpanded ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
                  <span>{isAllExpanded ? 'Collapse All' : 'Expand All'}</span>
                </button>
              </div>

              {/* Keyboard Shortcuts Discovery Hint */}
              <div className="changelog-keyboard-hint" aria-hidden="true">
                <span>Press <kbd>/</kbd> to search</span>
                <span className="changelog-keyboard-hint-sep">•</span>
                <span><kbd>J</kbd> / <kbd>K</kbd> navigate versions</span>
                <span className="changelog-keyboard-hint-sep">•</span>
                <span><kbd>E</kbd> toggle details</span>
              </div>
            </div>

            {/* Two-Column Layout Grid with Sticky Milestone Rail */}
            <div className="changelog-layout-grid">
              {/* Left Sticky Milestone Rail */}
              <aside
                className="changelog-milestones-rail"
                aria-label="Release version navigation"
                data-testid="changelog-milestones-rail"
              >
                {/* Mobile-only rail affordance label */}
                <div className="changelog-mobile-rail-label" aria-hidden="true">
                  <Milestone size={11} aria-hidden="true" />
                  <span>Jump to:</span>
                </div>

                <div className="changelog-milestone-rail-title">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Milestone size={12} aria-hidden="true" />
                    <span>Release Index</span>
                  </span>
                  <span style={{ fontSize: 'var(--font-2xs, 11px)', opacity: 0.75, fontVariantNumeric: 'tabular-nums' }}>
                    {milestones.length} tags
                  </span>
                </div>
                {milestones.map((m) => {
                  const isActive = activeMilestone === m.version;
                  return (
                    <button
                      key={m.version}
                      type="button"
                      className={`changelog-milestone-link ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleJumpToMilestone(m.version)}
                      aria-label={`Jump to release ${m.label}`}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          className={`release-legend-dot changelog-legend-dot release-legend-dot-${m.releaseType}`}
                          aria-hidden="true"
                        />
                        <span>{m.label}</span>
                      </span>
                      <time dateTime={m.date} style={{ fontSize: 'var(--font-2xs, 0.7rem)', opacity: 0.65, fontVariantNumeric: 'tabular-nums' }}>
                        {m.date}
                      </time>
                    </button>
                  );
                })}

                {/* SemVer Cadence Legend in Rail */}
                <div className="changelog-rail-legend" aria-label="Release cadence breakdown">
                  <span className="changelog-rail-legend-title">Release Cadence</span>
                  <div className="changelog-rail-legend-items">
                    <div className="changelog-rail-legend-item">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="changelog-legend-dot changelog-legend-dot-major" aria-hidden="true" />
                        <span>Major</span>
                      </span>
                      <span className="changelog-rail-legend-count">
                        {milestones.filter((m) => m.releaseType === 'major').length}
                      </span>
                    </div>
                    <div className="changelog-rail-legend-item">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="changelog-legend-dot changelog-legend-dot-minor" aria-hidden="true" />
                        <span>Minor</span>
                      </span>
                      <span className="changelog-rail-legend-count">
                        {milestones.filter((m) => m.releaseType === 'minor').length}
                      </span>
                    </div>
                    <div className="changelog-rail-legend-item">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="changelog-legend-dot changelog-legend-dot-patch" aria-hidden="true" />
                        <span>Patch</span>
                      </span>
                      <span className="changelog-rail-legend-count">
                        {milestones.filter((m) => m.releaseType === 'patch').length}
                      </span>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Version History Feed */}
              <main
                className="changelog-main-feed"
                style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 2.5vw, 32px)', minWidth: 0 }}
              >
                {filteredReleases.length === 0 ? (
                  <div className="changelog-release-card changelog-empty-state" role="region" aria-label="No matching releases">
                    <Filter size={32} className="changelog-empty-icon" aria-hidden="true" />
                    <h3 className="changelog-empty-title">
                      No releases matched your filter
                    </h3>
                    <p className="changelog-empty-text">
                      {searchQuery
                        ? `No releases found matching "${searchQuery}"${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}. Try checking for typos or resetting your filters.`
                        : `No releases found in the ${selectedCategory} category.`}
                    </p>
                    <button
                      type="button"
                      className="changelog-reset-btn"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                      aria-label="Clear search query and reset category filters"
                    >
                      Clear Search &amp; Filters
                    </button>
                  </div>
                ) : (
                  filteredReleases.map((entry, index) => (
                    <ReleaseCard
                      key={entry.version}
                      entry={entry}
                      isLatest={index === 0}
                      isExpanded={expandedVersions.has(entry.version)}
                      isHighlighted={highlightedVersion === entry.version}
                      selectedCategory={selectedCategory}
                      onToggleExpand={toggleExpand}
                      onCopyLink={handleCopyLink}
                      index={index}
                    />
                  ))
                )}
              </main>
            </div>
          </section>

          {/* Wordmark Rising over Footer */}
          <div className="wordmark-bleed" aria-hidden="true">
            <span className="wordmark-text">MYFINANCEOS</span>
          </div>

          {/* Canonical Landing Page SiteFooter with recursive shelf hidden on changelog */}
          <SiteFooter hideChangelogShelf={true} />
        </div>
      </div>
  );
};

export default ChangelogView;
