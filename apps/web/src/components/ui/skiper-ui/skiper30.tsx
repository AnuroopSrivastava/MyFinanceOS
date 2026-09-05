"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { cx } from "@financeos/ui";
import { useLenisScroll } from "@/hooks/useLenisScroll";

export const DEFAULT_IMAGES = [
  "/images/parallax/01-dashboard-overview.webp",
  "/images/parallax/02-smart-expenses.webp",
  "/images/parallax/03-tax-planning.webp",
  "/images/parallax/04-gst-invoicing.webp",
  "/images/parallax/05-wealth-tracking.webp",
  "/images/parallax/06-fire-planning.webp",
  "/images/parallax/07-sankey-cashflow.webp",
  "/images/parallax/08-emi-calculator.webp",
  "/images/parallax/09-document-vault.webp",
  "/images/parallax/10-local-ai.webp",
  "/images/parallax/11-automation-rules.webp",
  "/images/parallax/12-offline-security.webp",
];

export interface Skiper30Props {
  images?: string[];
  standalone?: boolean;
  className?: string;
  enableLenis?: boolean;
  showIndicators?: boolean;
}

const Skiper30 = ({
  images = DEFAULT_IMAGES,
  standalone = false,
  className = "",
  enableLenis = true,
  showIndicators = true,
}: Skiper30Props) => {
  const gallery = useRef<HTMLDivElement>(null);
  const col1Ref = useRef<HTMLDivElement>(null);
  const col2Ref = useRef<HTMLDivElement>(null);
  const col3Ref = useRef<HTMLDivElement>(null);
  const col4Ref = useRef<HTMLDivElement>(null);

  // Cached layout metrics measured strictly on mount/resize to prevent synchronous layout thrashing
  const docTopRef = useRef(0);
  const docHeightRef = useRef(0);
  const winHeightRef = useRef(typeof window !== "undefined" ? window.innerHeight : 900);

  // Viewport intersection culling: 0 CPU/GPU cost when off-screen
  const isInViewRef = useRef(false);

  // High-precision scroll tracking without artificial secondary lag
  const lastScrollRef = useRef<number>(-1);
  const initializedRef = useRef(false);

  const measure = useCallback(() => {
    const galleryEl = gallery.current;
    if (!galleryEl || typeof window === "undefined") return;

    // Walk offsetParent tree for absolute, immutable document Y coordinate.
    // getBoundingClientRect().top + scroll fluctuates during motion because of
    // compositor/DOM async frame differences; offsetTop is 100% constant and jitter-free.
    let top = 0;
    let curr: HTMLElement | null = galleryEl;
    while (curr) {
      top += curr.offsetTop;
      curr = curr.offsetParent as HTMLElement | null;
    }

    docTopRef.current = top;
    docHeightRef.current = galleryEl.offsetHeight;
    winHeightRef.current = window.innerHeight;
  }, []);

  /**
   * Pure Synchronous Lockstep Parallax Engine.
   *
   * Lenis ALREADY computes an exquisitely smooth exponential scroll position (lerp: 0.1)
   * in each requestAnimationFrame tick.
   *
   * By mapping progress directly to column transforms in the exact same RAF tick:
   * 1. Columns move in 100% mathematical synchrony with page scroll (0 frames latency).
   * 2. Eliminates secondary damping lag that was causing rubber-banding and drift.
   * 3. Eliminates resting threshold snaps that were causing columns to jump on deceleration.
   * 4. Eliminates subpixel dirty-checking deadbands that were dropping frames during slow scroll.
   * 5. Uses immutable offsetTop reference so transforms never fluctuate mid-motion.
   */
  const updateTransforms = useCallback((e?: { scroll: number; velocity: number }) => {
    const windowHeight = winHeightRef.current || (typeof window !== "undefined" ? window.innerHeight : 900);
    const totalDistance = (docHeightRef.current || (windowHeight * 1.75)) + windowHeight;
    if (totalDistance <= 0) return;

    let currentScroll: number;
    if (e && typeof e.scroll === "number") {
      currentScroll = e.scroll;
    } else if (typeof window !== "undefined") {
      const lenis = (window as unknown as { __myfinanceos_lenis__?: { scroll: number } }).__myfinanceos_lenis__;
      currentScroll = lenis?.scroll ?? window.scrollY;
    } else {
      currentScroll = 0;
    }

    // Viewport culling: skip DOM writes if gallery is completely outside the viewport
    if (!isInViewRef.current && initializedRef.current) {
      return;
    }

    // Idle culling: skip style updates if scroll position hasn't changed at all
    if (initializedRef.current && Math.abs(currentScroll - lastScrollRef.current) < 0.001) {
      return;
    }
    lastScrollRef.current = currentScroll;
    initializedRef.current = true;

    const currentTop = docTopRef.current - currentScroll;
    const currentDistance = windowHeight - currentTop;
    const rawProgress = currentDistance / totalDistance;
    const progress = Math.min(Math.max(rawProgress, 0), 1);

    const h = windowHeight;
    const y1 = progress * h * 2;
    const y2 = progress * h * 3.3;
    const y3 = progress * h * 1.25;
    const y4 = progress * h * 3;

    if (col1Ref.current) col1Ref.current.style.transform = `translate3d(0px, ${y1}px, 0px)`;
    if (col2Ref.current) col2Ref.current.style.transform = `translate3d(0px, ${y2}px, 0px)`;
    if (col3Ref.current) col3Ref.current.style.transform = `translate3d(0px, ${y3}px, 0px)`;
    if (col4Ref.current) col4Ref.current.style.transform = `translate3d(0px, ${y4}px, 0px)`;
  }, []);

  /**
   * Subscribe directly to the singleton Lenis loop.
   */
  useLenisScroll(enableLenis, updateTransforms);

  /**
   * IntersectionObserver for zero-cost viewport culling (activates 350px before entering view).
   */
  useEffect(() => {
    const galleryEl = gallery.current;
    if (!galleryEl || typeof IntersectionObserver === "undefined") {
      isInViewRef.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          measure();
          updateTransforms();
        }
      },
      { rootMargin: "350px 0px 350px 0px" }
    );

    observer.observe(galleryEl);
    return () => observer.disconnect();
  }, [measure, updateTransforms]);

  useEffect(() => {
    measure();
    updateTransforms();

    const handleResize = () => {
      measure();
      updateTransforms();
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("load", handleResize, { passive: true });
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(handleResize);
    }
    const timer = setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleResize);
      clearTimeout(timer);
    };
  }, [measure, updateTransforms]);

  const col1 = images.slice(0, 3);
  const col2 = images.slice(3, 6);
  const col3 = images.slice(6, 9);
  const col4 = images.slice(9, 12);

  const galleryContent = (
    <div
      ref={gallery}
      data-testid="parallax-gallery-section"
      aria-label="MyFinanceOS Skiper30 Parallax Showcase"
      className={cx(
        "box-border flex h-[175vh] w-full gap-[2vw] overflow-hidden p-[2vw]",
        standalone ? "bg-white" : "bg-transparent",
        className
      )}
      style={{
        position: "relative",
        boxSizing: "border-box",
        display: "flex",
        width: "100%",
        height: "175vh",
        gap: "clamp(16px, 2vw, 32px)",
        overflow: "hidden",
        padding: "clamp(16px, 2vw, 32px)",
        // Composite the clip itself: the four parallax column layers then glide
        // inside one composited clip surface instead of being re-clipped against
        // a paint-layer every frame. contain isolates paint/layout of the grid.
        transform: "translateZ(0)",
        contain: "layout paint style",
      }}
    >
      <Column ref={col1Ref} images={col1} topOffset="-45%" />
      <Column ref={col2Ref} images={col2} topOffset="-95%" />
      <Column ref={col3Ref} images={col3} topOffset="-45%" />
      <Column ref={col4Ref} images={col4} topOffset="-75%" />
    </div>
  );

  // Standalone original full-page demo mode
  if (standalone) {
    return (
      <main className="w-full bg-[#eee] text-black">
        <div className="font-geist flex h-screen items-center justify-center gap-2">
          <div className="absolute left-1/2 top-[10%] grid -translate-x-1/2 content-start justify-items-center gap-6 text-center text-black">
            <span className="relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-white after:to-black after:content-['']">
              scroll down to see
            </span>
          </div>
        </div>

        {galleryContent}

        <div className="font-geist relative flex h-screen items-center justify-center gap-2">
          <div className="absolute left-1/2 top-[10%] grid -translate-x-1/2 content-start justify-items-center gap-6 text-center text-black">
            <span className="relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-white after:to-black after:content-['']">
              scroll Up to see
            </span>
          </div>
        </div>
      </main>
    );
  }

  // Option 2: Embedded dark-luxury transition bridge with signature Skiper30 typographic indicators
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
      className={className}
    >
      {showIndicators && (
        <div
          data-testid="scroll-down-indicator"
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            paddingTop: "52px",
            paddingBottom: "32px",
            textAlign: "center",
            userSelect: "none",
          }}
        >
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.45)",
              fontFamily: "var(--font-jetbrains-mono, monospace)",
            }}
          >
            scroll down to see
            <span
              style={{
                display: "block",
                width: "1.5px",
                height: "44px",
                marginTop: "12px",
                borderRadius: "9999px",
                background:
                  "linear-gradient(to bottom, rgba(168, 85, 247, 0.85), rgba(255, 255, 255, 0.35), transparent)",
              }}
            />
          </span>
        </div>
      )}

      {galleryContent}

      {showIndicators && (
        <div
          data-testid="scroll-up-indicator"
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            paddingTop: "32px",
            paddingBottom: "52px",
            textAlign: "center",
            userSelect: "none",
          }}
        >
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.45)",
              fontFamily: "var(--font-jetbrains-mono, monospace)",
            }}
          >
            <span
              style={{
                display: "block",
                width: "1.5px",
                height: "44px",
                marginBottom: "12px",
                borderRadius: "9999px",
                background:
                  "linear-gradient(to top, rgba(168, 85, 247, 0.85), rgba(255, 255, 255, 0.35), transparent)",
              }}
            />
            scroll Up to see
          </span>
        </div>
      )}
    </div>
  );
};

