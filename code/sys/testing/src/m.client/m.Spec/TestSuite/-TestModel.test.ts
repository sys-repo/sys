import { type t, Time, describe, expect, it } from '../../-test.ts';
import { DEFAULT } from './common.ts';
import { Test } from './mod.ts';
import { TestModel } from './TestModel.ts';

describe('TestModel', () => {
  const description = 'foo';
  const parent = Test.describe('root');

  describe('model', () => {
    it('id: "Test.<slug>"', () => {
      const model = TestModel({ parent, description });
      expect(model.id.startsWith('Test.')).to.eql(true);
      expect(model.kind).to.eql('Test');
    });

    it('parent', () => {
      const model = TestModel({ parent, description });
      expect(model.parent).to.equal(parent);
    });

    it('description | handler', () => {
      const handler: t.TestHandler = () => null;
      const model1 = TestModel({ parent, description });
      const model2 = TestModel({ parent, description, handler });

      expect(model1.description).to.eql(description);
      expect(model2.description).to.eql(description);

      expect(model1.handler).to.eql(undefined);
      expect(model2.handler).to.eql(handler);
    });

    it('skip | only', () => {
      const model1 = TestModel({ parent, description });
      const model2 = TestModel({ parent, description, modifier: 'skip' });
      const model3 = TestModel({ parent, description, modifier: 'only' });

      expect(model1.modifier).to.eql(undefined);
      expect(model2.modifier).to.eql('skip');
      expect(model3.modifier).to.eql('only');
    });

    it('clone', async () => {
      let count = 0;
      const handler: t.TestHandler = () => count++;
      const model1 = TestModel({ parent, description, handler });
      const model2 = model1.clone();

      expect(model1).to.not.equal(model2); // NB: different instance.
      expect(model1.id).to.not.eql(model2.id);

      // Equivalent everything else.
      expect(model1.handler).to.eql(model2.handler);
      expect(model1.description).to.eql(model2.description);
      expect(model1.parent).to.equal(model2.parent);

      await model1.run();
      expect(count).to.eql(1);

      await model2.run();
      expect(count).to.eql(2);
    });
  });

  describe('run', () => {
    const description = 'my-root';

    it('sync', async () => {
      let count = 0;
      const handler: t.TestHandler = () => count++;
      const test = TestModel({ parent, description, handler });

      const now = Time.now.timestamp;
      const res = await test.run();
      expect(count).to.eql(1);

      expect(res.id).to.eql(test.id);
      expect(res.ok).to.eql(true);
      expect(res.timeout).to.eql(DEFAULT.TIMEOUT);
      expect(res.time.started).to.greaterThanOrEqual(now);
      expect(res.time.elapsed).to.greaterThan(-1);
      expect(res.error).to.eql(undefined);
      expect(res.description).to.eql(description);
      expect(res.excluded).to.eql(undefined);
      expect(res.noop).to.eql(undefined);
    });

    it('async', async () => {
      let count = 0;
      const handler: t.TestHandler = async () => {
        await Time.wait(50);
        count++;
      };
      const test = TestModel({ parent, description, handler });

      const res = await test.run();
      expect(count).to.eql(1);

      expect(res.id).to.eql(test.id);
      expect(res.ok).to.eql(true);
      expect(res.timeout).to.eql(DEFAULT.TIMEOUT);
      expect(res.time.elapsed).to.greaterThan(40); // NB: 10ms window (around 50ms) to prevent test fragility.
      expect(res.error).to.eql(undefined);
    });

    it('unique "tx" identifier for each test run operation', async () => {
      let count = 0;
      const handler: t.TestHandler = () => count++;
      const test = TestModel({ parent, description, handler });

      const res1 = await test.run();
      const res2 = await test.run();

      expect(res1.tx.length).to.greaterThan(0);
      expect(res1.id).to.eql(res2.id); // NB: The same test being run.
      expect(res1.tx).to.not.eql(res2.tx); // NB: Run response ID differs.
    });

    it('handler params: (e)', async () => {
      const args: t.TestHandlerArgs[] = [];
      const handler: t.TestHandler = (e) => args.push(e);
      const test = TestModel({ parent, description, handler });

      await test.run();

      expect(args.length).to.eql(1);
      expect(args[0].id).to.eql(test.id);
      expect(args[0].ctx).to.eql(undefined);
      expect(args[0].description).to.eql(description);
      expect(typeof args[0].timeout).to.eql('function');
    });

    it('with handler params: context (e.ctx)', async () => {
      const args: t.TestHandlerArgs[] = [];
      const handler: t.TestHandler = (e) => args.push(e);
      const test = TestModel({ parent, description, handler });

      const ctx = { foo: 123 };
      await test.run(); // NB: no context.
      await test.run({ ctx });

      expect(args.length).to.eql(2);
      expect(args[0].ctx).to.eql(undefined);
      expect(args[1].ctx).to.eql(ctx);
    });

    it('test throws error', async () => {
      const handler: t.TestHandler = () => {
        throw new Error('Derp');
      };
      const test = TestModel({ parent, description, handler });
      const res = await test.run();
      expect(res.ok).to.eql(false);
      expect(res.error?.message).to.eql('Derp');
    });

    it('no handler', async () => {
      const test = TestModel({ parent, description });
      const res = await test.run();
      expect(res.time.elapsed).to.lessThan(5);
      expect(res.error).to.eql(undefined);
    });

    it('skipped (it.skip modifier)', async () => {
      let count = 0;
      const handler: t.TestHandler = () => count++;

      const test = TestModel({ parent, description, handler, modifier: 'skip' });
      const res = await test.run();

      expect(res.excluded).to.eql(['skip']);
      expect(count).to.eql(0); // NB: test handler not invoked.
    });

    it('excluded (via test.run({ excluded }) parameter)', async () => {
      const test = async (excluded: t.TestModifier[] | undefined) => {
        let count = 0;
        const handler: t.TestHandler = () => count++;

        const testModel = TestModel({ parent, description, handler });
        const res = await testModel.run({ excluded });

        expect(res.excluded).to.eql(excluded);
        expect(count).to.eql(0); // NB: test handler not invoked.
      };

      await test(['only']);
      await test(['skip']);
      await test(['only', 'skip']);
    });

    it('not excluded (empty array parameter)', async () => {
      let count = 0;
      const handler: t.TestHandler = () => count++;

      const testModel = TestModel({ parent, description, handler });
      const res = await testModel.run({ excluded: [] }); // NB: Same as not specifying.

      expect(res.excluded).to.eql(undefined);
      expect(count).to.eql(1);
    });

    it('timeout', async () => {
      const handler: t.TestHandler = async () => await Time.wait(20);
      const test = TestModel({ parent, description, handler });
      const res = await test.run({ timeout: 10 });
      expect(res.timeout).to.eql(10);
      expect(res.error?.message).to.include('Test timed out after 10 msecs');
    });

    it('timeout: custom set within test', async () => {
      const handler: t.TestHandler = async (e) => {
        await Time.wait(5); //  Initial pause (within range)
        e.timeout(30); //       Reset timeout.
        await Time.wait(25); // Wait for most of the new timeout.
      };
      const test = TestModel({ parent, description, handler });
      const res = await test.run({ timeout: 10 });
      expect(res.timeout).to.eql(30);
    });

    it('noop', async () => {
      let count = 0;
      const handler: t.TestHandler = () => count++;
      const test = TestModel({ parent, description, handler });
      const res = await test.run({ noop: true });

      expect(res.ok).to.eql(true);
      expect(res.noop).to.eql(true);
      expect(count).to.eql(0);
      expect(res.time.elapsed).to.greaterThan(-1);
    });
  });
});
