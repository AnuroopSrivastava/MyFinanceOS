import React from 'react';

export type ReleaseLevel = 'major' | 'minor' | 'patch' | 'latest';

export interface ReleaseBadgeProps {
  level: ReleaseLevel | string;
  label?: string;
  isLatest?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ReleaseBadge: React.FC<ReleaseBadgeProps> = ({
  level,
  label,
  isLatest = false,
  className = '',
  style
}) => {
  const normalizedLevel = (level || 'patch').toLowerCase() as ReleaseLevel;
  const defaultLabel = label || (normalizedLevel === 'latest' ? 'Latest' : `${normalizedLevel} release`);

  return (
    <span
      data-testid="release-badge"
      className={`release-badge changelog-release-badge release-badge-${normalizedLevel} changelog-badge-${normalizedLevel} ${isLatest ? 'is-latest' : ''} ${className}`.trim()}
      style={style}
    >
      <span
        className={`release-legend-dot changelog-legend-dot release-legend-dot-${normalizedLevel} changelog-legend-dot-${normalizedLevel}`}
        aria-hidden="true"
      />
      <span>{defaultLabel}</span>
    </span>
  );
};

export interface ReleaseLegendItem {
  level: 'major' | 'minor' | 'patch';
  label: string;
  description: string;
}

export interface ReleaseLegendProps {
  className?: string;
  style?: React.CSSProperties;
  onSelectLevel?: (level: 'major' | 'minor' | 'patch') => void;
  selectedLevel?: string;
}

export const RELEASE_LEGEND_ITEMS: ReleaseLegendItem[] = [
  { level: 'major', label: 'Major', description: 'Foundational architecture & breaking upgrades' },
  { level: 'minor', label: 'Minor', description: 'Meaningful new capabilities & features' },
  { level: 'patch', label: 'Patch', description: 'Bug fixes, UI polish, & performance' }
];

export const ReleaseLegend: React.FC<ReleaseLegendProps> = ({
  className = '',
  style,
  onSelectLevel,
  selectedLevel
}) => {
  return (
    <div
      role="region"
      aria-label="Release type legend"
      className={`changelog-legend ${className}`.trim()}
      style={style}
    >
      {RELEASE_LEGEND_ITEMS.map((item) => {
        const isSelected = selectedLevel === item.level;

        if (onSelectLevel) {
          return (
            <button
              key={item.level}
              type="button"
              className={`changelog-legend-item-btn ${isSelected ? 'is-active' : ''}`}
              onClick={() => onSelectLevel(item.level)}
              aria-pressed={isSelected}
              aria-label={`Filter by ${item.label} releases: ${item.description}`}
            >
              <span
                className={`release-legend-dot changelog-legend-dot release-legend-dot-${item.level} changelog-legend-dot-${item.level}`}
                aria-hidden="true"
              />
              <strong>{item.label}:</strong> <span>{item.description}</span>
            </button>
          );
        }

        return (
          <div key={item.level} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              className={`release-legend-dot changelog-legend-dot release-legend-dot-${item.level} changelog-legend-dot-${item.level}`}
              aria-hidden="true"
            />
            <strong>{item.label}:</strong> {item.description}
          </div>
        );
      })}
    </div>
  );
};

export default ReleaseBadge;
