'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useLenisScroll } from './useLenisScroll';

export type LenisViewportAnchors = { start: number; end: number };

/**
 * Default anchors: progress 0 when the target's start edge reaches the
 * viewport's bottom (start: 1) and progress 1 when its end edge reaches the
 * viewport's top (end: 0) — identical semantics to framer-motion's
 * `offset: ["start end", "end start"]`.
 */
export const SECTION_ANCHORS: LenisViewportAnchors = { start: 1, end: 0 };

interface SectionMetrics {
  /** Absolute document-space top of the section, captured at measure time. */
  sectionTop: number;
  sectionHeight: number;
  vh: number;
}

/**
 * Scroll-linked section progress driven by the app-wide reference-counted
 * Lenis singleton (the single RAF engine behind the landing page).
 *
 * progress = 0 when the target's start edge crosses `start` fraction of the
 * viewport; progress = 1 when the target's end edge crosses `end` fraction.
 *
 * Layout metrics ({sectionTop, sectionHeight, vh}) are measured ONCE — on
 * mount, resize, load, fonts.ready, plus a 150ms safety re-measure — and
 * cached. Every scroll tick then computes progress purely from the cached
 * metrics and the Lenis payload's lerped `scroll` value: zero DOM reads per
 * frame, so no moving frame can trigger a forced reflow. A 0.0005 deadband
 * suppresses sub-visible style writes.
 */
export function useLenisSectionProgress(
  targetRef: React.RefObject<HTMLElement | null>,
  apply: (progress: number) => void,
  anchors: LenisViewportAnchors = SECTION_ANCHORS,
  enabled: boolean = true
) {
  const applyRef = useRef(apply);
  const lastProgressRef = useRef(-1);
  const metricsRef = useRef<SectionMetrics | null>(null);

  useEffect(() => {
    applyRef.current = apply;
  }, [apply]);

  const update = useCallback(
    (e?: { scroll: number }) => {
      const metrics = metricsRef.current;
      if (!metrics || typeof window === 'undefined') return;
      const scroll = e?.scroll ?? window.scrollY;
      const span =
        metrics.sectionHeight + (anchors.start - anchors.end) * metrics.vh;
      if (span <= 0) return;
      const viewportTop = metrics.sectionTop - scroll;
      const progress = Math.min(
        Math.max((anchors.start * metrics.vh - viewportTop) / span, 0),
        1
      );
      if (Math.abs(progress - lastProgressRef.current) < 0.0005) return;
      lastProgressRef.current = progress;
      applyRef.current(progress);
    },
    [anchors.start, anchors.end]
  );

  // Progress from the Lenis engine's lerped scroll position — the same
  // single RAF loop every other landing section subscribes to.
  useLenisScroll(enabled, update);

  const measure = useCallback(() => {
    const el = targetRef.current;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    metricsRef.current = {
      sectionTop: rect.top + window.scrollY,
      sectionHeight: rect.height,
      vh: window.innerHeight,
    };
    // Invalidate the deadband so a re-measure always re-applies progress.
    lastProgressRef.current = -1;
    update();
  }, [targetRef, update]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    measure();
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure, { passive: true });
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }
    const timer = setTimeout(measure, 150);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
      clearTimeout(timer);
    };
  }, [measure]);
}
