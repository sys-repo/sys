import { describe, expect, it } from '../../-test.ts';
import { HostAdapter, renderPlan } from '../mod.ts';

describe('React Adapter', () => {
  it('API', async () => {
    const m = await import('@sys/ui-factory/react');
    expect(m.HostAdapter).to.equal(HostAdapter);
    expect(m.renderPlan).to.equal(renderPlan);
  });
});
