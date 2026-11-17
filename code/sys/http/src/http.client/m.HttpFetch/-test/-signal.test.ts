import { describe, expect, it, Try } from '../../../-test.ts';
import { composeSignals } from '../u/u.signal.ts';

describe('Http.Fetch: signal composition ownership', () => {
  it('listener registration failure → rolls back all attempted subscriptions', () => {
    const parent = trackedSignal();
    const caller = trackedSignal();
    const failure = new Error('listener registration failed');
    const add = caller.signal.addEventListener.bind(caller.signal);
    caller.signal.addEventListener = (...args: Parameters<AbortSignal['addEventListener']>) => {
      add(...args);
      throw failure;
    };

    const { result } = Try.run(() => composeSignals(parent.signal, caller.signal));
    expect(result.ok).to.eql(false);
    expect(result.error).to.equal(failure);
    expect(parent.listeners).to.eql(0);
    expect(caller.listeners).to.eql(0);
  });

  it('throwing listener cleanup → still detaches the other signal and preserves settlement', () => {
    const parent = trackedSignal();
    const caller = trackedSignal();
    const remove = parent.signal.removeEventListener.bind(parent.signal);
    parent.signal.removeEventListener = (
      ...args: Parameters<AbortSignal['removeEventListener']>
    ) => {
      remove(...args);
      throw new Error('listener cleanup failed');
    };
    const request = composeSignals(parent.signal, caller.signal);

    const { result } = Try.run(() => request.dispose());
    expect(result.ok).to.eql(true);
    expect(parent.listeners).to.eql(0);
    expect(caller.listeners).to.eql(0);
    request.dispose();
    expect(parent.listeners).to.eql(0);
    expect(caller.listeners).to.eql(0);
  });
});

/** Observe real EventTarget subscriptions without replacing their behavior. */
function trackedSignal() {
  const { signal } = new AbortController();
  const add = signal.addEventListener.bind(signal);
  const remove = signal.removeEventListener.bind(signal);
  let listeners = 0;
  signal.addEventListener = (...args: Parameters<AbortSignal['addEventListener']>) => {
    listeners++;
    add(...args);
  };
  signal.removeEventListener = (...args: Parameters<AbortSignal['removeEventListener']>) => {
    listeners--;
    remove(...args);
  };
  return {
    signal,
    get listeners() {
      return listeners;
    },
  };
}
