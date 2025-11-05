import { describe, expect, it } from '../../-test.ts';
import { Foo } from '../mod.ts';

describe(`Immutable: web-worker (bridge)`, () => {
  it('API', async () => {
    const m = await import('@sys/immutable/worker');
    expect(m.Foo).to.equal(Foo);
  });
});
