import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChangelogMetaStrip } from './ChangelogMetaStrip';
import { CURRENT_VERSION, CURRENT_RELEASE_DATE } from '@financeos/shared';

describe('ChangelogMetaStrip Component', () => {
  it('renders default version, release date, and count metrics', () => {
    render(<ChangelogMetaStrip />);
    const metaStrip = screen.getByTestId('changelog-meta-strip');
    expect(metaStrip).toBeDefined();

    expect(metaStrip.textContent).toContain(`v${CURRENT_VERSION}`);
    expect(metaStrip.textContent).toContain(CURRENT_RELEASE_DATE);

    const values = metaStrip.querySelectorAll('.changelog-metric-value');
    expect(values.length).toBe(3);
  });

  it('renders custom metric overrides when provided', () => {
    render(
      <ChangelogMetaStrip
        currentVersion="2.0.0"
        releaseDate="October 2026"
        releaseCount={42}
      />
    );
    const metaStrip = screen.getByTestId('changelog-meta-strip');
    expect(metaStrip.textContent).toContain('v2.0.0');
    expect(metaStrip.textContent).toContain('October 2026');
    expect(metaStrip.textContent).toContain('42');
  });
});
