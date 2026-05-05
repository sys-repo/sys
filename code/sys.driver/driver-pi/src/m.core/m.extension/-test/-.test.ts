import { describe, expect, it } from '../../../-test.ts';
import { PiExtension } from '../mod.ts';

const { SandboxFs } = PiExtension;

describe(`Pi: wrapper-owned extensions`, () => {
  it('API', async () => {
    const m = await import('../mod.ts');
    expect(m.PiExtension).to.equal(PiExtension);
    expect(m.PiExtension.SandboxFs).to.equal(SandboxFs);
  });
});
