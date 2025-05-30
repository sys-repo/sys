import { type t } from './common.ts';
export * from '../common.ts';

export { AppSignals } from '../App.Signals/mod.ts';
export { Breakpoint } from '../App.Layout/mod.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  get theme() {
    const base: t.CommonTheme = 'Dark';
    const sheet: t.CommonTheme = 'Light';
    return { base, sheet };
  },
} as const;
