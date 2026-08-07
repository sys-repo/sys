import { describe, Dispose, expect, it, Rx, Schedule, type t } from './common.ts';

describe('Dispose.until', () => {
  it('observable input → one observable', () => {
    const source = Rx.subject<void>();
    const observables = Dispose.until(source);

    expect(observables.length).to.eql(1);
    expect(observables[0]).to.equal(source);
  });

  it('disposable input → disposal observable', () => {
    const test = (input: t.Disposable) => {
      const observables = Dispose.until(input);
      expect(observables.length).to.eql(1);
      expect(observables[0]).to.equal(input.dispose$);
    };

    test(Rx.disposable());
    test(Rx.lifecycle());
  });

  it('nested input → flattened observable list', () => {
    const first = Rx.subject<void>();
    const second = Rx.disposable();
    const third = [undefined, Rx.disposable()];
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
});

function waitForAsyncDispose(lifecycle: t.LifecycleAsync) {
  if (lifecycle.disposed) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const state: { terminal: boolean; subscription?: { unsubscribe(): void } } = {
      terminal: false,
    };
    const subscription = lifecycle.dispose$.subscribe((event) => {
      const { stage } = event.payload;
      if (stage !== 'complete' && stage !== 'error') return;

      state.terminal = true;
      state.subscription?.unsubscribe();
      resolve();
    });

    state.subscription = subscription;
    if (state.terminal) subscription.unsubscribe();
  });
}
