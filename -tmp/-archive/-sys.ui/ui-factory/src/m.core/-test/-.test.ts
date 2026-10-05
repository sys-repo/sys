import { describe, expect, it } from '../../-test.ts';
import { Factory, Plan, Renderer } from '../mod.ts';

describe('(core)', () => {
  it('API', async () => {
    const core = await import('@sys/ui-factory/core');
    expect(core.Factory).to.equal(Factory);
    expect(core.Plan).to.equal(Plan);
    expect(core.Renderer).to.equal(Renderer);
  });
});
