'use client';

import React from 'react';
import {
  CURRENT_VERSION,
  CURRENT_RELEASE_DATE,
  CHANGELOG_ENTRIES
} from '@financeos/shared';

export interface ChangelogMetaStripProps {
  currentVersion?: string;
  releaseDate?: string;
  releaseCount?: number;
}

export const ChangelogMetaStrip: React.FC<ChangelogMetaStripProps> = ({
  currentVersion = CURRENT_VERSION,
  releaseDate = CURRENT_RELEASE_DATE,
  releaseCount = CHANGELOG_ENTRIES.length
}) => {
  return (
    <div
      role="region"
      aria-label="Release overview metadata"
      className="changelog-meta-strip"
      data-testid="changelog-meta-strip"
    >
      <span className="changelog-meta-item">
        <span className="changelog-metric-label">Current Version:</span>
        <span className="changelog-metric-value changelog-metric-cyan">v{currentVersion}</span>
      </span>
      <span className="changelog-meta-bullet" aria-hidden="true" />
      <span className="changelog-meta-item">
        <span className="changelog-metric-label">Latest Update:</span>
        <time dateTime={releaseDate} className="changelog-metric-value changelog-metric-slate">{releaseDate}</time>
      </span>
      <span className="changelog-meta-bullet" aria-hidden="true" />
      <span className="changelog-meta-item">
        <span className="changelog-metric-label">Total Releases:</span>
        <span className="changelog-metric-value changelog-metric-emerald">{releaseCount}</span>
      </span>
    </div>
  );
};

export default ChangelogMetaStrip;
