'use client';

/**
 * Skiper30 — single canonical barrel for the parallax gallery.
 * The standalone dev page and the landing page both import the component
 * directly from `ui/skiper-ui/skiper30`; this wrapper exists only as the
 * public entry point. Do not add overlapping aliases here.
 */
export { Skiper30, DEFAULT_IMAGES as PARALLAX_IMAGES } from './ui/skiper-ui/skiper30';
export type { Skiper30Props } from './ui/skiper-ui/skiper30';
