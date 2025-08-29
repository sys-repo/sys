import { c, describe, expect, it, pkg } from '../-test.ts';
import { FileMap, Fs, Path } from './common.ts';
import { Tmpl } from './mod.ts';

const BUNDLE_ROOT = 'react.catalog.folder';

const makeTmp = async () => await Fs.makeTempDir({ prefix: 'ui-factory-write-' });
const listRelative = async (dir: string) => {
  const root = Path.resolve(dir);
  const out: string[] = [];
  for await (const e of Fs.walk(root)) {
    if (e.isFile) out.push(e.path.slice(root.length + 1));
  }
  return out.sort();
};

describe(`${pkg.name}/tmpl: Template Generation`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-factory/tmpl');
    expect(m.Tmpl).to.equal(Tmpl);
    expect(m.default).to.equal(Tmpl);
  });

  describe('Tmpl.write', () => {
    it('dryRun: returns ops, does not write to target', async () => {
      const target = await makeTmp();
      const res = await Tmpl.write(target.absolute, { dryRun: true, bundleRoot: BUNDLE_ROOT });

      expect(res.source.absolute).to.be.a('string');
      expect(res.target.absolute).to.eql(target.toString());
      expect(Array.isArray(res.ops)).to.eql(true);
      expect(res.ops.length > 0).to.eql(true);

      const after = await listRelative(target.toString());
      expect(after).to.eql([]); // Nothing written in dryRun.
    });

    it('real write: writes at least one file to disk', async () => {
      const target = await makeTmp();
      const res = await Tmpl.write(target.absolute, { dryRun: false, bundleRoot: BUNDLE_ROOT });

      expect(res.target.absolute).to.eql(target.absolute);
      expect(res.ops.length > 0).to.eql(true);

      // Verify there is at least one file on disk after write.
      const files = await listRelative(target.absolute);
      expect(files.length > 0).to.eql(true);
    });

    it('validate guard: throws when bundle is invalid (simulate)', async () => {
      const target = await makeTmp();

      // Monkey patch validate just for this test scope.
      const origValidate = FileMap.validate;
      (FileMap.validate as any) = () => ({
        fileMap: undefined,
        error: { message: 'boom' },
      });

      let threw = false;
      try {
        await Tmpl.write(target.absolute, { bundleRoot: BUNDLE_ROOT });
      } catch (err: any) {
        threw = true;
        expect(String(err?.message ?? err)).to.include('Invalid catalog bundle');
      } finally {
        // Restore:
        FileMap.validate = origValidate;
      }
      expect(threw).to.eql(true);
    });
  });

  it('print: scaffold tree (for human readers)', async () => {
    const target = await makeTmp();

    // Real write so we actually have files to show.
    await Tmpl.write(target.absolute, { dryRun: false, bundleRoot: BUNDLE_ROOT });

    // Collect relative file paths.
    const root = target.absolute;
    const rels: string[] = [];
    for await (const e of Fs.walk(root)) {
      if (e.isFile) rels.push(e.path.slice(root.length + 1));
    }
    rels.sort();

    // Render a simple tree to console.
    console.info();
    console.info(c.bold(c.gray(`Tmpl${c.green('.write')}:\n`)));
    console.info(`${Fs.Fmt.tree(rels, { indent: 2 })}`);
    console.info();
  });
});
