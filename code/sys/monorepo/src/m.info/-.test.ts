import { describe, expect, Fs, it, Testing } from '../-test.ts';
import { MonorepoInfo } from './mod.ts';

describe(`Monorepo.Pkg`, () => {
  it('API', async () => {
    const m = await import('@sys/monorepo/info');
    expect(m.MonorepoInfo).to.equal(MonorepoInfo);
  });
});
