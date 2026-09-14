"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cx } from "@financeos/ui";
import { useLenisSectionProgress } from "../../../hooks/useLenisSectionProgress";

export interface GalleryItem {
  src: string;
  id: string;
  tag: string;
  title: string;
  alt: string;
}

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    src: "/images/parallax/01-dashboard-overview.webp",
    id: "01",
    tag: "Net Worth",
    title: "Mission Control",
    alt: "MyFinanceOS Mission Control — Real-time consolidated net worth and multi-asset allocation dashboard",
  },
  {
    src: "/images/parallax/02-smart-expenses.webp",
    id: "02",
    tag: "Double-Entry",
    title: "Smart Expenses",
    alt: "MyFinanceOS Smart Expenses — Sub-millisecond double-entry banking ledger and cashflow outflow tracking",
  },
  {
    src: "/images/parallax/03-tax-planning.webp",
    id: "03",
    tag: "Old vs New",
    title: "Tax Optimization",
    alt: "MyFinanceOS Tax Suite — Indian income tax regime analyzer, deductions, and tax optimization recommendations",
  },
  {
    src: "/images/parallax/04-gst-invoicing.webp",
    id: "04",
    tag: "B2B & GST",
    title: "GST Invoicing",
    alt: "MyFinanceOS GST Invoicing — Compliant B2B invoicing, GST credit reconciliation, and export ready records",
  },
  {
    src: "/images/parallax/05-wealth-tracking.webp",
    id: "05",
    tag: "Multi-Asset",
    title: "Wealth Portfolio",
    alt: "MyFinanceOS Wealth Tracking — Stocks, SGB 24K Gold, Mutual Funds, and Fixed Deposit portfolio tracking with alpha analytics",
  },
  {
    src: "/images/parallax/06-fire-planning.webp",
    id: "06",
    tag: "Financial Independence",
    title: "FIRE Planner",
    alt: "MyFinanceOS FIRE Planner — Early retirement milestone simulator, safe withdrawal rate, and SIP accelerator",
  },
  {
    src: "/images/parallax/07-sankey-cashflow.webp",
    id: "07",
    tag: "Physics Flow",
    title: "Sankey Cashflow",
    alt: "MyFinanceOS Sankey Cashflow — Deterministic flow diagrams mapping income streams to savings and allocations",
  },
  {
    src: "/images/parallax/08-emi-calculator.webp",
    id: "08",
    tag: "Prepayment Engine",
    title: "EMI Accelerator",
    alt: "MyFinanceOS EMI Calculator — Loan prepayment schedules, interest saved calculations, and tenure slash forecasting",
  },
  {
    src: "/images/parallax/09-document-vault.webp",
    id: "09",
    tag: "AES-256 OPFS",
    title: "Encrypted Vault",
    alt: "MyFinanceOS Encrypted Vault — Air-gapped AES-256 private document storage utilizing browser Origin Private File System",
  },
  {
    src: "/images/parallax/10-local-ai.webp",
    id: "10",
    tag: "Local WASM",
    title: "Private AI Advisor",
    alt: "MyFinanceOS Local AI — 100% on-device WebAssembly intelligence with zero network packet leakage",
  },
  {
    src: "/images/parallax/11-automation-rules.webp",
    id: "11",
    tag: "Event Driven",
    title: "Automation Rules",
    alt: "MyFinanceOS Automation — Configurable triggers and auto-split rules for incoming salaries and investments",
  },
  {
    src: "/images/parallax/12-offline-security.webp",
    id: "12",
    tag: "Offline-First",
    title: "Zero Leakage Core",
    alt: "MyFinanceOS Security — Local SQLite database architecture with client-side biometric/PIN encryption",
  },
];

export const DEFAULT_IMAGES = DEFAULT_GALLERY_ITEMS.map((item) => item.src);

/** Generated responsive variant widths, ascending (smallest sufficient wins). */
export const PARALLAX_VARIANT_WIDTHS = [480, 800, 1080] as const;

export const PARALLAX_MASTER_WIDTH = 1080;

/**
 * Map a master parallax image src (…/NN-name.webp) to its resized variant
 * (…/NN-name-480.webp / …-800.webp). Widths without a generated variant
 * (i.e. 1080) return the master unchanged.
 */
