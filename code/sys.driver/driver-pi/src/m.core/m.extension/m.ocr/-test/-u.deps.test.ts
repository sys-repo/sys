import { describe, expect, it } from '../../../../-test.ts';
import { Ocr } from '../mod.ts';
import { depsFixture } from './u.fixture.ts';

describe(`Pi: OCR extension / Resolve.dependencies`, () => {
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
