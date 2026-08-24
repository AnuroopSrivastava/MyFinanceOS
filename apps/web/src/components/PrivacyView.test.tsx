import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrivacyView } from './PrivacyView';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

describe('PrivacyView Component', () => {
  it('renders privacy policy header and security white paper highlights', () => {
    render(<PrivacyView showNav={true} />);
    expect(screen.getByTestId('privacy-view')).toBeDefined();
    expect(screen.getAllByText(/Local-First Architecture/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Zero-Knowledge/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AES-256/i).length).toBeGreaterThan(0);
  });
});
