import { describe, expect, it } from '../-test.ts';
import { Immutable } from './mod.ts';

describe(`Immutable: rfc6902 (patch standard)`, () => {
  it('API', async () => {
    const rfc6902 = await import('@sys/immutable/rfc6902');
    expect(rfc6902.Immutable).to.equal(Immutable);

    const core = await import('@sys/immutable/core');
    expect(rfc6902.Immutable).to.equal(core.Immutable);
  });
});
