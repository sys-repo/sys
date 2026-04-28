import { describe, expect, it } from '../../-test.ts';
import { Cell } from '../mod.ts';

describe(`Cell`, () => {
  it('API', async () => {
    const m = await import('@sys/cell');
    expect(m.Cell).to.equal(Cell);
    expect(m.Cell.Schema).to.equal(Cell.Schema);
  });
});
