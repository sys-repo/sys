import { describe, expect, it } from '../-test.ts';
import { ReactHostAdapter, ReactPlanView } from './mod.ts';

describe('factory: react (adapter)', () => {
  it('API', async () => {
    const m = await import('@sys/ui-factory/react');
    expect(m.ReactPlanView).to.equal(ReactPlanView);
    expect(m.ReactHostAdapter).to.equal(ReactHostAdapter);
  });
});
