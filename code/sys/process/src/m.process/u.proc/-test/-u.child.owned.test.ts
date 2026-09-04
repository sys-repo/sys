import { describe, expect, it, type t, Time } from '../../../-test.ts';
import { ProcessTest } from '../../-test/u.fixture.ts';
import {
  observeChildStatus,
  type OwnedChildTerminationFailure,
  type OwnedChildTerminationResult,
  terminateOwnedChild,
} from '../../u/u.child.owned.ts';
import { operationDeadline } from '../../u/u.operation.ts';

const STATUS: Deno.CommandStatus = { success: false, code: 137, signal: 'SIGKILL' };

describe('Process owned-child termination', () => {
  it('graceful exit → signals the owned handle and reads status once', async () => {
    const status = Promise.withResolvers<Deno.CommandStatus>();
    const signals: Deno.Signal[] = [];
    let statusReads = 0;
    const child = {
      pid: 101,
      get status() {
        statusReads++;
        return status.promise;
      },
      kill(signal: Deno.Signal = 'SIGTERM') {
        signals.push(signal);
        status.resolve({ success: true, code: 0, signal });
      },
    };
    const operation = observeChildStatus(child.status);

    const result = await Reflect.apply(terminateOwnedChild, undefined, [
      child,
      operation,
      { graceTimeout: 5, settleTimeout: 5 },
    ]);

    expect(signals).to.eql(['SIGTERM']);
    expect(statusReads).to.eql(1);
    expect(result.status).to.eql({
      ok: true,
      status: { success: true, code: 0, signal: 'SIGTERM' },
    });
  });

  it('grace timeout → escalates through the owned handle', async () => {
    const status = Promise.withResolvers<Deno.CommandStatus>();
    const signals: Deno.Signal[] = [];
    const child = {
      pid: 102,
      status: status.promise,
      kill(signal: Deno.Signal = 'SIGTERM') {
        signals.push(signal);
        if (signal === 'SIGKILL') status.resolve(STATUS);
      },
    };
    const operation = observeChildStatus(status.promise);

    const result = await Reflect.apply(terminateOwnedChild, undefined, [
      child,
      operation,
      { graceTimeout: 1, settleTimeout: 5 },
    ]);

    expect(signals).to.eql(['SIGTERM', 'SIGKILL']);
    expect(result.status).to.eql({ ok: true, status: STATUS });
  });

  it('aggregate deadline → preserves a positive integer window for final status', async () => {
    const status = Promise.withResolvers<Deno.CommandStatus>();
    const child = {
      pid: 107,
      status: status.promise,
      kill(signal: Deno.Signal = 'SIGTERM') {
        if (signal === 'SIGKILL') {
          void Time.delay(2 as t.Msecs, () => status.resolve(STATUS));
        }
      },
    };
    const operation = observeChildStatus(status.promise);
    const deadline = operationDeadline(100 as t.Msecs);

    const result = await Reflect.apply(terminateOwnedChild, undefined, [
      child,
      operation,
      { deadline, graceTimeout: 1, settleTimeout: 100 },
    ]);

    expect(result.status).to.eql({ ok: true, status: STATUS });
    expect(result.forceTimedOut).to.eql(false);
  });

  it('timer bounds → accept the maximum and reject maximum-plus-one before signaling', async () => {
    const validSignals: Deno.Signal[] = [];
    const validStatus = Promise.resolve<Deno.CommandStatus>({
      success: true,
      code: 0,
      signal: null,
    });
    const validChild = {
      pid: 108,
      status: validStatus,
      kill(signal: Deno.Signal = 'SIGTERM') {
        validSignals.push(signal);
      },
    };
    await Reflect.apply(terminateOwnedChild, undefined, [
      validChild,
      observeChildStatus(validStatus),
      { graceTimeout: Time.Delay.MAX, settleTimeout: Time.Delay.MAX },
    ]);
    expect(validSignals).to.eql(['SIGTERM']);

    for (
      const item of [
        { label: 'grace', options: { graceTimeout: Time.Delay.MAX + 1 } },
        { label: 'settlement', options: { settleTimeout: Time.Delay.MAX + 1 } },
      ] as const
    ) {
      let signalCalls = 0;
      const status = new Promise<Deno.CommandStatus>(() => undefined);
      const child = {
        pid: 109,
        status,
        kill() {
          signalCalls++;
        },
      };
      const error = await ProcessTest.catchError(() =>
        Reflect.apply(terminateOwnedChild, undefined, [
          child,
          observeChildStatus(status),
          item.options,
        ])
      );

      expect(error?.message).to.eql(
        `Process: invalid owned-child ${item.label} timeout: ${Time.Delay.MAX + 1}.`,
      );
      expect(signalCalls).to.eql(0);
    }
  });

  it('early exit → preserves a racing signal failure without blocking settlement', async () => {
    const signalFailure = new Error('signal:already-exited');
    const status = Promise.resolve<Deno.CommandStatus>({ success: true, code: 0, signal: null });
    const child = {
      pid: 103,
      status,
      kill() {
        throw signalFailure;
      },
    };
    const operation = observeChildStatus(status);

    const result = await Reflect.apply(terminateOwnedChild, undefined, [
      child,
      operation,
      { graceTimeout: 1, settleTimeout: 1 },
    ]);

    expect(result.status).to.eql({
      ok: true,
      status: { success: true, code: 0, signal: null },
    });
    expect(result.failures).to.eql([{ phase: 'signal:SIGTERM', error: signalFailure }]);
  });

  it('shared phase → preserves action truth for result adapters', async () => {
    const termFailure = new Error('signal:SIGTERM');
    const status = Promise.withResolvers<Deno.CommandStatus>();
    const child = {
      pid: 106,
      status: status.promise,
      kill(signal: Deno.Signal = 'SIGTERM') {
        if (signal === 'SIGTERM') throw termFailure;
        status.resolve(STATUS);
      },
    };
    const operation = observeChildStatus(status.promise);

    const result = await Reflect.apply(terminateOwnedChild, undefined, [
      child,
      operation,
      { graceTimeout: 1, settleTimeout: 5 },
    ]);

    expect(result.actions).to.eql([
      { signal: 'SIGTERM', ok: false, error: termFailure },
      { signal: 'SIGKILL', ok: true },
    ]);
    expect(result.status).to.eql({ ok: true, status: STATUS });
    expect(result.failures).to.eql([{ phase: 'signal:SIGTERM', error: termFailure }]);
    expect(result.forceTimedOut).to.eql(false);
  });

  it('signal and status failure → preserves every causal phase', async () => {
    const statusFailure = new Error('status:failure');
    const signalFailure = new Error('signal:failure');
    const status = Promise.reject<Deno.CommandStatus>(statusFailure);
    const child = {
      pid: 104,
      status,
      kill() {
        throw signalFailure;
      },
    };
    const operation = observeChildStatus(status);

    const result = await Reflect.apply(terminateOwnedChild, undefined, [
      child,
      operation,
      { graceTimeout: 1, settleTimeout: 1 },
    ]);

    expect(result.failures).to.eql([
      { phase: 'signal:SIGTERM', error: signalFailure },
      { phase: 'status', error: statusFailure },
      { phase: 'signal:SIGKILL', error: signalFailure },
    ]);
    expect(result.status).to.eql({ ok: false, error: statusFailure });
  });

  it('failure callback → preserves occurrence order across concurrent lifecycle failures', async () => {
    const termFailure = new Error('signal:SIGTERM');
    const killFailure = new Error('signal:SIGKILL');
    const status = new Promise<Deno.CommandStatus>(() => undefined);
    const events: string[] = [];
    const child = {
      pid: 110,
      status,
      kill(signal: Deno.Signal = 'SIGTERM') {
        if (signal === 'SIGTERM') {
          queueMicrotask(() => events.push('stream'));
          throw termFailure;
        }
        throw killFailure;
      },
    };

    const result: OwnedChildTerminationResult = await Reflect.apply(
      terminateOwnedChild,
      undefined,
      [
        child,
        observeChildStatus(status),
        {
          graceTimeout: 1,
          settleTimeout: 1,
          onFailure(failure: OwnedChildTerminationFailure) {
            events.push(failure.phase);
          },
        },
      ],
    );

    expect(events).to.eql([
      'signal:SIGTERM',
      'stream',
      'signal:SIGKILL',
      'status:settle',
    ]);
    expect(result.failures.map((failure) => failure.phase)).to.eql([
      'signal:SIGTERM',
      'signal:SIGKILL',
      'status:settle',
    ]);
  });

  it('post-SIGKILL status deadline → returns exact bounded failure phase', async () => {
    const status = new Promise<Deno.CommandStatus>(() => undefined);
    const child = {
      pid: 105,
      status,
      kill() {},
    };
    const operation = observeChildStatus(status);

    const result: OwnedChildTerminationResult = await Reflect.apply(
      terminateOwnedChild,
      undefined,
      [child, operation, { graceTimeout: 1, settleTimeout: 1 }],
    );

    expect(result.forceTimedOut).to.eql(true);
    expect(result.failures.map((failure) => failure.phase)).to.eql(['status:settle']);
    expect(result.failures[0].error).to.be.instanceOf(Error);
  });
});
