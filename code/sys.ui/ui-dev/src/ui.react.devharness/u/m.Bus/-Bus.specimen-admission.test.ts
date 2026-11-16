import { describe, expect, it, Rx, Signal, Spec, type t, TestSample, Time } from '../../-test.ts';
import { Harness } from '../../mod.ts';
import { Context } from '../m.Ctx/mod.ts';
import { initContext } from '../m.Ctx/Context.ts';

/** Admission is live owner state, not knowledge reconstructed from retirement notifications. */
describe('DevBus: specimen admission', () => {
  it('reset → close before the first observer and reopen after response delivery', async () => {
    const instance = TestSample.instance();
    using first = Harness.Bus.Events({ instance });
    const states: t.DevCtxIs[] = [];
    first.reset.before$.subscribe(() => states.push(ctx.is));
    using controller = Harness.Bus.Controller({ instance });
    const ctx = await controller.ctx.get();
    using last = Harness.Bus.Events({ instance });
    last.reset.before$.subscribe(() => states.push(ctx.is));
    last.info.changed$.subscribe((e) => {
      if (e.message === 'reset') states.push(ctx.is);
    });
    last.reset.res$.subscribe(() => states.push(ctx.is));

    expect(ctx.is).to.include({ attachable: true });
    const result = await controller.reset.fire();
    expect(result.error).to.eql(undefined);
    expect(states).to.eql(Array(4).fill({ initial: true, attachable: false }));
    expect(await controller.ctx.get()).to.equal(ctx);
    expect(ctx.is).to.include({ attachable: true });
  });

  it('dispose → close before context teardown, through delivery, and after completion', async () => {
    using controller = Harness.Bus.Controller({ instance: TestSample.instance() });
    const states: t.DevCtxIs[] = [];
    controller.dispose$.subscribe(() => states.push(ctx.is)); // Before context lifetime wiring.
    const ctx = await controller.ctx.get();
    ctx.dispose$.subscribe(() => states.push(ctx.is));
    controller.dispose$.subscribe(() => states.push(ctx.is));

    expect(ctx.is).to.include({ attachable: true });
    controller.dispose();
    expect(states).to.eql(Array(3).fill({ initial: true, attachable: false }));
    expect(ctx.is).to.include({ attachable: false });
  });

  it('standalone context → no implicit controller admission binding', async () => {
    const instance = TestSample.instance();
    using controller = Harness.Bus.Controller({ instance });
    using context = await Context.init(instance);
    expect(context.ctx.is).to.include({ attachable: false });
    context.ctx.subject.size([320, 200]);
    await context.flush();
    const size = (await controller.info.get()).render.props?.subject.size;
    expect(size).to.eql({ mode: 'center', width: 320, height: 200 });
  });

  it('context created during cold reset → inherit live closed admission, not an open snapshot', async () => {
    using controller = Harness.Bus.Controller({ instance: TestSample.instance() });
    let pending: Promise<t.DevCtx> | undefined;
    const states: boolean[] = [];
    controller.reset.before$.subscribe(() => (pending = controller.ctx.get()));
    controller.ctx.res$.subscribe((e) => {
      if (e.ctx) states.push(e.ctx.is.attachable);
    });
    expect((await controller.reset.fire()).error).to.eql(undefined);
    const ctx = await pending;
    expect(states).to.eql([false]);
    expect(ctx?.is.attachable).to.eql(true);
  });

  it('queued reset from response → no admission between transitions', async () => {
    using controller = Harness.Bus.Controller({ instance: TestSample.instance() });
    const ctx = await controller.ctx.get();
    const states: boolean[] = [];
    let nested: Promise<t.DevResetRes> | undefined;
    controller.reset.before$.subscribe(() => states.push(ctx.is.attachable));
    controller.info.changed$.subscribe((e) => {
      if (e.message === 'reset') states.push(ctx.is.attachable);
    });
    controller.reset.res$.subscribe(() => {
      states.push(ctx.is.attachable);
      nested ??= controller.reset.fire();
    });

    expect((await controller.reset.fire()).error).to.eql(undefined);
    expect((await nested)?.error).to.eql(undefined);
    expect(states).to.eql([false, false, false, false, false, false]);
    expect(ctx.is.attachable).to.eql(true);
  });

  it('load → keep admission closed across reset response, continuation, and replacement', async () => {
    using controller = Harness.Bus.Controller({ instance: TestSample.instance() });
    const ctx = await controller.ctx.get();
    const states: [string, boolean][] = [];
    controller.reset.res$.subscribe(() => {
      states.push(['reset response', ctx.is.attachable]);
      void Promise.resolve().then(() => states.push(['continuation gap', ctx.is.attachable]));
    });
    controller.info.changed$.subscribe((e) => {
      if (e.message === 'spec:load') states.push(['replacement', ctx.is.attachable]);
    });
    controller.load.res$.subscribe(() => states.push(['load response', ctx.is.attachable]));

    const result = await controller.load.fire(Spec.describe('replacement', () => {}));
    expect(result.error).to.eql(undefined);
    expect(states).to.eql([
      ['reset response', false],
      ['continuation gap', false],
      ['replacement', false],
      ['load response', false],
    ]);
    expect(ctx.is.attachable).to.eql(true);
  });

  it('overlapping replacements → each finalizer releases only its own hold', async () => {
    const instance = TestSample.instance();
    const transport = instance.bus;
    const held: t.Event[] = [];
    const firstHeld = Promise.withResolvers<void>();
    const secondHeld = Promise.withResolvers<void>();
    const bus: t.EventBus = {
      $: transport.$,
      fire(e) {
        if (e.type !== 'sys.dev/reset:res') return transport.fire(e);
        held.push(e); // Delay response delivery, not the controller's reset processing.
        if (held.length === 1) firstHeld.resolve();
        if (held.length === 2) secondHeld.resolve();
      },
    };
    using controller = Harness.Bus.Controller({ instance: { ...instance, bus } });
    const ctx = await controller.ctx.get();
    const responses: boolean[] = [];
    controller.load.res$.subscribe(() => responses.push(ctx.is.attachable));

    const first = controller.load.fire(Spec.describe('first', () => {}));
    await firstHeld.promise;
    expect(ctx.is.attachable).to.eql(false);
    const failed = await controller.load.fire(Promise.reject(new Error('import failed')));
    expect(failed.error).to.eql('import failed');
    expect(ctx.is.attachable).to.eql(false); // A failed import never owned a replacement hold.
    const second = controller.load.fire(Spec.describe('second', () => {}));
    await secondHeld.promise;
    expect(ctx.is.attachable).to.eql(false);

    transport.fire(held[0]);
    expect((await first).error).to.eql(undefined);
    expect(ctx.is.attachable).to.eql(false);
    transport.fire(held[1]);
    expect((await second).error).to.eql(undefined);
    expect(responses).to.eql([false, false, false]);
    expect(ctx.is.attachable).to.eql(true);
  });

  it('pending/failed import and ordinary runs → preserve admission for the displayed suite', async () => {
    using controller = Harness.Bus.Controller({ instance: TestSample.instance() });
    const runs: boolean[] = [];
    const root = Spec.describe('displayed', (e) => {
      e.it('init', (e) => runs.push(Spec.ctx(e).is.attachable));
    });
    await controller.load.fire(root);
    const ctx = await controller.ctx.get();
    const pending = Promise.withResolvers<{ default: t.TestSuiteModel }>();
    const load = controller.load.fire(pending.promise);
    expect(ctx.is.attachable).to.eql(true);
    pending.reject(new Error('import failed'));
    const result = await load;
    expect(result.error).to.eql('import failed');
    expect(result.info?.spec).to.equal(root);
    expect(ctx.is.attachable).to.eql(true);
    expect((await controller.run.fire()).error).to.eql(undefined);
    expect((await controller.run.fire()).error).to.eql(undefined);
    expect(runs).to.eql([true, true]);
    expect(ctx.is.attachable).to.eql(true);
  });

  it('same bus, independent controllers → transition/disposal of A does not close B', async () => {
    const instance = TestSample.instance();
    using a = Harness.Bus.Controller({ instance });
    using b = Harness.Bus.Controller({ instance: { ...TestSample.instance(), bus: instance.bus } });
    const ctxA = await a.ctx.get();
    const ctxB = await b.ctx.get();
    const states: boolean[][] = [];
    a.reset.before$.subscribe(() => states.push([ctxA.is.attachable, ctxB.is.attachable]));
    await a.reset.fire();
    expect(states).to.eql([[false, true]]);
    a.dispose();
    expect([ctxA.is.attachable, ctxB.is.attachable]).to.eql([false, true]);
  });

  for (const transition of ['reset', 'load', 'dispose'] as const) {
    it(`${transition} → effect cleanup observes closed admission`, async () => {
      using controller = Harness.Bus.Controller({ instance: TestSample.instance() });
      const ctx = await controller.ctx.get();
      using effects = Signal.listeners(ctx.dispose$);
      const states: boolean[] = [];
      effects.effect(() => () => states.push(ctx.is.attachable));
      controller.reset.before$.subscribe(() => effects.dispose());

      if (transition === 'reset') await controller.reset.fire();
      if (transition === 'load') await controller.load.fire(Spec.describe('next', () => {}));
      if (transition === 'dispose') controller.dispose();
      expect(states).to.eql([false]);
      expect(ctx.is.attachable).to.eql(transition !== 'dispose');
    });
  }

  for (const mode of ['explicit', 'native', 'observable', 'abort', 'lifecycle'] as const) {
    it(`${mode} disposal → close before downstream subscription teardown and release bridges`, async () => {
      const instance = TestSample.instance();
      const trigger = Rx.subject<t.DisposeEvent>();
      using upstream = Rx.lifecycle();
      const abort = new AbortController();
      let bridges = 0;
      const until$ = new Rx.Observable<t.DisposeEvent>((observer) => {
        bridges++;
        const sub = trigger.subscribe(observer);
        return () => {
          bridges--;
          // Only explicit/native disposal promises closure before input-bridge teardown.
          if (mode === 'explicit' || mode === 'native') states.push(ctx.is.attachable);
          sub.unsubscribe();
        };
      });
      let subscriptions = 0;
      let recording = false;
      const states: boolean[] = [];
      const bus: t.EventBus = {
        $: new Rx.Observable<t.Event>((observer) => {
          subscriptions++;
          const sub = instance.bus.$.subscribe(observer);
          return () => {
            subscriptions--;
            if (recording) states.push(ctx.is.attachable);
            sub.unsubscribe();
          };
        }),
        fire: (e) => instance.bus.fire(e),
      };
      const until = mode === 'abort' ? abort.signal : mode === 'lifecycle' ? upstream : until$;
      using controller = Harness.Bus.Controller({ instance: { ...instance, bus }, until });
      const ctx = await controller.ctx.get();
      const reasons: unknown[] = [];
      const reason = { source: mode };
      controller.dispose$.subscribe((e) => reasons.push(e.reason));
      recording = true;
      expect(subscriptions).to.be.greaterThan(0);

      if (mode === 'explicit') controller.dispose(reason);
      if (mode === 'native') controller[Symbol.dispose]();
      if (mode === 'observable') trigger.next({ reason });
      if (mode === 'abort') abort.abort(reason);
      if (mode === 'lifecycle') upstream.dispose(reason);
      controller.dispose('ignored');
      expect(controller.disposed).to.eql(true);
      expect(ctx.is.attachable).to.eql(false);
      expect(states.length).to.be.greaterThan(0);
      expect(states.every((value) => value === false)).to.eql(true);
      expect({ subscriptions, bridges }).to.eql({ subscriptions: 0, bridges: 0 });
      expect(reasons).to.eql([mode === 'native' ? undefined : reason]);
    });
  }

  it('context-local disposal → cannot reopen when its live controller completes a reset', async () => {
    const instance = TestSample.instance();
    using controller = Harness.Bus.Controller({ instance });
    const owner = await controller.ctx.get();
    using context = await initContext(instance, {}, () => owner.is.attachable);
    const states: boolean[] = [];
    context.dispose$.subscribe(() => states.push(context.ctx.is.attachable));
    expect(context.ctx.is.attachable).to.eql(true);
    context.dispose();
    await controller.reset.fire();
    expect(states).to.eql([false]);
    expect(owner.is.attachable).to.eql(true);
    expect(context.ctx.is.attachable).to.eql(false);
  });

  it('context delivered after controller disposal → retained reader stays closed', async () => {
    const instance = TestSample.instance();
    using view = Harness.Bus.Events({ instance });
    using controller = Harness.Bus.Controller({ instance });
    view.info.changed$.subscribe((e) => {
      if (e.message === 'context:init') controller.dispose();
    });
    // Characterize the inherited late context response; admission must not revive it.
    const ctx = await view.ctx.get();
    expect(controller.disposed).to.eql(true);
    expect(ctx.is.attachable).to.eql(false);
  });

  it('UntilInput → retain deferred initial notification and completion-only semantics', async () => {
    using closed = Rx.lifecycle();
    closed.dispose();
    const abort = new AbortController();
    abort.abort();
    const inputs = [closed, abort.signal, Rx.of({ reason: 'initial' })];
    for (const until of inputs) {
      using view = Harness.Bus.Events({ instance: TestSample.instance(), until });
      expect(view.disposed).to.eql(false);
      await Promise.resolve();
      expect(view.disposed).to.eql(true);
    }
    using view = Harness.Bus.Events({ instance: TestSample.instance(), until: Rx.EMPTY });
    await Promise.resolve();
    expect(view.disposed).to.eql(false);
  });

  for (const transition of ['reset', 'load'] as const) {
    it(`${transition} failure → release transition without claiming rollback`, async () => {
      const instance = TestSample.instance();
      let fail = true;
      const bus: t.EventBus = {
        $: instance.bus.$,
        fire(e) {
          instance.bus.fire(e);
          if (fail && e.type === 'sys.dev/reset:before') {
            fail = false;
            throw new Error('retirement transport failed');
          }
        },
      };
      using controller = Harness.Bus.Controller({ instance: { ...instance, bus } });
      const ctx = await controller.ctx.get();
      const states: boolean[] = [];
      controller.reset.before$.subscribe(() => states.push(ctx.is.attachable));
      controller.reset.res$.subscribe(() => states.push(ctx.is.attachable));
      const result = transition === 'reset'
        ? await controller.reset.fire()
        : await controller.load.fire(Spec.describe('next', () => {}));
      expect(result.error).to.eql('retirement transport failed');
      expect(states).to.eql([false, false]);
      expect(ctx.is.attachable).to.eql(true);
      expect((await controller.reset.fire()).error).to.eql(undefined);
      expect(ctx.is.attachable).to.eql(true);
    });

    it(`${transition} response transport throws → release admission and retain error reporting`, async () => {
      const instance = TestSample.instance();
      const failure = new Error('response transport failed');
      using report = observeRejection(failure);
      let fail = true;
      const bus: t.EventBus = {
        $: instance.bus.$,
        fire(e) {
          instance.bus.fire(e);
          if (fail && e.type === `sys.dev/${transition}:res`) {
            fail = false;
            throw failure;
          }
        },
      };
      using controller = Harness.Bus.Controller({ instance: { ...instance, bus } });
      const ctx = await controller.ctx.get();
      const result = transition === 'reset'
        ? await controller.reset.fire()
        : await controller.load.fire(Spec.describe('next', () => {}));
      // Delivery preceded the transport throw; this is not a controller-reported error response.
      expect(result.error).to.eql(undefined);
      expect(ctx.is.attachable).to.eql(true);
      await Time.wait(1); // Allow the runtime's unhandled-rejection report to arrive.
      expect(report.errors).to.eql([failure]);
    });

    it(`${transition} disposed during response → finalization cannot reopen admission`, async () => {
      const instance = TestSample.instance();
      using view = Harness.Bus.Events({ instance });
      using controller = Harness.Bus.Controller({ instance });
      const ctx = await controller.ctx.get();
      const response$ = transition === 'reset' ? view.reset.res$ : view.load.res$;
      response$.subscribe(() => controller.dispose());
      const result = transition === 'reset'
        ? await view.reset.fire()
        : await view.load.fire(Spec.describe('next', () => {}));
      expect(result.error).to.eql(undefined);
      expect(controller.disposed).to.eql(true);
      expect(ctx.is.attachable).to.eql(false);
    });
  }
});

/** Capture only the deliberately thrown transport error, leaving unrelated failures visible. */
function observeRejection(failure: Error) {
  const errors: unknown[] = [];
  const handler = (event: PromiseRejectionEvent) => {
    if (event.reason !== failure) return;
    event.preventDefault();
    errors.push(event.reason);
  };
  addEventListener('unhandledrejection', handler);
  return {
    errors,
    [Symbol.dispose]: () => removeEventListener('unhandledrejection', handler),
  } as const;
}
