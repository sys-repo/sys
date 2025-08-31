import { type t, describe, expect, it } from '../../-test.ts';

import { Sample } from '../-u.ts';
import { Fs, Path } from '../common.ts';
import { FileMap } from '../mod.ts';

describe('FileMap', () => {
  describe('toMap', () => {
    const dir = Sample.source.dir;

    it('toMap ← all paths (sorted)', async () => {
      const res = await FileMap.toMap(dir);
      const paths = (await Sample.source.ls()).map((p) => p.slice(dir.length + 1)).sort();
      expect(Object.keys(res).sort()).to.eql(paths);
      expect(res['images/vector.svg']).to.exist;
      expect(res['images/pixels.png']).to.exist;
    });

    it('toMap: filtered', async () => {
      const res = await FileMap.toMap(dir, (e) => !e.contentType.startsWith('image/'));
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
      const bundle = await FileMap.toMap(dir);
      const res = await FileMap.write(sample.target, bundle);
      expect(res.target).to.eql(Path.resolve(sample.target));
      expect(res.error).to.eql(undefined);
      await expectEqual(dir, sample.target, bundle);
    });

    it('additive (by default)', async () => {
      const sample = Sample.init();
      const bundle = await FileMap.toMap(dir);
      const target = sample.target;
      await Fs.write(Path.join(target, 'foo.txt'), '👋');
      await FileMap.write(target, bundle);
      const ls = (await Fs.ls(target)).map((p) => p.slice(Path.resolve(target).length + 1)).sort();
      expect(ls).to.eql([...Object.keys(bundle), 'foo.txt'].toSorted());
    });

    describe('errors', () => {
      it('error: corrupted file', async () => {
        const sample = Sample.init();
        const bundle = await FileMap.toMap(dir);

        bundle['.gitignore'] = 'xx💀xx'; // NB: simulate a corruption to the file-content.

        const res = await FileMap.write(sample.target, bundle);
        expect(res.error?.message).to.include('Failed while writing FileMap');
        expect(res.error?.message).to.include('/.gitignore');
        expect(res.error?.cause?.message).to.include('Input not a "data:" URI');
      });
    });
  });

  describe('validate', () => {
    it('ok: minimal valid map', () => {
      const json = { 'a.txt': 'data:text/plain;base64,QQ==' };
      const res = FileMap.validate(json);
      expect(res.error).to.eql(undefined);
      expect(res.fileMap).to.eql(json);
    });

    it('ok: multiple entries', () => {
      const json = {
        'src/mod.ts': 'data:application/typescript;base64,LyoqKiov',
        '.gitignore': 'data:text/plain;base64,LmRpc3QK',
      };
      const res = FileMap.validate(json);
      expect(res.error).to.eql(undefined);
      expect(res.fileMap).to.eql(json);
      // Sanity check: values are strings (not decoded here).
      expect(typeof res.fileMap?.['src/mod.ts']).to.eql('string');
    });

    describe('validate: string input', () => {
      it('ok: parses valid JSON string', () => {
        const jsonStr = JSON.stringify({ 'a.txt': 'data:text/plain;base64,QQ==' });
        const res = FileMap.validate(jsonStr);
        expect(res.error).to.eql(undefined);
        expect(res.fileMap).to.eql({ 'a.txt': 'data:text/plain;base64,QQ==' });
      });

      it('error: parse failure', () => {
        const res = FileMap.validate('{ not valid }');
        expect(res.fileMap).to.eql(undefined);
        expect(res.error?.message).to.include('JSON parse failed');
        expect(res.error?.cause?.name).to.eql('SyntaxError');
        expect(res.error?.cause?.message).to.include(`Expected property name or '}'`);
      });
    });

    describe('errors', () => {
      it('error: non-object (null)', () => {
        const res = FileMap.validate(null as unknown);
        expect(res.fileMap).to.eql(undefined);
        expect(res.error?.message).to.include('expected an object');
      });

      it('error: non-object (array)', () => {
        const res = FileMap.validate(['x'] as unknown);
        expect(res.fileMap).to.eql(undefined);
        expect(res.error?.message).to.include('expected an object');
      });

      it('error: non-object (primitive)', () => {
        const res = FileMap.validate(123 as unknown);
        expect(res.fileMap).to.eql(undefined);
        expect(res.error?.message).to.include('expected an object');
      });

      it('error: empty key', () => {
        const json = { '': 'data:text/plain;base64,QQ==' } as unknown;
        const res = FileMap.validate(json);
        expect(res.fileMap).to.eql(undefined);
        expect(res.error?.message).to.include('keys must be non-empty strings');
      });

      it('error: value is not a string', () => {
        const json = { 'a.txt': 123 } as unknown;
        const res = FileMap.validate(json);
        expect(res.fileMap).to.eql(undefined);
        expect(res.error?.message).to.include('must be a string');
        expect(res.error?.message).to.include('a.txt');
      });
    });
  });
});
