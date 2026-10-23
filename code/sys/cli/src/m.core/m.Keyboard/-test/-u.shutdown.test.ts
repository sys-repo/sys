import { describe, expect, it } from '../../../-test.ts';
import { shutdown } from '../u.shutdown.ts';

describe('Cli.Keyboard.shutdown', () => {
  it('retries disposal once and waits for listener termination', async () => {
    const finished = Promise.withResolvers<void>();
    let disposeCalls = 0;
    const handle = {
      finished: finished.promise,
      dispose() {
        disposeCalls += 1;
        if (disposeCalls === 1) throw new Error('first disposal failed');
        finished.resolve();
      },
    };

    await shutdown(handle);
    expect(disposeCalls).to.eql(2);
  });

  it('retains failed-disposal authority until completion evidence settles', async () => {
    const finished = Promise.withResolvers<void>();
    const failure = new Error('disposal failed');
    let disposeCalls = 0;
    const handle = {
      finished: finished.promise,
      dispose() {
        disposeCalls += 1;
        throw failure;
      },
    };

    let settled = false;
    const closing = shutdown(handle).then(
      () => undefined,
      (cause) => cause,
    ).finally(() => (settled = true));
    await Promise.resolve();
    expect(settled).to.eql(false);
    expect(disposeCalls).to.eql(2);

    finished.resolve();
    expect(await closing).to.equal(failure);
  });
});
