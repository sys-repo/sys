import { describe, expect, it } from '../../../../-test.ts';
import { Fs, Path, type t } from '../common.ts';
import { Ocr } from '../mod.ts';
import { depsFixture } from './u.fixture.ts';

type OcrCommandInput = {
  readonly cmd: string;
  readonly args: readonly string[];
  readonly timeoutMs: number;
  readonly maxStdoutBytes: number;
  readonly maxStderrBytes: number;
  readonly signal?: AbortSignal;
};

type OcrCommandOutput = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut?: boolean;
  readonly cancelled?: boolean;
  readonly failedToStart?: boolean;
  readonly stdoutTruncated?: boolean;
  readonly stderrTruncated?: boolean;
};

type OcrToolResult = {
  readonly content: readonly { readonly type: string; readonly text: string }[];
  readonly details: Record<string, unknown>;
  readonly isError?: true;
};

type GuardResult =
  | {
    readonly ok: true;
    readonly requested: string;
    readonly resolved: string;
    readonly root: string;
  }
  | {
    readonly ok: false;
    readonly requested: string;
    readonly resolved?: string;
    readonly reason: string;
  };

type RegisteredTool = {
  readonly name: string;
};

type GeneratedOcrModule = {
  readonly default: (pi: { registerTool(tool: RegisteredTool): void }) => void;
  readonly __ocrPdfTest: {
    readonly guardInput: (input: {
      readonly requested: string;
      readonly cwd: string;
      readonly policy?: t.PiOcrExtension.Extension.Policy;
    }) => Promise<GuardResult>;
    readonly parsePdfInfoPages: (stdout: string) => number | undefined;
    readonly resolvePageRange: (
      params: { readonly pageStart?: number; readonly pageEnd?: number },
      pagesTotal: number,
      maxPages: number,
    ) => { readonly ok: true; readonly value: unknown } | {
      readonly ok: false;
      readonly reason: string;
    };
    readonly runOcrPdfWithCommand: (input: {
      readonly params: {
        readonly path: string;
        readonly pageStart?: number;
        readonly pageEnd?: number;
        readonly language?: string;
      };
      readonly cwd: string;
      readonly policy?: t.PiOcrExtension.Extension.Policy;
      readonly command?: (input: OcrCommandInput) => Promise<OcrCommandOutput>;
      readonly cleanup?: (
        path: string,
      ) => Promise<{ readonly ok: false; readonly reason: string } | undefined>;
      readonly signal?: AbortSignal;
    }) => Promise<OcrToolResult>;
    readonly runDenoCommand: (input: OcrCommandInput) => Promise<OcrCommandOutput>;
  };
};

