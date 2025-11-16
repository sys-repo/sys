/**
 * Helpers for safe try/catch execution.
 */
export type TryLib = {
  /**
   * Execute a function (sync or async) and optionally handle failures via a chained handler.
   *
   * Sync:
   *   Try
   *     .run(() => doSomething())
   *     .catch((err) => console.error('sync failure', err));
   *
   * Sync with result:
   *   const { result } = Try.run(() => computeValue());
   *   if (!result.ok) {
   *     console.error('sync failure', result.error);
   *   } else {
   *     console.log('value:', result.data);
   *   }
   *
   * Async:
   *   const { result } = await Try.run(async () => doSomethingAsync());
   *   if (!result.ok) {
   *     console.error('async failure', result.error);
   *   }
   *
   * Async with handler:
   *   const result = (await Try.run(async () => saveToStore(input)))
   *     .catch((err) => {
   *       console.error('save failed', err);
   *     });
   *   if (result.ok) {
   *     console.log('saved:', result.data);
   *   }
   */
  readonly run: TryRun;
};

/** Successful result containing resolved data and no error. */
export type TryOk<T> = {
  readonly ok: true;
  readonly data: T;
  readonly error: undefined;
};

/** Failed result containing a native Error. */
export type TryFail = {
  readonly ok: false;
  readonly error: Error;
};

/** Discriminated union representing the outcome of a Try.run call. */
export type TryResult<T> = TryOk<T> | TryFail;

/** Result of a Try.run invocation, with a handler helper. */
export type TryRunResult<T> = {
  /** Underlying TryResult from the attempted execution. */
  readonly result: TryResult<T>;
  /**
   * Invoke the given handler only when the execution failed.
   * Returns the original TryResult for further inspection if needed.
   */
  readonly catch: (fn: (error: Error) => void) => TryResult<T>;
};

/**
 * Runner for side-effecting code with optional error handler.
 *
 * - Sync thunk  → TryRunResult<T>
 * - Async thunk → Promise<TryRunResult<T>>
 */
export type TryRun = {
  <T>(fn: () => Promise<T>): Promise<TryRunResult<T>>;
  <T>(fn: () => T): TryRunResult<T>;
};