type ColumnProps = {
  images: string[];
  topOffset: string;
};

const Column = React.forwardRef<HTMLDivElement, ColumnProps>(({ images, topOffset }, ref) => {
  return (
    <div
      ref={ref}
      className="relative flex h-full w-1/4 min-w-[240px] flex-1 flex-col gap-[2vw]"
      style={{
        top: topOffset,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flex: "1 1 0%",
        minWidth: 0,
        height: "100%",
        gap: "clamp(16px, 2vw, 32px)",
        willChange: "transform",
        transform: "translate3d(0px, 0px, 0px)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      }}
    >
      {images.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0d0e1b]"
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            flex: "1 1 0%",
            minHeight: "360px",
            overflow: "hidden",
            borderRadius: "clamp(14px, 1.2vw, 20px)",
            // boxShadow is deliberately omitted: presented-frame tracing (CDP
            // screencast) measured the 36px translucent shadows on these moving
            // layers as the dominant per-frame GPU fill-rate cost on the landing
            // page (presented p99 81ms -> 26ms when removed, equal to the
            // standalone page). On the #070810 section background a black shadow
            // is imperceptible, so this is a zero-visual-delta removal.
            // NOTE: deliberately NOT layer-promoted. Each image tile bakes into
            // its column's single composited texture (radius + shadow included)
            // when the column rasterizes, so the four column layers are the ONLY
            // GPU layers this grid creates. Per-image translateZ(0)/mask/isolation
            // used to spawn 12 extra masked sublayers that re-composited over the
            // moving columns every frame — the source of the image scroll lag.
          }}
        >
          <img
            src={src}
            alt="MyFinanceOS Gallery Feature Preview"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="pointer-events-none h-full w-full object-cover select-none"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              pointerEvents: "none",
              userSelect: "none",
              display: "block",
            }}
          />
        </div>
      ))}
    </div>
  );
});
Column.displayName = "Column";

export { Skiper30 };
export default Skiper30;
