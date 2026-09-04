import { describe, expect, it } from '../../../-test.ts';
import { PiExtension } from '../mod.ts';

const { Ocr, SandboxFs } = PiExtension;

describe(`Pi: wrapper-owned extensions`, () => {
  it('API', async () => {
    const m = await import('../mod.ts');
    expect(m.PiExtension).to.equal(PiExtension);
    expect(m.PiExtension.Ocr).to.equal(Ocr);
    expect(m.PiExtension.SandboxFs).to.equal(SandboxFs);
  });
});
