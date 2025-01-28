import type { t } from '../common.ts';
import type { WrangleLib } from './u.Wrangle.ts';

/**
 * Root API to the UI Spec Runner system.
 */
export type SpecLib = {
  Wrangle: WrangleLib;
  describe: t.TestSuiteDescribe;
  ctx(e: t.TestHandlerArgs | t.DevCtx): t.DevCtx;
  once(e: t.DevCtxInput, fn: (ctx: t.DevCtx) => any | Promise<any>): Promise<t.DevCtx>;
};
