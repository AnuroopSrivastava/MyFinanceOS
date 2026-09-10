'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, MotionConfig, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Bug,
  CheckCircle2,
  Palette,
  Wrench,
  AlertTriangle,
  Tag,
  Calendar,
  Search,
  Filter,
  Link2,
  Check,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { getSavedTheme, setTheme as setGlobalTheme } from '@financeos/ui';
import {
  CURRENT_VERSION,
  CURRENT_RELEASE_DATE,
  CHANGELOG_ENTRIES,
  type ChangeCategory,
  getActiveCategories,
  STORAGE_KEYS
} from '@financeos/shared';
import '../styles/emergent-landing.css';
import { SiteFooter, ThemeToggle } from './Landing';

export interface ChangelogViewProps {
  onBack?: () => void;
  showNav?: boolean;
}

const CATEGORY_ICONS: Record<ChangeCategory, React.ReactNode> = {
  Features: <Sparkles size={15} color="#fbbf24" />,
  Improvements: <CheckCircle2 size={15} color="#38bdf8" />,
  'Bug Fixes': <Bug size={15} color="#34d399" />,
  Performance: <Zap size={15} color="#facc15" />,
  'UI/UX': <Palette size={15} color="#c084fc" />,
  Security: <ShieldCheck size={15} color="#fb7185" />,
  Refactoring: <Wrench size={15} color="#818cf8" />,
  'Breaking Changes': <AlertTriangle size={15} color="#ef4444" />,
  Other: <Tag size={15} color="#94a3b8" />
};

