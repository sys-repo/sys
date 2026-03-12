import { describe, expect, it } from '../-test.ts';
import { MonorepoCi } from '../m.ci/mod.ts';
import { MonorepoInfo } from '../m.info/mod.ts';
import { MonorepoPkg } from '../m.pkg/mod.ts';
import { Monorepo } from '../mod.ts';

describe(`@sys/monorepo/ci`, () => {
  it('API', async () => {
    const m = await import('@sys/monorepo');
    expect(m.Monorepo).to.equal(Monorepo);
    expect(m.Monorepo.Pkg).to.equal(MonorepoPkg);
    expect(m.Monorepo.Info).to.equal(MonorepoInfo);
    expect(m.Monorepo.Ci).to.equal(MonorepoCi);
    expect(m.Monorepo.Ci.Jsr).to.equal(MonorepoCi.Jsr);
    expect(m.Monorepo.Ci.Build).to.equal(MonorepoCi.Build);
    expect(m.Monorepo.Ci.Test).to.equal(MonorepoCi.Test);
  });
});
