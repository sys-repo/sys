import { describe, expect, it, Schedule, Try } from '../../../-test.ts';
import { monotonicClock } from '../../../u/-test/u.fixture.clock.ts';
import { CANCELLED } from '../u/u.operation.ts';
import { bodyFixture, expectPolicyFailure } from './u.fixture.body.ts';

describe('Http.Fetch: body completion ordering', () => {
  it('latches completion failure before cancellation queued after EOF observation', async () => {
    using fixture = bodyFixture();
    const { controller, operation } = fixture;
    const events: string[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull(stream) {
        stream.close();
        // Two callback jobs place abort after EOF admission but before an extra continuation.
        Schedule.micro(() => {
          Schedule.micro(() => {
            events.push('abort');
            controller.abort();
          });
        });
      },
    }, { highWaterMark: 0 });

    const { result } = await Try.run(() => {
      return fixture.read(body, (event) => {
        events.push(`complete=${event.complete}:aborted=${controller.signal.aborted}`);
        throw new Error('callback failure');
      });
    });
    expect(events).to.eql(['complete=true:aborted=false', 'abort']);
    expectPolicyFailure(result, operation, 'progress-failure');
    expect(body.locked).to.eql(false);
  });

  it('suppresses completion when cancellation is observed before EOF', async () => {
    using fixture = bodyFixture();
    const { controller, operation } = fixture;
    const events: boolean[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull(stream) {
        controller.abort();
        stream.close();
      },
    }, { highWaterMark: 0 });

    const { result } = await Try.run(() => {
      return fixture.read(body, (event) => events.push(event.complete));
    });
    expect(result.ok).to.eql(false);
    expect(operation.terminal).to.equal(CANCELLED);
    expect(events).to.eql([]);
    expect(body.locked).to.eql(false);
  });

  it('deadline before EOF observation → suppresses completion', async () => {
    // Declare clock first: the operation is disposed before the real clock is restored.
    using clock = monotonicClock();
    using fixture = bodyFixture();
    const events: string[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull(stream) {
        stream.close();
        clock.set(fixture.timeout);
        events.push('deadline');
      },
    }, { highWaterMark: 0 });

    const { result } = await Try.run(() => {
      return fixture.read(body, (event) => {
        events.push(`complete=${event.complete}`);
        throw new Error('callback failure');
      });
    });
    expectPolicyFailure(result, fixture.operation, 'response-timeout');
    expect(events).to.eql(['deadline']);
    expect(body.locked).to.eql(false);
  });

  it('deadline queued after EOF observation → completion failure wins', async () => {
    using clock = monotonicClock();
    using fixture = bodyFixture();
    const events: string[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull(stream) {
        stream.close();
        Schedule.micro(() => {
          Schedule.micro(() => {
            clock.set(fixture.timeout);
            events.push('deadline');
          });
        });
      },
    }, { highWaterMark: 0 });

    const { result } = await Try.run(() => {
      return fixture.read(body, (event) => {
        events.push(`complete=${event.complete}`);
        throw new Error('callback failure');
      });
    });
    expectPolicyFailure(result, fixture.operation, 'progress-failure');
    expect(events).to.eql(['complete=true', 'deadline']);
    expect(body.locked).to.eql(false);
  });

  it('deadline reached inside a throwing completion callback → timeout wins', async () => {
    using clock = monotonicClock();
    using fixture = bodyFixture();
    const events: string[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull: (stream) => stream.close(),
    }, { highWaterMark: 0 });

    const { result } = await Try.run(() => {
      return fixture.read(body, (event) => {
        events.push(`complete=${event.complete}`);
        clock.set(fixture.timeout);
        events.push('deadline');
        throw new Error('callback failure');
      });
    });
    expectPolicyFailure(result, fixture.operation, 'response-timeout');
    expect(events).to.eql(['complete=true', 'deadline']);
    expect(body.locked).to.eql(false);
  });

  it('deadline reached inside a returning completion callback → timeout wins', async () => {
    using clock = monotonicClock();
    using fixture = bodyFixture();
    const events: string[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull: (stream) => stream.close(),
    }, { highWaterMark: 0 });

    const { result } = await Try.run(() => {
      return fixture.read(body, (event) => {
        events.push(`complete=${event.complete}`);
        clock.set(fixture.timeout);
        events.push('deadline');
      });
    });
    expectPolicyFailure(result, fixture.operation, 'response-timeout');
    expect(events).to.eql(['complete=true', 'deadline']);
    expect(body.locked).to.eql(false);
  });

  it('chunk callback abort then rejected return → cancellation without an unhandled rejection', async () => {
    using fixture = bodyFixture();
    const { controller, operation } = fixture;
    const events: boolean[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull: (stream) => stream.enqueue(new Uint8Array([1])),
    }, { highWaterMark: 0 });

    // Keep the raw symbol identity; Try.run normalizes non-Error rejections.
    try {
      await fixture.read(body, (event) => {
        events.push(event.complete);
        controller.abort();
        return Promise.reject(new Error('chunk rejection after abort'));
      });
      expect.fail('Expected cancellation.');
    } catch (cause) {
      expect(cause).to.equal(CANCELLED);
    }
    expect(operation.terminal).to.equal(CANCELLED);
    expect(events).to.eql([false]);
    expect(body.locked).to.eql(false);
    // Cross a host turn so Deno reports any unobserved callback rejection in this test.
    await Schedule.macro();
  });

  it('completion callback abort then rejected return → cancellation without an unhandled rejection', async () => {
    using fixture = bodyFixture();
    const { controller, operation } = fixture;
    const events: boolean[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull: (stream) => stream.close(),
    }, { highWaterMark: 0 });

    try {
      await fixture.read(body, (event) => {
        events.push(event.complete);
        controller.abort();
        return Promise.reject(new Error('completion rejection after abort'));
      });
      expect.fail('Expected cancellation.');
    } catch (cause) {
      expect(cause).to.equal(CANCELLED);
    }
    expect(operation.terminal).to.equal(CANCELLED);
    expect(events).to.eql([true]);
    expect(body.locked).to.eql(false);
    await Schedule.macro();
  });

  it('chunk callback deadline then rejected return → timeout without an unhandled rejection', async () => {
    using clock = monotonicClock();
    using fixture = bodyFixture();
    const events: boolean[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull: (stream) => stream.enqueue(new Uint8Array([1])),
    }, { highWaterMark: 0 });

    const { result } = await Try.run(() => {
      return fixture.read(body, (event) => {
        events.push(event.complete);
        clock.set(fixture.timeout);
        return Promise.reject(new Error('chunk rejection after deadline'));
      });
    });
    expectPolicyFailure(result, fixture.operation, 'response-timeout');
    expect(events).to.eql([false]);
    expect(body.locked).to.eql(false);
    await Schedule.macro();
  });

  it('completion callback deadline then rejected return → timeout without an unhandled rejection', async () => {
    using clock = monotonicClock();
    using fixture = bodyFixture();
    const events: boolean[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull: (stream) => stream.close(),
    }, { highWaterMark: 0 });

    const { result } = await Try.run(() => {
      return fixture.read(body, (event) => {
        events.push(event.complete);
        clock.set(fixture.timeout);
        return Promise.reject(new Error('completion rejection after deadline'));
      });
    });
    expectPolicyFailure(result, fixture.operation, 'response-timeout');
    expect(events).to.eql([true]);
    expect(body.locked).to.eql(false);
    await Schedule.macro();
  });

  it('throwing then getter in a completion callback result → progress failure', async () => {
    using fixture = bodyFixture();
    const events: boolean[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull: (stream) => stream.close(),
    }, { highWaterMark: 0 });

    const { result } = await Try.run(() => {
      return fixture.read(body, (event) => {
        events.push(event.complete);
        return {
          get then() {
            throw new Error('hostile then getter');
          },
        };
      });
    });
    expectPolicyFailure(result, fixture.operation, 'progress-failure');
    expect(events).to.eql([true]);
    expect(body.locked).to.eql(false);
  });

  it('rejected async completion callback → progress failure without an unhandled rejection', async () => {
    using fixture = bodyFixture();
    const events: boolean[] = [];
    const body = new ReadableStream<Uint8Array>({
      pull: (stream) => stream.close(),
    }, { highWaterMark: 0 });

    const { result } = await Try.run(() => {
      return fixture.read(body, (event) => {
        events.push(event.complete);
        return Promise.reject(new Error('async callback failure'));
      });
    });
    expectPolicyFailure(result, fixture.operation, 'progress-failure');
    expect(events).to.eql([true]);
    expect(body.locked).to.eql(false);
  });
});
