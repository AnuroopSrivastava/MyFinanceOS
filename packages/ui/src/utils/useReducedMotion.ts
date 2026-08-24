import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduceMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setShouldReduceMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return shouldReduceMotion;
}

export function getMotionProps(reduced: boolean) {
  if (reduced) {
    return {
      initial: false,
      animate: false,
      transition: { duration: 0 },
      whileHover: undefined,
      whileTap: undefined,
      whileInView: undefined,
      whileFocus: undefined,
    };
  }
  return {};
}