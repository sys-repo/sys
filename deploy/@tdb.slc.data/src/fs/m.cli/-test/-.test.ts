import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { SlcDataCli } from '../mod.ts';
import type { t } from '../common.ts';
import type * as TCli from '@tdb/slc-data/t';

describe(`@tdb/slc-data/cli`, () => {
  it('API', async () => {
    const m = await import('@tdb/slc-data/cli');
    expect(m.SlcDataCli).to.equal(SlcDataCli);
    expectTypeOf({} as t.SlcDataCli.Lib).toEqualTypeOf<TCli.SlcDataCli.Lib>();
  });
});
