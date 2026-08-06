import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Dist, DistServer } from '../mod.ts';

describe('@sys/server/dist', () => {
  it('API', async () => {
    const m = await import('@sys/server/dist');

    expect(m.Dist).to.equal(Dist);
    expect(m.DistServer).to.equal(DistServer);
    expect(Object.keys(m)).to.eql(['Dist', 'DistServer']);
    expect(Object.keys(Dist)).to.eql(['materialize']);
    expect(Object.keys(DistServer)).to.eql(['start', 'Error']);
    expect(Object.isFrozen(Dist)).to.eql(true);
    expectTypeOf(Dist).toEqualTypeOf<t.Dist.Lib>();
    expectTypeOf(DistServer).toEqualTypeOf<t.DistServer.Lib>();
  });
});
