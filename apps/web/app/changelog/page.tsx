import React from 'react';
import { Metadata } from 'next';
import { ChangelogView } from '../../src/components/ChangelogView';
import { CURRENT_VERSION, CURRENT_RELEASE_DATE, CURRENT_RELEASE_SUMMARY } from '@financeos/shared';

export const metadata: Metadata = {
  title: `Changelog v${CURRENT_VERSION} | MyFinanceOS Sovereign Release History`,
  description: `MyFinanceOS v${CURRENT_VERSION} (${CURRENT_RELEASE_DATE}): ${CURRENT_RELEASE_SUMMARY}. Deterministic local-first wealth operating system for India.`,
  alternates: {
    canonical: '/changelog'
  },
  openGraph: {
    title: `MyFinanceOS Changelog v${CURRENT_VERSION}`,
    description: CURRENT_RELEASE_SUMMARY,
    type: 'website',
    url: '/changelog'
  }
};

export default function ChangelogPage() {
  return <ChangelogView showNav={true} />;
}
