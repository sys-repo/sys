import { describe, expect, it } from '../../-test.ts';
import { Obj, StdEffectController } from '../common.ts';
import { EffectController } from '../mod.ts';

describe(`EffectController`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-react');
    const mm = await import('@sys/ui-react/effect');

    expect(m.EffectController).to.equal(EffectController);
    expect(mm.EffectController).to.equal(EffectController);

    for (const [key, fn] of Obj.entries(StdEffectController)) {
      expect(EffectController[key]).to.equal(fn);
    }
  });
});
