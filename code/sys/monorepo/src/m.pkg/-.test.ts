import { describe, expect, expectTypeOf, it } from '../-test.ts';
import { MonorepoPkg } from './mod.ts';

describe(`Monorepo.Pkg`, () => {
  it('API', async () => {
    const m = await import('@sys/monorepo/pkg');
    expect(m.MonorepoPkg).to.equal(MonorepoPkg);
  });
});
