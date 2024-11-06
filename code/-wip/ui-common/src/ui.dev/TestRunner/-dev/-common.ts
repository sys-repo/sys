import type { t } from '../common.ts';
import type { TestCtx } from './-types.ts';

export type { TestCtx };
export * from '../../../test.ui/mod.ts';

export const Wrangle = {
  ctx(e: t.TestHandlerArgs) {
    return e.ctx as TestCtx;
  },

  shouldThrow(e: t.TestHandlerArgs) {
    return Wrangle.ctx(e).fail && Math.random() < 0.5;
  },
};
