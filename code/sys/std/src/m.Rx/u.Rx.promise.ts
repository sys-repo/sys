import { catchError, of, take, timeout, type t } from './common.ts';

type Event = { type: string; payload: unknown };
type Milliseconds = number;

/**
 * Helpers for working with observables as promises.
 */
export const asPromise: t.RxAsPromise = {
  /**
   * Retrieves the first event from the given observable.
   */
  first<E extends Event>(
    ob$: t.Observable<E['payload']>,
    options: { op?: string; timeout?: Milliseconds } = {},
  ) {
    type T = t.RxPromiseResponse<E>;

    return new Promise<T>((resolve) => {
      const msecs = Math.max(0, options.timeout ?? 0);
      let $ = ob$.pipe(take(1));
      if (msecs > 0)
        $ = $.pipe(
          timeout(msecs),
          catchError(() => {
            let err = `Timed out after ${msecs} msecs`;
            if (options.op) err = `[${options.op}] ${err}`;
            return of(err);
          }),
        );

      $.subscribe({
        next(e) {
          const payload = typeof e === 'object' ? e : undefined;
          const error: t.RxPromiseError | undefined =
            typeof e === 'string' ? { code: 'timeout', message: e } : undefined;
          resolve({ payload, error });
        },
        error(err) {
          const message = err?.message ?? 'Failed';
          resolve({ error: { code: 'unknown', message } });
        },
        complete() {
          const message = `The given observable has already "completed"`;
          resolve({ error: { code: 'completed', message } });
        },
      });
    });
  },
};