export function parallaxVariantSrc(src: string, width: number): string {
  if (width === PARALLAX_MASTER_WIDTH) return src;
  return src.replace(/\.webp$/, `-${width}.webp`);
}

export interface Skiper30Props {
  images?: string[];
  items?: GalleryItem[];
  standalone?: boolean;
  className?: string;
  enableLenis?: boolean;
  showIndicators?: boolean;
}

// Variants are generated on disk only for the shipped parallax masters —
// custom image props fall back to plain src so srcset candidates never 404.
function srcSetFor(src: string): string | undefined {
  if (!src.startsWith("/images/parallax/") || !/\.webp$/.test(src)) return undefined;
  return PARALLAX_VARIANT_WIDTHS.map(
    (w) => `${parallaxVariantSrc(src, w)} ${w}w`
  ).join(", ");
}

// Desktop: 4 columns inside the padded wrapper — padding 2× + 3 gaps = 5 × gap.
// Mobile: 2 columns — 2 × 12px padding + 1 gap.
const DESKTOP_TILE_SIZES = "calc((100vw - 5*clamp(16px,2vw,32px))/4)";
const MOBILE_TILE_SIZES = "calc((100vw - 24px - clamp(12px,2.5vw,20px))/2)";

const DESKTOP_VELOCITY = [2, 3.3, 1.25, 2.2] as const;
const MOBILE_VELOCITY = [1.6, 2.6] as const;

const DESKTOP_TOP_OFFSETS = ["-45%", "-95%", "-45%", "-75%"] as const;
const MOBILE_TOP_OFFSETS = ["-20%", "-45%"] as const;

