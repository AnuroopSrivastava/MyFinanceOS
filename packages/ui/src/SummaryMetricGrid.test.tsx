import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SummaryMetricGrid } from './SummaryMetricGrid.js';

describe('SummaryMetricGrid component', () => {
  it('renders children within a responsive grid container', () => {
    const { container } = render(
      <SummaryMetricGrid columns={4} gap="1.5rem">
        <div>Metric 1</div>
        <div>Metric 2</div>
        <div>Metric 3</div>
        <div>Metric 4</div>
      </SummaryMetricGrid>
    );

    const grid = container.firstElementChild as HTMLElement;
    expect(grid.classList.contains('summary-metric-grid')).toBe(true);
    expect(grid.style.display).toBe('grid');
    expect(grid.style.gridTemplateColumns).toBe('repeat(4, 1fr)');
    expect(grid.style.gap).toBe('1.5rem');
    expect(screen.getByText('Metric 1')).toBeDefined();
    expect(screen.getByText('Metric 4')).toBeDefined();
  });

  it('renders auto-fit grid when columns="auto"', () => {
    const { container } = render(
      <SummaryMetricGrid columns="auto" minItemWidth="250px">
        <div>Item A</div>
        <div>Item B</div>
      </SummaryMetricGrid>
    );

    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(250px, 1fr))');
  });
});
