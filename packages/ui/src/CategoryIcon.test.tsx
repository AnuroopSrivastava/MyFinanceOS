import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CategoryIcon } from './CategoryIcon';

describe('CategoryIcon Component', () => {
  it('renders without throwing for all standard change categories', () => {
    const categories = [
      'Features',
      'Improvements',
      'Bug Fixes',
      'Performance',
      'UI/UX',
      'Security',
      'Refactoring',
      'Breaking Changes',
      'Other'
    ];

    for (const cat of categories) {
      const { container } = render(<CategoryIcon category={cat} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    }
  });

  it('falls back safely for unknown category', () => {
    const { container } = render(<CategoryIcon category="Unknown Category" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
  });
});
