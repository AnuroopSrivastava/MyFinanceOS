import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { SettingsView } from './SettingsView';
import { dbService } from '@financeos/database';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
  };
});

vi.mock('@financeos/database', () => ({
  dbService: {
    subscribe: vi.fn().mockImplementation(() => () => {}),
    getAuditLogs: () => [],
    onUnsavedChangeStatus: () => () => {},
    onSaveErrorStatus: () => () => {},
    getSettings: () => ({
      theme: 'dark',
      currency: 'INR',
      backupSchedule: 'none',
      isCloudBackupEnabled: false,
      businessName: 'Acme',
      businessGSTIN: '123'
    }),
    getProfiles: () => [
      { id: 'p1', name: 'Anuroop Srivastava', role: 'Admin', isNomineeProvided: true, relationship: 'Self' }
    ],
    updateSettings: vi.fn(),
    addProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
    getRawDb: () => '{}',
    importRawDb: vi.fn()
  }
}));

describe('SettingsView Edit Profile', () => {
  it('should open edit modal and save changes', async () => {
    const mockOnChange = vi.fn();
    render(<SettingsView activeProfileId="p1" onActiveProfileChange={mockOnChange} />);

    // Click Edit button
    const editBtn = screen.getByTitle('Edit Profile');
    fireEvent.click(editBtn);

    // Modal should be visible
    expect(screen.getByText('Edit Profile Details')).toBeTruthy();

    // Change name
    const nameInput = screen.getByDisplayValue('Anuroop Srivastava');
    fireEvent.change(nameInput, { target: { value: 'Anuroop Updated' } });

    // Click Save
    const saveBtn = screen.getByText(/Save Profile Changes|Save Changes/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(dbService.updateProfile).toHaveBeenCalledWith('p1', expect.objectContaining({
        name: 'Anuroop Updated'
      }));
    });
  });

});
