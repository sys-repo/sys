import { describe, expect, it } from '../../-test.ts';
import { mergeFailures } from '../u.lifecycle/u.failure.ts';

describe('@sys/cell/cli lifecycle failures', () => {
  it('retains one primary cause while flattening and identity-deduplicating composition', () => {
    const primary = new Error('primary');
    const cleanupA = new Error('cleanup-a');
    const cleanupB = new Error('cleanup-b');

    const first = mergeFailures(primary, cleanupA, 'first');
    const duplicate = mergeFailures(first, cleanupA, 'duplicate');
    const complete = mergeFailures(duplicate, cleanupB, 'complete');

    expect(duplicate).to.equal(first);
    expect(complete instanceof AggregateError).to.eql(true);
    const aggregate = complete as AggregateError;
    expect(aggregate.cause).to.equal(primary);
    expect(aggregate.errors).to.eql([primary, cleanupA, cleanupB]);
  });

  it('does not duplicate a failure already nested inside an atomic aggregate', () => {
    const nested = new Error('nested');
    const primary = new AggregateError([nested], 'external');

    expect(mergeFailures(primary, nested, 'duplicate')).to.equal(primary);
  });
});
