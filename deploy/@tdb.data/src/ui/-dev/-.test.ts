import type { t as TDev } from '@tdb/data/slug/ui/dev';
import type * as TDevSubpath from '@tdb/data/slug/ui/dev/t';
import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { HttpDataCards } from './mod.ts';

describe('@tdb/data/slug/ui/dev', () => {
  it('API', async () => {
    const m = await import('@tdb/data/slug/ui/dev');
    expect(m.HttpDataCards).to.equal(HttpDataCards);
  });

  it('types', () => {
    expectTypeOf({} as TDev.HttpDataCards.Lib).toEqualTypeOf<TDevSubpath.HttpDataCards.Lib>();
    expectTypeOf(HttpDataCards.Spec.load).toEqualTypeOf<TDev.HttpDataCards.Lib['Spec']['load']>();
  });
});
