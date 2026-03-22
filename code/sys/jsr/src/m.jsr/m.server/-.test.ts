import { describe, expect, it } from '../-test.ts';
import { Jsr, Manifest } from './mod.ts';

describe('@sys/registry/jsr (server)', () => {
  it('API', async () => {
    const m = await import('@sys/registry/jsr/server');
    expect(m.Jsr).to.equal(Jsr);
    expect(m.Manifest).to.equal(Manifest);
  });
});
