import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SettingsView } from './SettingsView';
import { dbService } from '@financeos/database';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('@financeos/database', () => ({
  dbService: {
    subscribe: vi.fn().mockImplementation(() => () => {}),
    getAuditLogs: () => [],
    onUnsavedChangeStatus: () => () => {},
    onSaveErrorStatus: () => () => {},
    getSettings: () => ({ theme: 'dark', currency: 'INR', backupSchedule: 'none', isCloudBackupEnabled: false }),
    getProfiles: vi.fn().mockReturnValue([{ id: 'p1', name: 'Admin', role: 'Admin', isNomineeProvided: true, relationship: 'Self' }]),
    updateSettings: vi.fn(),
    addProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
    getRawDb: () => '{}',
    importRawDb: vi.fn(),
  },
}));

describe('SettingsView profile controls', () => {
  it('opens and cancels the add-profile dialog', () => {
    render(<SettingsView activeProfileId="p1" onActiveProfileChange={vi.fn()} />);

    fireEvent.click(screen.getByText('Add Profile'));
    expect(screen.getByText('Add Family Profile')).toBeTruthy();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Add Family Profile')).toBeNull();
  });

  it('opens the protected-delete message for the only admin profile', () => {
    render(<SettingsView activeProfileId="p1" onActiveProfileChange={vi.fn()} />);

    fireEvent.click(screen.getByTitle('Delete Profile'));
    expect(screen.getByText('Cannot Delete Admin Profile')).toBeTruthy();
  });

  it('allows removing a non-sole admin profile via confirmation', async () => {
    vi.mocked(dbService.getProfiles).mockReturnValueOnce([
      { id: 'p1', name: 'Admin 1', role: 'Admin', isNomineeProvided: true, relationship: 'Self' },
      { id: 'p2', name: 'Member 2', role: 'Member', isNomineeProvided: false, relationship: 'Spouse' }
    ]);
    const mockOnChange = vi.fn();
    render(<SettingsView activeProfileId="p1" onActiveProfileChange={mockOnChange} />);

    const removeButtons = screen.getAllByTitle('Delete Profile');
    expect(removeButtons.length).toBe(2);

    fireEvent.click(removeButtons[1]);
    expect(screen.getByText(/Permanently delete profile "Member 2"/i)).toBeTruthy();

    const confirmBtn = screen.getByRole('button', { name: 'Delete Profile' });
    fireEvent.click(confirmBtn);

    expect(dbService.deleteProfile).toHaveBeenCalledWith('p2');
  });
});
