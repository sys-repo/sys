import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { SlcDataCli } from '../mod.ts';

describe(`@tdb/slc-data/cli`, () => {
  it('API', async () => {
    const m = await import('@tdb/slc-data/cli');
    expect(m.SlcDataCli).to.equal(SlcDataCli);
  });
});
