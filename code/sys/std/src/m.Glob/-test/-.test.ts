import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Glob } from '../mod.ts';

describe('Glob', () => {
  it('API', async () => {
    const m = await import('@sys/std/glob');
    expect(m.Glob).to.eql(Glob);
    expectTypeOf(Glob).toEqualTypeOf<t.Glob.Lib>();
  });
});
