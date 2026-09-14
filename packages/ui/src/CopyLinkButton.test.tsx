import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyLinkButton } from './CopyLinkButton';

describe('CopyLinkButton Component', () => {
  it('renders with default label and handles copy interaction', async () => {
    const onCopy = vi.fn();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });

    render(<CopyLinkButton url="https://example.com/changelog#v1.1.1" onCopy={onCopy} />);
    const button = screen.getByRole('button', { name: /copy link/i });
    expect(button).toBeDefined();

    fireEvent.click(button);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/changelog#v1.1.1');
      expect(onCopy).toHaveBeenCalledWith('https://example.com/changelog#v1.1.1');
      expect(screen.getByText('Copied')).toBeDefined();
    });
  });
});
