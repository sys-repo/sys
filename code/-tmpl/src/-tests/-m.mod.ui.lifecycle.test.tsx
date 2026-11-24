import { afterEach } from '@sys/testing/server';
import { describe, expect, it, Json, Rx } from '../-test.ts';
import {
  closeDom,
  createDebug,
  type Dev,
  errorFixture,
  freshStorage,
  HarnessHost,
  hostFixture,
  keyFor,
  LocalStorage,
  projectionFixture,
  settle,
  Signal,
  type Snapshot,
  Spec,
  specimenFixture,
  storageFixture,
  TestReact,
  variants,
} from './u.fixture.ui-lifecycle.tsx';

afterEach(closeDom);

for (const variant of variants) {
  describe(`UI specimen lifecycle: ${variant}`, () => {
    it('repeat init → one redraw per knob and retained stored signals', async () => {
      using storage = storageFixture();
      storage.seed(variant, { debug: true, theme: 'Light', controlled: true });
      using host = await specimenFixture(variant);
      await host.run();
      const debug = await host.debug();
      const identities = { ...debug.props };
      expect(Signal.toObject(debug.props)).to.include({ debug: true, theme: 'Light' });
      const subscriptions = host.subscriptions;
      await host.run();
      expect(host.subscriptions).to.eql(subscriptions);
      const before = host.redraws.length;
      debug.props.debug.value = false;
      expect(host.redraws.length - before).to.eql(1);
      expect((await host.debug()).props.debug).to.equal(identities.debug);
      expect((await host.debug()).props.theme).to.equal(identities.theme);
      expect(Json.parse(storage.read(variant)!)).to.include({ debug: false, theme: 'Light' });
      if ('controlled' in debug.props) {
        expect(debug.props.controlled.value).to.eql(true);
        const count = host.redraws.length;
        debug.props.controlled.value = false;
        expect(host.redraws.length - count).to.eql(1);
        expect(Json.parse(storage.read(variant)!)).to.include({ controlled: false });
      }
    });

    it('shared suite in two hosts → independent retirement and one persistence projection', async () => {
      using storage = storageFixture();
      storage.seed(variant, { debug: false, theme: 'Dark', controlled: false });
      using projection = projectionFixture(variant);
      using a = await specimenFixture(variant);
      await a.run();
      const debug = await a.debug();
      expect(projection.count).to.eql(1);
      using b = await hostFixture(a.suite);
      await b.run();
      expect(projection.count, 'joining a host adds no second persistence effect').to.eql(1);
      expect((await b.debug()).props.debug).to.equal(debug.props.debug);
      const counts = [a.redraws.length, b.redraws.length, storage.writes.length];
      debug.props.debug.value = true;
      expect([a.redraws.length - counts[0], b.redraws.length - counts[1]]).to.eql([1, 1]);
      expect(storage.writes.length - counts[2]).to.eql(1);
      expect(projection.count).to.eql(2);
      await a.controller.reset.fire();
      const detached = a.redraws.length;
      const live = b.redraws.length;
      const persisted = { projections: projection.count, writes: storage.writes.length };
      debug.props.debug.value = false;
      expect(a.redraws.length).to.eql(detached);
      expect(b.redraws.length - live).to.eql(1);
      expect(projection.count - persisted.projections).to.eql(1);
      expect(storage.writes.length - persisted.writes).to.eql(1);
      expect(Json.parse(storage.read(variant)!)).to.include({ debug: false, theme: 'Dark' });
      b.controller.dispose();
      const writes = storage.writes.length;
      const retired = [a.redraws.length, b.redraws.length];
      debug.props.debug.value = true;
      debug.reset();
      expect(storage.writes.length).to.eql(writes);
      expect([a.redraws.length, b.redraws.length]).to.eql(retired);
    });

    it('reset or replacement → old signals cannot write, redraw, or repaint the successor', async () => {
      using storage = storageFixture();
      storage.seed(variant, { debug: false, theme: 'Dark', controlled: false });
      using host = await specimenFixture(variant);
      await host.run();
      const debug = await host.debug();
      const ctx = host.ctx;
      await host.controller.reset.fire();
      const before = host.redraws.length;
      const writes = storage.writes.length;
      debug.props.debug.value = true;
      expect(host.redraws.length).to.eql(before);
      expect(storage.writes.length).to.eql(writes);
      expect(await host.controller.ctx.get()).to.equal(ctx);
      await host.run();
      const replacement = Spec.describe('successor', (e) => {
        e.it('init', (e) => {
          const ctx = Spec.ctx(e);
          ctx.host.backgroundColor('tomato');
          ctx.subject.backgroundColor('gold').render(() => <div>successor</div>);
        });
      });
      await host.controller.load.fire(replacement);
      await host.run();
      const baseline = host.redraws.length;
      debug.props.theme.value = 'Light';
      await settle();
      expect(host.redraws.length).to.eql(baseline);
      const props = (await host.controller.info.get()).render.props;
      expect(props?.host.backgroundColor).to.eql('tomato');
      expect(props?.subject.backgroundColor).to.eql('gold');
    });

    it('normal completion and failed import → keep the displayed attachment alive', async () => {
      using storage = storageFixture();
      storage.seed(variant, { debug: false, theme: 'Dark', controlled: false });
      using host = await specimenFixture(variant);
      await host.run();
      const debug = await host.debug();
      const failure = new Error('import failed');
      const result = await host.controller.load.fire(Promise.reject(failure));
      expect(result.error).to.eql(failure.message);
      const before = host.redraws.length;
      debug.props.debug.value = true;
      expect(host.redraws.length - before).to.eql(1);
    });

    it('theme changes → actual harness flush/render; unrelated knobs preserve custom paint', async () => {
      using storage = storageFixture();
      storage.seed(variant, { debug: false, theme: 'Light', controlled: false });
      using host = await specimenFixture(variant);
      using rendered = await TestReact.render(<HarnessHost instance={host.instance} />, {
        strict: false,
      });
      await TestReact.act(async () => {
        await host.run();
        await settle();
      });
      const root = () =>
        rendered.container.querySelector(
          '[data-component$=":MyComponent"], [data-component$=":MyCtrl"]',
        );
      expect(root(), 'real specimen subject is mounted').not.to.eql(null);
      expect(root()!.className).not.to.eql('');
      const debug = await host.debug();
      const uncontrolledRoot = root();
      await TestReact.act(async () => {
        host.ctx.host.backgroundColor('#123456');
        host.ctx.subject.backgroundColor('#654321');
        await settle();
        debug.props.debug.value = true;
        if ('controlled' in debug.props) debug.props.controlled.value = true;
        await settle();
      });
      const custom = (await host.controller.info.get()).render.props;
      expect(custom?.host.backgroundColor).to.eql('#123456');
      expect(custom?.subject.backgroundColor).to.eql('#654321');
      if ('controlled' in debug.props) expect(root()).not.to.equal(uncontrolledRoot);
      const lightClass = root()!.className;
      const before = host.redraws.length;
      await TestReact.act(async () => {
        debug.props.theme.value = 'Dark';
        await settle();
      });
      expect(host.redraws.length - before).to.eql(1);
      // Production JSX/style bindings changed through real redraw and debounced props flushing.
      // DOM-emulated class changes are propagation proof, not browser paint equivalence.
      expect(root()!.className).not.to.eql(lightClass);
      expect((await host.controller.info.get()).render.props?.subject.backgroundColor).to.eql(0);
      await TestReact.act(async () => {
        debug.props.theme.value = 'Light';
        await settle();
      });
      expect(root()!.className).to.eql(lightClass);
      if ('controlled' in debug.props) {
        const controlled = debug.props.controlled;
        const controlledRoot = root();
        await TestReact.act(async () => {
          controlled.value = false;
          await settle();
        });
        expect(root()).not.to.eql(null);
        expect(root()).not.to.equal(controlledRoot);
        const identity = debug.props.theme;
        await TestReact.act(async () => {
          debug.reset();
          await settle();
        });
        expect(controlled.value).to.eql(false);
        expect(debug.props.theme).to.equal(identity);
        expect(root()!.className).not.to.eql(lightClass);
      }
    });

    it('retirement during reconnect projection → no later setup, membership, or event-view leak', async () => {
      using storage = storageFixture();
      storage.seed(variant, { debug: false, theme: 'Dark', controlled: false });
      using host = await specimenFixture(variant);
      await host.run();
      const debug = await host.debug();
      await host.controller.reset.fire();
      await settle();
      debug.props.debug.value = true;
      const idle = host.subscriptions;
      const before = host.redraws.length;
      let reset: Promise<Dev.DevResetRes> | undefined;
      using observation = Rx.lifecycle();
      LocalStorage.immutable<Snapshot>(keyFor(variant), {}).events(observation).$.subscribe(() => {
        reset = host.controller.reset.fire();
      });
      const result = await host.init();
      await reset;
      expect(result.error).to.eql(undefined);
      expect(reset).not.to.eql(undefined);
      expect(host.subscriptions).to.eql(idle);
      expect(host.redraws.length).to.eql(before);
      expect(host.ctx.toObject().props.subject.renderer).to.eql(undefined);
      const writes = storage.writes.length;
      debug.props.debug.value = false;
      expect(storage.writes.length).to.eql(writes);
      observation.dispose();
      await host.run();
      const active = host.redraws.length;
      debug.props.debug.value = true;
      expect(host.redraws.length - active).to.eql(1);
    });

    const failures = [
      ['Error', new Error('projection acquisition failed')],
      ['undefined', undefined],
    ] as const;
    for (const [label, failure] of failures) {
      it(`first attachment throws ${label} → release candidate, preserve raw failure, and retry`, async () => {
        using storage = storageFixture();
        storage.seed(variant, { debug: false, theme: 'Dark', controlled: false });
        using projection = projectionFixture(variant);
        const debug = await createDebug(variant);
        expect(projection.count, 'factory creation does not activate persistence').to.eql(0);
        using host = await hostFixture(Spec.describe('projection', () => {}));
        const idle = host.subscriptions;
        projection.fail(failure);
        // TestModel uses error truthiness; prove the thrown value at the attachment boundary.
        let caught = false;
        let error: unknown;
        try {
          debug.attach(host.ctx, {});
        } catch (cause) {
          caught = true;
          error = cause;
        }
        expect(caught).to.eql(true);
        expect(error).to.equal(failure);
        expect(host.subscriptions).to.eql(idle);
        projection.fail();
        const before = projection.count;
        debug.props.debug.value = true;
        expect(projection.count).to.eql(before);
        using attachment = debug.attach(host.ctx, {});
        expect(attachment.disposed).to.eql(false);
        expect(projection.count).to.eql(before + 1);
        attachment.dispose();
        debug.props.debug.value = false;
        expect(projection.count).to.eql(before + 1);
        expect(host.subscriptions).to.eql(idle);
      });
    }

    it('independent suites → separate signals and retirement', async () => {
      using storage = storageFixture();
      storage.seed(variant, { debug: false, theme: 'Dark', controlled: false });
      using a = await specimenFixture(variant);
      await a.run();
      const debug = await a.debug();
      using b = await specimenFixture(variant);
      await b.run();
      const independent = await b.debug();
      expect(independent.props.debug).not.to.equal(debug.props.debug);
      expect(independent.props.theme).not.to.equal(debug.props.theme);
      const before = [a.redraws.length, b.redraws.length];
      debug.props.debug.value = true;
      expect([a.redraws.length - before[0], b.redraws.length - before[1]]).to.eql([1, 0]);
      expect(independent.props.debug.value).to.eql(false);
      a.controller.dispose();
      const retired = a.redraws.length;
      const live = b.redraws.length;
      independent.props.debug.value = true;
      expect(a.redraws.length).to.eql(retired);
      expect(b.redraws.length - live).to.eql(1);
    });

    it('subject setup throws → preserve error and other host; retry without leaked views', async () => {
      using storage = storageFixture();
      storage.seed(variant, { debug: false, theme: 'Dark', controlled: false });
      using a = await specimenFixture(variant);
      await a.run();
      const debug = await a.debug();
      using b = await hostFixture(a.suite);
      const idle = b.subscriptions;
      const original = b.ctx.subject.render;
      const failure = new Error('subject setup failed');
      b.ctx.subject.render = () => {
        throw failure;
      };
      try {
        const result = await b.init();
        expect(result.error).to.equal(failure);
        expect(b.subscriptions).to.eql(idle);
        const counts = [a.redraws.length, b.redraws.length, storage.writes.length];
        debug.props.debug.value = true;
        expect([a.redraws.length - counts[0], b.redraws.length - counts[1]]).to.eql([1, 0]);
        expect(storage.writes.length - counts[2]).to.eql(1);
      } finally {
        b.ctx.subject.render = original;
      }
      await b.run();
      const counts = [a.redraws.length, b.redraws.length];
      debug.props.debug.value = false;
      expect([a.redraws.length - counts[0], b.redraws.length - counts[1]]).to.eql([1, 1]);
    });

    it('malformed stored theme → failed init releases persistence and allows corrected retry', async () => {
      using storage = storageFixture();
      // Storage is unvalidated JSON. Exercise the reachable object-without-is shape.
      storage.seed(variant, Json.parse<Snapshot>('{"debug":false,"theme":{}}')!);
      using host = await specimenFixture(variant);
      // Obtain this suite's retained signals without activating its init handler.
      const controls = host.suite.state.tests.find((test) => test.description === 'ui:debug')!;
      expect((await controls.run({ ctx: host.ctx })).error).to.eql(undefined);
      await settle();
      const debug = await host.debug();
      const idle = host.subscriptions;
      const result = await host.init();
      expect(result.error).to.be.instanceOf(TypeError);
      expect(host.subscriptions).to.eql(idle);
      const writes = storage.writes.length;
      const redraws = host.redraws.length;
      debug.props.theme.value = 'Dark';
      expect(storage.writes.length).to.eql(writes);
      expect(host.redraws.length).to.eql(redraws);
      await host.run();
      expect((await host.debug()).props.theme).to.equal(debug.props.theme);
      const before = host.redraws.length;
      debug.props.debug.value = true;
      expect(host.redraws.length - before).to.eql(1);
    });

    it('physical write failure → cache may advance; unchanged reconnect does not retry', async () => {
      using storage = storageFixture();
      storage.seed(variant, { debug: false, theme: 'Dark', controlled: false });
      using host = await specimenFixture(variant);
      await host.run();
      const debug = await host.debug();
      const bytes = storage.read(variant);
      const failure = new Error('physical storage write failed');
      using errors = errorFixture(failure);
      storage.fail(failure);
      debug.props.debug.value = true;
      await settle();
      expect(errors.errors).to.eql([failure]);
      expect(storage.read(variant)).to.eql(bytes);
      expect(LocalStorage.immutable<Snapshot>(keyFor(variant), {}).current.debug).to.eql(true);
      await host.controller.reset.fire();
      storage.fail();
      const writes = storage.writes.length;
      await host.run();
      expect(storage.writes.length).to.eql(writes);
      expect(storage.read(variant)).to.eql(bytes);
    });

    it('fresh registry → hydrates non-default knobs and preserves serialized bytes', async () => {
      const props: Snapshot = variant === 'plain'
        ? { debug: true, theme: 'Light' }
        : { debug: true, theme: 'Light', controlled: true };
      const bytes = Json.stringify(props);
      expect(await freshStorage({ variant, bytes })).to.eql({ props, bytes });
    });

    it('storage creation fails → factory preserves the original failure', async () => {
      expect(await freshStorage({ variant, failCreation: true })).to.include({ original: true });
    });

    it('connected reset → preserves signal identities and serializes defaults', async () => {
      using storage = storageFixture();
      storage.seed(variant, { debug: true, theme: 'Light', controlled: true });
      using host = await specimenFixture(variant);
      await host.run();
      const debug = await host.debug();
      const signals = { ...debug.props };
      debug.reset();
      expect(debug.props.debug).to.equal(signals.debug);
      expect(debug.props.theme).to.equal(signals.theme);
      const props = Signal.toObject(debug.props);
      expect(props).to.include({ debug: false, theme: 'Dark' });
      if ('controlled' in debug.props) {
        expect(debug.props.controlled).to.equal(
          'controlled' in signals ? signals.controlled : undefined,
        );
        expect(debug.props.controlled.value).to.eql(false);
      }
      expect(Json.parse(storage.read(variant)!)).to.include(props);
    });

    it('last detach → silence until reconnect, where retained signals win a conflicting store', async () => {
      using storage = storageFixture();
      storage.seed(variant, { debug: false, theme: 'Dark', controlled: false });
      using host = await specimenFixture(variant);
      await host.run();
      const debug = await host.debug();
      const signal = debug.props.debug;
      await host.controller.reset.fire();
      const writes = storage.writes.length;
      const redraws = host.redraws.length;
      signal.value = true;
      expect(storage.writes.length).to.eql(writes);
      expect(host.redraws.length).to.eql(redraws);
      const store = LocalStorage.immutable(keyFor(variant), { debug: false, theme: 'Dark' });
      store.change((draft) => {
        draft.debug = false;
        draft.theme = 'Light';
      });
      await host.run();
      expect((await host.debug()).props.debug).to.equal(signal);
      expect(signal.value).to.eql(true);
      expect(store.current).to.include({ debug: true, theme: 'Dark' });
      await host.controller.reset.fire();
      const unchanged = storage.writes.length;
      await host.run();
      expect(storage.writes.length).to.eql(unchanged);
    });
  });
}
