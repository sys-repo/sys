import { describe, expect, it, Signal, Spec, type t, TestSample } from '../../-test.ts';
import { Harness } from '../../mod.ts';

/** Required by UI template attachments: retirement must precede observable reset mutation. */
describe('DevBus: specimen retirement boundary', () => {
  for (const transition of ['reset', 'load'] as const) {
    it(`${transition} → retire attachment before reset observers can reactivate it`, async () => {
      using specimen = await specimenFixture();
      const { controller, ctx, attachment, view } = specimen;
      const signal = Signal.create(0);
      const calls: number[] = [];
      const atReset: { disposed: boolean; count: number }[] = [];
      let redraws = 0;

      view.reset.before$.subscribe(() => attachment.dispose());
      controller.$.subscribe((e) => {
        if (e.type === 'sys.dev/redraw') redraws++;
      });
      attachment.effect(() => {
        calls.push(signal.value);
        void ctx.redraw();
      });
      expect(calls).to.eql([0]);
      expect(redraws).to.eql(1);

      // A consumer can react to reset state synchronously. No private state or forced flush.
      controller.info.changed$.subscribe((e) => {
        if (e.message !== 'reset') return;
        atReset.push({ disposed: attachment.disposed, count: attachment.count });
        signal.value++;
      });

      const result = transition === 'reset'
        ? await controller.reset.fire()
        : await controller.load.fire(Spec.describe('replacement', () => {}));
      expect(result.error).to.eql(undefined);
      expect(await controller.ctx.get()).to.equal(ctx);
      expect(controller.disposed).to.eql(false);
      expect(attachment.disposed).to.eql(true);
      expect(attachment.count).to.eql(0);

      // Assert outside Rx callbacks so an assertion cannot escape via async error reporting.
      expect({ atReset, calls, redraws }).to.eql({
        atReset: [{ disposed: true, count: 0 }],
        calls: [0],
        redraws: 1,
      });
    });
  }

  for (const subscribe of ['before controller', 'after controller'] as const) {
    it(`${subscribe} → retirement completes before reset publication`, async () => {
      const instance = TestSample.instance();
      using view = Harness.Bus.Events({ instance });
      const order: string[] = [];
      const bind = () => view.reset.before$.subscribe(() => order.push('retire'));
      if (subscribe === 'before controller') bind();
      using controller = Harness.Bus.Controller({ instance });
      if (subscribe === 'after controller') bind();
      controller.info.changed$.subscribe((e) => {
        if (e.message === 'reset') order.push('reset');
      });
      controller.reset.res$.subscribe(() => order.push('response'));

      const result = await controller.reset.fire();
      expect(result.error).to.eql(undefined);
      expect(order).to.eql(['retire', 'reset', 'response']);
    });
  }

  it('reentrant reset → finish every retirement observer before either state publication', async () => {
    using specimen = await specimenFixture();
    const { controller, ctx, attachment } = specimen;
    const order: string[] = [];
    const before: t.DevResetBefore[] = [];
    const responses: t.DevResetRes[] = [];
    let nested: Promise<t.DevResetRes> | undefined;
    let requested = false;
    const signal = Signal.create(0);
    const calls: number[] = [];
    attachment.effect(() => {
      calls.push(signal.value);
    });

    controller.reset.before$.subscribe((e) => {
      order.push('before:request');
      before.push(e);
      if (requested) return;
      requested = true;
      nested = controller.reset.fire();
    });
    controller.reset.before$.subscribe(() => {
      order.push('before:retire');
      attachment.dispose();
    });
    controller.info.changed$.subscribe((e) => {
      if (e.message !== 'reset') return;
      order.push(`reset:${attachment.disposed}`);
      signal.value++;
    });
    controller.reset.res$.subscribe((e) => {
      order.push('response');
      responses.push(e);
    });

    const first = await controller.reset.fire();
    const second = await nested;
    expect(first.error).to.eql(undefined);
    expect(second?.error).to.eql(undefined);
    expect(order).to.eql([
      'before:request',
      'before:retire',
      'reset:true',
      'response',
      'before:request',
      'before:retire',
      'reset:true',
      'response',
    ]);
    expect(responses).to.eql([first, second]);
    expect(before.map((e) => e.tx)).to.eql(responses.map((e) => e.tx));
    expect(first.tx).to.not.eql(second?.tx);
    expect(first.info?.instance.session).to.not.eql(second?.info?.instance.session);
    expect(await controller.ctx.get()).to.equal(ctx);
    expect(calls).to.eql([0]);
  });

  it('shared bus → reset retires only the addressed host and tears down its event view', async () => {
    const instanceA = TestSample.instance();
    const instanceB = { ...TestSample.instance(), bus: instanceA.bus };
    using hostA = await specimenFixture({ instance: instanceA });
    using hostB = await specimenFixture({ instance: instanceB });
    const before: string[] = [];
    hostA.view.reset.before$.subscribe(() => {
      before.push('A');
      hostA.attachment.dispose();
    });
    hostB.view.reset.before$.subscribe(() => {
      before.push('B');
      hostB.attachment.dispose();
    });
    const signal = Signal.create(0);
    const callsA: number[] = [];
    const callsB: number[] = [];
    hostA.attachment.effect(() => {
      callsA.push(signal.value);
    });
    hostB.attachment.effect(() => {
      callsB.push(signal.value);
    });

    await hostA.controller.reset.fire();
    signal.value++;
    expect(before).to.eql(['A']);
    expect(hostA.view.disposed).to.eql(true);
    expect(hostB.view.disposed).to.eql(false);
    expect(callsA).to.eql([0]);
    expect(callsB).to.eql([0, 1]);
    await hostA.controller.reset.fire();
    expect(before).to.eql(['A']);

    hostB.controller.dispose();
    signal.value++;
    expect(hostB.attachment.disposed).to.eql(true);
    expect(hostB.view.disposed).to.eql(true);
    expect(callsB).to.eql([0, 1]);
  });

  it('normal runs → leave the displayed specimen attachment active', async () => {
    const root = Spec.describe('displayed', (e) => {
      e.it('init', () => {});
    });
    using specimen = await specimenFixture({ spec: root });
    const { controller, ctx, attachment, view } = specimen;
    let retirements = 0;
    view.reset.before$.subscribe(() => {
      retirements++;
      attachment.dispose();
    });
    const signal = Signal.create(0);
    const calls: number[] = [];
    attachment.effect(() => {
      calls.push(signal.value);
    });

    const first = await controller.run.fire();
    const second = await controller.run.fire();
    signal.value++;
    expect(first.error).to.eql(undefined);
    expect(second.error).to.eql(undefined);
    expect(second.info?.run.count).to.eql(2);
    expect(second.info?.instance.session).to.eql(first.info?.instance.session);
    expect(await controller.ctx.get()).to.equal(ctx);
    expect({ retirements, calls, disposed: attachment.disposed }).to.eql({
      retirements: 0,
      calls: [0, 1],
      disposed: false,
    });
  });

  it('failed import → preserve the displayed suite and its attachment', async () => {
    const root = Spec.describe('displayed', (e) => {
      e.it('init', () => {});
    });
    using specimen = await specimenFixture({ spec: root });
    const { controller, ctx, attachment, view } = specimen;
    const before = await controller.info.get();
    let retirements = 0;
    view.reset.before$.subscribe(() => {
      retirements++;
      attachment.dispose();
    });
    const signal = Signal.create(0);
    const calls: number[] = [];
    attachment.effect(() => {
      calls.push(signal.value);
    });

    const failure = new Error('bundle import failed');
    const result = await controller.load.fire(Promise.reject(failure));
    signal.value++;
    expect(result.error).to.eql(failure.message);
    expect(result.info?.spec).to.equal(root);
    expect(result.info?.instance.session).to.eql(before.instance.session);
    expect(await controller.ctx.get()).to.equal(ctx);
    expect({ retirements, calls, disposed: attachment.disposed }).to.eql({
      retirements: 0,
      calls: [0, 1],
      disposed: false,
    });

    // The preserved suite remains runnable, not merely present in the info snapshot.
    const run = await controller.run.fire();
    expect(run.error).to.eql(undefined);
    expect(run.info?.spec?.id).to.eql(root.id);
    expect(run.info?.spec?.run).to.equal(root.run);
    expect(run.info?.run.count).to.eql(1);
  });

  for (const transition of ['reset', 'load'] as const) {
    it(`${transition} transport throws after retirement → report failure and keep effects retired on retry`, async () => {
      const instance = TestSample.instance();
      const transport = instance.bus;
      let fail = false;
      const failure = new Error('retirement transport failed');
      const bus: t.EventBus = {
        $: transport.$,
        fire(e) {
          if (fail && e.type === 'sys.dev/reset:before') {
            fail = false;
            transport.fire(e); // Complete notification, then fail the transport—not an observer.
            throw failure;
          }
          transport.fire(e);
        },
      };
      const root = Spec.describe('displayed', () => {});
      using specimen = await specimenFixture({ instance: { ...instance, bus }, spec: root });
      const { controller, ctx, attachment, view } = specimen;
      const before = await controller.info.get();
      view.reset.before$.subscribe(() => attachment.dispose());
      const signal = Signal.create(0);
      const calls: number[] = [];
      attachment.effect(() => {
        calls.push(signal.value);
      });
      const replacement = Spec.describe('replacement', () => {});

      fail = true;
      const result = transition === 'reset'
        ? await controller.reset.fire()
        : await controller.load.fire(replacement);
      expect(result.error).to.eql(failure.message);
      expect(result.info?.spec).to.equal(root);
      expect(result.info?.instance.session).to.eql(before.instance.session);
      expect(attachment.disposed).to.eql(true);
      signal.value++;

      const retry = await controller.reset.fire();
      expect(retry.error).to.eql(undefined);
      expect(attachment.disposed).to.eql(true);
      expect(await controller.ctx.get()).to.equal(ctx);
      signal.value++;
      expect(calls).to.eql([0]);
    });
  }

  // External views below outlive their controllers. Timeouts observe response silence;
  // they are not cancellation results returned by the controller.
  for (const phase of ['import', 'retirement'] as const) {
    it(`load disposal during ${phase} → no spec replacement or load response`, async () => {
      const instance = TestSample.instance();
      using view = Harness.Bus.Events({ instance });
      using controller = Harness.Bus.Controller({ instance });
      const pending = Promise.withResolvers<{ default: t.TestSuiteModel }>();
      const observed = { requests: 0, retirements: 0, responses: 0, loads: 0 };
      view.reset.req$.subscribe(() => observed.requests++);
      view.reset.before$.subscribe(() => {
        observed.retirements++;
        if (phase === 'retirement') controller.dispose();
      });
      view.load.res$.subscribe(() => observed.responses++);
      view.info.changed$.subscribe((e) => {
        if (e.message === 'spec:load') observed.loads++;
      });

      const request = view.load.fire(pending.promise, { timeout: 20 });
      if (phase === 'import') controller.dispose();
      pending.resolve({ default: Spec.describe('replacement', () => {}) });
      const result = await request;
      expect(result.error).to.eql('[load] Timed out after 20 msecs');
      expect(observed).to.eql({
        requests: phase === 'import' ? 0 : 1,
        retirements: phase === 'import' ? 0 : 1,
        responses: 0,
        loads: 0,
      });
    });
  }

  for (const phase of ['retirement', 'state publication'] as const) {
    it(`reset disposal during ${phase} → discard queued resets without responses`, async () => {
      const instance = TestSample.instance();
      using view = Harness.Bus.Events({ instance });
      using controller = Harness.Bus.Controller({ instance });
      await controller.ctx.get(); // This case does not cover disposal during cold-context init.
      const order: string[] = [];
      let nested: Promise<t.DevResetRes> | undefined;
      let requested = false;
      const dispose = () => {
        if (requested) return;
        requested = true;
        nested = view.reset.fire({ timeout: 20 });
        controller.dispose();
      };
      view.reset.before$.subscribe(() => {
        order.push('before');
        if (phase === 'retirement') dispose();
      });
      view.info.changed$.subscribe((e) => {
        if (e.message !== 'reset') return;
        order.push('state');
        if (phase === 'state publication') dispose();
      });
      view.reset.res$.subscribe(() => order.push('response'));

      const result = await view.reset.fire({ timeout: 20 });
      const queued = await nested;
      expect(result.error).to.eql('[reset] Timed out after 20 msecs');
      expect(queued?.error).to.eql('[reset] Timed out after 20 msecs');
      expect(controller.disposed).to.eql(true);
      expect(order).to.eql(phase === 'retirement' ? ['before'] : ['before', 'state']);
    });
  }
});

/** Own real resources; leave retirement subscriptions and all test interventions at the call site. */
async function specimenFixture(
  options: { instance?: t.DevInstance; spec?: t.TestSuiteModel } = {},
) {
  using resources = new DisposableStack();
  const instance = options.instance ?? TestSample.instance();
  const controller = resources.use(Harness.Bus.Controller({ instance }));
  if (options.spec) {
    const loaded = await controller.load.fire(options.spec);
    if (loaded.error) throw new Error(loaded.error);
  }
  const ctx = await controller.ctx.get();
  const attachment = resources.use(Signal.listeners(ctx.dispose$));
  const view = resources.use(
    Harness.Bus.Events({ instance: ctx.toObject().instance, until: attachment }),
  );
  const owned = resources.move();
  return {
    controller,
    ctx,
    attachment,
    view,
    [Symbol.dispose]() {
      owned.dispose();
    },
  } as const;
}
