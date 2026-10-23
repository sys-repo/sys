import { describe, expect, it } from '../../../../-test.ts';
import { Ocr } from '../mod.ts';

describe(`Pi: OCR extension / API`, () => {
  it('exports the OCR extension surface', async () => {
    const m = await import('../mod.ts');
    expect(m.Ocr).to.equal(Ocr);
    expect(Ocr.Resolve).to.equal(m.Ocr.Resolve);
    expect(Ocr.Resolve.policy).to.equal(m.Ocr.Resolve.policy);
    expect(Ocr.Resolve.dependencies).to.equal(m.Ocr.Resolve.dependencies);
    expect(Ocr.installCommand).to.equal(m.Ocr.installCommand);
    expect(Ocr.resolveExtensionPolicy).to.equal(m.Ocr.resolveExtensionPolicy);
    expect(Ocr.write).to.equal(m.Ocr.write);
    expect(Ocr.toPromptArgs).to.equal(m.Ocr.toPromptArgs);
  });
});
