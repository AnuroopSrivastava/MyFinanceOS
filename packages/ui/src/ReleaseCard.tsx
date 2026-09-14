import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Database,
  ShieldCheck,
  GitCommit,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  type ChangelogEntry,
  getActiveCategories,
  getEntryReleaseLabel
} from '@financeos/shared';
import { ReleaseBadge } from './ReleaseBadge.js';
import { CopyLinkButton } from './CopyLinkButton.js';
import { CategoryIcon } from './CategoryIcon.js';

export interface ReleaseCardProps {
  entry: ChangelogEntry;
  isLatest?: boolean;
  isExpanded?: boolean;
  isHighlighted?: boolean;
  selectedCategory?: string;
  onToggleExpand?: (version: string) => void;
  onCopyLink?: (version: string) => void;
  index?: number;
  className?: string;
}

const ReleaseCardBase: React.FC<ReleaseCardProps> = ({
  entry,
  isLatest = false,
  isExpanded = true,
  isHighlighted = false,
  selectedCategory = 'All',
  onToggleExpand,
  onCopyLink,
  index = 0,
  className = ''
}) => {
  const [isAuditExpanded, setIsAuditExpanded] = useState(false);

  const activeCategories = useMemo(() =>
    getActiveCategories(entry).filter(
      (c) => selectedCategory === 'All' || c.category === selectedCategory
    ),
    [entry, selectedCategory]
  );

  const directAnchorUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#v${entry.version}`
      : `#v${entry.version}`;

  const hasAuditData = Boolean(
    (entry.migrations && entry.migrations.length > 0) ||
    entry.commitHash ||
    entry.gitTag
  );

  return (
    <article
      id={`v${entry.version}`}
      data-testid={`release-card-${entry.version}`}
      className={`changelog-release-card release-card ${className}`.trim()}
      style={{
        animationDelay: `${Math.min(index * 0.05, 0.2)}s`,
        borderColor: isHighlighted ? 'var(--accent-purple, #a855f7)' : undefined,
        boxShadow: isHighlighted ? '0 0 24px rgba(168, 85, 247, 0.4)' : undefined
      }}
    >
      {/* Card Top Row: Version, Type, Date, and Actions */}
      <div className="changelog-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h2 className="changelog-version-heading">v{entry.version}</h2>

          {isLatest && <span className="changelog-badge-latest">Latest</span>}

          <ReleaseBadge
            level={entry.releaseType}
            label={getEntryReleaseLabel(entry)}
            className={entry.versionJump && entry.versionJump.minor >= 2 && entry.releaseType === 'minor' ? 'release-badge-substantial' : undefined}
          />
        </div>

        {/* Top Right: Date & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="changelog-date-wrap">
            <Calendar size={14} aria-hidden="true" />
            <time dateTime={entry.date} className="changelog-tabular">
              {entry.date}
            </time>
          </div>

          {/* Direct Link Button */}
          <CopyLinkButton
            url={directAnchorUrl}
            ariaLabel={`Copy direct link to release v${entry.version}`}
            onCopy={() => onCopyLink?.(entry.version)}
          />

          {/* Expand/Collapse Toggle for Older Releases */}
          {!isLatest && onToggleExpand && (
            <button
              type="button"
              onClick={() => onToggleExpand(entry.version)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse changelog details' : 'Expand changelog details'}
              className="changelog-btn"
            >
              {isExpanded ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
              <span>{isExpanded ? 'Collapse' : 'Details'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Release Context Group: Subsystems + Summary tightly coupled */}
      <div className="changelog-card-context">
        {entry.subsystems && entry.subsystems.length > 0 && (
          <div className="changelog-subsystems-row" data-testid="release-subsystems">
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: 'var(--font-2xs, 11px)', fontWeight: 600 }}>
              <Layers size={12} aria-hidden="true" />
              <span>Subsystems:</span>
            </div>
            {entry.subsystems.map((subsystem) => (
              <span key={subsystem} className="changelog-subsystem-pill">
                {subsystem}
              </span>
            ))}
          </div>
        )}

        {/* Release Summary */}
        <p data-testid={`release-summary-${entry.version}`} className="changelog-summary">
          {entry.summary}
        </p>
      </div>

      {/* Release Highlights / Metrics */}
      {entry.highlights && entry.highlights.length > 0 && (
        <div className="changelog-highlights-row" data-testid="release-highlights">
          {entry.highlights.map((h, i) => (
            <div key={i} className="changelog-highlight-chip">
              <Sparkles size={11} className="changelog-highlight-icon" aria-hidden="true" />
              <span className="changelog-highlight-label">{h.label}:</span>
              <span className="changelog-highlight-value">{h.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Categorized Changes (Collapsible for older releases) */}
      {(isLatest || isExpanded) && (
        <div className="changelog-changes-list">
          {activeCategories.map((group) => (
            <div
              key={group.category}
              data-testid={`release-category-${group.category.toLowerCase().replace(/\s+/g, '-')}`}
              className="changelog-category-container"
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
                <CategoryIcon category={group.category} size={15} />
                <strong className="changelog-category-title">{group.category}</strong>
                <span className="changelog-item-count">
                  {group.items.length} {group.items.length === 1 ? 'update' : 'updates'}
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
                  <li key={i} className="changelog-bullet-item">
                    <span className="changelog-bullet-dot" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Technical Audit & Migration Inspector Drawer */}
          {hasAuditData && (
            <div className="changelog-audit-section">
              <button
                type="button"
                className="changelog-audit-trigger"
                onClick={() => setIsAuditExpanded((prev) => !prev)}
                aria-expanded={isAuditExpanded}
                aria-label={`Toggle technical audit: ${isAuditExpanded ? 'Hide' : 'Show'} details for release v${entry.version}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Database size={13} aria-hidden="true" style={{ color: 'var(--accent-cyan, #06b6d4)' }} />
                  <span>Technical &amp; Storage Audit</span>
                </div>
                {isAuditExpanded ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
              </button>

              {isAuditExpanded && (
                <div
                  className="changelog-audit-drawer"
                  data-testid="release-audit-drawer"
                >
                  {/* Database Migrations */}
                  {entry.migrations && entry.migrations.length > 0 && (
                    <div className="changelog-audit-block">
                      <div className="changelog-audit-subtitle">
                        <Database size={12} aria-hidden="true" />
                        <span>Database Schema Changes</span>
                      </div>
                      <div className="changelog-migration-list">
                        {entry.migrations.map((mig, mi) => (
                          <div key={mi} className="changelog-migration-item">
                            <div className="changelog-migration-header">
                              <code className="changelog-migration-table">{mig.table}</code>
                              {mig.safe && (
                                <span className="changelog-migration-safe" title="Backwards-compatible with local encrypted database">
                                  <ShieldCheck size={11} aria-hidden="true" />
                                  Non-breaking Migration
                                </span>
                              )}
                            </div>
                            <p className="changelog-migration-desc">{mig.change}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cryptographic & Git Metadata */}
                  <div className="changelog-audit-meta-row">
                    {entry.gitTag && (
                      <div className="changelog-audit-meta-tag">
                        <GitCommit size={12} aria-hidden="true" />
                        <span>Git Tag:</span>
                        <code className="changelog-mono">{entry.gitTag}</code>
                      </div>
                    )}
                    {entry.commitHash && (
                      <div className="changelog-audit-meta-tag">
                        <span>Commit:</span>
                        <code className="changelog-mono">{entry.commitHash}</code>
                      </div>
                    )}
                    <div className="changelog-audit-meta-tag changelog-audit-sovereign">
                      <ShieldCheck size={12} aria-hidden="true" />
                      <span>Verified Offline: 100% Local &amp; Sovereign</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export const ReleaseCard = React.memo(ReleaseCardBase, (prev, next) =>
  prev.entry.version === next.entry.version &&
  prev.isExpanded === next.isExpanded &&
  prev.isHighlighted === next.isHighlighted &&
  prev.selectedCategory === next.selectedCategory &&
  prev.isLatest === next.isLatest &&
  prev.index === next.index
);

export const MemoizedReleaseCard = ReleaseCard;
export default ReleaseCard;
