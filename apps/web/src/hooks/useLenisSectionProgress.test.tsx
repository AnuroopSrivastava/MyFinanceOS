import React, { useRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act, cleanup } from '@testing-library/react';
import { useLenisSectionProgress } from './useLenisSectionProgress.js';

/**
 * The ORIGINAL (pre-cache) formula: read a live getBoundingClientRect every
 * tick. The cached-metrics implementation must produce identical numbers
 * whenever the world is consistent (rectTop = sectionTop - scrollY).
 */
function oldFormulaProgress(
  rectTop: number,
  rectHeight: number,
  vh: number,
  anchors: { start: number; end: number }
): number {
  const span = rectHeight + (anchors.start - anchors.end) * vh;
  if (span <= 0) return NaN;
  return Math.min(Math.max((anchors.start * vh - rectTop) / span, 0), 1);
}

const rectState = { top: 600, height: 1400, width: 1280 };

function mockRects() {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      return {
        top: rectState.top,
        bottom: rectState.top + rectState.height,
        left: 0,
        right: rectState.width,
        width: rectState.width,
        height: rectState.height,
        x: 0,
        y: rectState.top,
        toJSON: () => ({}),
      } as DOMRect;
    }
  );
}

function setWindow(prop: 'innerWidth' | 'innerHeight' | 'scrollY', value: number) {
  Object.defineProperty(window, prop, { configurable: true, writable: true, value });
}

function Harness({
  apply,
  anchors,
}: {
  apply: (progress: number) => void;
  anchors?: { start: number; end: number };
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLenisSectionProgress(ref, apply, anchors);
  return <div ref={ref} style={{ height: 1400 }} />;
}

function lastProgress(spy: ReturnType<typeof vi.fn>): number {
  const calls = spy.mock.calls as Array<[number]>;
  return calls[calls.length - 1][0];
}

describe('useLenisSectionProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setWindow('innerWidth', 1280);
    setWindow('innerHeight', 800);
    setWindow('scrollY', 0);
    rectState.top = 600;
    rectState.height = 1400;
    mockRects();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('computes progress from cached metrics identically to the old rect-per-tick formula', () => {
    const apply = vi.fn();
    render(<Harness apply={apply} />);

    expect(apply).toHaveBeenCalled();
    expect(lastProgress(apply)).toBeCloseTo(
      oldFormulaProgress(600, 1400, 800, { start: 1, end: 0 }),
      6
    );
  });

  it('recomputes progress after scrolling — cached metrics match a fresh rect read, with exactly one rect read per re-measure', () => {
    const apply = vi.fn();
    const rectSpy = mockRects();
    render(<Harness apply={apply} />);
    const readsAfterMount = rectSpy.mock.calls.length;

    // Simulate scrolling 250px: the live rect moves up by exactly that while
    // sectionTop (rect.top + scrollY) stays constant at 600.
    setWindow('scrollY', 250);
    rectState.top = 350;
    fireEvent(window, new Event('resize'));

    // Same number the old per-tick rect read would have produced.
    expect(lastProgress(apply)).toBeCloseTo(
      oldFormulaProgress(350, 1400, 800, { start: 1, end: 0 }),
      6
    );
    // One measure per resize event — never a rect read per scroll tick.
    expect(rectSpy.mock.calls.length).toBe(readsAfterMount + 1);
  });

  it('honors custom anchors with the same formula', () => {
    const apply = vi.fn();
    const anchors = { start: 0.92, end: 0.42 };
    render(<Harness apply={apply} anchors={anchors} />);

    expect(lastProgress(apply)).toBeCloseTo(
      oldFormulaProgress(600, 1400, 800, anchors),
      6
    );
  });

  it('clamps progress to [0, 1] for sections outside the viewport', () => {
    const apply = vi.fn();
    render(<Harness apply={apply} />);

    // Section entirely below the fold -> progress 0.
    rectState.top = 2000;
    fireEvent(window, new Event('resize'));
    expect(lastProgress(apply)).toBe(0);

    // Section entirely scrolled past -> progress 1.
    rectState.top = -2200;
    fireEvent(window, new Event('resize'));
    expect(lastProgress(apply)).toBe(1);
  });

  it('re-measures on the 150ms safety timer', () => {
    const apply = vi.fn();
    const rectSpy = mockRects();
    render(<Harness apply={apply} />);
    const readsAfterMount = rectSpy.mock.calls.length;

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(rectSpy.mock.calls.length).toBe(readsAfterMount + 1);
    expect(lastProgress(apply)).toBeCloseTo(
      oldFormulaProgress(600, 1400, 800, { start: 1, end: 0 }),
      6
    );
  });

  it('is null-safe when no Lenis engine exists (jsdom) and targets have zero rects', () => {
    vi.restoreAllMocks(); // remove the rect mock: jsdom's zero rects everywhere
    const apply = vi.fn();
    expect(() => render(<Harness apply={apply} />)).not.toThrow();
    expect(apply).toHaveBeenCalled();
  });
});
