import { describe, expect, it } from '../../../-test.ts';
import { Ocr } from '../m.ocr/mod.ts';
import { Sandbox } from '../m.sandbox/mod.ts';
import { Zip } from '../m.zip/mod.ts';
import { PiExtension } from '../mod.ts';

describe(`Pi: wrapper-owned extensions`, () => {
  it('API', async () => {
    const m = await import('../mod.ts');
    expect(m.PiExtension).to.equal(PiExtension);
    expect(m.PiExtension.Ocr).to.equal(Ocr);
    expect(m.PiExtension.Sandbox).to.equal(Sandbox);
    expect(m.PiExtension.Zip).to.equal(Zip);
  });
});
