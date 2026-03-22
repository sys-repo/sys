import { describe, expect, it } from '../../-test.ts';
import { Modules } from '../m.Modules.ts';
import { Esm } from '../mod.ts';

describe('Jsr.Esm', () => {
  it('API', async () => {
    const root = await import('@sys/esm');
    const core = await import('@sys/esm/core');

    expect(root).to.equal(core);
    expect(core.Esm).to.equal(Esm);

    expect(Esm.Modules).to.equal(Modules);
    expect(Esm.modules).to.equal(Modules.create);
  });
});
