import type { t } from './common.ts';
import { DslHelp, RootHelp } from './u/u.load.ts';
export type * from './t.ts';

export const Help: t.Help.Lib = {
  Root: RootHelp,
  Dsl: DslHelp,
};
