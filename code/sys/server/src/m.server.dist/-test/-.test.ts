import type { ServerDist } from '@sys/server/t';
import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Dist } from '../mod.ts';

describe('Dist', () => {
  it('API', async () => {
    const m = await import('@sys/server/dist');

    expect(m.Dist).to.equal(Dist);
    expect(Object.keys(m)).to.eql(['Dist']);
    expect(Object.isFrozen(Dist)).to.eql(true);
    expectTypeOf(Dist).toEqualTypeOf<ServerDist.Lib>();
  });
});
