import { describe, expect, it } from '../../../-test.ts';
import {
  isCliSettledFailure,
  markCliSettledFailure,
  startGuiCompletion,
  startGuiCompletionKind,
} from '../u/u.start.gui.settlement.ts';

describe('@sys/driver-pi start:gui CLI settlement', () => {
  it('classifies only package-owned finite completions', () => {
    for (const kind of ['back', 'quit', 'external-cancellation'] as const) {
      const completion = startGuiCompletion(kind);
      const replacement = kind === 'back' ? 'quit' : 'back';

      expect(Reflect.set(completion, 'kind', replacement)).to.eql(false);
      expect(startGuiCompletionKind(completion)).to.eql(kind);
      expect(startGuiCompletionKind(Object.freeze({ kind }))).to.eql(undefined);
    }
  });

  it('authenticates only marked settled failures', () => {
    const failure = new Error('presented GUI failure');
    markCliSettledFailure(failure);

    expect(isCliSettledFailure(failure)).to.eql(true);
    expect(isCliSettledFailure(new Error('forged GUI failure'))).to.eql(false);
    expect(isCliSettledFailure(Object.freeze({ message: failure.message }))).to.eql(false);
  });
});
