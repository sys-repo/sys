import { describe, expect, it, Try } from '../../../-test.ts';
import { monotonicClock } from '../../../u/-test/u.fixture.clock.ts';
import { CANCELLED } from '../u/u.operation.ts';
import { bodyFixture, expectPolicyFailure } from './u.fixture.body.ts';

describe('Http.Fetch: synchronous deadline observation', () => {
  it('elapsed deadline → latches timeout without throwing or replacing it with a later abort', () => {
    using clock = monotonicClock();
    using fixture = bodyFixture();
    const { operation, controller } = fixture;

    clock.set(fixture.timeout);
    operation.checkDeadline();
    const terminal = operation.terminal;
    const { result } = Try.run(() => operation.throwIfStopped());
    expectPolicyFailure(result, operation, 'response-timeout');

    controller.abort();
    operation.checkDeadline();
    expect(operation.terminal).to.equal(terminal);
  });

  it('cancellation before elapsed deadline → retains the cancellation cause', () => {
    using clock = monotonicClock();
    using fixture = bodyFixture();
    const { operation, controller } = fixture;

    controller.abort();
    clock.set(fixture.timeout);
    operation.checkDeadline();
    expect(operation.terminal).to.equal(CANCELLED);
  });
});
