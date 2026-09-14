import React from 'react';
import { Metadata } from 'next';
import { ChangelogView } from '../../src/components/ChangelogView';
import {
  CURRENT_VERSION,
  CURRENT_RELEASE_DATE,
  CURRENT_RELEASE_SUMMARY,
  CHANGELOG_ENTRIES
} from '@financeos/shared';

export const metadata: Metadata = {
  title: `Changelog & Product Updates v${CURRENT_VERSION} | MyFinanceOS`,
  description: `Track all updates and improvements in MyFinanceOS v${CURRENT_VERSION} (${CURRENT_RELEASE_DATE}): ${CURRENT_RELEASE_SUMMARY}. Sovereign, local-first wealth operating system for India.`,
  alternates: {
    canonical: '/changelog'
  },
  openGraph: {
    title: `MyFinanceOS Changelog & Product Updates (v${CURRENT_VERSION})`,
    description: CURRENT_RELEASE_SUMMARY,
    type: 'website',
    url: '/changelog'
  },
  twitter: {
    card: 'summary_large_image',
    title: `MyFinanceOS Changelog & Product Updates (v${CURRENT_VERSION})`,
    description: CURRENT_RELEASE_SUMMARY
  }
};

export default function ChangelogPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MyFinanceOS',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web, Progressive Web App',
    softwareVersion: CURRENT_VERSION,
    datePublished: CURRENT_RELEASE_DATE,
    description: CURRENT_RELEASE_SUMMARY,
    releaseNotes: CHANGELOG_ENTRIES.map((entry) => ({
      '@type': 'SoftwareUpdate',
      version: entry.version,
      releaseDate: entry.date,
      description: entry.summary
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ChangelogView showNav={true} />
    </>
  );
}
