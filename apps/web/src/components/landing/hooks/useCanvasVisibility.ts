import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook that observes an element's visibility in the viewport
 * using IntersectionObserver. Used across 3D and 2D canvas loops
 * (LandingHero, ValueCarousel, OutroBrandCTA) to pause requestAnimationFrame
 * when off-screen for battery, CPU, and GPU optimization.
 */
export function useCanvasVisibility(threshold = 0.02) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      isVisibleRef.current = true;
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        isVisibleRef.current = visible;
        setIsVisible(visible);
      },
      { threshold }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return { containerRef, isVisibleRef, isVisible };
}
