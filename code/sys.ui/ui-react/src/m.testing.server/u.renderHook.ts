import { DomMock, Schedule } from './common.ts';

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
if (!DomMock.isPolyfilled) {
  DomMock.polyfill();

  /**
   * IMPORTANT:
   * HappyDOM's AsyncTaskManager schedules internal timers during polyfill/import-time.
   * Deno will fail a test if a timer started "before the test" completes "during the test".
   *
   * Drain one macrotask here so HappyDOM's initial timers complete before any test runs.
   */
  await Schedule.macro();
}

/**
 * JSR slow-types:
 * - All public API symbols must have explicit types.
 * - This includes the top-level `TL` binding created via top-level await.
 */
type TLModule = typeof import('@testing-library/react');

// Top-level await keeps the exported API sync (no Promise-returning renderHook).
const TL: TLModule = await import('@testing-library/react');

export const renderHook: TLModule['renderHook'] = TL.renderHook;
export const act: TLModule['act'] = TL.act;

export type RenderHook = TLModule['renderHook'];
export type Act = TLModule['act'];
