import { describe, expect, it, Test } from '../../-test.ts';
import { Loader, type t } from '../mod.ts';

describe('Loader.load', () => {
  it('no params → uses default suite', async () => {
    const defaultSuite = Test.describe('default');
    const load = Loader.load(async () => ({ default: defaultSuite }));
    const mod = await load();

    expect(mod.default).to.equal(defaultSuite);
  });

  it('params + createSpec → materializes suite', async () => {
    const defaultSuite = Test.describe('default');
    const createdSuite = Test.describe('created');
    let called = 0;
    let last: { count: number } | undefined;

    const load = Loader.load(
      async () => ({
        default: defaultSuite,
        createSpec(params: { count: number }) {
          called++;
          last = params;
          return createdSuite;
        },
      }),
      { count: 123 },
    );
    const mod = await load();

    expect(mod.default).to.equal(createdSuite);
    expect(called).to.eql(1);
    expect(last).to.eql({ count: 123 });
  });

  it('no params + createSpec only → materializes suite', async () => {
    const createdSuite = Test.describe('created');
    let called = 0;

    const load = Loader.load(async () => ({
      createSpec(_params: void) {
        called++;
        return createdSuite;
      },
    }));
    const mod = await load();

    expect(mod.default).to.equal(createdSuite);
    expect(called).to.eql(1);
  });

  it('no params + default + createSpec → prefers default suite', async () => {
    const defaultSuite = Test.describe('default');
    const createdSuite = Test.describe('created');
    let called = 0;

    const load = Loader.load(async () => ({
      default: defaultSuite,
      createSpec(_params: void) {
        called++;
        return createdSuite;
      },
    }));
    const mod = await load();

    expect(mod.default).to.equal(defaultSuite);
    expect(called).to.eql(0);
  });

  it('params + no createSpec → throws', async () => {
    const from: t.Loader.ModuleLoader<{ count: number }> = async () => ({
      default: Test.describe('default'),
    });
    const load = Loader.load(from, { count: 1 });

    try {
      await load();
      throw new Error('Expected Loader.load to throw.');
    } catch (err) {
      expect((err as Error).message).to.eql(
        'Expected module to export { createSpec } when params were provided.',
      );
    }
  });

  it('no params + no default + no createSpec → throws', async () => {
    const load = Loader.load(async () => ({}));

    try {
      await load();
      throw new Error('Expected Loader.load to throw.');
    } catch (err) {
      expect((err as Error).message).to.eql(
        'Expected module to export { default } or { createSpec }.',
      );
    }
  });
});
