import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act, cleanup, screen } from '@testing-library/react';
import {
  Skiper30,
  DEFAULT_GALLERY_ITEMS,
  DEFAULT_IMAGES,
  parallaxVariantSrc,
  PARALLAX_VARIANT_WIDTHS,
} from './skiper30';

const DESKTOP_VELOCITY = [2, 3.3, 1.25, 2.2];
const MOBILE_VELOCITY = [1.6, 2.6];

const rectState = { top: 600, height: 1400, width: 1280 };

function setWindow(prop: 'innerWidth' | 'innerHeight', value: number) {
  Object.defineProperty(window, prop, { configurable: true, writable: true, value });
}

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value });
}

function gallerySection(): HTMLElement {
  return screen.getByTestId('parallax-gallery-section');
}

function getColumns(): HTMLElement[] {
  return Array.from(gallerySection().querySelectorAll<HTMLElement>('.gallery-column'));
}

function columnTransforms(): string[] {
  return getColumns().map((el) => el.style.transform);
}

function parseY(transform: string): number {
  const matches = transform.match(/translate3d\(0, ([\d.-]+)px, 0\)/);
  if (!matches) throw new Error(`Unexpected transform: ${transform}`);
  return parseFloat(matches[1]);
}

describe('Skiper30 gallery (Lenis-native parallax)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setWindow('innerWidth', 1280);
    setWindow('innerHeight', 800);
    setScrollY(0);
    rectState.top = 600;
    rectState.height = 1400;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
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
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders 4 desktop columns / 2 mobile columns from the 12 default items', () => {
    const { unmount } = render(<Skiper30 enableLenis={true} />);
    expect(getColumns().length).toBe(4);
    const images = gallerySection().querySelectorAll('img');
    expect(images.length).toBe(12);
    unmount();

    setWindow('innerWidth', 375);
    render(<Skiper30 enableLenis={true} />);
    expect(getColumns().length).toBe(2);
    expect(gallerySection().querySelectorAll('img').length).toBe(12);
  });

  it('applies expected translate3d transforms on mount and clamps them to the velocity distances', () => {
    render(<Skiper30 enableLenis={true} />);

    // Mount: rect.top 600, vh 800, height 1400, anchors {1, 0}:
    // span = 1400 + 800 = 2200; progress = (800 - 600) / 2200 = 0.0909...
    const progress = (800 - 600) / (1400 + 800);
    const expected = DESKTOP_VELOCITY.map((m) => progress * 800 * m);

    const transforms = columnTransforms();
    expect(transforms.length).toBe(4);
    transforms.forEach((t, i) => {
      expect(parseY(t)).toBeCloseTo(expected[i], 1);
    });

    // Section fully scrolled past -> progress clamps to 1 -> y = full distance.
    rectState.top = -2200;
    fireEvent(window, new Event('resize'));
    act(() => {
      vi.runAllTimers();
    });
    columnTransforms().forEach((t, i) => {
      expect(parseY(t)).toBeCloseTo(800 * DESKTOP_VELOCITY[i], 1);
    });
  });

  it('updates column layout and distances when the 768px breakpoint flips', () => {
    render(<Skiper30 enableLenis={true} />);
    expect(getColumns().length).toBe(4);

    setWindow('innerWidth', 375);
    fireEvent(window, new Event('resize'));
    act(() => {
      vi.runAllTimers();
    });

    // Layout re-render: 2 mobile columns...
    expect(getColumns().length).toBe(2);
    // ...and mobile velocity distances now drive the transforms.
    const progress = (800 - rectState.top) / (rectState.height + 800);
    const expected = MOBILE_VELOCITY.map((m) => progress * 800 * m);
    columnTransforms().forEach((t, i) => {
      expect(parseY(t)).toBeCloseTo(expected[i], 1);
    });
  });

  it('recomputes parallax distances after a resize burst without re-rendering tiles', () => {
    const { container } = render(<Skiper30 enableLenis={true} />);
    const tilesBefore = Array.from(container.querySelectorAll('.gallery-card-tile'));
    const tileNodes = tilesBefore.map((t) => t.firstChild);

    // Viewport height changes but width stays desktop: no breakpoint flip.
    for (let i = 0; i < 10; i++) {
      setWindow('innerHeight', 900 + i);
      fireEvent(window, new Event('resize'));
    }
    act(() => {
      vi.runAllTimers();
    });

    // Distances recomputed against the new vh (909) — transform reflects it.
    const vh = (window as unknown as { innerHeight: number }).innerHeight;
    const progress = (vh - rectState.top) / (rectState.height + vh);
    const expected = DESKTOP_VELOCITY.map((m) => progress * vh * m);
    columnTransforms().forEach((t, i) => {
      expect(parseY(t)).toBeCloseTo(expected[i], 0);
    });

    // Same DOM tile nodes — no re-render replaced them.
    const tilesAfter = Array.from(container.querySelectorAll('.gallery-card-tile'));
    expect(tilesAfter.length).toBe(tilesBefore.length);
    tilesAfter.forEach((t, i) => {
      expect(t.firstChild).toBe(tileNodes[i]);
    });
  });

  it('equips every image with srcset (480w/800w/1080w) and sizes matching tile-width math', () => {
    render(<Skiper30 enableLenis={true} />);
    const imgs = Array.from(gallerySection().querySelectorAll<HTMLImageElement>('img'));

    expect(imgs.length).toBe(12);
    for (const img of imgs) {
      expect(img.getAttribute('srcset')).toContain('-480.webp 480w');
      expect(img.getAttribute('srcset')).toContain('-800.webp 800w');
      expect(img.getAttribute('srcset')).toContain('1080w');
      expect(img.getAttribute('sizes')).toContain('calc((100vw - 5*clamp(16px,2vw,32px))/4)');
    }
  });

  it('gives mobile images the 2-column sizes expression', () => {
    setWindow('innerWidth', 375);
    render(<Skiper30 enableLenis={true} />);
    const img = gallerySection().querySelector('img');
    expect(img?.getAttribute('sizes')).toBe(
      'calc((100vw - 24px - clamp(12px,2.5vw,20px))/2)'
    );
  });

  it('exports deterministic variant helpers used by the idle pre-warm', () => {
    expect(parallaxVariantSrc('/images/parallax/01-dashboard-overview.webp', 480)).toBe(
      '/images/parallax/01-dashboard-overview-480.webp'
    );
    expect(parallaxVariantSrc('/images/parallax/01-dashboard-overview.webp', 1080)).toBe(
      '/images/parallax/01-dashboard-overview.webp'
    );
    // Ascending order so "smallest width >= needed" selection works.
    expect([...PARALLAX_VARIANT_WIDTHS]).toEqual([480, 800, 1080]);
    expect(DEFAULT_IMAGES).toHaveLength(DEFAULT_GALLERY_ITEMS.length);
  });

  it('falls back to plain src for non-parallax custom images (no 404 srcset candidates)', () => {
    render(
      <Skiper30
        enableLenis={true}
        images={['/images/custom/foo.png', '/images/custom/bar.jpg']}
      />
    );
    const imgs = Array.from(gallerySection().querySelectorAll<HTMLImageElement>('img'));
    expect(imgs.length).toBe(2);
    for (const img of imgs) {
      expect(img.getAttribute('srcset')).toBeNull();
    }
  });
});
