import type { t } from './common.ts';
import { RootHelp } from './u/u.load.ts';
export type * from './t.ts';

export const Help: t.Help.Lib = Object.freeze({
  Root: RootHelp,
});
