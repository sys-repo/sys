import { describe, expect, it, pkg } from '../../../-test.ts';
import { Modules } from '../m.Modules.ts';
import { Esm } from '../mod.ts';
import { Topological } from '../../m.Topological/mod.ts';
import { Policy } from '../../m.Policy/mod.ts';

describe('Esm', () => {
  it('API', async () => {
    const root = await import('@sys/esm');
    const core = await import('@sys/esm/core');

    expect(root.pkg.name).to.equal('@sys/esm');
    expect(root.Esm).to.equal(core.Esm);
    expect(root.pkg).to.equal(pkg);
    expect(core.Esm).to.equal(Esm);

    expect(Esm.Policy).to.equal(Policy);
    expect(Esm.Topological).to.equal(Topological);
    expect(Esm.Modules).to.equal(Modules);
    expect(Esm.modules).to.equal(Modules.create);
  });
});
