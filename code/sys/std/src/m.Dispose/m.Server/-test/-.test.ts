import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Dispose as BaseDispose, Rx, Schedule } from '../../-test/common.ts';
import { Dispose } from '../mod.ts';

describe('Dispose.Server', () => {
  it('exposes a frozen composition without changing universal Dispose or Rx aliases', async () => {
    const universal = await import('@sys/std/dispose');
    const server = await import('@sys/std/dispose/server');
    expect(server.Dispose).to.equal(Dispose);
    expect(universal.Dispose).to.equal(BaseDispose);
    expect(Dispose).not.to.equal(BaseDispose);
    expect(Object.keys(Dispose)).to.eql([...Object.keys(BaseDispose), 'Snapshot']);
    for (const key of Object.keys(BaseDispose) as (keyof t.Dispose.Lib)[]) {
      expect(Dispose[key]).to.equal(BaseDispose[key]);
    }
    expect(Object.isFrozen(Dispose)).to.equal(true);
    expect(Object.isFrozen(Dispose.Snapshot)).to.equal(true);
    expect(Object.keys(Dispose.Snapshot)).to.eql(['until']);
    expect('Snapshot' in BaseDispose).to.equal(false);
    expect('Snapshot' in Rx).to.equal(false);
    expect(Rx.lifecycle).to.equal(Dispose.lifecycle);
    expect(Rx.abortable).to.equal(Dispose.abortable);
    expectTypeOf(Dispose).toEqualTypeOf<t.Dispose.Server.Lib>();
    expectTypeOf(Dispose.Snapshot).toEqualTypeOf<t.Dispose.Snapshot.Lib>();
    expectTypeOf(universal.Dispose).toEqualTypeOf<t.Dispose.Lib>();
  });

  it('accepts readonly capture directly at existing lifecycle boundaries and mutable callers', async () => {
    const mutable: t.UntilInput[] = [Rx.subject(), [undefined]];
    const captured = Dispose.Snapshot.until(mutable);
    expectTypeOf(captured).toEqualTypeOf<t.Dispose.Snapshot.Until>();
    expectTypeOf(captured).toMatchTypeOf<t.UntilInput>();
    expectTypeOf<Extract<t.Dispose.Snapshot.Until, readonly unknown[]>>([])
      .toEqualTypeOf<readonly t.Dispose.Snapshot.Until[]>();
    const owners = [
      Dispose.abortable(captured),
      Dispose.lifecycle(captured),
      Dispose.abortable(mutable),
      Dispose.lifecycle(mutable),
    ];
    expect(Dispose.until(captured).length).to.equal(1);
    const asyncOwner = Dispose.lifecycleAsync(captured);
    for (const owner of owners) owner.dispose();
    await asyncOwner.dispose();

    // Compile-only refusal: the output's recursive array branch carries no mutation authority.
    const readonlyProof = (array: Extract<t.Dispose.Snapshot.Until, readonly unknown[]>) => {
      // @ts-expect-error Captured arrays cannot be appended to.
      array.push(undefined);
      // @ts-expect-error Captured indexes are readonly.
      array[0] = undefined;
    };
    void readonlyProof;
  });

  it('does not subscribe during capture and releases lifecycle subscriptions without disposing leaves', () => {
    let subscriptions = 0;
    let cleanups = 0;
    const source = new Rx.Observable(() => {
      subscriptions++;
      return () => {
        cleanups++;
      };
    });
    const captured = Dispose.Snapshot.until([source]);
    expect(subscriptions).to.equal(0);
    const owner = Dispose.abortable(captured);
    expect(subscriptions).to.equal(1);
    owner.dispose();
    expect(cleanups).to.equal(1);
    expect(Object.isFrozen(source)).to.equal(false);
  });

  it('retains pre-terminal and synchronous-emission settlement across the construction microtask', async () => {
    const controller = new AbortController();
    controller.abort('pre-aborted');
    const disposed = Dispose.lifecycle();
    disposed.dispose();
    const synchronous = new Rx.Observable((subscriber) => {
      subscriber.next(undefined);
      return () => undefined;
    });
    for (const input of [controller.signal, disposed, synchronous]) {
      const owner = Dispose.abortable(Dispose.Snapshot.until([input]));
      expect(owner.disposed).to.equal(false);
      await Schedule.micro();
      expect(owner.disposed).to.equal(true);
      expect(owner.signal.aborted).to.equal(true);
    }
  });

  it('retains live cancellation after capture and after caller-array mutation', () => {
    const controller = new AbortController();
    const caller = [controller.signal];
    const owner = Dispose.abortable(Dispose.Snapshot.until(caller));
    caller.length = 0;
    expect(owner.disposed).to.equal(false);
    controller.abort('live');
    expect(owner.disposed).to.equal(true);
  });

  it('reads live structural leaf state when lifecycle creation follows capture', async () => {
    const source = Dispose.lifecycle();
    const view = {
      get disposed() {
        return source.disposed;
      },
      get dispose$() {
        return source.dispose$;
      },
    };
    const captured = Dispose.Snapshot.until([view]);
    source.dispose();
    const owner = Dispose.abortable(captured);
    expect(owner.disposed).to.equal(false);
    await Schedule.micro();
    expect(owner.disposed).to.equal(true);
  });
});
