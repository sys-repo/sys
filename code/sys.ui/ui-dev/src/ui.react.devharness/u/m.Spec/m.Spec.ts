import { maybeWait, type t, Test } from '../common.ts';
import { attachments } from './u.attachments.ts';
import { Wrangle } from './u.Wrangle.ts';

/**
 * Root API to the UI Spec Runner system.
 */
export const Spec: t.SpecLib = {
  Wrangle,
  attachments,

  /**
   * Spec (root test suite) creator.
   * Usage:
   *
   *    export default Spec.describe('My Thing', (e) => {
   *      e.it('name', (e) => {
   *        const ctx = Spec.ctx(e);
   *      });
   *    });
   */
  describe: Test.describe,

  /**
   * Pluck and type-cast the {ctx} context object from the standard
   * arguments passed into a test ("it") via the spec runner.
   */
  ctx(e: t.TestHandlerArgs | t.DevCtx) {
    return Wrangle.ctx(e, { throw: true })!;
  },

  /**
   * Pluck the {ctx} and run the given handler if this is the
   * initial test run within the session.
   */
  async once(e: t.DevCtxInput, fn: (ctx: t.DevCtx) => any | Promise<any>) {
    const ctx = Spec.ctx(e);
    if (ctx.is.initial) await maybeWait(fn(ctx));
    return ctx;
  },
};
