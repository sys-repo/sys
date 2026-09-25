import { describe, expect, it } from '../../../-test.ts';
import { createFailureLedger } from '../u.failure.ts';

describe('Process failure ledger', () => {
  it('one identity in one phase → returns the raw failure', () => {
    const failure = new Error('single-phase');
    const ledger = createFailureLedger<'read'>();
    ledger.record('read', failure);

    expect(ledger.toError('Process failed.', 'ProcessFailureError')).to.equal(failure);
  });

  it('one identity in several phases → exposes every phase without duplicating the error', () => {
    const failure = new Error('multi-phase');
    const ledger = createFailureLedger<'read' | 'pump'>();
    ledger.record('read', failure);
    ledger.record('pump', failure);

    const output = ledger.toError('Process failed.', 'ProcessFailureError');

    expect(output).to.be.instanceOf(AggregateError);
    if (!(output instanceof AggregateError)) throw output;
    expect(output.name).to.eql('ProcessFailureError');
    expect(output.errors).to.eql([failure]);
    expect(output.cause).to.equal(failure);
    expect(Reflect.get(output, 'failures')).to.eql([
      { phases: ['read', 'pump'], error: failure },
    ]);
  });
});
