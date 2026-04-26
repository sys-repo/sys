import { type t, describe, expect, it } from '../../-test.ts';
import { Dispose } from '../../m.Dispose/mod.ts';
import { Rx } from '../mod.ts';

describe('Rx.disposable', () => {
  it('referenced from Dispose', () => {
    expect(Rx.disposable).to.equal(Dispose.disposable);
    expect(Rx.disposableAsync).to.equal(Dispose.disposableAsync);
    expect(Rx.lifecycle).to.equal(Dispose.lifecycle);
    expect(Rx.lifecycleAsync).to.equal(Dispose.lifecycleAsync);
  });

  it('method: dispose', () => {
    const { dispose$, dispose } = Rx.disposable();

    let count = 0;
    dispose$.subscribe(() => count++);

    dispose();
    dispose();
    dispose();

    expect(count).to.eql(1); // NB: Multiple calls only fire the observable event once.
  });

  it('until$', () => {
    const until$ = Rx.subject<number>();
    const { dispose$ } = Rx.disposable(until$);

    let count = 0;
    dispose$.subscribe(() => count++);
    expect(count).to.eql(0);

    until$.next(123);
    until$.next(456);
    expect(count).to.eql(1);
  });

  it('lifecycle', () => {
    const until$ = Rx.subject<number>();
    const lifecycleA = Rx.lifecycle([undefined, [undefined, [undefined, [until$]]]]);
    const lifecycleB = Rx.lifecycle();

    const count = { a: 0, b: 0 };
    lifecycleA.dispose$.subscribe(() => count.a++);
    lifecycleB.dispose$.subscribe(() => count.b++);

    expect(lifecycleA.disposed).to.eql(false);
    expect(lifecycleB.disposed).to.eql(false);

    until$.next(123);
    expect(lifecycleA.disposed).to.eql(true);
    expect(lifecycleB.disposed).to.eql(false);
    expect(count).to.eql({ a: 1, b: 0 });

    lifecycleA.dispose(); // NB: No effect.
    lifecycleB.dispose();

    expect(lifecycleA.disposed).to.eql(true);
    expect(lifecycleB.disposed).to.eql(true);
    expect(count).to.eql({ a: 1, b: 1 });
  });

  it('Rx.done() - fires and completes the subject', () => {
    const dispose$ = Rx.subject<t.DisposeEvent>();

    let count = 0;
    dispose$.subscribe(() => (count += 1));

    Rx.done(dispose$);
    Rx.done(dispose$);
    Rx.done(dispose$);

    expect(count).to.eql(1);
  });
});
