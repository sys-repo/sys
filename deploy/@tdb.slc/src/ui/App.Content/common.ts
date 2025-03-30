import { type t } from './common.ts';
export * from '../common.ts';

export { AppSignals } from '../App.Signals/mod.ts';
export { Breakpoint } from '../m.Layout/mod.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  baseSheetOffset: 40,
  get theme() {
    const base: t.CommonTheme = 'Dark';
    const sheet: t.CommonTheme = 'Light';
    return { base, sheet };
  },
} as const;
