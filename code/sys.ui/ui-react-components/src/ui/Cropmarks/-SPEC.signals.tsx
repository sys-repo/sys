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
    subjectOnly: s<P['subjectOnly']>(false),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.theme.value;
      p.size.value;
      p.subjectOnly.value;
    },
  };
  init?.(api);
  return api;
}
