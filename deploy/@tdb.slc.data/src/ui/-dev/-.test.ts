import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { HttpDataCards } from './mod.ts';
import type { t as TDev } from '@tdb/slc-data/dev';
import type * as TDevSubpath from '@tdb/slc-data/dev/t';

describe('@tdb/slc-data/dev', () => {
  it('API', async () => {
    const m = await import('@tdb/slc-data/dev');
    expect(m.HttpDataCards).to.equal(HttpDataCards);
  });

  it('types', () => {
    expectTypeOf({} as TDev.HttpDataCards.Lib).toEqualTypeOf<TDevSubpath.HttpDataCards.Lib>();
  });
});
