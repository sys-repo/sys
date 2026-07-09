import { describe, expect, it } from '../../../-test.ts';
import { depsFixture } from '../../m.extension/m.ocr/-test/u.fixture.ts';
import { Ocr } from '../../m.extension/m.ocr/mod.ts';
import { type t } from '../common.ts';
import { preflightOcrStartup } from '../u/u.ocr.preflight.ts';

describe(`@sys/driver-pi/cli/Profiles/u.ocr.preflight`, () => {
  it('preflight → skips external OCR probes unless PDF OCR is enabled', async () => {
    const res = await preflightOcrStartup({
      pdf: { enabled: false, languages: ['eng'], defaultLanguage: 'eng' },
      exists: () => {
        throw new Error('exists should not run for disabled OCR.');
      },
      command: async () => {
        throw new Error('command should not run for disabled OCR.');
      },
      languageProbe: async () => {
        throw new Error('language probe should not run for disabled OCR.');
      },
    });

    expect(res).to.eql({ enabled: false });
  });

  it('preflight → resolves dependencies and verifies configured Tesseract language data', async () => {
    const fixture = depsFixture({
      existing: [
        '/brew/bin/brew',
        '/brew/opt/poppler/bin/pdfinfo',
        '/brew/opt/poppler/bin/pdftoppm',
        '/brew/opt/tesseract/bin/tesseract',
      ],
      command: (input) => {
        const formula = input.args[1];
        return {
          code: 0,
          stdout: formula === 'poppler' ? '/brew/opt/poppler\n' : '/brew/opt/tesseract\n',
          stderr: '',
        };
      },
    });
    const languageProbes: Array<{
      readonly cmd: t.StringPath;
      readonly args: readonly string[];
      readonly env?: Record<string, string>;
    }> = [];

    const res = await preflightOcrStartup({
      pdf: { enabled: true, languages: ['eng', 'deu'], defaultLanguage: 'deu' },
      env: { PATH: '/ignored/bin', TESSDATA_PREFIX: '/tmp/tessdata' },
      brewPath: '/brew/bin/brew',
      standardBinDirs: [],
      exists: fixture.exists,
      command: fixture.command,
      languageProbe: async (input) => {
        languageProbes.push({ cmd: input.cmd, args: input.args, env: input.env });
        return {
          code: 0,
          stdout: 'List of available languages in "/tmp/tessdata" (3):\neng\ndeu\nosd\n',
          stderr: '',
        };
      },
    });

    expect(res).to.eql({
      enabled: true,
      policy: {
        pdf: {
          enabled: true,
          languages: ['eng', 'deu'],
          defaultLanguage: 'deu',
          dpi: 200,
          maxPages: 10,
          maxChars: 60_000,
          timeoutMs: 120_000,
        },
      },
      executables: {
        pdfinfo: '/brew/opt/poppler/bin/pdfinfo',
        pdftoppm: '/brew/opt/poppler/bin/pdftoppm',
        tesseract: '/brew/opt/tesseract/bin/tesseract',
      },
      languages: ['eng', 'deu', 'osd'],
      installCommand: Ocr.installCommand(),
    });
    expect(fixture.commands).to.eql([
      { cmd: '/brew/bin/brew', args: ['--prefix', 'poppler'] },
      { cmd: '/brew/bin/brew', args: ['--prefix', 'tesseract'] },
    ]);
    expect(languageProbes).to.eql([
      {
        cmd: '/brew/opt/tesseract/bin/tesseract',
        args: ['--list-langs'],
        env: { PATH: '/ignored/bin', TESSDATA_PREFIX: '/tmp/tessdata' },
      },
    ]);
  });

  it('preflight → fails deterministically when OCR executables are missing', async () => {
    const fixture = depsFixture();
    let languageProbeRan = false;
    let error: unknown;

    try {
      await preflightOcrStartup({
        pdf: { enabled: true, languages: ['eng'], defaultLanguage: 'eng' },
        envPath: '',
        standardBinDirs: [],
        exists: fixture.exists,
        languageProbe: async () => {
          languageProbeRan = true;
          return { code: 0, stdout: 'eng\n', stderr: '' };
        },
      });
    } catch (err) {
      error = err;
    }

    expect(languageProbeRan).to.eql(false);
    expect(error).to.be.instanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).to.contain(
        'OCR startup preflight failed: Missing OCR dependencies: pdfinfo, pdftoppm, tesseract.',
      );
      expect(error.message).to.contain('Install with: brew install poppler tesseract');
    }
  });

  it('preflight → rejects configured OCR languages absent from Tesseract data', async () => {
    const fixture = depsFixture({
      existing: ['/ocr/bin/pdfinfo', '/ocr/bin/pdftoppm', '/ocr/bin/tesseract'],
    });
    let error: unknown;

    try {
      await preflightOcrStartup({
        pdf: { enabled: true, languages: ['eng', 'deu'], defaultLanguage: 'deu' },
        envPath: '',
        standardBinDirs: ['/ocr/bin'],
        exists: fixture.exists,
        languageProbe: async () => ({
          code: 0,
          stdout: 'List of available languages in "/ocr/share/tessdata" (2):\neng\nosd\n',
          stderr: '',
        }),
      });
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).to.contain('missing Tesseract language data: deu');
      expect(error.message).to.contain('Available languages: eng, osd');
      expect(error.message).to.contain('adjust the profile');
    }
  });

  it('preflight → reports failed Tesseract language probes with the exact argv', async () => {
    const fixture = depsFixture({
      existing: ['/ocr/bin/pdfinfo', '/ocr/bin/pdftoppm', '/ocr/bin/tesseract'],
    });
    let error: unknown;

    try {
      await preflightOcrStartup({
        pdf: { enabled: true, languages: ['eng'], defaultLanguage: 'eng' },
        envPath: '',
        standardBinDirs: ['/ocr/bin'],
        exists: fixture.exists,
        languageProbe: async () => ({ code: 2, stdout: '', stderr: 'failed to load tessdata' }),
      });
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).to.contain('tesseract language probe failed');
      expect(error.message).to.contain('Command: /ocr/bin/tesseract --list-langs');
      expect(error.message).to.contain('Exit code: 2');
      expect(error.message).to.contain('failed to load tessdata');
    }
  });
});
