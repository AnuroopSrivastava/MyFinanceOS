import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReleaseCard } from './ReleaseCard';
import type { ChangelogEntry } from '@financeos/shared';

const mockEntry: ChangelogEntry = {
  version: '2.0.0',
  date: '2026-09-10',
  releaseType: 'major',
  summary: 'Major platform upgrade with sovereign local vaulting',
  gitTag: 'v2.0.0',
  commitHash: '8f2a1b9',
  subsystems: ['Encrypted Vault', 'Tax Engine'],
  highlights: [
    { label: 'WASM Latency', value: '-22%' },
    { label: 'Security', value: 'Argon2id' }
  ],
  migrations: [
    {
      table: 'vault_keys',
      change: 'Added Argon2id parameters record',
      safe: true
    }
  ],
  changes: [
    {
      category: 'Features',
      items: ['Introduced multi-currency tracking', 'Added automated asset valuation']
    },
    {
      category: 'Security',
      items: ['Upgraded key derivation cipher']
    }
  ]
};

describe('ReleaseCard Component', () => {
  it('renders version heading, summary, and latest badge when isLatest is true', () => {
    render(<ReleaseCard entry={mockEntry} isLatest={true} />);
    expect(screen.getByText('v2.0.0')).toBeDefined();
    expect(screen.getByText('Latest')).toBeDefined();
    expect(screen.getByText('Major platform upgrade with sovereign local vaulting')).toBeDefined();
    expect(screen.getByText('Features')).toBeDefined();
    expect(screen.getByText('Introduced multi-currency tracking')).toBeDefined();
  });

  it('renders subsystem badges and highlight metric chips', () => {
    render(<ReleaseCard entry={mockEntry} isLatest={true} />);
    expect(screen.getByTestId('release-subsystems')).toBeDefined();
    expect(screen.getByText('Encrypted Vault')).toBeDefined();
    expect(screen.getByText('Tax Engine')).toBeDefined();

    expect(screen.getByTestId('release-highlights')).toBeDefined();
    expect(screen.getByText('-22%')).toBeDefined();
    expect(screen.getByText('Argon2id')).toBeDefined();
  });

  it('toggles technical audit and migration inspector drawer', () => {
    render(<ReleaseCard entry={mockEntry} isLatest={true} />);
    const auditBtn = screen.getByRole('button', { name: /toggle technical audit/i });
    expect(auditBtn).toBeDefined();
    expect(screen.queryByTestId('release-audit-drawer')).toBeNull();

    // Expand audit drawer
    fireEvent.click(auditBtn);
    expect(screen.getByTestId('release-audit-drawer')).toBeDefined();
    expect(screen.getByText('vault_keys')).toBeDefined();
    expect(screen.getByText('Added Argon2id parameters record')).toBeDefined();
    expect(screen.getByText('8f2a1b9')).toBeDefined();

    // Collapse audit drawer
    fireEvent.click(auditBtn);
    expect(screen.queryByTestId('release-audit-drawer')).toBeNull();
  });

  it('handles toggle expand callback for older releases', () => {
    const onToggle = vi.fn();
    render(<ReleaseCard entry={mockEntry} isLatest={false} isExpanded={false} onToggleExpand={onToggle} />);
    const button = screen.getByRole('button', { name: /expand changelog details/i });
    expect(button).toBeDefined();

    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledWith('2.0.0');
  });
});
