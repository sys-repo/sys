import { type t, describe, it, expect, c } from '../../-test.ts';

describe('Hooks', () => {
  it('imports', async () => {
    const m = await import('./mod.ts');
    console.info(c.brightGreen('(Hooks) Module:'));
    console.info({ ...m });

    expect(typeof m.useKeyboard == 'function').to.be.true;
  });
});
