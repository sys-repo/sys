import { describe, expect, it } from '../../../../-test.ts';
import { Ocr } from '../mod.ts';

describe(`Pi: OCR extension`, () => {
  it('API', async () => {
    const m = await import('../mod.ts');
    expect(m.Ocr).to.equal(Ocr);
  });
});
