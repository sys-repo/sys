import { describe, expect, it } from '../-test.ts';
import { pkg } from '../pkg.ts';

describe('@sys/registry', () => {
  it('API', async () => {
    const m = await import('@sys/registry');
    expect(m.pkg).to.equal(pkg);
  });
});
