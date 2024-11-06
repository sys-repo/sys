import type { t } from '../common.ts';
import { Is } from '../m.Is/mod.ts';

export type WrangleLib = {
  ctx(
    input: any | t.TestHandlerArgs | t.DevCtx,
    options?: { throw?: boolean },
  ): t.DevCtx | undefined;
};

export const Wrangle: WrangleLib = {
  ctx(input, options = {}): t.DevCtx | undefined {
    if (Is.ctx(input)) return input;

    if (typeof input === 'object' && input !== null) {
      if (Is.ctx(input.ctx)) return input.ctx;
    }

    if (options.throw) {
      throw new Error(`Expected a {ctx} object. Make sure to pass it into the runner.`);
    }

    return undefined;
  },
};
