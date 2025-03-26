import { type t, Signal } from './common.ts';

/**
 * Types:
 */
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  type P = t.CropmarksProps;
  const s = Signal.create;
  const props = {
    theme: s<P['theme']>('Light'),
    size: s<P['size']>(),
  };
  const api = { props };
  init?.(api);
  return api;
}
