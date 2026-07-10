import { describe, expect, it } from '../../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { Ocr } from '../mod.ts';
import { importGenerated, ocrExecutables, type RegisteredTool } from './u.fixture.generated.ts';

describe(`Pi: OCR extension / write`, () => {
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
