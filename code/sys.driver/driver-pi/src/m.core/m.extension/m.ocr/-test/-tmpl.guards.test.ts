import { describe, expect, it } from '../../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { Ocr } from '../mod.ts';
import { importGenerated, ocrExecutables } from './u.fixture.generated.ts';

describe(`Pi: OCR extension / generated guards`, () => {
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
