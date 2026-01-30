import { describe, expect, it } from '../../-test.ts';
import { Dispose } from '../../mod.ts';
import { Rx } from '../mod.ts';

describe('Rx (API)', () => {
  it('API', async () => {
    const m = await import('@sys/std/rx');
    expect(m.Rx).to.equal(Rx);

    expect(Rx.toLifecycle).to.equal(Dispose.toLifecycle);
    expect(Rx.toLifecycleView).to.equal(Dispose.toLifecycleView);
    expect(Rx.lifecycle).to.equal(Dispose.lifecycle);
    expect(Rx.lifecycleAsync).to.equal(Dispose.lifecycleAsync);
    expect(Rx.disposable).to.equal(Dispose.disposable);
    expect(Rx.disposableAsync).to.equal(Dispose.disposableAsync);
    expect(Rx.abortable).to.equal(Dispose.abortable);
  });

  it('dual cased names', () => {
    expect(Rx).to.equal(Rx);
  });
});
