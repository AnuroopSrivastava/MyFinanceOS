'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

declare global {
  interface Window {
    __myfinanceos_lenis__?: Lenis | null;
    __myfinanceos_lenis_raf__?: number | null;
    __myfinanceos_lenis_refs__?: number;
    __myfinanceos_lenis_subscribers__?: Set<LenisScrollCallback>;
  }
}

export const SKIPER30_SCROLL_PHYSICS = {
  // 0.1 = Lenis gold standard buttery-smooth inertial curve
  lerp: 0.1,
  smoothWheel: true,
  syncTouch: true,
  wheelMultiplier: 1.0,
  touchMultiplier: 1.0,
  infinite: false,
  respectReducedMotion: false,
} as const;

export const DEFAULT_SCROLL_PHYSICS = SKIPER30_SCROLL_PHYSICS;
export const GALLERY_ZONE_PHYSICS = SKIPER30_SCROLL_PHYSICS;

export type LenisScrollCallback = (e?: { scroll: number; velocity: number }) => void;

/**
 * Singleton Lenis smooth-scroll lifecycle hook.
 *
 * Runs ONE and ONLY ONE requestAnimationFrame loop across the entire application.
 * Reuses a single pre-allocated payload to eliminate GC allocations per frame.
 * All subscribed components update synchronously in the same RAF tick immediately
 * after Lenis calculates scroll position.
 */
export function useLenisScroll(
  enabled = true,
  onScroll?: LenisScrollCallback
) {
  const callbackRef = useRef<LenisScrollCallback | undefined>(onScroll);

  useEffect(() => {
    callbackRef.current = onScroll;
  }, [onScroll]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const isJsdom =
      typeof navigator !== 'undefined' &&
      navigator.userAgent?.includes('jsdom');
    if (isJsdom) return;

    window.__myfinanceos_lenis_refs__ =
      (window.__myfinanceos_lenis_refs__ || 0) + 1;

    let subscriber: LenisScrollCallback | null = null;
    if (onScroll) {
      if (!window.__myfinanceos_lenis_subscribers__) {
        window.__myfinanceos_lenis_subscribers__ = new Set();
      }
      subscriber = (e) => {
        callbackRef.current?.(e);
      };
      window.__myfinanceos_lenis_subscribers__.add(subscriber);
    }

    let lenis = window.__myfinanceos_lenis__ ?? null;
    let rafId: number | null = null;

    try {
      if (!lenis) {
        lenis = new Lenis({
          lerp: SKIPER30_SCROLL_PHYSICS.lerp,
          smoothWheel: SKIPER30_SCROLL_PHYSICS.smoothWheel,
          syncTouch: SKIPER30_SCROLL_PHYSICS.syncTouch,
          wheelMultiplier: SKIPER30_SCROLL_PHYSICS.wheelMultiplier,
          touchMultiplier: SKIPER30_SCROLL_PHYSICS.touchMultiplier,
          infinite: SKIPER30_SCROLL_PHYSICS.infinite,
          respectReducedMotion: false,
        });

        window.__myfinanceos_lenis__ = lenis;

        // Reusable payload object to completely eliminate garbage collection pressure
        const payload = {
          scroll: 0,
          velocity: 0,
        };

        let lastEmittedScroll = -1;
        let wasMoving = false;

        /**
         * ONE and ONLY ONE RAF loop drives Lenis and all synchronized subscribers.
         * Suppresses subscriber iteration when stationary, but guarantees a final
         * settling frame (velocity: 0) when motion halts.
         */
        const raf = (time: number) => {
          lenis?.raf(time);

          const currentScroll = lenis?.scroll ?? window.scrollY;
          const currentVelocity = lenis?.velocity ?? 0;
          const isMoving =
            Boolean(lenis?.isScrolling) ||
            Math.abs(currentVelocity) > 0.00001 ||
            Math.abs(currentScroll - lastEmittedScroll) > 0.0001;

          if (isMoving || lastEmittedScroll === -1 || wasMoving) {
            lastEmittedScroll = currentScroll;
            payload.scroll = currentScroll;
            payload.velocity = isMoving ? currentVelocity : 0;
            wasMoving = isMoving;

            const subs = window.__myfinanceos_lenis_subscribers__;
            if (subs && subs.size > 0) {
              for (const sub of subs) {
                try {
                  sub(payload);
                } catch (e) {
                  console.error('[Lenis subscriber error]', e);
                }
              }
            }
          }

          rafId = requestAnimationFrame(raf);
          window.__myfinanceos_lenis_raf__ = rafId;
        };

        rafId = requestAnimationFrame(raf);
        window.__myfinanceos_lenis_raf__ = rafId;
      }

      // Initial position update if onScroll callback was provided
      if (onScroll) {
        callbackRef.current?.({
          scroll: lenis?.scroll ?? window.scrollY,
          velocity: lenis?.velocity ?? 0,
        });
      }

      return () => {
        if (subscriber && window.__myfinanceos_lenis_subscribers__) {
          window.__myfinanceos_lenis_subscribers__.delete(subscriber);
        }

        window.__myfinanceos_lenis_refs__ = Math.max(
          0,
          (window.__myfinanceos_lenis_refs__ || 1) - 1
        );

        if (window.__myfinanceos_lenis_refs__ === 0) {
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
          }
          if (window.__myfinanceos_lenis_raf__) {
            cancelAnimationFrame(window.__myfinanceos_lenis_raf__);
          }
          try {
            lenis?.destroy();
          } catch {}
          window.__myfinanceos_lenis__ = null;
          window.__myfinanceos_lenis_raf__ = null;
          window.__myfinanceos_lenis_subscribers__ = undefined;
        }
      };
    } catch (err) {
      console.warn('[Lenis] Smooth scroll initialisation skipped:', err);
      return () => {
        window.__myfinanceos_lenis_refs__ = Math.max(
          0,
          (window.__myfinanceos_lenis_refs__ || 1) - 1
        );
      };
    }
  }, [enabled]);
}

export interface ScrollZoneOptions {
  activeDuration?: number;
  defaultDuration?: number;
}

export function useLenisScrollZone(
  targetRef: React.RefObject<HTMLElement | null>,
  _options: ScrollZoneOptions = {}
) {
  useEffect(() => {
    if (typeof window === 'undefined' || !targetRef.current) return;
  }, [targetRef]);
}

export default useLenisScroll;
