import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormRow } from './FormRow.js';

describe('FormRow', () => {
  it('renders children with default 2-column layout', () => {
    const { container } = render(
      <FormRow>
        <input data-testid="input-1" />
        <input data-testid="input-2" />
      </FormRow>
    );

    expect(screen.getByTestId('input-1')).toBeDefined();
    expect(screen.getByTestId('input-2')).toBeDefined();

    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain('responsive-stack');
    expect(row.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
  });

  it('supports custom ratio string columns and custom gap', () => {
    const { container } = render(
      <FormRow columns="1.2fr 1fr" gap="var(--spacing-05)">
        <div>Field A</div>
        <div>Field B</div>
      </FormRow>
    );

    const row = container.firstChild as HTMLElement;
    expect(row.style.gridTemplateColumns).toBe('1.2fr 1fr');
    expect(row.style.gap).toBe('var(--spacing-05)');
  });
});
