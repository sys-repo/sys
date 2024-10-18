import { TestSample, describe, expect, it } from '../-test.ts';
import { Is, Time, type t } from '../common.ts';
import { Spec } from './mod.ts';

describe('Spec', () => {
  describe('Spec.ctx(e)', () => {
    it('retrieve {ctx} from test args', async () => {
      const { ctx, dispose } = await TestSample.context();
      expect(typeof ctx.subject.render).to.eql('function');
      expect(typeof ctx.toObject).to.eql('function');
      dispose();
    });

    it('throw', () => {
      const fn = () => Spec.ctx({} as any);
      expect(fn).to.throw(/Expected a {ctx} object/);
    });
  });

  describe('Spec.once(e, () => ...)', () => {
    it('passes and returns {ctx}', async () => {
      const { events } = TestSample.controller();

      let _resCtx: t.DevCtx | undefined;
      let _paramCtx: t.DevCtx | undefined;

      const root = Spec.describe('root', (e) => {
        e.it('foo', async (e) => {
          _resCtx = await Spec.once(e, (ctx) => (_paramCtx = ctx));
        });
      });

      await events.load.fire(root);
      await events.run.fire();

      expect(_resCtx).to.eql(_paramCtx);
      Is.ctx(_resCtx);
      Is.ctx(_paramCtx);

      events.dispose();
    });

    it('runs initial (sync)', async () => {
      const { events } = TestSample.controller();

      let _every = 0;
      let _initial = 0;

      const root = Spec.describe('root', (e) => {
        e.it('foo', (e) => {
          _every++;
          Spec.once(e, (_ctx) => _initial++);
        });
      });

      await events.load.fire(root);
      await events.run.fire();

      expect(_initial).to.eql(1);
      expect(_every).to.eql(1);

      await events.run.fire();
      await events.run.fire();
      await events.run.fire();

      expect(_initial).to.eql(1); // NB: no change.
      expect(_every).to.eql(4);

      events.dispose();
    });

    it('runs initial (async)', async () => {
      const { events } = TestSample.controller();

      let _every = 0;
      let _initial = 0;

      const root = Spec.describe('root', (e) => {
        e.it('foo', (e) => {
          _every++;
          return Spec.once(e, async (_ctx) => {
            await Time.delay(10);
            _initial++;
          });
        });
      });

      await events.load.fire(root);
      await events.run.fire();

      expect(_initial).to.eql(1);
      expect(_every).to.eql(1);

      await events.run.fire();
      await events.run.fire();
      await events.run.fire();

      expect(_initial).to.eql(1); // NB: no change.
      expect(_every).to.eql(4);

      events.dispose();
    });
  });

  describe('Wrangle', () => {
    const Wrangle = Spec.Wrangle;

    describe('Wrangle.ctx', () => {
      it('from ctx (already), pass-through', async () => {
        const { ctx, dispose } = await TestSample.context();
        expect(Wrangle.ctx(ctx)).to.equal(ctx);
        dispose();
      });

      it('from test args ("it")', async () => {
        const { ctx, dispose } = await TestSample.context();

        let _testArgs: t.TestHandlerArgs;
        const suite = Spec.describe('MySuite', (e) => {
          e.it('MyTest', (e) => (_testArgs = e));
        });
        await suite.run({ ctx });

        expect(Wrangle.ctx(suite)).to.eql(undefined); // NB: No match on a suite.

        const res = Wrangle.ctx(_testArgs!);
        expect(res).to.equal(ctx);

        dispose();
      });

      it('no match (throw: true/false)', () => {
        const INVALID = [undefined, null, {}, [], true, 123, 'a', () => null];
        INVALID.forEach((value) => {
          const fn = () => Wrangle.ctx(value, { throw: true });
          expect(fn).to.throw(/Expected a {ctx}/);
          expect(Wrangle.ctx(value)).to.eql(undefined);
        });
      });
    });
  });
});
