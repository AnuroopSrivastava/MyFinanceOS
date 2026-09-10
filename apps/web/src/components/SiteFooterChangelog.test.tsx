import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SiteFooter } from './Landing';
import { CURRENT_VERSION, LATEST_CHANGELOG_ENTRY } from '@financeos/shared';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

describe('SiteFooter Changelog & Version Integration', () => {
  it('renders dynamic application version in footer matching single source of truth', () => {
    render(<SiteFooter />);
    const versionTag = screen.getByTestId('footer-version-tag');
    expect(versionTag).toBeDefined();
    expect(versionTag.textContent).toContain(`MyFinanceOS v${CURRENT_VERSION}`);
  });

  it('renders latest changelog summary dynamically in footer', () => {
    render(<SiteFooter />);
    const summaryContainer = screen.getByTestId('footer-changelog-summary');
    expect(summaryContainer).toBeDefined();
    expect(summaryContainer.textContent).toContain(LATEST_CHANGELOG_ENTRY.summary);
  });

  it('contains View Changelog link pointing to /changelog', () => {
    render(<SiteFooter />);
    const changelogLink = screen.getByTestId('footer-changelog-link');
    expect(changelogLink).toBeDefined();
    expect(changelogLink.getAttribute('href')).toBe('/changelog');
  });

  it('does not throw when a path-based footer link is clicked', () => {
    render(<SiteFooter />);
    // Path hrefs are not valid CSS selectors, so the smooth-scroll handler
    // must skip document.querySelector for them and let navigation proceed.
    for (const label of ['Changelog', 'Terms of Service', 'Privacy Policy']) {
      expect(() => fireEvent.click(screen.getByText(label))).not.toThrow();
    }
  });
});
