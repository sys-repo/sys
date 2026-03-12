import { describe, expect, it } from '../../-test.ts';
import { MonorepoInfo } from '../mod.ts';

describe(`Monorepo.Info`, () => {
  it('API', async () => {
    const m = await import('@sys/monorepo/info');
    expect(m.MonorepoInfo).to.equal(MonorepoInfo);
  });
});
