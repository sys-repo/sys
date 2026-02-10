import { describe, expect, it } from '../../-test.ts';
import { EffectController } from '../mod.ts';

describe(`EffectController`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react/effect');
    expect(m.Effect.Controller).to.equal(EffectController);
  });
});
