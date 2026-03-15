import { describe, expect, it } from '../-test.ts';
import { Jsr, Manifest } from './mod.ts';

describe('@sys/jsr/server', () => {
  it('API', async () => {
    const m = await import('@sys/jsr/server');
    expect(m.Jsr).to.equal(Jsr);
    expect(m.Manifest).to.equal(Manifest);
  });
});
