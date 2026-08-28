import { describe, expect, it, type t } from '../../../-test.ts';
import { createFailureLedger } from '../u.failure.ts';
import { captureOperation, operationDeadline } from '../u.operation.ts';

describe('Process operation', () => {
  it('raw thrown identity → survives sync/async capture and ledger coalescing', async () => {
    const failure = Object.freeze({ source: 'raw-rejection' });
    const [sync, async] = await Promise.all([
      captureOperation(() => {
        throw failure;
      }),
      captureOperation(() => Promise.reject(failure)),
    ]);

    expect(sync.ok).to.eql(false);
    expect(async.ok).to.eql(false);
    if (sync.ok || async.ok) throw new Error('Expected operation failures.');
    expect(sync.error).to.equal(failure);
    expect(async.error).to.equal(failure);

    const ledger = createFailureLedger<'sync' | 'async'>();
    ledger.record('sync', sync.error);
    ledger.record('async', async.error);
    expect(ledger.records()).to.eql([{ phases: ['sync', 'async'], error: failure }]);
  });

  it('sequential phases → preserve positive residual time without refreshing the budget', () => {
    let now = 0;
    const deadline = operationDeadline(100 as t.Msecs, () => now);

    expect(deadline.remaining(80 as t.Msecs)).to.eql(80);
    now = 60;
    expect(deadline.remaining(80 as t.Msecs)).to.eql(40);
    now = 99.6;
    expect(deadline.remaining(80 as t.Msecs)).to.eql(1);
    now = 100;
    expect(deadline.remaining(80 as t.Msecs)).to.eql(0);
    now = 101;
    expect(deadline.remaining(80 as t.Msecs)).to.eql(0);
  });
});
