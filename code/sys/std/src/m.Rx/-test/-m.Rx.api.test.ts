import { describe, expect, it } from '../../-test.ts';
import { Dispose } from '../../m.Dispose/mod.ts';
import { Rx } from '../mod.ts';

describe('Rx (API)', () => {
  it('API', async () => {
    const m = await import('@sys/std/rx');
    expect(m.Rx).to.equal(Rx);

    expect(Rx.toLifecycle).to.equal(Dispose.toLifecycle);
    expect(Rx.lifecycle).to.equal(Dispose.lifecycle);
    expect(Rx.lifecycleAsync).to.equal(Dispose.lifecycleAsync);
    expect(Rx.abortable).to.equal(Dispose.abortable);
  });
});
