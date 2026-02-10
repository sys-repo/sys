import { describe, expect, it } from '../../-test.ts';
import { EffectController, useEffectController } from '../mod.ts';

describe(`EffectController`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react/effect');
    expect(m.Effect.Controller).to.equal(EffectController);
    expect(m.Effect.useEffectController).to.equal(useEffectController);
  });
});
