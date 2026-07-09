import { describe, expect, it } from '../../../../-test.ts';
import { Ocr } from '../mod.ts';

describe(`Pi: OCR extension`, () => {
  it('API', async () => {
    const m = await import('../mod.ts');
    expect(m.Ocr).to.equal(Ocr);
    expect(Ocr.resolvePolicy).to.equal(m.Ocr.resolvePolicy);
    expect(Ocr.toPromptArgs).to.equal(m.Ocr.toPromptArgs);
  });

  it('resolvePolicy → resolves bounded PDF OCR defaults', () => {
    expect(Ocr.resolvePolicy()).to.eql({
      pdf: {
        enabled: false,
        languages: ['eng'],
        defaultLanguage: 'eng',
        dpi: 200,
        maxPages: 10,
        maxChars: 60_000,
        timeoutMs: 120_000,
      },
    });
  });

  it('resolvePolicy → accepts profile-authored PDF OCR bounds', () => {
    expect(
      Ocr.resolvePolicy({
        pdf: {
          enabled: true,
          languages: ['eng', 'deu', 'eng'],
          defaultLanguage: 'deu',
          dpi: 300,
          maxPages: 4,
          maxChars: 12_000,
          timeoutMs: 90_000,
        },
      }),
    ).to.eql({
      pdf: {
        enabled: true,
        languages: ['eng', 'deu'],
        defaultLanguage: 'deu',
        dpi: 300,
        maxPages: 4,
        maxChars: 12_000,
        timeoutMs: 90_000,
      },
    });
  });

  it('resolvePolicy → normalizes language codes and rejects invalid language policy', () => {
    expect(Ocr.resolvePolicy({ pdf: { languages: [' eng ', 'deu'], defaultLanguage: ' deu ' } }))
      .to.eql({
        pdf: {
          enabled: false,
          languages: ['eng', 'deu'],
          defaultLanguage: 'deu',
          dpi: 200,
          maxPages: 10,
          maxChars: 60_000,
          timeoutMs: 120_000,
        },
      });
    expect(() => Ocr.resolvePolicy({ pdf: { languages: ['eng'], defaultLanguage: 'deu' } }))
      .to.throw(/defaultLanguage/);
    expect(() => Ocr.resolvePolicy({ pdf: { languages: [''] } })).to.throw(/language/);
  });

  it('resolvePolicy → accepts numeric policy bounds at their hard limits', () => {
    expect(
      Ocr.resolvePolicy({
        pdf: { dpi: 600, maxPages: 100, maxChars: 1_000_000, timeoutMs: 600_000 },
      }),
    ).to.eql({
      pdf: {
        enabled: false,
        languages: ['eng'],
        defaultLanguage: 'eng',
        dpi: 600,
        maxPages: 100,
        maxChars: 1_000_000,
        timeoutMs: 600_000,
      },
    });
  });

  it('resolvePolicy → rejects unsafe numeric bounds', () => {
    expect(() => Ocr.resolvePolicy({ pdf: { dpi: 71 } })).to.throw(/dpi/);
    expect(() => Ocr.resolvePolicy({ pdf: { dpi: 601 } })).to.throw(/dpi/);
    expect(() => Ocr.resolvePolicy({ pdf: { maxPages: 1.5 } })).to.throw(/maxPages/);
    expect(() => Ocr.resolvePolicy({ pdf: { maxPages: 101 } })).to.throw(/maxPages/);
    expect(() => Ocr.resolvePolicy({ pdf: { maxChars: -1 } })).to.throw(/maxChars/);
    expect(() => Ocr.resolvePolicy({ pdf: { maxChars: 1_000_001 } })).to.throw(/maxChars/);
    expect(() => Ocr.resolvePolicy({ pdf: { timeoutMs: 999 } })).to.throw(/timeoutMs/);
    expect(() => Ocr.resolvePolicy({ pdf: { timeoutMs: 600_001 } })).to.throw(/timeoutMs/);
  });

  it('toPromptArgs → appends a truthful OCR contract only when enabled', () => {
    const disabled = Ocr.toPromptArgs(Ocr.resolvePolicy());
    expect(disabled).to.eql([]);

    const enabled = Ocr.toPromptArgs(
      Ocr.resolvePolicy({ pdf: { enabled: true, languages: ['eng', 'deu'], defaultLanguage: 'deu' } }),
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