const Skiper30 = ({
  images = DEFAULT_IMAGES,
  items,
  standalone = false,
  className = "",
  enableLenis = true,
  showIndicators = true,
}: Skiper30Props) => {
  const gallery = useRef<HTMLDivElement>(null);
  // React state only tracks the layout BREAKPOINT — it flips at most once per
  // crossing of 768px. Parallax distances live in distancesRef and recompute
  // on a debounced resize listener without any re-render.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  // 4 desktop column refs / 2 shared by mobile (mobile uses refs[0..1]).
  const colRefs = useRef<Array<HTMLDivElement | null>>([]);
  const distancesRef = useRef<{ vh: number; ys: number[] }>({ vh: 0, ys: [] });

  // Parallax distances depend on viewport height only — recomputed on resize,
  // never during scroll.
  const computeDistances = () => {
    if (typeof window === "undefined") return;
    const vh = window.innerHeight;
    const multipliers = isMobileRef.current ? MOBILE_VELOCITY : DESKTOP_VELOCITY;
    distancesRef.current = {
      vh,
      ys: multipliers.map((m) => vh * m),
    };
    // Re-apply immediately with fresh distances so a mid-session viewport
    // height change (e.g. mobile URL bar collapse) doesn't freeze columns.
    applyRef.current(lastProgressRef.current);
  };

  const isMobileRef = useRef(isMobile);
  const lastProgressRef = useRef(0);
  const applyRef = useRef<(progress: number) => void>(() => {});

  const apply = (progress: number) => {
    lastProgressRef.current = progress;
    const { ys } = distancesRef.current;
    const cols = colRefs.current;
    const count = isMobileRef.current ? 2 : 4;
    for (let i = 0; i < count; i++) {
      const el = cols[i];
      if (!el || ys.length <= i) continue;
      // Same motion curve as before: y = progress × distance (0 → vh·multiplier).
      el.style.transform = `translate3d(0, ${(progress * ys[i]).toFixed(2)}px, 0)`;
    }
  };
  applyRef.current = apply;

  // Parallax driver: the app-wide Lenis singleton measures section geometry
  // once (mount/resize/load/fonts) and derives progress per tick from cached
  // metrics — zero DOM reads inside the scroll loop, transforms follow the
  // engine's lerped scroll exactly like every other landing section.
  // Anchors {start: 1, end: 0} replicate the previous
  // `useScroll({ offset: ["start end", "end start"] })` semantics.
  useLenisSectionProgress(
    gallery,
    (progress) => applyRef.current(progress),
    { start: 1, end: 0 },
    enableLenis
  );

  // Breakpoint flip + debounced distance recompute — the only resize listeners
  // that may re-render are the breakpoint crossings themselves.
  useEffect(() => {
    const checkBreakpoint = () => {
      const next = window.innerWidth < 768;
      if (next !== isMobileRef.current) {
        isMobileRef.current = next;
        setIsMobile(next);
      }
    };
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      checkBreakpoint();
      clearTimeout(debounce);
      debounce = setTimeout(computeDistances, 120);
    };
    checkBreakpoint();
    computeDistances();
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(debounce);
    };
    // computeDistances reads isMobileRef (kept current by checkBreakpoint), so
    // the effect only needs to run once; layout changes re-run it via state.
  }, [isMobile]);

  // Normalized item list
  const resolvedItems = useMemo<GalleryItem[]>(() => {
    if (items && items.length > 0) return items;
    return images.map((src, idx) => {
      const found = DEFAULT_GALLERY_ITEMS.find((d) => d.src === src);
      if (found) return found;
      const num = String(idx + 1).padStart(2, "0");
      return {
        src,
        id: num,
        tag: "Engine",
        title: `Module ${num}`,
        alt: `MyFinanceOS Platform Feature Preview ${num}`,
      };
    });
  }, [images, items]);

  // Desktop 4-column distribution vs Mobile 2-column alternating distribution
  const desktopCol1 = useMemo(() => resolvedItems.slice(0, 3), [resolvedItems]);
  const desktopCol2 = useMemo(() => resolvedItems.slice(3, 6), [resolvedItems]);
  const desktopCol3 = useMemo(() => resolvedItems.slice(6, 9), [resolvedItems]);
  const desktopCol4 = useMemo(() => resolvedItems.slice(9, 12), [resolvedItems]);

  const mobileCol1 = useMemo(() => resolvedItems.filter((_, i) => i % 2 === 0), [resolvedItems]);
  const mobileCol2 = useMemo(() => resolvedItems.filter((_, i) => i % 2 !== 0), [resolvedItems]);

  const galleryContent = (
    <div
      ref={gallery}
      data-testid="parallax-gallery-section"
      aria-label="MyFinanceOS Interactive Feature Showcase"
      role="region"
      className={cx(
        "box-border w-full overflow-hidden",
        standalone ? "bg-white" : "bg-transparent",
        className
      )}
      style={{
        position: "relative",
        width: "100%",
        height: "175vh",
        overflow: "hidden",
      }}
    >
      {/*
        Reference architecture (.galleryWrapper):
        position: relative, top: -12.5vh, height: 200vh
        Gives 25vh vertical margin so translated columns have smooth seamless overlap
      */}
      <div
        className="gallery-wrapper"
        style={{
          position: "relative",
          top: "-12.5vh",
          height: "200vh",
          display: "flex",
          width: "100%",
          boxSizing: "border-box",
          gap: isMobile ? "clamp(12px, 2.5vw, 20px)" : "clamp(16px, 2vw, 32px)",
          padding: isMobile ? "12px" : "clamp(16px, 2vw, 32px)",
        }}
      >
        {isMobile ? (
          <>
            <Column ref={(el) => { colRefs.current[0] = el; }} items={mobileCol1} topOffset="-20%" sizes={MOBILE_TILE_SIZES} />
            <Column ref={(el) => { colRefs.current[1] = el; }} items={mobileCol2} topOffset="-45%" sizes={MOBILE_TILE_SIZES} />
          </>
        ) : (
          <>
            <Column ref={(el) => { colRefs.current[0] = el; }} items={desktopCol1} topOffset="-45%" sizes={DESKTOP_TILE_SIZES} />
            <Column ref={(el) => { colRefs.current[1] = el; }} items={desktopCol2} topOffset="-95%" sizes={DESKTOP_TILE_SIZES} />
            <Column ref={(el) => { colRefs.current[2] = el; }} items={desktopCol3} topOffset="-45%" sizes={DESKTOP_TILE_SIZES} />
            <Column ref={(el) => { colRefs.current[3] = el; }} items={desktopCol4} topOffset="-75%" sizes={DESKTOP_TILE_SIZES} />
          </>
        )}
      </div>
    </div>
  );

  // Standalone original full-page demo mode
  if (standalone) {
    return (
      <main className="w-full bg-[#070810] text-white">
        <div className="flex h-screen items-center justify-center gap-2">
          <div className="absolute left-1/2 top-[10%] grid -translate-x-1/2 content-start justify-items-center gap-6 text-center text-white">
            <span className="relative max-w-[14ch] text-xs uppercase tracking-widest opacity-60">
              Scroll down to explore
            </span>
          </div>
        </div>

        {galleryContent}

        <div className="relative flex h-screen items-center justify-center gap-2">
          <div className="absolute left-1/2 top-[10%] grid -translate-x-1/2 content-start justify-items-center gap-6 text-center text-white">
            <span className="relative max-w-[14ch] text-xs uppercase tracking-widest opacity-60">
              Scroll up to review
            </span>
          </div>
        </div>
      </main>
    );
  }

  // Embedded dark-luxury transition bridge with typographic indicators
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
            paddingTop: "24px",
            paddingBottom: "24px",
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
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.82)",
              fontFamily: "var(--font-jetbrains-mono, monospace)",
              textShadow: "0 1px 10px rgba(60, 20, 120, 0.45)",
            }}
          >
            Scroll to explore architecture
            <span
              style={{
                display: "block",
                width: "1.5px",
                height: "36px",
                marginTop: "10px",
                borderRadius: "9999px",
                background:
                  "linear-gradient(to bottom, rgba(255, 255, 255, 0.7), transparent)",
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
            paddingTop: "24px",
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
              fontSize: "10px",
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
                height: "36px",
                marginBottom: "10px",
                borderRadius: "9999px",
                background:
                  "linear-gradient(to top, rgba(255, 255, 255, 0.35), transparent)",
              }}
            />
            Continuous parallax loop
          </span>
        </div>
      )}
    </div>
  );
};

