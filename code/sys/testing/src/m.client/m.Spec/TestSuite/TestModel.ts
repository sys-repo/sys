import { DEFAULT, Delete, R, Time, maybeWait, slug, type t } from './common.ts';

/**
 * A single test.
 */
export const TestModel = (args: {
  parent: t.TestSuiteModel;
  description: string;
  handler?: t.TestHandler;
  modifier?: t.TestModifier;
}): t.TestModel => {
  const { parent, description, handler, modifier } = args;
  const id = `Test.${slug()}`;

  const run: t.TestRun = (options = {}) => {
    type R = t.TestRunResponse;

    return new Promise<R>(async (resolve) => {
      const tx = `run.test.tx.${slug()}`;
      const timer = Time.timer();
      const excluded = toExcluded({ modifier, excluded: options.excluded });
      const { noop } = options;

      const response: R = {
        id,
        tx,
        ok: true,
        description,
        time: { started: Time.now.timestamp, elapsed: -1 },
        timeout: Math.max(0, options.timeout ?? DEFAULT.TIMEOUT),
        excluded,
        noop,
      };

      let _stopTimeout: () => void = () => null;
      const finalizeResponse = (options: { error?: Error } = {}) => {
        _stopTimeout?.();
        response.time.elapsed = timer.elapsed.msec;
        response.error = options.error;
        response.ok = !Boolean(response.error);
        return Delete.undefined(response);
      };

      const done = (options: { error?: Error } = {}) => resolve(finalizeResponse(options));
      if (!handler || excluded) return done();

      const startTimeout = (msecs: number) => {
        _stopTimeout?.();
        const res = Time.delay(msecs, () => {
          const error = new Error(`Test timed out after ${msecs} msecs`);
          return done({ error });
        });
        _stopTimeout = res.cancel;
      };

      const args: t.TestHandlerArgs = {
        id,
        description,
        ctx: options.ctx,
        timeout(value) {
          response.timeout = Math.max(0, value);
          startTimeout(response.timeout);
          return args;
        },
      };

      if (noop) return done();

      try {
        /**
         * Before handler.
         */
        if (options.before) {
          await maybeWait(options.before({ id, description }));
        }

        /**
         * Test handler.
         */
        let error: Error | undefined;
        startTimeout(response.timeout);
        try {
          await maybeWait(handler(args));
        } catch (err: any) {
          error = err;
        }

        /**
         * After handler.
         */
        if (options.after) {
          const result = finalizeResponse({ error });
          await maybeWait(options.after({ id, description, result }));
        }

        return done({ error });
      } catch (error: any) {
        done({ error });
      }
    });
  };

  const model: t.TestModel = {
    parent,
    kind: 'Test',
    id,
    description,
    modifier,
    handler,
    run,
    toString: () => description,
    clone: () => TestModel(args),
  };
  return model;
};

/**
 * Helpers
 */

const toExcluded = (options: {
  modifier?: t.TestModifier;
  excluded?: t.TestModifier[];
}): t.TestModifier[] | undefined => {
  if (options.modifier === 'skip' || Array.isArray(options.excluded)) {
    let list: t.TestModifier[] = [];
    if (options.modifier === 'skip') list.push('skip');
    if (Array.isArray(options.excluded)) list.push(...options.excluded);
    list = R.uniq(list);
    return list.length === 0 ? undefined : list;
  } else {
    return undefined;
  }
};
