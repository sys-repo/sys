import { type t, expect, Fs, Path, describe, it } from '../../-test.ts';
import { makeTmpl } from '../mod.ts';
import { encode, listRelative, makeProcessFile, tmpDir } from './-u.ts';

/**
 * Build a tiny FileMap inline.
 */
const makeFileMap = (): t.FileMap => ({
  'README.md': encode('README.md' as t.StringPath, '# readme\n'),
  'mydir/src/index.ts': encode('mydir/src/index.ts', 'export const ok = 1;\n'),
  'mydir/.gitignore-': encode('mydir/.gitignore-', 'node_modules\n'),
});

describe(`@sys/tmpl-engine: kernel`, () => {
  /**
   * Kernel under test:
   */
  const kernel = makeTmpl({
    sourceDir: '-tmpl',
    loadFileMap: async () => makeFileMap(),
    makeProcessFile,
  });

  it('API', async () => {
    const m = await import('@sys/tmpl-engine');
    expect(m.makeTmpl).to.equal(makeTmpl);
  });

  describe('bundle', () => {
    it('writes sorted JSON with expected count', async () => {
      const src = await tmpDir('kernel-bundle-src-');
      const out = await tmpDir('kernel-bundle-out-');

      // create tiny source layout
      await Fs.ensureDir(Path.join(src, 'a'));
      await Fs.ensureDir(Path.join(src, 'b'));
      await Fs.write(Path.join(src, 'b', 'two.txt'), '2');
      await Fs.write(Path.join(src, 'a', 'one.txt'), '1');

      const outFile = Path.join(out, 'bundle.json');
      const res = await kernel.bundle({ srcDir: src, outFile });

      expect(res.outFile).to.eql(Path.resolve(outFile));
      expect(res.count).to.eql(2);

      // verify output exists and keys are sorted
      const json = (await Fs.readText(outFile)).data ?? '';
      const map = JSON.parse(json) as t.FileMap;
      const keys = Object.keys(map);
      expect(keys).to.eql([...keys].sort());
    });
  });

  describe('write', () => {
    it('dryRun: returns ops and does not touch target', async () => {
      const target = await tmpDir('kernel-write-dry-');

      const res = await kernel.write(target as t.StringDir, {
        dryRun: true,
        bundleRoot: 'mydir',
      });

      expect(res.ops).to.be.an('array').that.is.not.empty;

      const files = await listRelative(target);
      expect(files).to.eql([]); // nothing written in dryRun
    });

    it('real: strips bundleRoot and renames .gitignore-', async () => {
      const target = await tmpDir('kernel-write-real-');

      const res = await kernel.write(target as t.StringDir, {
        dryRun: false,
        bundleRoot: 'mydir',
      });

      expect(res.ops).to.be.an('array').that.is.not.empty;

      const files = await listRelative(target);

      expect(files).to.include('src/index.ts');
      expect(files).to.include('.gitignore');
      expect(files).to.not.include('README.md'); // top-level excluded
    });
  });

  describe('table', () => {
    it('renders from native ops', async () => {
      const target = await tmpDir('kernel-write-table-');
      const res = await kernel.write(target as t.StringDir, {
        dryRun: true,
        bundleRoot: 'mydir',
      });

      const text = kernel.table(res.ops, { dryRun: true, baseDir: target as t.StringDir });
      expect(text).to.be.a('string').and.not.empty;
    });
  });
});
