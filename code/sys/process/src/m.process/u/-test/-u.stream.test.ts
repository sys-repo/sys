import { describe, expect, it, type t } from '../../../-test.ts';
import { settleOwnedStream } from '../u.stream.ts';

describe('Process owned-stream settlement', () => {
  it('release-unblocked pump → retries settlement without reporting a false timeout', async () => {
    const operation = Promise.withResolvers<'settled-after-release'>();
    const reports: { phase: string; error: unknown }[] = [];
    let locked = true;
    let releases = 0;

    const reader = {
      cancel: () => Promise.resolve(),
      releaseLock() {
        releases++;
        locked = false;
        operation.resolve('settled-after-release');
      },
    } as unknown as ReadableStreamDefaultReader<Uint8Array>;
    const stream = {
      get locked() {
        return locked;
      },
      cancel: () => Promise.resolve(),
    } as unknown as ReadableStream<Uint8Array>;

    const result = await settleOwnedStream({
      stream,
      reader,
      operation: operation.promise,
      drain: false,
      deadline: { remaining: () => 1 as t.Msecs },
      timeout: 1 as t.Msecs,
      observe: () => true,
      report: (phase, error) => reports.push({ phase, error }),
      timeoutError: (phase) => new Error(`Unexpected ${phase} timeout.`),
    });

    expect(result).to.eql({ settled: true, value: 'settled-after-release' });
    expect(reports).to.eql([]);
    expect(releases).to.eql(1);
    expect(stream.locked).to.eql(false);
  });
});
