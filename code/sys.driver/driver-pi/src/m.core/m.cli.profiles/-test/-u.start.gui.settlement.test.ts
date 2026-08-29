import { describe, expect, it } from '../../../-test.ts';
import {
  isCliSettledFailure,
  markCliSettledFailure,
  startGuiCompletion,
  startGuiCompletionKind,
} from '../u/u.start.gui.settlement.ts';

describe('@sys/driver-pi start:gui CLI settlement', () => {
  it('classifies only immutable package-owned finite completions without observing callers', () => {
    for (const kind of ['back', 'quit', 'external-cancellation'] as const) {
      const completion = startGuiCompletion(kind);
      const replacement = kind === 'back' ? 'quit' : 'back';

      expect(Reflect.set(completion, 'kind', replacement)).to.eql(false);
      expect(startGuiCompletionKind(completion)).to.eql(kind);
      expect(startGuiCompletionKind(Object.freeze({ kind }))).to.eql(undefined);
    }

    const hostile = Proxy.revocable({}, {});
    hostile.revoke();
    expect(startGuiCompletionKind(hostile.proxy)).to.eql(undefined);
  });

  it('authenticates only marked settled failures', () => {
    const failure = new Error('presented GUI failure');
    markCliSettledFailure(failure);

    expect(isCliSettledFailure(failure)).to.eql(true);
    expect(isCliSettledFailure(new Error('forged GUI failure'))).to.eql(false);
    expect(isCliSettledFailure(Object.freeze({ message: failure.message }))).to.eql(false);
  });

  it('keeps failure authentication closed after ambient WeakSet mutation', () => {
    const add = Object.getOwnPropertyDescriptor(WeakSet.prototype, 'add');
    const has = Object.getOwnPropertyDescriptor(WeakSet.prototype, 'has');
    if (!add || !has) throw new Error('Expected WeakSet method descriptors.');
    let ambientCalls = 0;
    let authenticated = false;

    try {
      const replacement = {
        value() {
          ambientCalls += 1;
          throw new Error('ambient WeakSet method invoked');
        },
      };
      Object.defineProperty(WeakSet.prototype, 'add', { ...add, ...replacement });
      Object.defineProperty(WeakSet.prototype, 'has', { ...has, ...replacement });
      const failure = new Error('presented GUI failure');
      markCliSettledFailure(failure);
      authenticated = isCliSettledFailure(failure);
    } finally {
      Object.defineProperty(WeakSet.prototype, 'add', add);
      Object.defineProperty(WeakSet.prototype, 'has', has);
    }

    expect(authenticated).to.eql(true);
    expect(ambientCalls).to.eql(0);
  });
});
