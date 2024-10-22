import { SAMPLES, Test, TestSample, Time, describe, expect, it, type t } from '../-test.ts';
import { Spec } from '../mod.ts';
import { DevBus } from './mod.ts';
import { DevEventsIs } from './Bus.Events.ts';

const exepctSessionId = (value: string) => expect(value).to.match(/^dev:ctx\./);

describe.skip('DevBus', () => {
  describe('is', () => {
    const is = DevEventsIs;

    it('is (static/instance)', () => {
      const instance = TestSample.instance();
      const events = DevBus.Events({ instance });
      expect(events.is).to.equal(is);
    });

    it('is.base', () => {
      const test = (type: string, expected: boolean) => {
        expect(is.base({ type, payload: {} })).to.eql(expected);
      };
      test('foo', false);
      test('sys.dev/', true);
    });

    it('is.instance', () => {
      const type = 'sys.dev/';
      expect(is.instance({ type, payload: { instance: 'abc' } }, 'abc')).to.eql(true);
      expect(is.instance({ type, payload: { instance: 'abc' } }, '123')).to.eql(false);
      expect(is.instance({ type: 'foo', payload: { instance: 'abc' } }, 'abc')).to.eql(false);
    });
  });

  describe('Controller/Events', () => {
    it('dispose', () => {
      const instance = TestSample.instance();
      const events = DevBus.Controller({ instance });
      expect(events.disposed).to.eql(false);

      events.dispose();
      events.dispose();
      expect(events.disposed).to.eql(true);
    });

    it('dispose (implicit attaching to dispose$)', async () => {
      const { dispose, ctx } = await TestSample.context();
      const events = DevBus.events(ctx);

      let fired = 0;
      events.dispose$.subscribe(() => fired++);

      dispose();
      dispose();
      expect(fired).to.eql(1);
    });

    describe('info', () => {
      it('fire (read)', async () => {
        const instance = TestSample.instance();
        const events = DevBus.Controller({ instance });

        const res = await events.info.fire();
        const info = res.info!;

        expect(res.instance).to.eql(instance.id);
        expect(info.spec).to.eql(undefined);

        expect(info.instance.kind).to.eql('dev:harness');
        expect(info.instance.bus).to.match(/^bus\./);
        exepctSessionId(info.instance.session);

        events.dispose();
      });

      it('get', async () => {
        const instance = TestSample.instance();
        const events = DevBus.Controller({ instance });
        const info1 = await events.info.get();
        const info2 = await events.info.get();

        expect(info1.run.count).to.eql(0);
        expect(info1).to.eql(info2);
        expect(info1).to.not.equal(info2);

        events.dispose();
      });

      it('{env}', async () => {
        const env = { foo: 123 };
        const events1 = DevBus.Controller({ instance: TestSample.instance(), env });
        const events2 = DevBus.Controller({ instance: TestSample.instance() });
        expect((await events1.info.get()).env).to.eql(env);
        expect((await events2.info.get()).env).to.eql(undefined);
        events1.dispose();
        events2.dispose();
      });
    });

    describe('ctx (get)', () => {
      it('fire (read)', async () => {
        const { events } = await TestSample.controller();
        const res = await events.ctx.fire();
        expect(res.ctx?.toObject().instance.id).to.eql(events.instance.id);
        events.dispose();
      });

      it('get', async () => {
        const { events } = await TestSample.controller();
        const ctx = await events.ctx.get();
        expect(ctx.toObject().instance.id).to.eql(events.instance.id);
        events.dispose();
      });
    });

    describe('load', () => {
      it('load (import bundle)', async () => {
        const instance = TestSample.instance();
        const events = DevBus.Controller({ instance });

        const fired: t.DevInfoChanged[] = [];
        events.info.changed$.subscribe((e) => fired.push(e));

        const res = await events.load.fire(SAMPLES.Sample1);
        const root = await Test.bundle(SAMPLES.Sample1);

        expect(res.error).to.eql(undefined);
        expect(res.info?.spec).to.not.eql(undefined);
        expect(res.info?.spec).to.eql(root);

        const info = await events.info.get();
        expect(info.spec).to.eql(root);

        expect(fired.length).to.eql(3);

        expect(fired[0].message).to.eql('reset');
        expect(fired[0].info.spec).to.eql(undefined);

        expect(fired[1].message).to.eql('context:init');
        expect(fired[1].info.spec).to.eql(undefined);

        expect(fired[2].message).to.eql('spec:load');
        expect(fired[2].info.spec).to.eql(info.spec);

        events.dispose();
      });

      it('load (direct spec)', async () => {
        const instance = TestSample.instance();
        const events = DevBus.Controller({ instance });

        const { root } = await SAMPLES.Sample1;
        const res = await events.load.fire(root);
        const info = await events.info.get();

        expect(res.error).to.eql(undefined);
        expect(res.info?.spec).to.not.eql(undefined);
        expect(res.info?.spec).to.eql(root);

        expect(info.spec).to.eql(root);

        events.dispose();
      });

      it('load with {env}', async () => {
        const instance = TestSample.instance();
        const env = { foo: 123, fn: () => '👋' };
        const events = DevBus.Controller({ instance, env });

        const ctx = await events.ctx.get();
        expect(ctx.env).to.eql(env);
        expect((ctx.env as typeof env).fn()).to.eql('👋');

        events.dispose();
      });

      it('render context changes between load/reset', async () => {
        const { events } = await TestSample.controller();

        const getId = async () => (await events.info.get()).instance.session;

        const id1 = await getId();

        await events.load.fire(SAMPLES.Sample1);
        const id2 = await getId();

        await events.run.fire();
        const id3 = await getId();

        await events.run.fire(); // NB: Second run
        const id4 = await getId();

        await events.reset.fire();
        const id5 = await getId();

        await events.load.fire(SAMPLES.Sample1);
        await events.run.fire();
        await events.run.fire();
        await events.run.fire();
        const id6 = await getId();

        exepctSessionId(id1);

        expect(id2).to.not.eql(id1);
        exepctSessionId(id2);

        expect(id3).to.eql(id2);
        expect(id4).to.eql(id3);

        expect(id5).to.not.eql(id4);
        exepctSessionId(id5);

        expect(id6).to.not.eql(id5);
        exepctSessionId(id6);

        events.dispose();
      });
    });

    describe('run', () => {
      it('run', async () => {
        const { events } = await TestSample.preloaded();

        const info1 = (await events.run.fire()).info;
        const info2 = (await events.run.fire()).info;
        const info3 = (await events.run.fire()).info;

        expect(info1?.run.count).to.eql(1);
        expect(info2?.run.count).to.eql(2);
        expect(info3?.run.count).to.eql(3);

        expect(info3?.run?.results?.description).to.eql('MySample');
        expect(info3?.render.props?.subject.backgroundColor).to.eql(1);

        events.dispose();
      });

      it('run: suite not loaded', async () => {
        const { events } = await TestSample.controller();

        const info1 = (await events.run.fire()).info;
        expect(info1?.run.count).to.eql(0);
        expect(info1?.run.results).to.eql(undefined);
        expect(info1?.render.props).to.eql(undefined);

        events.dispose();
      });

      it('run: { ctx.isInitial } flag', async () => {
        const { Wrapper } = await SAMPLES.Sample2;
        const sample = Wrapper();
        const { events } = await TestSample.controller();

        await sample.root.init();
        await events.load.fire(sample.root);

        await events.run.fire();
        expect(sample.log.items.every(({ ctx }) => ctx.run.is.initial)).to.eql(true);

        sample.log.reset();

        await events.run.fire();
        expect(sample.log.items.every(({ ctx }) => ctx.run.is.initial)).to.eql(false);

        events.dispose();
      });
    });

    describe('run ({ only } specific specs)', () => {
      it('target single spec (from initial run)', async () => {
        const { Wrapper } = await SAMPLES.Sample2;
        const sample = Wrapper();
        const { events } = await TestSample.controller();

        await sample.root.init();
        await events.load.fire(sample.root);
        expect(sample.log.count).to.eql(0);

        /**
         * TODO 🐷
         *
         * - Details on ctx:
         *    - parent
         *    - siblings ("its" and "describes")
         */

        const info1 = await events.info.get();
        expect(info1.render.props).to.not.exist;

        const root = info1.spec;
        const test1 = root?.state.tests[0];
        const test2 = root?.state.tests[1];
        expect(test1).to.exist;
        expect(test2).to.exist;

        /**
         * Run for the first time with a target ("filter on subset") value provided.
         * There is no prior context.
         * All tests should run.
         */
        await events.run.fire({ only: test1?.id });

        const info2 = await events.info.get();
        expect(info2.instance.session).to.eql(info1.instance.session);
        expect(info2.render.props).to.exist;
        expect(info2.run.count).to.eql(1);
        expect(sample.log.count).to.eql(1);
        expect(sample.log.items[0].args.description).to.eql('init');

        sample.log.reset();

        /**
         * Run for a second time, the context (instance state) should NOT change
         * when a target ("filter on subset") is used.
         */
        await events.run.fire({ only: [test2?.id] as string[] });
        const info3 = await events.info.get();
        expect(info3.instance.session).to.eql(info2.instance.session);
        expect(info3.run.count).to.eql(2);
        expect(sample.log.count).to.eql(1);
        expect(sample.log.items[0].args.description).to.eql('foo-1');

        sample.log.reset();

        /**
         * Run for a third time, but with NO target ("filter on subset") value provided.
         * Again, the context (instance state) is NOT CHANGED.
         */
        await events.run.fire({});
        const info4 = await events.info.get();
        expect(info4.instance.session).to.eql(info3.instance.session); // NB: No change to the context (instance/state).
        expect(info4.run.count).to.eql(3);
        expect(sample.log.count).to.eql(3);
        expect(sample.log.items.map((e) => e.args.description)).to.eql(['init', 'foo-1', 'foo-2']);

        events.dispose();
      });

      it('reset (session context/state)', async () => {
        const { events } = await TestSample.preloaded();

        /**
         * No change to context/state.
         */
        await events.run.fire({});
        const info1 = await events.info.get();

        await events.run.fire({});
        const info2 = await events.info.get();
        expect(info2.instance.session).to.eql(info1.instance.session); // NB: No change to the context (instance/state).

        events.reset.fire();

        // NB: instances changed.
        const info3 = await events.info.get();
        expect(info3.instance.session).to.not.eql(info2.instance.session); // NB: New session ID created.

        events.dispose();
      });
    });

    describe('ctx.run', () => {
      it('ctx.run()', async () => {
        const { events } = await TestSample.controller();

        const root = Spec.describe('root', (e) => {
          e.it('foo', async (e) =>
            Spec.once(e, (ctx) => {
              Time.delay(10, () => ctx.run()); // NB: Simulate a "re-run" activated by say a UI click handler.
            }),
          );
        });

        await events.load.fire(root);
        const res = await events.run.fire();
        expect(res.info?.run.count).to.eql(1);

        await Time.wait(30);
        const info = await events.info.get();
        expect(info.run.count).to.eql(2);

        events.dispose();
      });

      it('ctx.run({ reset })', async () => {
        const { events } = await TestSample.controller();

        const root = Spec.describe('root', (e) => {
          e.it('foo', async (e) => {
            Spec.once(e, (ctx) => {
              Time.delay(10, () => ctx.run({ reset: true })); // NB: Simulate a "re-run" activated by say a UI click handler.
            });
          });
        });

        await events.load.fire(root);
        await events.run.fire();
        await events.run.fire();

        const info1 = await events.info.get();
        expect(info1?.run.count).to.eql(2);

        await Time.wait(30);
        const info2 = await events.info.get();
        expect(info2.run.count).to.eql(1);

        events.dispose();
      });

      it('ctx.isInitial', async () => {
        const { events } = await TestSample.controller();
        const log: boolean[] = [];
        const root = Spec.describe('root', (e) => {
          e.it('foo', async (e) => {
            const ctx = Spec.ctx(e);
            log.push(ctx.is.initial);
          });
        });

        await events.load.fire(root);
        await events.run.fire();
        await events.run.fire();
        await events.run.fire();

        expect(log.length).to.eql(3);

        expect(log[0]).to.eql(true);
        expect(log[1]).to.eql(false);
        expect(log[2]).to.eql(false);

        events.dispose();
      });
    });

    describe('reset', () => {
      it('reset clears props', async () => {
        const { events } = await TestSample.preloaded();

        const info1 = (await events.run.fire()).info;
        expect(info1?.run.count).to.eql(1);
        expect(info1?.run.results).to.not.eql(undefined);

        await events.reset.fire();

        const info2 = await events.info.get();
        expect(info2?.run).to.eql({ count: 0 });
        expect(info2?.run.results).to.eql(undefined);
        expect(info2?.render.props).to.eql(undefined);

        events.dispose();
      });
    });

    describe('context:state (read/write)', () => {
      type T = { msg?: string; count: number };

      it('write state (fn)', async () => {
        const { events } = await TestSample.preloaded();
        const info1 = await events.info.get();
        expect(info1.render.state).to.eql(undefined);
        expect(info1.render.revision.state).to.eql(0);

        let _initial: T | undefined;

        await events.state.change.fire<T>({ count: 0 }, (draft) => {
          _initial = { ...draft };
          draft.msg = 'hello';
          draft.count++;
        });

        const info2 = await events.info.get();
        expect(_initial).to.eql({ count: 0 });
        expect(info2.render.state).to.eql({ count: 1, msg: 'hello' });
        expect(info2.render.revision.state).to.eql(1);

        events.dispose();
      });

      it('write {object} (replace)', async () => {
        const { events } = await TestSample.preloaded();
        const info1 = await events.info.get();
        expect(info1.render.state).to.eql(undefined);
        expect(info1.render.revision.state).to.eql(0);

        const initial: T = { count: 0 };
        const replace: T = { count: 1234 };
        await events.state.change.fire<T>(initial, replace);

        const info2 = await events.info.get();
        expect(info2.render.state).to.eql(replace);
        expect(info2.render.state).to.not.equal(replace); // NB: Immutable replacement.
        expect(info2.render.revision.state).to.eql(1);

        events.dispose();
      });

      it('reset state', async () => {
        const { events } = await TestSample.preloaded();

        const initial: T = { count: 0 };
        await events.state.change.fire<T>(initial, (draft) => draft.count++);
        const info1 = await events.info.get();
        expect(info1.render.state).to.eql({ count: 1 });

        await events.reset.fire();

        const info2 = await events.info.get();
        expect(info2.render.state).to.eql(undefined);

        events.dispose();
      });

      it('state object (API)', async () => {
        type T = { count: number };
        const { events } = await TestSample.preloaded();

        const initial: T = { count: 0 };
        const state = events.state.object(initial);

        const info1 = await events.info.get();
        expect(state.current.count).to.eql(0);
        expect(info1.render.state).to.eql(undefined);

        await state.change((draft) => draft.count++);

        const info2 = await events.info.get();
        expect(state.current.count).to.eql(1);
        expect(info2.render.state).to.eql({ count: 1 });

        events.dispose();
      });
    });

    describe('context:props (read/write)', () => {
      it('write props', async () => {
        const { events } = await TestSample.preloaded();
        const info1 = await events.info.get();
        expect(info1.render.props).to.eql(undefined);
        expect(info1.render.revision.props).to.eql(0);

        await events.props.change.fire((draft) => {
          draft.subject.backgroundColor = -0.3;
        });

        const info2 = await events.info.get();
        expect(info2.render.props?.subject.backgroundColor).to.eql(-0.3);
        expect(info2.render.revision.props).to.eql(1);

        events.dispose();
      });

      it('props.changed$', async () => {
        const { events } = await TestSample.preloaded();

        const fired: t.DevInfoChanged[] = [];
        events.props.changed$.subscribe((e) => fired.push(e));

        type T = { count: number };
        events.state.change.fire<T>({ count: 0 }, (draft) => draft.count++);
        expect(fired).to.eql([]); // NB: State changes does not trigger the props.

        await events.props.change.fire((draft) => (draft.host.backgroundColor = -1));
        expect(fired.length).to.eql(1);
        expect(fired[0].message === 'props:write').to.eql(true);

        const { Wrapper } = await SAMPLES.Sample2;
        const sample = Wrapper();
        await events.load.fire(sample.root);

        expect(fired.length).to.eql(2);
        expect(fired[1].message === 'reset').to.eql(true);

        await events.reset.fire();
        expect(fired.length).to.eql(3);
        expect(fired[2].message === 'reset').to.eql(true);

        events.dispose();
      });
    });
  });
});
