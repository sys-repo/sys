import { describe, expect, it } from '../../../../-test.ts';
import { Ocr } from '../mod.ts';
import { depsFixture } from './u.fixture.ts';

describe(`Pi: OCR extension`, () => {
  describe('API', () => {
    it('exports the OCR extension surface', async () => {
      const m = await import('../mod.ts');
      expect(m.Ocr).to.equal(Ocr);
      expect(Ocr.Resolve).to.equal(m.Ocr.Resolve);
      expect(Ocr.Resolve.policy).to.equal(m.Ocr.Resolve.policy);
      expect(Ocr.Resolve.dependencies).to.equal(m.Ocr.Resolve.dependencies);
      expect(Ocr.installCommand).to.equal(m.Ocr.installCommand);
      expect(Ocr.toPromptArgs).to.equal(m.Ocr.toPromptArgs);
    });
  });

  describe('Resolve.policy', () => {
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

  describe('Resolve.dependencies', () => {
    it('exposes the fixed Homebrew install command', () => {
      expect(Ocr.installCommand()).to.eql({
        cmd: 'brew',
        args: ['install', 'poppler', 'tesseract'],
        text: 'brew install poppler tesseract',
      });
    });

    it('prefers Homebrew package prefixes', async () => {
      const fixture = depsFixture({
        existing: [
          '/opt/homebrew/bin/brew',
          '/opt/homebrew/opt/poppler/bin/pdfinfo',
          '/opt/homebrew/opt/poppler/bin/pdftoppm',
          '/opt/homebrew/opt/tesseract/bin/tesseract',
        ],
        command: (input) => {
          const formula = input.args[1];
          return {
            code: 0,
            stdout: formula === 'poppler'
              ? '/opt/homebrew/opt/poppler\n'
              : '/opt/homebrew/opt/tesseract\n',
            stderr: '',
          };
        },
      });

      const res = await Ocr.Resolve.dependencies({
        brewPath: '/opt/homebrew/bin/brew',
        exists: fixture.exists,
        command: fixture.command,
      });

      expect(res).to.eql({
        ok: true,
        executables: {
          pdfinfo: '/opt/homebrew/opt/poppler/bin/pdfinfo',
          pdftoppm: '/opt/homebrew/opt/poppler/bin/pdftoppm',
          tesseract: '/opt/homebrew/opt/tesseract/bin/tesseract',
        },
        installCommand: Ocr.installCommand(),
      });
      expect(fixture.commands).to.eql([
        { cmd: '/opt/homebrew/bin/brew', args: ['--prefix', 'poppler'] },
        { cmd: '/opt/homebrew/bin/brew', args: ['--prefix', 'tesseract'] },
      ]);
    });

    it('falls back to configured bin dirs and launcher PATH text', async () => {
      const fixture = depsFixture({
        existing: [
          '/tools/bin/pdfinfo',
          '/tools/bin/pdftoppm',
          '/env/bin/tesseract',
        ],
      });

      const res = await Ocr.Resolve.dependencies({
        standardBinDirs: ['/tools/bin'],
        envPath: '/env/bin:/relative/bin',
        exists: fixture.exists,
      });

      expect(res).to.eql({
        ok: true,
        executables: {
          pdfinfo: '/tools/bin/pdfinfo',
          pdftoppm: '/tools/bin/pdftoppm',
          tesseract: '/env/bin/tesseract',
        },
        installCommand: Ocr.installCommand(),
      });
    });

    it('checks the standard Linuxbrew bin dir by default', async () => {
      const fixture = depsFixture({
        existing: [
          '/home/linuxbrew/.linuxbrew/bin/pdfinfo',
          '/home/linuxbrew/.linuxbrew/bin/pdftoppm',
          '/home/linuxbrew/.linuxbrew/bin/tesseract',
        ],
      });

      const res = await Ocr.Resolve.dependencies({ exists: fixture.exists });

      expect(res).to.eql({
        ok: true,
        executables: {
          pdfinfo: '/home/linuxbrew/.linuxbrew/bin/pdfinfo',
          pdftoppm: '/home/linuxbrew/.linuxbrew/bin/pdftoppm',
          tesseract: '/home/linuxbrew/.linuxbrew/bin/tesseract',
        },
        installCommand: Ocr.installCommand(),
      });
    });

    it('reports structured missing dependencies', async () => {
      const fixture = depsFixture({ existing: ['/opt/homebrew/bin/pdfinfo'] });

      const res = await Ocr.Resolve.dependencies({
        standardBinDirs: ['/opt/homebrew/bin'],
        exists: fixture.exists,
      });

      expect(res).to.eql({
        ok: false,
        missing: ['pdftoppm', 'tesseract'],
        found: { pdfinfo: '/opt/homebrew/bin/pdfinfo' },
        installCommand: Ocr.installCommand(),
        message:
          'Missing OCR dependencies: pdftoppm, tesseract. Install with: brew install poppler tesseract',
      });
    });
  });

  describe('toPromptArgs', () => {
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
});
