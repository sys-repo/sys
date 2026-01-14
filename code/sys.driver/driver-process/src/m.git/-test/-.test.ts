import { describe, expect, it } from '../../-test.ts';
import { Git } from '../mod.ts';

describe(`Process: Git`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-process/git');
    expect(m.Git).to.equal(Git);
  });
});
