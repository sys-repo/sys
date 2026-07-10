import { describe, expect, it } from '../../../../-test.ts';
import { Ocr } from '../mod.ts';

describe(`Pi: OCR extension / Resolve.policy`, () => {
  it('resolves bounded PDF OCR defaults', () => {
    expect(Ocr.Resolve.policy()).to.eql({
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

  it('accepts profile-authored PDF OCR bounds', () => {
    expect(
      Ocr.Resolve.policy({
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

  it('normalizes language codes and rejects invalid language policy', () => {
    expect(Ocr.Resolve.policy({ pdf: { languages: [' eng ', 'deu'], defaultLanguage: ' deu ' } }))
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
    expect(() => Ocr.Resolve.policy({ pdf: { languages: ['eng'], defaultLanguage: 'deu' } }))
      .to.throw(/defaultLanguage/);
    expect(() => Ocr.Resolve.policy({ pdf: { languages: [''] } })).to.throw(/language/);
  });

  it('accepts numeric policy bounds at their hard limits', () => {
    expect(
      Ocr.Resolve.policy({
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

  it('rejects unsafe numeric bounds', () => {
    expect(() => Ocr.Resolve.policy({ pdf: { dpi: 71 } })).to.throw(/dpi/);
    expect(() => Ocr.Resolve.policy({ pdf: { dpi: 601 } })).to.throw(/dpi/);
    expect(() => Ocr.Resolve.policy({ pdf: { maxPages: 1.5 } })).to.throw(/maxPages/);
    expect(() => Ocr.Resolve.policy({ pdf: { maxPages: 101 } })).to.throw(/maxPages/);
    expect(() => Ocr.Resolve.policy({ pdf: { maxChars: -1 } })).to.throw(/maxChars/);
    expect(() => Ocr.Resolve.policy({ pdf: { maxChars: 1_000_001 } })).to.throw(/maxChars/);
    expect(() => Ocr.Resolve.policy({ pdf: { timeoutMs: 999 } })).to.throw(/timeoutMs/);
    expect(() => Ocr.Resolve.policy({ pdf: { timeoutMs: 600_001 } })).to.throw(/timeoutMs/);
  });
});
