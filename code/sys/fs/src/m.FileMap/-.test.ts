import { type t, describe, expect, it } from '../-test.ts';
import { Fs } from '../m.Fs/mod.ts';
import { Path } from '../m.Path/mod.ts';
import { Sample } from './-u.ts';
import { FileMap } from './mod.ts';

describe('FileMap', () => {
  describe('bundle', () => {
    const dir = Sample.source.dir;

    it('bundle ← all paths (sorted)', async () => {
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
          source: (await Fs.read(path.source)).data!,
          target: (await Fs.read(path.target)).data!,
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
      expect(ls).to.eql([...Object.keys(bundle), 'foo.txt'].toSorted());
    });

    describe('errors', () => {
      it('error: corrupted file', async () => {
        const sample = Sample.init();
        const bundle = await FileMap.bundle(dir);

        bundle['.gitignore'] = 'xx💀xx'; // NB: simulate a corruption to the file-content.

        const res = await FileMap.write(sample.target, bundle);
        expect(res.error?.message).to.include('Failed while writing FileMap');
        expect(res.error?.message).to.include('/.gitignore');
        expect(res.error?.cause?.message).to.include('Input not a "data:" URI');
      });
    });
  });

  describe('fromJson', () => {
    it('ok: minimal valid map', () => {
      const json = { 'a.txt': 'data:text/plain;base64,QQ==' };
      const res = FileMap.fromJson(json);
      expect(res.error).to.eql(undefined);
      expect(res.fileMap).to.eql(json);
    });

    it('ok: multiple entries', () => {
      const json = {
        'src/mod.ts': 'data:application/typescript;base64,LyoqKiov',
        '.gitignore': 'data:text/plain;base64,LmRpc3QK',
      };
      const res = FileMap.fromJson(json);
      expect(res.error).to.eql(undefined);
      expect(res.fileMap).to.eql(json);
      // sanity: values are strings (not decoded here).
      expect(typeof res.fileMap?.['src/mod.ts']).to.eql('string');
    });

    it('error: non-object (null)', () => {
      const res = FileMap.fromJson(null as unknown);
      expect(res.fileMap).to.eql(undefined);
      expect(res.error?.message).to.include('expected an object');
    });

    it('error: non-object (array)', () => {
      const res = FileMap.fromJson(['x'] as unknown);
      expect(res.fileMap).to.eql(undefined);
      expect(res.error?.message).to.include('expected an object');
    });

    it('error: non-object (primitive)', () => {
      const res = FileMap.fromJson('nope' as unknown);
      expect(res.fileMap).to.eql(undefined);
      expect(res.error?.message).to.include('expected an object');
    });

    it('error: empty key', () => {
      const json = { '': 'data:text/plain;base64,QQ==' } as unknown;
      const res = FileMap.fromJson(json);
      expect(res.fileMap).to.eql(undefined);
      expect(res.error?.message).to.include('keys must be non-empty strings');
    });

    it('error: value is not a string', () => {
      const json = { 'a.txt': 123 } as unknown;
      const res = FileMap.fromJson(json);
      expect(res.fileMap).to.eql(undefined);
      expect(res.error?.message).to.include('must be a string');
      expect(res.error?.message).to.include('a.txt');
    });
  });
});
