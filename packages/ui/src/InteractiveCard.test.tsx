import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { InteractiveCard } from './InteractiveCard';

describe('InteractiveCard opt-out', () => {
  it('marks interactive cards with data-interactive-card by default', () => {
    const { container } = render(<InteractiveCard>Presentational</InteractiveCard>);
    const card = container.firstElementChild as HTMLElement;
    expect(card.getAttribute('data-interactive-card')).toBe('normal');
    expect(card.classList.contains('glass-panel')).toBe(true);
  });

  it('allows panels with controls to opt out of 3D transforms', () => {
    const { container } = render(
      <div className="glass-panel" data-interactive-card="off">
        <button type="button">Save</button>
      </div>,
    );
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.getAttribute('data-interactive-card')).toBe('off');
  });
});
