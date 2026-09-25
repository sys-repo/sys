import { describe, expect, it } from '../../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { Ocr } from '../mod.ts';
import type { OcrPolicy as GeneratedOcrPolicy } from '../tmpl/t.ts';
import { expectStandaloneGeneratedExtension } from '../../-test/u.generated.ts';
import { importGenerated, ocrExecutables, type RegisteredTool } from './u.fixture.generated.ts';

type AssertAssignable<From, To> = From extends To ? true : never;

describe(`Pi: OCR extension / write`, () => {
  it('keeps host policy assignable to the generated standalone policy ABI', () => {
    const compatible: AssertAssignable<
      t.PiOcrExtension.Extension.Policy,
      GeneratedOcrPolicy
    > = true;

    expect(compatible).to.eql(true);
  });

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
      const mod = await Fs.readText(res.path);
      if (!mod.ok) throw mod.error;
      const modText = mod.data ?? '';
      const command = await Fs.readText(Fs.join(Fs.dirname(res.path), 'u.command.ts'));
      if (!command.ok) throw command.error;
      const commandText = command.data ?? '';
      const schema = await Fs.readText(Fs.join(Fs.dirname(res.path), 'u.schema.ts'));
      if (!schema.ok) throw schema.error;
      const schemaText = schema.data ?? '';
      const generatedText = [modText, commandText, schemaText].join('\n');

      expect(res.path).to.eql(Fs.join(cwd, '.pi', '@sys', 'extensions', 'ocr', 'mod.ts'));
      expect(res.args).to.eql(['--extension', res.path]);
      expect(res.ops.some((op) => op.kind === 'create')).to.eql(true);
      expect(modText).to.contain("name: 'ocr_pdf'");
      expect(modText).to.contain('"pdfinfo": "/ocr/bin/pdfinfo"');
      expect(modText).to.contain('"pdftoppm": "/ocr/bin/pdftoppm"');
      expect(modText).to.contain('"tesseract": "/ocr/bin/tesseract"');
      expect(modText).to.contain('"maxChars": 1234');
      expect(commandText).to.contain('new Deno.Command');
      expectStandaloneGeneratedExtension(generatedText);
      expect(modText).not.to.contain('__OCR_POLICY__');
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
