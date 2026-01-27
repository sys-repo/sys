import { DomMock } from './common.ts';

/**
 * Hook testing helpers.
 *
 * Goal:
 * - Ensure HappyDOM is polyfilled *before* @testing-library/react is imported,
 *   because newer React/ReactDOM/scheduler may touch `window` at import-time.
 *
 * Shape:
 * - Export the same sync surface as @testing-library/react (renderHook + act).
 */

if (!DomMock.isPolyfilled) DomMock.polyfill();

// Top-level await keeps the exported API sync (no Promise-returning renderHook).
const TL = await import('@testing-library/react');

export const renderHook = TL.renderHook;
export const act = TL.act;
export type RenderHook = typeof TL.renderHook;
export type Act = typeof TL.act;
