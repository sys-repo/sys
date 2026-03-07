import { describe, expect, it } from '../../../-test.ts';
import { Obj, StdEffectController } from '../common.ts';
import { EffectController, useEffectController } from '../mod.ts';

describe(`EffectController`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react/effect');
    expect(m.useEffectController).to.equal(useEffectController);
    expect(m.EffectController).to.equal(EffectController);
    expect(EffectController.useEffectController).to.equal(useEffectController);

    for (const [key, fn] of Obj.entries(StdEffectController)) {
      expect(EffectController[key]).to.equal(fn);
    }
  });
});
