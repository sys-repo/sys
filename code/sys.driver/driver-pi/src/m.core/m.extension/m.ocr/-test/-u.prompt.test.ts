import { describe, expect, it } from '../../../../-test.ts';
import { Ocr } from '../mod.ts';

describe(`Pi: OCR extension / toPromptArgs`, () => {
  it('appends a truthful OCR contract only when enabled', () => {
    const disabled = Ocr.toPromptArgs(Ocr.Resolve.policy());
    expect(disabled).to.eql([]);

    const enabled = Ocr.toPromptArgs(
      Ocr.Resolve.policy({
        pdf: { enabled: true, languages: ['eng', 'deu'], defaultLanguage: 'deu' },
      }),
    );
    expect(enabled[0]).to.eql('--append-system-prompt');
    expect(enabled[1]).to.contain('Runtime Tool Contract: ocr_pdf');
    expect(enabled[1]).to.contain('optical character recognition (OCR)');
    expect(enabled[1]).to.contain('Bash is not an OCR fallback.');
    expect(enabled[1]).to.contain('Do not use `ocr_pdf` as a general PDF parser');
    expect(enabled[1]).to.contain('languages eng, deu');
    expect(enabled[1]).to.contain('default language deu');
  });
});
