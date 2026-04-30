import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { CellCli } from '../mod.ts';

describe(`@sys/cell/cli`, () => {
  it('API', async () => {
    const m = await import('@sys/cell/cli');
    expect(m.CellCli).to.equal(CellCli);
  });
});
