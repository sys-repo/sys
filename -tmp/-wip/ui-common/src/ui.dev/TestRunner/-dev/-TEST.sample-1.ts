import { Dev, Time, Wrangle, expect } from './-common';

/**
 * Default export.
 */
export default Dev.describe('Sample-1', (e) => {
  e.it('foo', async (e) => {
    const ctx = Wrangle.ctx(e);
    await Time.wait(ctx.delay);
    expect(123).to.eql(123);
  });

  e.it('bar', async (e) => {
    const ctx = Wrangle.ctx(e);
    if (ctx.fail) expect(123).to.eql('BOO');
  });

  e.it.skip('skipped test', async (e) => {});
  e.it(`TODO: ${Dev.Lorem.toString()}`, async (e) => {});
  e.it(`TODO: short`, async (e) => {});

  e.describe.skip('skipped suite', (e) => {
    e.describe('child suite', (e) => {
      e.it('hello', async (e) => {});
    });
  });

  e.describe('child', (e) => {
    e.it('foo', async (e) => {});
    e.it.skip('bar', async (e) => {});
  });
});

/**
 * Named export.
 */
export const MySpec = Dev.describe('MySpec', (e) => {
  e.it('foo', async (e) => {});
});
