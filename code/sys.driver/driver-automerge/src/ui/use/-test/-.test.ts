import { describe, expect, it } from '../../../-test.ts';
import { useDoc, useRev } from '../mod.ts';

describe('Hooks', () => {
  it('API', async () => {
    const m = await import('@sys/driver-automerge/web/ui');
    expect(m.useDoc).to.equal(useDoc);
    expect(m.useRev).to.equal(useRev);
  });
});
