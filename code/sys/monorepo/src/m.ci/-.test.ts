import { describe, expect, it } from '../-test.ts';
import { MonorepoCi } from './mod.ts';

describe(`@sys/monorepo/ci`, () => {
  it('API', async () => {
    const m = await import('@sys/monorepo/ci');
    expect(m.MonorepoCi).to.equal(MonorepoCi);
    expect(m.MonorepoCi.Jsr).to.equal(MonorepoCi.Jsr);
    expect(m.MonorepoCi.Build).to.equal(MonorepoCi.Build);
    expect(m.MonorepoCi.Test).to.equal(MonorepoCi.Test);
  });
});
