import type { t } from './common.ts';
import { DslHelp, RootHelp } from './u/u.load.ts';
export type * from './t.ts';

export const ServerHelp: t.ServerHelp.Lib = Object.freeze({
  Root: RootHelp,
  Dsl: DslHelp,
});
