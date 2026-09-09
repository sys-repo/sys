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
    try {
      const result = await Promise.race([
        ProcessTest.catchError(fn).then((error) => ({ kind: 'settled' as const, error })),
        timer.then(() => ({ kind: 'timeout' as const })),
      ]);
      if (result.kind === 'timeout') {
        throw new Error(`Timed out waiting for operation rejection after ${timeout}ms.`);
      }
      return result.error;
    } finally {
      timer.cancel();
    }
  },
} as const;
