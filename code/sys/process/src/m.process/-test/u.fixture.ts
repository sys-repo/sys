import { type t, Time, Try } from '../../-test.ts';

export const ProcessTest = {
  evalArgs(code: string) {
    return ['eval', code];
  },

  async catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
    const { result } = await Try.run(fn);
    return result.ok ? undefined : result.error;
  },

  async catchErrorWithin(
    fn: () => Promise<unknown>,
    timeout: t.Msecs = 1_000,
  ): Promise<Error | undefined> {
    const timer = Time.delay(timeout);
    const timeoutError = timer.then(() => new Error('Timed out waiting for rejection'));
    const result = await Promise.race([ProcessTest.catchError(fn), timeoutError]);
    timer.cancel();
    return result;
  },
} as const;