type ColumnProps = {
  ref?: React.Ref<HTMLDivElement>;
  items?: GalleryItem[];
  images?: string[];
  topOffset: string;
  /** CSS sizes expression mirroring the actual tile width math. */
  sizes: string;
};

/**
 * Plain memoized div column — transforms are written directly to the DOM by
 * the gallery's single Lenis scroll tick, so the column never re-renders
 * during scroll or resize-distance recomputes.
 */
const Column = React.memo(({ ref, items, images, topOffset, sizes }: ColumnProps) => {
  // Normalization to support either items or legacy images prop
  const cardItems = useMemo<GalleryItem[]>(() => {
    if (items && items.length > 0) return items;
    if (images && images.length > 0) {
      return images.map((src, i) => ({
        src,
        id: String(i + 1).padStart(2, "0"),
        tag: "Module",
        title: "Feature",
        alt: "MyFinanceOS Gallery Feature Preview",
      }));
    }
    return [];
  }, [items, images]);

  return (
    <div
      ref={ref}
      className="gallery-column relative flex h-full flex-1 flex-col"
      style={{
        top: topOffset,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flex: "1 1 0%",
        minWidth: 0,
        height: "100%",
        gap: "clamp(14px, 1.8vw, 28px)",
      }}
    >
      {cardItems.map((item, i) => (
        <div
          key={`${item.src}-${i}`}
          className="gallery-card-tile relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0d0e1b]"
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1080 / 1485",
            minHeight: 0,
            flex: "0 0 auto",
            overflow: "hidden",
            borderRadius: "clamp(12px, 1.2vw, 20px)",
            boxShadow: "none",
          }}
        >
          <img
            src={item.src}
            srcSet={srcSetFor(item.src)}
            sizes={sizes}
            alt={item.alt}
            width={1080}
            height={1485}
            loading="eager"
            decoding="async"
            className="pointer-events-none h-full w-full object-cover select-none"
            style={{
              width: "100%",
              height: "100%",
              aspectRatio: "1080 / 1485",
              objectFit: "cover",
              pointerEvents: "none",
              userSelect: "none",
              display: "block",
            }}
          />

          {/* Feature Recognition Micro-Badge */}
          <div
            style={{
              position: "absolute",
              bottom: "clamp(8px, 1vw, 14px)",
              left: "clamp(8px, 1vw, 14px)",
              zIndex: 2,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 9px",
              borderRadius: "999px",
              background: "rgba(13, 14, 27, 0.94)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              boxShadow: "none",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#c084fc",
                fontFamily: "var(--font-jetbrains-mono, monospace)",
              }}
            >
              {item.id}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.01em",
                color: "rgba(255, 255, 255, 0.92)",
                whiteSpace: "nowrap",
              }}
            >
              {item.title}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
});
Column.displayName = "Column";

export { Skiper30 };
export default Skiper30;
