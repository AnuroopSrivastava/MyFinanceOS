import React, { forwardRef, useEffect } from 'react';

export type InteractiveCardIntensity = 'subtle' | 'normal' | 'interactive';

interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Controls the amount of lift and tilt applied by the shared interaction system. */
  intensity?: InteractiveCardIntensity;
}

const INTERACTIVE_CARD_SELECTOR = [
  '.glass-panel:not([data-interactive-card="off"])',
  '.neo-card:not([data-interactive-card="off"])',
  '.glass-widget:not([data-interactive-card="off"])',
  '.glass-card:not([data-interactive-card="off"])',
  '.stat-card:not([data-interactive-card="off"])',
  '.feature-card:not([data-interactive-card="off"])',
  '.feature-block-card:not([data-interactive-card="off"])',
  '.faq-card-panel:not([data-interactive-card="off"])',
  '.feedback-section-panel:not([data-interactive-card="off"])',
  '.landing-section-panel:not([data-interactive-card="off"])',
  '[data-interactive-card]:not([data-interactive-card="off"])',
].join(', ');

const getCardFromTarget = (target: EventTarget | null): HTMLElement | null => {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>(INTERACTIVE_CARD_SELECTOR);
};

const getIntensity = (card: HTMLElement): InteractiveCardIntensity => {
  const configured = card.dataset.interactiveCard;
  if (configured === 'subtle' || configured === 'interactive' || configured === 'normal') {
    return configured;
  }

  if (card.classList.contains('glass-widget') || card.classList.contains('widget-col-8') || card.classList.contains('widget-col-12')) {
    return 'subtle';
  }

  if (card.classList.contains('feature-card') || card.getAttribute('role') === 'button' || card.onclick) {
    return 'interactive';
  }

  return 'normal';
};

const INTENSITY = {
  subtle: { tilt: 6, lift: 5 },
  normal: { tilt: 8, lift: 6 },
  interactive: { tilt: 10, lift: 8 },
} as const;

/**
 * Applies a GPU-friendly 3D card interaction to all project card primitives.
 * Pointer state is kept in DOM styles / custom CSS properties instead of React state,
 * avoiding unnecessary React component re-renders during mouse movement.
 */
export const useInteractiveCardSystem = (): void => {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let activeCard: HTMLElement | null = null;

    // Pointer moves are coalesced to one processed event per animation frame.
    // A raw pointermove handler writing 3D transforms (with a forced layout via
    // getBoundingClientRect) fires far more often than the display refreshes —
    // during a scroll gesture it invalidates layers mid-frame and directly
    // fights the landing page's Lenis parallax budget.
    let pendingFrame = 0;
    let pendingEvent: PointerEvent | null = null;

    const getLenisVelocity = (): number => {
      const lenis = (window as unknown as { __myfinanceos_lenis__?: { velocity?: number } }).__myfinanceos_lenis__;
      return lenis ? Math.abs(lenis.velocity ?? 0) : 0;
    };

    const resetCard = (card: HTMLElement | null) => {
      if (!card) return;

      card.classList.remove('is-interactive-card-active');
      // Clear instead of leaving a resident identity 3D transform: a permanent
      // inline perspective() keeps the (often section-sized) panel on its own
      // composited layer forever — a standing raster cost next to the gallery.
      card.style.transform = '';
      card.style.removeProperty('--interactive-pointer-x');
      card.style.removeProperty('--interactive-pointer-y');

      if (activeCard === card) {
        activeCard = null;
      }
    };

    const handleCardPointerMove = (card: HTMLElement, event: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const config = INTENSITY[getIntensity(card)];

      const rotateX = ((y - centerY) / centerY) * -config.tilt;
      const rotateY = ((x - centerX) / centerX) * config.tilt;

      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      card.style.setProperty('--interactive-pointer-x', `${xPercent.toFixed(1)}%`);
      card.style.setProperty('--interactive-pointer-y', `${yPercent.toFixed(1)}%`);

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-${config.lift}px)`;
    };

    const activateCard = (card: HTMLElement, event: PointerEvent) => {
      if (activeCard !== card) {
        resetCard(activeCard);
        activeCard = card;
        card.classList.add('is-interactive-card-active');
      }
      handleCardPointerMove(card, event);
    };

    const flushPendingMove = () => {
      pendingFrame = 0;
      const event = pendingEvent;
      pendingEvent = null;
      if (!event) return;

      const card = getCardFromTarget(event.target);
      if (!card) {
        resetCard(activeCard);
        return;
      }

      // While the page is smooth-scrolling, tilt is a compositor liability:
      // rewriting 3D transforms on large panels churns layers in the exact
      // frames the parallax columns must stay cheap. Freeze until at rest.
      if (getLenisVelocity() > 0.5) {
        resetCard(activeCard);
        return;
      }

      activateCard(card, event);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || reduceMotion.matches || !finePointer.matches) return;
      // FIX: Freeze 3D transform recalculation while the user is actively clicking (mouse button down).
      // If the transform updates between mousedown and mouseup, the browser invalidates the hit-test and drops the `click` event!
      if (event.buttons > 0) return;

      pendingEvent = event;
      if (!pendingFrame) {
        pendingFrame = requestAnimationFrame(flushPendingMove);
      }
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !activeCard) return;
      const fromCard = getCardFromTarget(event.target);
      const toCard = getCardFromTarget(event.relatedTarget);
      if (fromCard === activeCard && toCard !== activeCard) resetCard(activeCard);
    };

    const clearPressedCard = (event: PointerEvent) => {
      const card = getCardFromTarget(event.target);
      card?.classList.remove('is-interactive-card-pressed');
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || reduceMotion.matches) return;
      getCardFromTarget(event.target)?.classList.add('is-interactive-card-pressed');
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.matches(':focus-visible')) return;
      getCardFromTarget(target)?.classList.add('is-interactive-card-focus-visible');
    };

    const handleFocusOut = (event: FocusEvent) => {
      const card = getCardFromTarget(event.target);
      const nextCard = getCardFromTarget(event.relatedTarget);
      if (card && card !== nextCard) card.classList.remove('is-interactive-card-focus-visible');
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      if (target.matches(INTERACTIVE_CARD_SELECTOR) && target.getAttribute('role') === 'button') {
        event.preventDefault();
        target.click();
      }
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerout', handlePointerOut, { passive: true });
    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('pointerup', clearPressedCard, { passive: true });
    document.addEventListener('pointercancel', clearPressedCard, { passive: true });
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (pendingFrame) cancelAnimationFrame(pendingFrame);
      resetCard(activeCard);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerout', handlePointerOut);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', clearPressedCard);
      document.removeEventListener('pointercancel', clearPressedCard);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
};

/** A manual opt-in surface for new cards that do not use the glass primitives. */
export const InteractiveCard = forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ className = '', intensity = 'normal', ...props }, ref) => (
    <div
      ref={ref}
      data-interactive-card={intensity}
      className={`glass-panel interactive-card interactive-card--${intensity} ${className}`.trim()}
      {...props}
    />
  ),
);

InteractiveCard.displayName = 'InteractiveCard';
