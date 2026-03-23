import { describe, expect, it } from '../-test.ts';
import { Npm } from './mod.ts';

describe('@sys/registry/npm (server)', () => {
  it('API', async () => {
    const m = await import('@sys/registry/npm/server');
    expect(m.Npm).to.equal(Npm);
  });
});
