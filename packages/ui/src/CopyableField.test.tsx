import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyableField } from './CopyableField.js';

describe('CopyableField', () => {
  it('renders value and label', () => {
    render(<CopyableField label="API Key" value="sk-123456789" />);
    expect(screen.getByText('API Key')).toBeDefined();
    expect(screen.getByText('sk-123456789')).toBeDefined();
  });

  it('handles copy click and transitions state', async () => {
    const onCopy = vi.fn();
    const writeTextMock = vi.fn().mockImplementation(() => Promise.resolve());
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<CopyableField value="secret-token-abc" onCopy={onCopy} />);
    const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(onCopy).toHaveBeenCalledWith('secret-token-abc');
      expect(screen.getByText('Copied!')).toBeDefined();
    });
  });

  it('masks sensitive secret values and toggles reveal', () => {
    render(<CopyableField value="my-super-secret-password" secret />);
    expect(screen.getByText('••••••••••••••••')).toBeDefined();

    const eyeBtn = screen.getByRole('button', { name: /show secret value/i });
    fireEvent.click(eyeBtn);

    expect(screen.getByText('my-super-secret-password')).toBeDefined();
  });
});
