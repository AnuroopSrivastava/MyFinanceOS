'use client';

import { useRef, useCallback } from 'react';
import { useLenisScroll } from './useLenisScroll';

export interface HeaderScrollPhysicsOptions {
  scrolledThreshold?: number;
  retractThreshold?: number;
  retractMinScroll?: number;
  unretractDelta?: number;
  topThreshold?: number;
}

/**
 * High-performance directional scroll physics for public landing & changelog headers.
 * 
 * Directly manipulates classList (.is-scrolled, .is-retracted) on header element
 * to guarantee 60fps/120fps buttery scroll without triggering React component re-renders.
 */
export function useHeaderScrollPhysics(options: HeaderScrollPhysicsOptions = {}) {
  const {
    scrolledThreshold = 20,
    retractThreshold = 60,
    retractMinScroll = 300,
    unretractDelta = 16,
    topThreshold = 120
  } = options;

  const headerRef = useRef<HTMLElement | null>(null);
  const lastYRef = useRef(0);
  const scrolledRef = useRef(false);
  const hiddenRef = useRef(false);
  const accumulatedDownRef = useRef(0);
  const accumulatedUpRef = useRef(0);

  const handleScrollTick = useCallback(
    (e?: { scroll: number }) => {
      const el = headerRef.current;
      if (!el) return;

      const y = e?.scroll ?? (typeof window !== 'undefined' ? window.scrollY : 0);
      const isScrolled = y > scrolledThreshold;
      if (scrolledRef.current !== isScrolled) {
        scrolledRef.current = isScrolled;
        el.classList.toggle('is-scrolled', isScrolled);
      }

      const diff = y - lastYRef.current;
      lastYRef.current = y;

      if (y < topThreshold) {
        if (hiddenRef.current) {
          hiddenRef.current = false;
          el.classList.remove('is-retracted');
        }
        accumulatedDownRef.current = 0;
        accumulatedUpRef.current = 0;
        return;
      }

      if (diff > 0) {
        accumulatedDownRef.current += diff;
        accumulatedUpRef.current = 0;
        if (accumulatedDownRef.current > retractThreshold && y > retractMinScroll) {
          if (!hiddenRef.current) {
            hiddenRef.current = true;
            el.classList.add('is-retracted');
          }
        }
      } else if (diff < 0) {
        accumulatedUpRef.current += Math.abs(diff);
        accumulatedDownRef.current = 0;
        if (accumulatedUpRef.current > unretractDelta) {
          if (hiddenRef.current) {
            hiddenRef.current = false;
            el.classList.remove('is-retracted');
          }
        }
      }
    },
    [scrolledThreshold, retractThreshold, retractMinScroll, unretractDelta, topThreshold]
  );

  // Subscribe to singleton Lenis scroll listener
  useLenisScroll(true, handleScrollTick);

  return {
    headerRef
  };
}

export default useHeaderScrollPhysics;
