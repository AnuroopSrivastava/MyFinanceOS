import React from 'react';
import { Accordion } from '@financeos/ui';
import { LandingSectionHeader } from './primitives/index.js';

export interface FaqItem {
  id: string;
  title: string;
  content: string;
}

export interface LandingFaqSectionProps {
  items?: FaqItem[];
  badgeText?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-free',
    title: 'Is MyFinanceOS free and open-source?',
    content:
      'Yes! Because your data is processed and stored locally on your device and synced via lightweight encrypted cloud storage, server costs are near zero. MyFinanceOS provides a complete suite of personal and business financial tools completely free.'
  },
  {
    id: 'faq-sync',
    title: 'How does Cloud Sync work across my phone and laptop?',
    content:
      'When you enable Cloud Sync, MyFinanceOS encrypts your financial data directly on your device before sending it to Supabase. Only encrypted ciphertext is stored in the cloud. You can log in on any device with Google and decrypt your records using your personal PIN.'
  },
  {
    id: 'faq-pin',
    title: 'What happens if I lose my PIN or device?',
    content:
      'Because MyFinanceOS uses zero-knowledge encryption, nobody—not even our team—can reset your PIN or see your data. We recommend making regular 1-click encrypted JSON backup exports saved to your Google Drive or personal computer.'
  },
  {
    id: 'faq-export',
    title: 'Can I export my data to Excel or CSV at any time?',
    content:
      'Absolutely. You own 100% of your data forever. You can export your entire transaction history, double-entry ledgers, and tax simulations to standard CSV (Excel-compatible) and JSON formats anytime in one click.'
  },
  {
    id: 'faq-privacy',
    title: 'Does MyFinanceOS read my SMS or share data with anyone?',
    content:
      'Never. Unlike traditional banking and expense apps, MyFinanceOS does not read your private SMS inbox, does not scrape your email receipts, and never sells your information to loan aggregators or ad networks. Your finances remain 100% private.'
  }
];

export const LandingFaqSection: React.FC<LandingFaqSectionProps> = ({
  items = DEFAULT_FAQ_ITEMS,
  badgeText,
  title = 'Frequently Asked Questions',
  subtitle = 'Everything you need to know about MyFinanceOS security, zero-knowledge privacy, and local-first architecture.',
  className = '',
  style = {}
}) => {
  return (
    <section
      id="faq-section"
      aria-label="Frequently Asked Questions"
      className={`l-section ${className}`}
      style={{
        paddingTop: '2.5rem',
        paddingBottom: '3.5rem',
        ...style
      }}
    >
      <LandingSectionHeader
        badgeText={badgeText}
        title={title}
        subtitle={subtitle}
        style={{ marginBottom: '2.5rem' }}
      />

      <div className="l-faq-wrapper">
        <Accordion items={items} iconVariant="plus" />
      </div>
    </section>
  );
};
