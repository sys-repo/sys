import { describe, expect, it } from '../-test.ts';
import { WorkspaceCi } from './mod.ts';

describe(`@sys/workspace/ci`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/ci');
    expect(m.WorkspaceCi).to.equal(WorkspaceCi);
    expect(m.WorkspaceCi.Jsr).to.equal(WorkspaceCi.Jsr);
    expect(m.WorkspaceCi.Build).to.equal(WorkspaceCi.Build);
    expect(m.WorkspaceCi.Test).to.equal(WorkspaceCi.Test);
  });
});
