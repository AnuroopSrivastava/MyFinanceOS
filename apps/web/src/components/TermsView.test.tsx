import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TermsView } from './TermsView';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

describe('TermsView Component', () => {
  it('renders terms of service header and user sovereignty disclaimers', () => {
    render(<TermsView showNav={true} />);
    expect(screen.getByTestId('terms-view')).toBeDefined();
    expect(screen.getAllByText(/Software License/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/User Data Ownership|Data Ownership/i).length).toBeGreaterThan(0);
  });
});