describe(`Pi: OCR extension`, () => {
  describe('API', () => {
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

  describe('resolveExtensionPolicy', () => {
    it('freezes read roots, protected roots, temp root, executables, and setup guidance', () => {
      const root = '/tmp/driver-pi-ocr' as t.StringDir;
      const profilePolicy = Ocr.Resolve.policy({
        pdf: { enabled: true, languages: ['eng', 'deu'], defaultLanguage: 'deu' },
      });
      const policy = Ocr.resolveExtensionPolicy({
        cwd: { invoked: root, git: root },
        read: ['./docs' as t.StringPath, '/tmp/readable-pdfs' as t.StringPath],
        policy: profilePolicy,
        executables: ocrExecutables(),
      });

      expect(policy).to.eql({
        readRoots: [root, `${root}/docs`, '/tmp/readable-pdfs'],
        protectedRoots: [
          `${root}/.git`,
          `${root}/.pi`,
          `${root}/.tmp/pi.cli`,
          `${root}/.tmp/pi.cli.pi`,
          `${root}/.log/@sys.driver-pi`,
          `${root}/.log/@sys.driver-pi.pi`,
        ],
        tmpRoot: `${root}/.pi/@sys/tmp/ocr`,
        pdf: profilePolicy.pdf,
        executables: ocrExecutables(),
        installCommand: Ocr.installCommand(),
      });
    });
  });

  describe('write', () => {
    it('materializes the generated OCR extension with frozen absolute executable paths', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        const profilePolicy = Ocr.Resolve.policy({
          pdf: { enabled: true, maxChars: 1_234, timeoutMs: 5_000 },
        });
        const policy = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          read: ['./pdfs' as t.StringPath],
          policy: profilePolicy,
          executables: ocrExecutables(),
        });
        const res = await Ocr.write({ cwd, policy });
        const read = await Fs.readText(res.path);
        if (!read.ok) throw read.error;
        const text = read.data ?? '';

        expect(res.args).to.eql(['--extension', res.path]);
        expect(res.ops.some((op) => op.kind === 'create')).to.eql(true);
        expect(text).to.contain("name: 'ocr_pdf'");
        expect(text).to.contain('"pdfinfo": "/ocr/bin/pdfinfo"');
        expect(text).to.contain('"pdftoppm": "/ocr/bin/pdftoppm"');
        expect(text).to.contain('"tesseract": "/ocr/bin/tesseract"');
        expect(text).to.contain('"maxChars": 1234');
        expect(text).to.contain("from 'jsr:@sys/process@");
        expect(text).to.contain("/process'");
        expect(text).not.to.contain("from '@sys/process/process'");
        expect(text).not.to.contain('Deno.Command');
        expect(text).not.to.contain('__OCR_POLICY__');
        expect(text).not.to.contain("from '@sys/fs'");
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('generated extension registers ocr_pdf only when OCR is enabled', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        const enabled = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({ pdf: { enabled: true } }),
          executables: ocrExecutables(),
        });
        const enabledModule = await importGenerated(
          (await Ocr.write({ cwd, policy: enabled })).path,
        );
        const enabledTools: RegisteredTool[] = [];
        enabledModule.default({ registerTool: (tool) => enabledTools.push(tool) });
        expect(enabledTools.map((tool) => tool.name)).to.eql(['ocr_pdf']);

        const disabled = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({ pdf: { enabled: false } }),
          executables: ocrExecutables(),
        });
        const disabledModule = await importGenerated(
          (await Ocr.write({ cwd, policy: disabled })).path,
        );
        const disabledTools: RegisteredTool[] = [];
        disabledModule.default({ registerTool: (tool) => disabledTools.push(tool) });
        expect(disabledTools).to.eql([]);
      } finally {
        await Fs.remove(cwd);
      }
    });
  });

  describe('generated ocr_pdf runtime', () => {
    it('runs pdfinfo, pdftoppm, and tesseract through frozen absolute executable paths', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        const source = Fs.join(cwd, 'scan.pdf') as t.StringPath;
        await Fs.write(source, '%PDF fixture');
        const policy = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({
            pdf: { enabled: true, maxPages: 2, maxChars: 12, timeoutMs: 5_000 },
          }),
          executables: ocrExecutables(),
        });
        const mod = await importGenerated((await Ocr.write({ cwd, policy })).path);
        const commands: OcrCommandInput[] = [];
        let tesseractCalls = 0;

        const result = await mod.__ocrPdfTest.runOcrPdfWithCommand({
          params: { path: 'scan.pdf', pageStart: 1, pageEnd: 2 },
          cwd,
          policy,
          command: async (input) => {
            commands.push(input);
            if (input.cmd === '/ocr/bin/pdfinfo') {
              return { code: 0, stdout: 'Pages: 4\n', stderr: '' };
            }
            if (input.cmd === '/ocr/bin/pdftoppm') return { code: 0, stdout: '', stderr: '' };
            if (input.cmd === '/ocr/bin/tesseract') {
              tesseractCalls += 1;
              return {
                code: 0,
                stdout: tesseractCalls === 1 ? 'abcdef' : 'ghijklmnop',
                stderr: '',
              };
            }
            return { code: 127, stdout: '', stderr: `unexpected command: ${input.cmd}` };
          },
        });

        expect(result.isError).to.eql(undefined);
        expect(result.details.ok).to.eql(true);
        expect(result.details.pagesProcessed).to.eql(2);
        expect(result.details.chars).to.eql(12);
        expect(result.details.truncated).to.eql(true);
        expect(result.content[0].text).to.contain('truncated');
        expect(commands.map((input) => input.cmd)).to.eql([
          '/ocr/bin/pdfinfo',
          '/ocr/bin/pdftoppm',
          '/ocr/bin/tesseract',
          '/ocr/bin/pdftoppm',
          '/ocr/bin/tesseract',
        ]);
        expect(commands.every((input) => input.cmd.startsWith('/ocr/bin/'))).to.eql(true);
        expect(commands[0].maxStdoutBytes).to.eql(64_000);
        expect(commands[0].maxStderrBytes).to.eql(64_000);
        expect(commands[2].maxStdoutBytes).to.eql(12);
        expect(commands[2].maxStderrBytes).to.eql(64_000);
        expect(commands[1].args).to.include('-singlefile');
        expect(commands[2].args).to.include('--dpi');
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('treats tesseract stdout capture truncation as OCR truncation', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        await Fs.write(Fs.join(cwd, 'scan.pdf'), '%PDF fixture');
        const policy = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({ pdf: { enabled: true, maxChars: 100 } }),
          executables: ocrExecutables(),
        });
        const result = await (await importGenerated((await Ocr.write({ cwd, policy })).path))
          .__ocrPdfTest.runOcrPdfWithCommand({
            params: { path: 'scan.pdf' },
            cwd,
            policy,
            command: async (input) => {
              if (input.cmd === '/ocr/bin/pdfinfo') {
                return { code: 0, stdout: 'Pages: 1\n', stderr: '' };
              }
              if (input.cmd === '/ocr/bin/pdftoppm') return { code: 0, stdout: '', stderr: '' };
              if (input.cmd === '/ocr/bin/tesseract') {
                return { code: 0, stdout: 'partial text', stderr: '', stdoutTruncated: true };
              }
              return { code: 127, stdout: '', stderr: `unexpected command: ${input.cmd}` };
            },
          });

        expect(result.isError).to.eql(undefined);
        expect(result.details.ok).to.eql(true);
        expect(result.details.truncated).to.eql(true);
        expect(result.content[0].text).to.contain('truncated');
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('returns structured timeout errors without setup guidance', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        await Fs.write(Fs.join(cwd, 'scan.pdf'), '%PDF fixture');
        const policy = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({ pdf: { enabled: true, timeoutMs: 5_000 } }),
          executables: ocrExecutables(),
        });
        const result = await (await importGenerated((await Ocr.write({ cwd, policy })).path))
          .__ocrPdfTest.runOcrPdfWithCommand({
            params: { path: 'scan.pdf' },
            cwd,
            policy,
            command: async () => {
              return { code: -1, stdout: '', stderr: 'command timed out', timedOut: true };
            },
          });

        expect(result.isError).to.eql(true);
        expect(result.details.ok).to.eql(false);
        expect(result.details.reason).to.contain('pdfinfo command exceeded OCR timeout budget');
        expect(result.details.installCommand).to.eql(undefined);
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('surfaces cleanup failure details without hiding successful OCR output', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        await Fs.write(Fs.join(cwd, 'scan.pdf'), '%PDF fixture');
        const policy = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({ pdf: { enabled: true } }),
          executables: ocrExecutables(),
        });
        const result = await (await importGenerated((await Ocr.write({ cwd, policy })).path))
          .__ocrPdfTest.runOcrPdfWithCommand({
            params: { path: 'scan.pdf' },
            cwd,
            policy,
            command: async (input) => {
              if (input.cmd === '/ocr/bin/pdfinfo') {
                return { code: 0, stdout: 'Pages: 1\n', stderr: '' };
              }
              if (input.cmd === '/ocr/bin/pdftoppm') return { code: 0, stdout: '', stderr: '' };
              if (input.cmd === '/ocr/bin/tesseract') {
                return { code: 0, stdout: 'visible text', stderr: '' };
              }
              return { code: 127, stdout: '', stderr: `unexpected command: ${input.cmd}` };
            },
            cleanup: async () => {
              throw new Error('cleanup exploded');
            },
          });

        expect(result.isError).to.eql(undefined);
        expect(result.details.ok).to.eql(true);
        expect(result.content[0].text).to.contain('visible text');
        expect(result.details.cleanup).to.eql({
          ok: false,
          reason: 'cleanup failed: cleanup exploded',
        });
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('generated command runner returns pre-spawn cancellation without probing run permission', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        const policy = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({ pdf: { enabled: true } }),
          executables: ocrExecutables(),
        });
        const controller = new AbortController();
        controller.abort();
        const mod = await importGenerated((await Ocr.write({ cwd, policy })).path);
        const result = await mod.__ocrPdfTest.runDenoCommand({
          cmd: '/not-started',
          args: [],
          timeoutMs: 5_000,
          ...commandCaps(),
          signal: controller.signal,
        });

        expect(result.cancelled).to.eql(true);
        expect(result.timedOut).to.eql(undefined);
        expect(result.failedToStart).to.eql(undefined);
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('returns early structured cancellation before file probes or commands', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        const policy = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({ pdf: { enabled: true } }),
          executables: ocrExecutables(),
        });
        const controller = new AbortController();
        controller.abort();
        let called = false;
        const result = await (await importGenerated((await Ocr.write({ cwd, policy })).path))
          .__ocrPdfTest.runOcrPdfWithCommand({
            params: { path: 'missing.pdf' },
            cwd,
            policy,
            signal: controller.signal,
            command: async () => {
              called = true;
              return { code: 0, stdout: '', stderr: '' };
            },
          });

        expect(called).to.eql(false);
        expect(result.isError).to.eql(true);
        expect(result.details.ok).to.eql(false);
        expect(result.details.reason).to.eql('ocr_pdf was cancelled before it started.');
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('threads AbortSignal into OCR commands and returns structured cancellation', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        await Fs.write(Fs.join(cwd, 'scan.pdf'), '%PDF fixture');
        const policy = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({ pdf: { enabled: true } }),
          executables: ocrExecutables(),
        });
        const controller = new AbortController();
        let seenSignal: AbortSignal | undefined;
        const result = await (await importGenerated((await Ocr.write({ cwd, policy })).path))
          .__ocrPdfTest.runOcrPdfWithCommand({
            params: { path: 'scan.pdf' },
            cwd,
            policy,
            signal: controller.signal,
            command: async (input) => {
              seenSignal = input.signal;
              controller.abort();
              return { code: -1, stdout: '', stderr: 'command cancelled', cancelled: true };
            },
          });

        expect(seenSignal).to.equal(controller.signal);
        expect(result.isError).to.eql(true);
        expect(result.details.ok).to.eql(false);
        expect(result.details.reason).to.contain('pdfinfo command was cancelled');
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('returns structured command-runner exceptions instead of rejecting the tool call', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        await Fs.write(Fs.join(cwd, 'scan.pdf'), '%PDF fixture');
        const policy = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({ pdf: { enabled: true } }),
          executables: ocrExecutables(),
        });
        const result = await (await importGenerated((await Ocr.write({ cwd, policy })).path))
          .__ocrPdfTest.runOcrPdfWithCommand({
            params: { path: 'scan.pdf' },
            cwd,
            policy,
            command: async () => {
              throw new Error('runner exploded');
            },
          });

        expect(result.isError).to.eql(true);
        expect(result.details.ok).to.eql(false);
        expect(result.details.reason).to.eql('pdfinfo command runner failed: runner exploded');
        expect(result.details.installCommand).to.eql(undefined);
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('returns structured file-probe guard errors instead of rejecting the tool call', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        const policy = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({ pdf: { enabled: true } }),
          executables: ocrExecutables(),
        });
        let called = false;
        const result = await (await importGenerated((await Ocr.write({ cwd, policy })).path))
          .__ocrPdfTest.runOcrPdfWithCommand({
            params: { path: 'bad\0.pdf' },
            cwd,
            policy,
            command: async () => {
              called = true;
              return { code: 0, stdout: '', stderr: '' };
            },
          });

        expect(called).to.eql(false);
        expect(result.isError).to.eql(true);
        expect(result.details.ok).to.eql(false);
        expect(result.details.reason).to.contain('could not inspect source path');
      } finally {
        await Fs.remove(cwd);
      }
    });

    it('returns structured setup errors before invoking bare executable names', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        await Fs.write(Fs.join(cwd, 'scan.pdf'), '%PDF fixture');
        const policy = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({ pdf: { enabled: true } }),
          executables: { ...ocrExecutables(), pdfinfo: 'pdfinfo' as t.StringPath },
        });
        let called = false;
        const result = await (await importGenerated((await Ocr.write({ cwd, policy })).path))
          .__ocrPdfTest.runOcrPdfWithCommand({
            params: { path: 'scan.pdf' },
            cwd,
            policy,
            command: async () => {
              called = true;
              return { code: 0, stdout: '', stderr: '' };
            },
          });

        expect(called).to.eql(false);
        expect(result.isError).to.eql(true);
        expect(result.details.ok).to.eql(false);
        expect(result.details.reason).to.contain('absolute path');
        expect(result.details.installCommand).to.eql('brew install poppler tesseract');
      } finally {
        await Fs.remove(cwd);
      }
    });
  });

  describe('generated guards', () => {
    it('rejects traversal, protected roots, symlinks, non-PDFs, and bad page ranges', async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.ocr.test.' })).absolute as t.StringDir;
      try {
        const policy = Ocr.resolveExtensionPolicy({
          cwd: { invoked: cwd, git: cwd },
          policy: Ocr.Resolve.policy({ pdf: { enabled: true, maxPages: 2 } }),
          executables: ocrExecutables(),
        });
        const guards =
          (await importGenerated((await Ocr.write({ cwd, policy })).path)).__ocrPdfTest;
        await Fs.write(Fs.join(cwd, 'scan.pdf'), '%PDF fixture');
        await Fs.write(Fs.join(cwd, 'note.txt'), 'not a pdf');
        await Fs.ensureDir(Fs.join(cwd, '.pi'));
        await Fs.write(Fs.join(cwd, '.pi', 'secret.pdf'), '%PDF protected');
        await Deno.symlink(Fs.join(cwd, 'scan.pdf'), Fs.join(cwd, 'scan-link.pdf'));

        const traversal = await guards.guardInput({ requested: '../scan.pdf', cwd, policy });
        expect(traversal.ok).to.eql(false);
        if (!traversal.ok) expect(traversal.reason).to.contain('.. segments');

        const protectedPath = await guards.guardInput({ requested: '.pi/secret.pdf', cwd, policy });
        expect(protectedPath.ok).to.eql(false);
        if (!protectedPath.ok) expect(protectedPath.reason).to.contain('protected');

        const nonPdf = await guards.guardInput({ requested: 'note.txt', cwd, policy });
        expect(nonPdf.ok).to.eql(false);
        if (!nonPdf.ok) expect(nonPdf.reason).to.contain('.pdf extension');

        const fileProbe = await guards.guardInput({ requested: 'bad\0.pdf', cwd, policy });
        expect(fileProbe.ok).to.eql(false);
        if (!fileProbe.ok) expect(fileProbe.reason).to.contain('could not inspect source path');

        const symlink = await guards.guardInput({ requested: 'scan-link.pdf', cwd, policy });
        expect(symlink.ok).to.eql(false);
        if (!symlink.ok) expect(symlink.reason).to.contain('symlink');

        const range = guards.resolvePageRange({ pageStart: 1, pageEnd: 3 }, 10, 2);
        expect(range.ok).to.eql(false);
        if (!range.ok) expect(range.reason).to.contain('maxPages');
        expect(guards.parsePdfInfoPages('Pages: 3\n')).to.eql(3);
        expect(guards.parsePdfInfoPages('no page count')).to.eql(undefined);
      } finally {
        await Fs.remove(cwd);
      }
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

function commandCaps() {
  return { maxStdoutBytes: 64_000, maxStderrBytes: 64_000 };
}

function ocrExecutables(): t.PiOcrExtension.Dependency.Executables {
  return {
    pdfinfo: '/ocr/bin/pdfinfo' as t.StringPath,
    pdftoppm: '/ocr/bin/pdftoppm' as t.StringPath,
    tesseract: '/ocr/bin/tesseract' as t.StringPath,
  };
}

async function importGenerated(path: t.StringPath): Promise<GeneratedOcrModule> {
  const url = Path.toFileUrl(path);
  url.search = `v=${Date.now()}.${Math.random()}`;
  return await import(url.href) as GeneratedOcrModule;
}
