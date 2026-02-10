import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Effect, EffectController } from '../mod.ts';

describe(`Effect`, () => {
  it('API', async () => {
    const m = await import('@sys/std/effect');
    expect(m.Effect).to.equal(Effect);
    expect(Effect.Controller).to.equal(EffectController);
  });
});
