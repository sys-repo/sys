import { describe, expect, it } from '../../../-test.ts';
import { depsFixture } from '../../m.extension/m.ocr/-test/u.fixture.ts';
import { Ocr } from '../../m.extension/m.ocr/mod.ts';
import { Cli, type t } from '../common.ts';
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

  it('preflight → installs missing OCR dependencies only with explicit non-interactive consent', async () => {
    const fixture = depsFixture({
      existing: ['/brew/bin/brew', '/ocr/bin/pdfinfo', '/ocr/bin/pdftoppm', '/ocr/bin/tesseract'],
      command: () => ({ code: 1, stdout: '', stderr: '' }),
    });
    const installs: Array<{
      readonly cmd: string;
      readonly args: readonly string[];
      readonly env?: Record<string, string>;
    }> = [];
    let installed = false;

    const res = await preflightOcrStartup({
      pdf: { enabled: true, languages: ['eng'], defaultLanguage: 'eng' },
      env: { PATH: '/usr/bin' },
      brewPath: '/brew/bin/brew',
      envPath: '',
      standardBinDirs: ['/ocr/bin'],
      exists: (path) => path === '/brew/bin/brew' || (installed && fixture.exists(path)),
      command: fixture.command,
      setup: {
        installDeps: true,
        interactive: false,
        install: async (input) => {
          installs.push({ cmd: input.cmd, args: input.args, env: input.env });
          installed = true;
          return { code: 0, stdout: 'installed', stderr: '' };
        },
      },
      languageProbe: async () => ({ code: 0, stdout: 'eng\n', stderr: '' }),
    });

    expect(installs).to.eql([
      {
        cmd: '/brew/bin/brew',
        args: ['install', 'poppler', 'tesseract'],
        env: { PATH: '/usr/bin' },
      },
    ]);
    expect(res.enabled).to.eql(true);
    if (res.enabled) {
      expect(res.executables).to.eql({
        pdfinfo: '/ocr/bin/pdfinfo',
        pdftoppm: '/ocr/bin/pdftoppm',
        tesseract: '/ocr/bin/tesseract',
      });
      expect(res.installCommand).to.eql(Ocr.installCommand());
    }
  });

  it('preflight → built-in interactive OCR install prompt defaults to skip', async () => {
    const fixture = depsFixture();
    const originalPrompt = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    let installRan = false;
    let error: unknown;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: {
        readonly message: string;
        readonly default?: string;
        readonly options?: readonly { readonly value: string }[];
      }) => {
        expect(input.message).to.eql('OCR dependencies');
        expect(input.default).to.eql('skip');
        expect((input.options ?? []).map((item) => item.value)).to.eql(['skip', 'install']);
        return Promise.resolve(input.default);
      },
    });
    console.info = () => undefined;

    try {
      await preflightOcrStartup({
        pdf: { enabled: true, languages: ['eng'], defaultLanguage: 'eng' },
        envPath: '',
        standardBinDirs: [],
        exists: fixture.exists,
        setup: {
          interactive: true,
          install: async () => {
            installRan = true;
            return { code: 0, stdout: '', stderr: '' };
          },
        },
      });
    } catch (err) {
      error = err;
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: originalPrompt });
      console.info = prevInfo;
    }

    expect(installRan).to.eql(false);
    expect(error).to.be.instanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).to.contain('OCR dependency install declined');
      expect(error.message).to.contain('Install with: brew install poppler tesseract');
    }
  });

  it('preflight → prompts for interactive OCR install consent and stops on decline', async () => {
    const fixture = depsFixture();
    const prompts: Array<{
      readonly missing: readonly t.PiOcrExtension.Dependency.Name[];
      readonly installCommand: t.PiOcrExtension.Install.Command;
    }> = [];
    let installRan = false;
    let error: unknown;

    try {
      await preflightOcrStartup({
        pdf: { enabled: true, languages: ['eng'], defaultLanguage: 'eng' },
        envPath: '',
        standardBinDirs: [],
        exists: fixture.exists,
        setup: {
          interactive: true,
          prompt: async (input) => {
            prompts.push(input);
            return 'skip';
          },
          install: async () => {
            installRan = true;
            return { code: 0, stdout: '', stderr: '' };
          },
        },
      });
    } catch (err) {
      error = err;
    }

    expect(installRan).to.eql(false);
    expect(prompts).to.eql([
      {
        missing: ['pdfinfo', 'pdftoppm', 'tesseract'],
        installCommand: Ocr.installCommand(),
      },
    ]);
    expect(error).to.be.instanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).to.contain('OCR dependency install declined');
      expect(error.message).to.contain('Install with: brew install poppler tesseract');
    }
  });

  it('preflight → installs after interactive OCR setup consent', async () => {
    const fixture = depsFixture({
      existing: ['/brew/bin/brew', '/ocr/bin/pdfinfo', '/ocr/bin/pdftoppm', '/ocr/bin/tesseract'],
      command: () => ({ code: 1, stdout: '', stderr: '' }),
    });
    let installed = false;
    let prompted = false;

    const res = await preflightOcrStartup({
      pdf: { enabled: true, languages: ['eng'], defaultLanguage: 'eng' },
      brewPath: '/brew/bin/brew',
      envPath: '',
      standardBinDirs: ['/ocr/bin'],
      exists: (path) => path === '/brew/bin/brew' || (installed && fixture.exists(path)),
      command: fixture.command,
      setup: {
        interactive: true,
        prompt: async () => {
          prompted = true;
          return 'install';
        },
        install: async () => {
          installed = true;
          return { code: 0, stdout: '', stderr: '' };
        },
      },
      languageProbe: async () => ({ code: 0, stdout: 'eng\n', stderr: '' }),
    });

    expect(prompted).to.eql(true);
    expect(installed).to.eql(true);
    expect(res.enabled).to.eql(true);
  });

  it('preflight → reports failed OCR dependency install status and stderr', async () => {
    const fixture = depsFixture({
      existing: ['/brew/bin/brew'],
      command: () => ({ code: 1, stdout: '', stderr: '' }),
    });
    let error: unknown;

    try {
      await preflightOcrStartup({
        pdf: { enabled: true, languages: ['eng'], defaultLanguage: 'eng' },
        brewPath: '/brew/bin/brew',
        envPath: '',
        standardBinDirs: [],
        exists: fixture.exists,
        command: fixture.command,
        setup: {
          installDeps: true,
          install: async () => ({ code: 9, stdout: '', stderr: 'brew failed' }),
        },
      });
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).to.contain('OCR dependency install command failed');
      expect(error.message).to.contain('Command: brew install poppler tesseract');
      expect(error.message).to.contain('Exit code: 9');
      expect(error.message).to.contain('brew failed');
    }
  });

  it('preflight → reports OCR dependency install command start failures', async () => {
    const fixture = depsFixture({
      existing: ['/brew/bin/brew'],
      command: () => ({ code: 1, stdout: '', stderr: '' }),
    });
    let error: unknown;

    try {
      await preflightOcrStartup({
        pdf: { enabled: true, languages: ['eng'], defaultLanguage: 'eng' },
        brewPath: '/brew/bin/brew',
        envPath: '',
        standardBinDirs: [],
        exists: fixture.exists,
        command: fixture.command,
        setup: {
          installDeps: true,
          install: async () => {
            throw new Error('permission denied');
          },
        },
      });
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).to.contain('OCR dependency install command could not start');
      expect(error.message).to.contain('Command: brew install poppler tesseract');
      expect(error.message).to.contain('permission denied');
    }
  });

  it('preflight → reports missing Homebrew before attempting OCR dependency install', async () => {
    const fixture = depsFixture();
    let installRan = false;
    let error: unknown;

    try {
      await preflightOcrStartup({
        pdf: { enabled: true, languages: ['eng'], defaultLanguage: 'eng' },
        envPath: '',
        standardBinDirs: [],
        exists: fixture.exists,
        setup: {
          installDeps: true,
          install: async () => {
            installRan = true;
            return { code: 0, stdout: '', stderr: '' };
          },
        },
      });
    } catch (err) {
      error = err;
    }

    expect(installRan).to.eql(false);
    expect(error).to.be.instanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).to.contain('Homebrew is required for OCR dependency install');
      expect(error.message).to.contain('Command: brew install poppler tesseract');
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