export const ChangelogView: React.FC<ChangelogViewProps> = ({ onBack, showNav = true }) => {
  const [dark, setDark] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedVersion, setCopiedVersion] = useState<string | null>(null);
  const [highlightedVersion, setHighlightedVersion] = useState<string | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(() => {
    // Latest release is always expanded by default
    const latest = CHANGELOG_ENTRIES[0]?.version;
    return new Set(latest ? [latest] : []);
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
      if (stored === 'dark') {
        setDark(true);
      } else if (stored === 'light') {
        setDark(false);
      } else {
        const savedTheme = getSavedTheme();
        setDark(savedTheme !== 'light');
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

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

      const targetEl =
        document.getElementById(`v${cleanVersion}`) ||
        document.getElementById(`release-${cleanVersion}`);

      if (targetEl) {
        setTimeout(() => {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        setCopiedVersion(version);
        setTimeout(() => setCopiedVersion(null), 2200);
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

  // Filtered releases based on category filter and search query
  const filteredReleases = useMemo(() => {
    return CHANGELOG_ENTRIES.filter((entry) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        entry.version.toLowerCase().includes(query) ||
        entry.summary.toLowerCase().includes(query) ||
        entry.changes.some(
          (c) =>
            c.category.toLowerCase().includes(query) ||
            c.items.some((item) => item.toLowerCase().includes(query))
        );

      if (!matchesSearch) return false;
      if (selectedCategory === 'All') return true;
      return entry.changes.some((c) => c.category === selectedCategory && c.items.length > 0);
    });
  }, [searchQuery, selectedCategory]);

  return (
    <MotionConfig reducedMotion="never">
      <div
        className={`app-shell ${dark ? 'dark' : ''}`}
        data-testid="changelog-view"
        style={{ minHeight: '100vh', position: 'relative' }}
      >
        {/* Landing Page Styled Header */}
        {showNav && (
          <header className="site-header is-scrolled" data-testid="changelog-header">
            <Link
              href="/"
              className="logo"
              data-testid="brand-logo"
              aria-label="MyFinanceOS home"
              style={{ textDecoration: 'none' }}
            >
              <span className="logo-mark" aria-hidden="true">
                <span className="mark-halo" />
                <i />
                <span className="mark-shine" />
              </span>
              <span>MyFinanceOS</span>
            </Link>

            <nav className="nav-pill" aria-label="Changelog navigation" data-testid="changelog-navigation">
              <Link href="/" className="active">
                <span className="nav-dot" aria-hidden="true" />
                Home
              </Link>
              <Link href="/#features">Features</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </nav>

            <div className="header-actions">
              <span
                data-testid="current-version-pill"
                className="footer-version-tag hide-on-mobile"
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                <span className="footer-version-dot" aria-hidden="true" />
                v{CURRENT_VERSION}
              </span>

              <ThemeToggle dark={dark} onToggle={handleToggleTheme} />

              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="contact-button"
                  style={{ cursor: 'pointer', border: 'none' }}
                >
                  Workspace
                </button>
              ) : (
                <Link href="/" className="contact-button" style={{ textDecoration: 'none' }}>
                  Launch App
                </Link>
              )}
            </div>
          </header>
        )}

        {/* Outro Ambient Container */}
        <div
          className="outro"
          style={{
            paddingTop: 'clamp(84px, 9vw, 120px)',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Aurora Borealis Glows & Rim */}
          <div className="outro-rim" aria-hidden="true" />
          <div className="outro-aurora outro-aurora-1" aria-hidden="true" />
          <div className="outro-aurora outro-aurora-2" aria-hidden="true" />

          {/* Hero Content Area */}
          <section
            style={{
              maxWidth: '1180px',
              margin: '0 auto',
              padding: 'clamp(20px, 3vw, 40px) clamp(16px, 3vw, 36px) clamp(40px, 6vw, 80px)',
              position: 'relative',
              zIndex: 2
            }}
          >
            {/* Outro Eyebrow Badge */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <motion.span
                className="outro-badge"
                data-testid="changelog-badge"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <svg viewBox="0 0 12 12" width="9" height="9" fill="currentColor" aria-hidden="true" style={{ marginRight: '6px' }}>
                  <path d="M6 0l1.3 3.9L11 5.2 7.3 6.5 6 10.4 4.7 6.5 1 5.2l3.7-1.3z" />
                </svg>
                PRODUCT RELEASE HISTORY
              </motion.span>
            </div>

            {/* Landing Title */}
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                font: "clamp(42px, 6.2vw, 82px)/0.92 'Anton', Impact, sans-serif",
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                textAlign: 'center',
                margin: '0 0 16px',
                color: '#ffffff',
                textShadow: '0 4px 28px rgba(20, 4, 60, 0.45)'
              }}
            >
              WHAT&apos;S NEW IN MYFINANCEOS
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              style={{
                font: "500 clamp(14px, 1.2vw, 17px)/1.6 'Plus Jakarta Sans', sans-serif",
                color: dark ? '#a7a1c8' : '#4b4c68',
                maxWidth: '680px',
                margin: '0 auto clamp(24px, 3vw, 38px)',
                textAlign: 'center'
              }}
            >
              Deterministic local-first engineering, sovereign offline vaulting, and continuous product evolution.
              Track every release, algorithmic upgrade, performance milestone, and security enhancement.
            </motion.p>

            {/* Metrics Shelf */}
            <motion.div
              className="footer-frosted-shelf"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              style={{ maxWidth: '820px', margin: '0 auto clamp(24px, 3vw, 36px)' }}
            >
              <div
                className="footer-shelf-content"
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  flexWrap: 'wrap',
                  gap: '16px 28px'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <small style={{ display: 'block', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.75, fontWeight: 700 }}>
                    Current Version
                  </small>
                  <strong style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>
                    v{CURRENT_VERSION}
                  </strong>
                </div>

                <div style={{ width: 1, height: 28, background: 'rgba(255, 255, 255, 0.18)' }} />

                <div style={{ textAlign: 'center' }}>
                  <small style={{ display: 'block', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.75, fontWeight: 700 }}>
                    Latest Release Date
                  </small>
                  <strong style={{ fontSize: '17px', fontWeight: 700, color: dark ? '#f8fafc' : '#1e1038' }}>
                    {CURRENT_RELEASE_DATE}
                  </strong>
                </div>

                <div style={{ width: 1, height: 28, background: 'rgba(255, 255, 255, 0.18)' }} />

                <div style={{ textAlign: 'center' }}>
                  <small style={{ display: 'block', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.75, fontWeight: 700 }}>
                    Recorded Releases
                  </small>
                  <strong style={{ fontSize: '20px', fontWeight: 800, color: '#34d399' }}>
                    {CHANGELOG_ENTRIES.length}
                  </strong>
                </div>
              </div>
            </motion.div>

            {/* Release Type Legend */}
            <div
              style={{
                maxWidth: '820px',
                margin: '0 auto clamp(20px, 2.5vw, 32px)',
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '12px 24px',
                padding: '10px 18px',
                borderRadius: '16px',
                background: dark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.45)',
                border: dark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(120, 100, 230, 0.15)',
                fontSize: '12px',
                color: dark ? '#cbd5e1' : '#475569'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c084fc' }} />
                <strong>Major:</strong> Foundational architecture & breaking upgrades
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
                <strong>Minor:</strong> Meaningful new capabilities & features
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                <strong>Patch:</strong> Bug fixes, UI polish, & performance
              </div>
            </div>

            {/* Search Box & Category Pills */}
            <div
              style={{
                maxWidth: '680px',
                margin: '0 auto clamp(24px, 3.5vw, 44px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              {/* Search Bar */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: dark ? '#a7a1c8' : '#7c769b'
                  }}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  role="searchbox"
                  aria-label="Search releases by feature, fix, or keyword"
                  placeholder="Search releases, features, or fixes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 18px 12px 44px',
                    borderRadius: '16px',
                    background: dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.75)',
                    border: dark ? '1px solid rgba(216, 180, 254, 0.2)' : '1px solid rgba(120, 100, 230, 0.25)',
                    color: dark ? '#ffffff' : '#0f1026',
                    font: "500 14px 'Plus Jakarta Sans', sans-serif",
                    outline: 'none',
                    backdropFilter: 'blur(16px)',
                    boxShadow: dark ? '0 10px 28px rgba(0, 0, 0, 0.45)' : '0 6px 20px rgba(50, 25, 120, 0.08)'
                  }}
                />
              </div>

              {/* Category Pills */}
              <div
                role="group"
                aria-label="Filter releases by category"
                style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}
              >
                {['All', 'Features', 'Improvements', 'Bug Fixes', 'UI/UX', 'Performance', 'Security'].map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '7px 15px',
                        borderRadius: '999px',
                        font: "600 12.5px/1 'Plus Jakarta Sans', sans-serif",
                        cursor: 'pointer',
                        border: isSelected
                          ? '1px solid #f472b6'
                          : dark
                          ? '1px solid rgba(255, 255, 255, 0.16)'
                          : '1px solid rgba(120, 100, 230, 0.2)',
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.45) 0%, rgba(244, 114, 182, 0.35) 100%)'
                          : dark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(255, 255, 255, 0.65)',
                        color: isSelected ? '#ffffff' : dark ? '#d8d2f6' : '#4b4c68',
                        boxShadow: isSelected ? '0 4px 16px rgba(244, 114, 182, 0.3)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Version History List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 2.5vw, 32px)' }}>
              {filteredReleases.length === 0 ? (
                <div
                  className="footer-card-module"
                  style={{ textAlign: 'center', padding: '50px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <Filter size={32} style={{ color: dark ? '#a7a1c8' : '#7c769b', marginBottom: '14px' }} />
                  <h3 style={{ font: "700 18px 'Plus Jakarta Sans', sans-serif", margin: '0 0 8px' }}>
                    No releases matched your filter
                  </h3>
                  <p style={{ color: dark ? '#a7a1c8' : '#6b668f', fontSize: '14px', margin: 0 }}>
                    Try clearing your search query or selecting &quot;All&quot; categories.
                  </p>
                </div>
              ) : (
                filteredReleases.map((entry, index) => {
                  const activeCategories = getActiveCategories(entry).filter(
                    (c) => selectedCategory === 'All' || c.category === selectedCategory
                  );
                  const isLatest = index === 0;
                  const isExpanded = expandedVersions.has(entry.version);
                  const isHighlighted = highlightedVersion === entry.version;
                  const isCopied = copiedVersion === entry.version;

                  return (
                    <motion.article
                      key={entry.version}
                      id={`v${entry.version}`}
                      data-testid={`release-card-${entry.version}`}
                      className="footer-card-module"
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3) }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        justifyContent: 'flex-start',
                        gap: '20px',
                        borderColor: isHighlighted
                          ? '#a855f7'
                          : isLatest
                          ? 'rgba(244, 114, 182, 0.45)'
                          : undefined,
                        boxShadow: isHighlighted
                          ? '0 0 24px rgba(168, 85, 247, 0.4)'
                          : undefined,
                        transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                      }}
                    >
                      {/* Card Top Row: Version, Type, Date, and Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                          borderBottom: dark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                          paddingBottom: '16px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <h2
                            style={{
                              margin: 0,
                              font: "clamp(26px, 3vw, 38px)/1 'Anton', Impact, sans-serif",
                              letterSpacing: '-0.02em',
                              color: '#ffffff',
                              textShadow: '0 2px 14px rgba(20, 4, 60, 0.5)'
                            }}
                          >
                            v{entry.version}
                          </h2>

                          {isLatest && (
                            <span
                              style={{
                                padding: '4px 11px',
                                borderRadius: '999px',
                                background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                                color: '#ffffff',
                                font: "800 10.5px/1 'Plus Jakarta Sans', sans-serif",
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)'
                              }}
                            >
                              Latest
                            </span>
                          )}

                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              background:
                                entry.releaseType === 'major'
                                    ? 'rgba(168, 85, 247, 0.22)'
                                    : entry.releaseType === 'minor'
                                    ? 'rgba(6, 182, 212, 0.22)'
                                    : 'rgba(16, 185, 129, 0.22)',
                              border:
                                entry.releaseType === 'major'
                                  ? '1px solid rgba(168, 85, 247, 0.45)'
                                  : entry.releaseType === 'minor'
                                  ? '1px solid rgba(6, 182, 212, 0.45)'
                                  : '1px solid rgba(16, 185, 129, 0.45)',
                              color:
                                entry.releaseType === 'major'
                                  ? '#d8b4fe'
                                  : entry.releaseType === 'minor'
                                  ? '#38bdf8'
                                  : '#34d399',
                              font: "700 11px/1 'Plus Jakarta Sans', sans-serif",
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em'
                            }}
                          >
                            {entry.releaseType} release
                          </span>
                        </div>

                        {/* Top Right: Date & Copy Link Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: dark ? '#a7a1c8' : '#6b668f',
                              font: "500 13px 'Plus Jakarta Sans', sans-serif"
                            }}
                          >
                            <Calendar size={14} />
                            <time dateTime={entry.date}>{entry.date}</time>
                          </div>

                          {/* Direct Link Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(entry.version)}
                            aria-label={`Copy direct link to release v${entry.version}`}
                            title="Copy direct anchor link"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              border: dark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
                              background: isCopied
                                ? 'rgba(52, 211, 153, 0.2)'
                                : dark
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.04)',
                              color: isCopied ? '#34d399' : dark ? '#cbd5e1' : '#475569',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {isCopied ? <Check size={13} /> : <Link2 size={13} />}
                            <span>{isCopied ? 'Copied' : 'Share'}</span>
                          </button>

                          {/* Expand/Collapse Toggle for Older Releases */}
                          {!isLatest && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(entry.version)}
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? 'Collapse changelog details' : 'Expand changelog details'}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                border: dark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
                                background: dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                                color: dark ? '#cbd5e1' : '#475569',
                                cursor: 'pointer',
                                fontSize: '11.5px',
                                fontWeight: 600
                              }}
                            >
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              <span>{isExpanded ? 'Collapse' : 'Details'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Release Summary */}
                      <p
                        data-testid={`release-summary-${entry.version}`}
                        style={{
                          margin: 0,
                          font: "500 15px/1.6 'Plus Jakarta Sans', sans-serif",
                          color: dark ? '#ede9fe' : '#231d3e'
                        }}
                      >
                        {entry.summary}
                      </p>

                      {/* Categorized Changes (Collapsible for older releases) */}
                      {(isLatest || isExpanded) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
                          {activeCategories.map((group) => (
                            <div
                              key={group.category}
                              data-testid={`release-category-${group.category.toLowerCase().replace(/\s+/g, '-')}`}
                              style={{
                                borderRadius: '18px',
                                background: dark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.55)',
                                border: dark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(120, 100, 230, 0.15)',
                                padding: '16px 20px'
                              }}
                            >
                              {/* Category Header */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '10px'
                                }}
                              >
                                {CATEGORY_ICONS[group.category]}
                                <strong
                                  style={{
                                    font: "700 14px 'Plus Jakarta Sans', sans-serif",
                                    color: dark ? '#ffffff' : '#121324'
                                  }}
                                >
                                  {group.category}
                                </strong>
                                <span
                                  style={{
                                    marginLeft: 'auto',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: dark ? '#a7a1c8' : '#7c769b'
                                  }}
                                >
                                  {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                                </span>
                              </div>

                              {/* Bullets */}
                              <ul
                                style={{
                                  margin: 0,
                                  padding: 0,
                                  listStyle: 'none',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px'
                                }}
                              >
                                {group.items.map((item, i) => (
                                  <li
                                    key={i}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'baseline',
                                      gap: '10px',
                                      font: "500 13.5px/1.55 'Plus Jakarta Sans', sans-serif",
                                      color: dark ? '#cbd5e1' : '#334155'
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#a855f7',
                                        boxShadow: '0 0 8px #a855f7',
                                        flexShrink: 0,
                                        transform: 'translateY(-2px)'
                                      }}
                                      aria-hidden="true"
                                    />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.article>
                  );
                })
              )}
            </div>
          </section>

          {/* Wordmark Rising over Footer */}
          <div className="wordmark-bleed" aria-hidden="true">
            <span className="wordmark-text">MYFINANCEOS</span>
          </div>

          {/* Canonical Landing Page SiteFooter */}
          <SiteFooter />
        </div>
      </div>
    </MotionConfig>
  );
};

export default ChangelogView;
