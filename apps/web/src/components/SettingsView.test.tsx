import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { SettingsView } from './SettingsView';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
  };
});

// Mock database service
vi.mock('@financeos/database', () => ({
  dbService: {
    getAuditLogs: () => [],
    subscribe: () => () => {},
    onUnsavedChangeStatus: () => () => {},
    onSaveErrorStatus: () => () => {},
    getSettings: () => ({
      theme: 'dark',
      currency: 'INR',
      backupSchedule: 'none',
      isCloudBackupEnabled: false,
      businessName: 'Acme Test Pvt Ltd',
      businessGSTIN: '27AAAAA0000A1Z5'
    }),
    getProfiles: () => [
      { id: 'p1', name: 'Anuroop', role: 'Admin', isNomineeProvided: true, relationship: 'Self' }
    ],

    updateSettings: vi.fn(),
    addProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
    getRawDb: () => '{}',
    importRawDb: vi.fn()
  }
}));

describe('SettingsView Diagnostics', () => {
  it('renders system configuration header and stats correctly', () => {
    const mockOnChange = vi.fn();
    render(<SettingsView activeProfileId="p1" onActiveProfileChange={mockOnChange} />);

    expect(screen.getByText(/System Settings/i)).toBeTruthy();
    expect(screen.getByText(/Appearance & Theme Engine/i)).toBeTruthy();
    expect(screen.getByText(/Business & GSTIN Profile/i)).toBeTruthy();
    expect(screen.getByText(/Offline Data Backup & Vault/i)).toBeTruthy();
    expect(screen.getByText(/Profiles & Access Registry/i)).toBeTruthy();

  });

  it('displays active user profile name and theme presets', () => {
    const mockOnChange = vi.fn();
    render(<SettingsView activeProfileId="p1" onActiveProfileChange={mockOnChange} />);

    expect(screen.getByText(/Anuroop/i)).toBeTruthy();
    expect(screen.getByText(/Vantablack/i)).toBeTruthy();
    expect(screen.getByText(/Neon Cyan/i)).toBeTruthy();
    expect(screen.getByText(/Emerald Green/i)).toBeTruthy();
  });
});
