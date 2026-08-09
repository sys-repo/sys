import { describe, Dispose, expect, it, Rx, Schedule, type t } from './common.ts';
import { waitForAsyncDispose } from './u.fixture.ts';

describe('Dispose.until', () => {
  it('observable input → one observable', () => {
    const source = Rx.subject<void>();
    const observables = Dispose.until(source);

    expect(observables.length).to.eql(1);
    expect(observables[0]).to.equal(source);
  });

  it('live lifecycle view input → non-replaying disposal observable', () => {
    const lifecycle = Rx.lifecycle();
    const view: t.LifecycleView = {
      get disposed() {
        return lifecycle.disposed;
      },
      dispose$: lifecycle.dispose$,
    };

    for (const input of [lifecycle, view]) {
      const observables = Dispose.until(input);
      expect(observables.length).to.eql(1);
      expect(observables[0]).to.equal(input.dispose$);
    }
  });

  it('nested input → flattened observable list', () => {
    const first = Rx.subject<void>();
    const second = Rx.lifecycle();
    const third = [undefined, Rx.lifecycle()];
    const observables = Dispose.until([first, undefined, second, third]);

    expect(observables.length).to.eql(3);
    expect(observables[0]).to.equal(first);
    expect(observables[1]).to.equal(second.dispose$);
    expect(observables[2]).to.equal(third[1]?.dispose$);
  });

  it('deep nested input → flattened observable list', () => {
    const first = Rx.subject<void>();
    const second = Rx.subject<void>();
    const observables = Dispose.until([first, undefined, [undefined, [undefined, second]]]);

    expect(observables.length).to.eql(2);
    expect(observables[0]).to.equal(first);
    expect(observables[1]).to.equal(second);
  });

  it('already-disposed lifecycle view → one queued reasonless stop', async () => {
    const source = Rx.lifecycle();
    source.dispose('historical:reason');
    const view: t.LifecycleView = {
      get disposed() {
        return source.disposed;
      },
      dispose$: source.dispose$,
    };
    const events: t.DisposeEvent[] = [];
    let completed = false;

    Dispose.until(view)[0].subscribe({
      next: (event) => events.push(event as t.DisposeEvent),
      complete: () => (completed = true),
    });

    expect(events).to.eql([]);
    expect(completed).to.eql(false);
    await Schedule.micro();

    expect(events).to.eql([{ reason: undefined }]);
    expect(completed).to.eql(true);
    await Schedule.micro();
    expect(events.length).to.eql(1);
  });

  it('normalization while live preserves non-replaying stream behavior', () => {
    const source = Rx.lifecycle();
    const observable = Dispose.until(source)[0];
    const events: t.DisposeEvent[] = [];
    let completed = false;

    source.dispose('historical:reason');
    observable.subscribe({
      next: (event) => events.push(event as t.DisposeEvent),
      complete: () => (completed = true),
    });

    expect(observable).to.equal(source.dispose$);
    expect(events).to.eql([]);
    expect(completed).to.eql(true);
  });

  it('recursive already-terminal input → downstream stops after construction', async () => {
    const source = Rx.lifecycle();
    source.dispose('historical:reason');
    const downstream = Dispose.lifecycle([
      undefined,
      [Rx.subject<void>(), [undefined, source]],
    ]);
    const events: t.DisposeEvent[] = [];
    downstream.dispose$.subscribe((event) => events.push(event));

    expect(downstream.disposed).to.eql(false);
    await Schedule.micro();

    expect(downstream.disposed).to.eql(true);
    expect(events).to.eql([{ reason: undefined }]);
  });

  it('AbortSignal abort → one adapted observable and reasoned completion', () => {
    const controller = new AbortController();
    const observables = Dispose.until(controller.signal);
    expect(observables.length).to.eql(1);

    const observable = observables[0];
    const events: t.DisposeEvent[] = [];
    let completed = false;

    observable.subscribe({
      next: (event) => events.push(event as t.DisposeEvent),
      complete: () => (completed = true),
    });

    controller.abort('signal:reason');
    controller.abort('ignored');

    expect(events).to.eql([{ reason: 'signal:reason' }]);
    expect(completed).to.eql(true);
  });

  it('AbortSignal unsubscribe → listener removal', () => {
    let removed = 0;
    const signal = {
      aborted: false,
      reason: undefined,
      addEventListener() {},
      removeEventListener() {
        removed++;
      },
    } as unknown as AbortSignal;

    const subscription = Dispose.until(signal)[0].subscribe(() => {});
    subscription.unsubscribe();

    expect(removed).to.eql(1);
  });

  it('pre-aborted signal → lifecycle terminal state after construction', async () => {
    const controller = new AbortController();
    controller.abort('pre-aborted');

    const lifecycle = Dispose.lifecycle(controller.signal);
    const events: t.DisposeEvent[] = [];
    lifecycle.dispose$.subscribe((event) => events.push(event));

    expect(lifecycle.disposed).to.eql(false);
    await Schedule.micro();

    expect(lifecycle.disposed).to.eql(true);
    expect(events).to.eql([{ reason: 'pre-aborted' }]);
  });

  it('pre-aborted signal → lifecycleAsync terminal state after construction', async () => {
    const controller = new AbortController();
    controller.abort('pre-aborted:async');

    let handled: unknown;
    const lifecycle = Dispose.lifecycleAsync(controller.signal, (event) => {
      handled = event.reason;
    });

    expect(lifecycle.disposed).to.eql(false);
    await waitForAsyncDispose(lifecycle);

    expect(lifecycle.disposed).to.eql(true);
    expect(handled).to.eql('pre-aborted:async');
  });

  it('already-disposed lifecycle view → lifecycleAsync stops without historical reason', async () => {
    const source = Dispose.lifecycle();
    source.dispose('historical:reason');
    let handled: unknown = 'not-called';
    const lifecycle = Dispose.lifecycleAsync(source, (event) => {
      handled = event.reason;
    });

    expect(lifecycle.disposed).to.eql(false);
    expect(handled).to.eql('not-called');
    await waitForAsyncDispose(lifecycle);

    expect(lifecycle.disposed).to.eql(true);
    expect(handled).to.eql(undefined);
  });
});
