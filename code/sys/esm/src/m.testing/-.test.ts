import { describe, expect, it } from '../-test.ts';
import { EsmAssert } from './mod.ts';

describe(`@sys/esm/testing`, () => {
  it('API', async () => {
    const m = await import('@sys/esm/testing');
    expect(m.EsmAssert).to.equal(EsmAssert);
  });
});
