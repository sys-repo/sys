import { describe, expect, it } from '../../-test.ts';
import { Factory, Plan, Renderer } from '../mod.ts';

describe('(core)', () => {
  it('API', async () => {
    const m1 = await import('@sys/ui-factory');
    const m2 = await import('@sys/ui-factory/core');
    expect(m1.Factory).to.equal(Factory);
    expect(m2.Factory).to.equal(Factory);
    expect(m2.Plan).to.equal(Plan);
    expect(m2.Renderer).to.equal(Renderer);
  });
});
