import { type t, Rx } from './common.ts';

/**
 * Helpers for working with observables as promises.
 */
export const asPromise: t.RxAsPromise = {
  /**
   * Retrieves the first value from the given observable.
   */
  first<P>(
    ob$: t.Observable<P>,
    options: { op?: string; timeout?: t.Msecs } = {},
  ): Promise<t.RxPromiseResponse<P>> {
    const { op, timeout: ms } = options;

    return new Promise<t.RxPromiseResponse<P>>((resolve) => {
      let src: t.Observable<P> = ob$;

      // Apply timeout if requested (errors with TimeoutError on lapse).
      if (ms && ms > 0) src = src.pipe(Rx.timeout(ms));

      src.pipe(Rx.take(1)).subscribe({
        next(value) {
          resolve({ payload: value });
        },
        error(err: unknown) {
          const isTimeout =
            typeof err === 'object' &&
            err !== null &&
            // rxjs TimeoutError has name === 'TimeoutError'
            // keeping this tolerant without importing the class
            /** @ts-expect-error dynamic */
            err.name === 'TimeoutError';

          if (isTimeout) {
            const msg = `${op ? `[${op}] ` : ''}Timed out after ${ms} msecs`;
            resolve({ error: { code: 'timeout', message: msg } });
          } else {
            const message = (
              typeof err === 'object' && err && 'message' in err
                ? // deno-lint-ignore no-explicit-any
                  (err as any).message
                : String(err ?? 'Failed')
            ) as string;
            resolve({ error: { code: 'unknown', message } });
          }
        },
        complete() {
          // No value arrived before completion.
          const message = `The given observable has already "completed"`;
          resolve({ error: { code: 'completed', message } });
        },
      });
    });
  },
};
