import { describe, expect, it, type t } from '../-test.ts';
import { Fs } from '../m.Fs/mod.ts';
import { Path } from '../m.Path/mod.ts';
import { Sample } from './-u.ts';
import { FileMap } from './mod.ts';

describe('FileMap', () => {
  describe('bundle', () => {
    const dir = Sample.source.dir;

    it('bundle ← all paths', async () => {
      const res = await FileMap.bundle(dir);
      const paths = (await Sample.source.ls()).map((p) => p.slice(dir.length + 1)).sort();
      expect(Object.keys(res).sort()).to.eql(paths);
      expect(res['images/vector.svg']).to.exist;
      expect(res['images/pixels.png']).to.exist;
    });

    it('bundle: filtered', async () => {
      const res = await FileMap.bundle(dir, (e) => !e.contentType.startsWith('image/'));
      // NB: image content-types filtered out.
      expect(res['images/vector.svg']).to.eql(undefined);
      expect(res['images/wax.png']).to.eql(undefined);
    });
  });

  describe('write', () => {
    const dir = Sample.source.dir;

    const areEqual = (a: Uint8Array, b: Uint8Array) => {
      return a.length === b.length && a.every((val, i) => val === b[i]);
    };

    const compare = async (sourceDir: t.StringDir, targetDir: t.StringDir, bundle: t.FileMap) => {
      for (const key of Object.keys(bundle)) {
        const path = {
          source: Fs.resolve(sourceDir, key),
          target: Fs.resolve(targetDir, key),
        };
        const file = {
          source: await Deno.readFile(path.source),
          target: await Deno.readFile(path.target),
        };
        if (!areEqual(file.source, file.target)) return false;
      }
      return true;
    };

    const expectEqual = async (
      sourceDir: t.StringDir,
      targetDir: t.StringDir,
      bundle: t.FileMap,
    ) => {
      expect(await compare(sourceDir, targetDir, bundle)).to.eql(true);
    };

    it('writes to target directory', async () => {
      const sample = Sample.init();
      const bundle = await FileMap.bundle(dir);
      const res = await FileMap.write(sample.target, bundle);
      expect(res.target).to.eql(Path.resolve(sample.target));
      expect(res.error).to.eql(undefined);
      await expectEqual(dir, sample.target, bundle);
    });

    it('additive (by default)', async () => {
      const sample = Sample.init();
      const bundle = await FileMap.bundle(dir);
      const target = sample.target;
      await Fs.write(Path.join(target, 'foo.txt'), '👋');
      await FileMap.write(target, bundle);
      const ls = (await Fs.ls(target)).map((p) => p.slice(Path.resolve(target).length + 1)).sort();
      expect(ls).to.eql([...Object.keys(bundle), 'foo.txt'].sort());
    });

    describe('errors', () => {
      it('error: corrupted file', async () => {
        const sample = Sample.init();
        const bundle = await FileMap.bundle(dir);

        bundle['.gitignore'] = 'xxx'; // NB: corrupt the file.

        const res = await FileMap.write(sample.target, bundle);
        expect(res.error?.message).to.include('Failed while writing FileMap');
        expect(res.error?.message).to.include('/.gitignore');
        expect(res.error?.cause?.message).to.include('Input not a "data:" URI');
      });
    });
  });
});
