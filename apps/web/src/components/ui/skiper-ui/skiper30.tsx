"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { cx } from "@financeos/ui";

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

export interface Skiper30Props {
  images?: string[];
  items?: GalleryItem[];
  standalone?: boolean;
  className?: string;
  enableLenis?: boolean;
  showIndicators?: boolean;
}

const Skiper30 = ({
  images = DEFAULT_IMAGES,
  items,
  standalone = false,
  className = "",
  showIndicators = true,
}: Skiper30Props) => {
  const gallery = useRef<HTMLDivElement>(null);
  const [dimension, setDimension] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  }));

  /**
   * Reference implementation from tutorial:
   * useScroll tracks the gallery section across ['start end', 'end start']
   */
  const { scrollYProgress } = useScroll({
    target: gallery,
    offset: ["start end", "end start"],
  });

  const { height, width } = dimension;
  const isMobile = width > 0 && width < 768;

  // Parallax velocity multipliers
  const y1 = useTransform(scrollYProgress, [0, 1], [0, height * (isMobile ? 1.6 : 2)]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, height * (isMobile ? 2.6 : 3.3)]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, height * 1.25]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, height * (isMobile ? 1.75 : 2.2)]);

  useEffect(() => {
    const resize = () => {
      setDimension({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", resize);
    resize();
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

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
            <Column items={mobileCol1} y={y1} topOffset="-20%" priority />
            <Column items={mobileCol2} y={y2} topOffset="-45%" />
          </>
        ) : (
          <>
            <Column items={desktopCol1} y={y1} topOffset="-45%" priority />
            <Column items={desktopCol2} y={y2} topOffset="-95%" />
            <Column items={desktopCol3} y={y3} topOffset="-45%" />
            <Column items={desktopCol4} y={y4} topOffset="-75%" />
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

// Each `.webp` screenshot ships with a `.jpg` twin in the same folder. When a
// webp request drops, the browser cannot recover it through a `<picture>`
// source: source selection is by format support, not by load success, and webp
// is supported everywhere here. So the jpg fallback runs through `onError`
// instead, which also covers a dropped jpg with a neutral placeholder.
const toJpgSrc = (src: string) => src.replace(/\.webp(\?.*)?$/i, ".jpg$1");

// Try the webp first, then its jpg twin, then a neutral placeholder. The
// placeholder means a dropped asset never shows the browser's broken-image
// icon plus the long alt text inside the card.
const GalleryImage = ({ item, eager }: { item: GalleryItem; eager: boolean }) => {
  const sources = useMemo(() => [item.src, toJpgSrc(item.src)], [item.src]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const failedSrc = useRef<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const failed = sourceIndex >= sources.length;
  const currentSrc = failed ? null : sources[sourceIndex];

  // Advance once per source. A dropped source can report through both the
  // native error event and the mount-time completeness check below, so the
  // ref guards against skipping a fallback on a double report.
  const advance = useCallback((src: string) => {
    if (failedSrc.current === src) return;
    failedSrc.current = src;
    setSourceIndex((index) => index + 1);
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !currentSrc) return;
    // An eager image can fail before hydration attaches the handler, so the
    // error event never reaches React. Detect that already-failed state here.
    if (img.complete && img.naturalWidth === 0) {
      advance(currentSrc);
      return;
    }
    const onError = () => advance(currentSrc);
    img.addEventListener("error", onError);
    return () => img.removeEventListener("error", onError);
  }, [currentSrc, advance]);

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    aspectRatio: "1080 / 1485",
    objectFit: "cover",
    pointerEvents: "none",
    userSelect: "none",
    display: "block",
  };

  if (failed) {
    return (
      <div
        role="img"
        aria-label={item.alt}
        style={{
          ...imgStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #14152a 0%, #0d0e1b 100%)",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "rgba(255, 255, 255, 0.55)",
            padding: "0 12px",
            textAlign: "center",
          }}
        >
          {item.title}
        </span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      key={currentSrc ?? undefined}
      src={currentSrc ?? undefined}
      alt={item.alt}
      width={1080}
      height={1485}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      className="pointer-events-none h-full w-full object-cover select-none"
      style={imgStyle}
    />
  );
};

type ColumnProps = {
  items?: GalleryItem[];
  images?: string[];
  topOffset: string;
  y: MotionValue<number>;
  priority?: boolean;
};

const Column = React.memo(({ items, images, topOffset, y, priority = false }: ColumnProps) => {
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
    <motion.div
      className="gallery-column relative flex h-full flex-1 flex-col"
      style={{
        y,
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
          <GalleryImage item={item} eager={priority && i === 0} />

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
    </motion.div>
  );
});
Column.displayName = "Column";

export { Skiper30 };
export default Skiper30;
