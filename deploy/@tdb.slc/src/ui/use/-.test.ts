import { type t, describe, it, expect } from '../../-test.ts';

describe('Landing', () => {
  it('imports', async () => {
    const m = await import('./mod.ts');
    console.info('Landing:', m);

    expect(typeof m.useKeyboard == 'function').to.be.true;
  });
});
