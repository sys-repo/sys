import { describe, expect, it } from '../../../-test.ts';

import { A, Anchor } from '../mod.ts';

describe('Anchor', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.A).to.equal(A);
    expect(m.Anchor).to.equal(Anchor);
    expect(m.Anchor.UI).to.equal(A);
  });
});
