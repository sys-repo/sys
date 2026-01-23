import { type t, describe, it, expect, expectTypeOf } from '../../-test.ts';
import { EffectController } from '../mod.ts';

describe('EffectController', () => {
  it('API', async () => {
    const m = await import('@sys/std/effect');
    expect(m.EffectController).to.equal(EffectController);
  });
});
