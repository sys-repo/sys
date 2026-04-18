import { expectTypeOf } from '@sys/std/testing';
import { describe, expect, it } from '../../-test.ts';
import type { t as TRoot } from '../../mod.ts';
import { Loader, type t } from '../mod.ts';

describe(`@sys/ui-react-devharness/spec`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-devharness/spec');
    expect(m.Loader).to.equal(Loader);
  });

  it('types', () => {
    expectTypeOf(Loader).toEqualTypeOf<t.Loader.Lib>();
    expectTypeOf(Loader.load).toEqualTypeOf<t.Loader.Load>();
    expectTypeOf(Loader.load).toEqualTypeOf<TRoot.DevSpec.Loader.Load>();
  });
});
