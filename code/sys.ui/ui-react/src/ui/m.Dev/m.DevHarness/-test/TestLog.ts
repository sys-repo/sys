import { Is, type t } from './common.ts';

type T = { args: t.TestHandlerArgs; ctx: t.DevCtxObject };

export const TestLog = {
  create() {
    const logger = {
      items: [] as T[],
      reset: () => (logger.items = []),
      push(args: t.TestHandlerArgs, ctxInput: t.DevCtxObject | t.DevCtx) {
        const ctx = Is.ctx(ctxInput)
          ? (ctxInput as unknown as t.DevCtx).toObject()
          : (ctxInput as t.DevCtxObject);
        logger.items.push({ args, ctx });
      },
      get count() {
        return logger.items.length;
      },
    };
    return logger;
  },
};
