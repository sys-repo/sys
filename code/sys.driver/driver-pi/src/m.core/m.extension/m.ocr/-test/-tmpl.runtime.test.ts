import { describe, expect, it } from '../../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { Ocr } from '../mod.ts';
import {
  commandCaps,
  importGenerated,
  type OcrCommandInput,
  ocrExecutables,
} from './u.fixture.generated.ts';

describe(`Pi: OCR extension / generated ocr_pdf runtime`, () => {
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
