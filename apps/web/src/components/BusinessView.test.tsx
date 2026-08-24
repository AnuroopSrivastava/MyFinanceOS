import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BusinessView } from './BusinessView.js';

vi.mock('@financeos/database', () => ({
  dbService: {
    getAccounts: () => [],
    getTransactions: () => [],
    getInvoices: () => [],
    getInventory: () => [],
    getContacts: () => [],
    getRegister: () => [],
    getSettings: () => ({ businessName: 'Test Corp', businessGSTIN: '27AAAAA0000A1Z5' }),
    getProfiles: () => [{ id: 'default', name: 'Test User' }],
    subscribe: () => () => {},
    onUnsavedChangeStatus: () => () => {},
    onSaveErrorStatus: () => () => {}
  }
}));

describe('BusinessView Component Diagnostics', () => {
  it('renders Business Ledger & GST Compliance Hub', () => {
    render(<BusinessView activeProfileId="default" />);

    expect(screen.getByText(/Business Suite & Bookkeeping/i)).toBeTruthy();
    expect(screen.getAllByText(/Invoices/i).length).toBeGreaterThan(0);
  });
});
