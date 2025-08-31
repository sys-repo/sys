import { type t, describe, expect, it } from '../../-test.ts';

import { Sample } from '../-u.ts';
import { Fs, Path } from '../common.ts';
import { FileMap } from '../mod.ts';

describe('FileMape: write', () => {
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

  const expectEqual = async (sourceDir: t.StringDir, targetDir: t.StringDir, bundle: t.FileMap) => {
    expect(await compare(sourceDir, targetDir, bundle)).to.eql(true);
  };

  it('writes to target directory', async () => {
    const sample = await Sample.init();
    const bundle = await FileMap.toMap(dir);
    const res = await FileMap.write(sample.target, bundle);
    expect(res.target).to.eql(Path.resolve(sample.target));
    expect(res.error).to.eql(undefined);
    await expectEqual(dir, sample.target, bundle);
  });

  it('additive (by default)', async () => {
    const sample = await Sample.init();
    const bundle = await FileMap.toMap(dir);
    const target = sample.target;
    await Fs.write(Path.join(target, 'foo.txt'), '👋');
    await FileMap.write(target, bundle);
    const ls = (await Fs.ls(target)).map((p) => p.slice(Path.resolve(target).length + 1)).sort();
    expect(ls).to.eql([...Object.keys(bundle), 'foo.txt'].toSorted());
  });

  describe('errors', () => {
    it('error: corrupted file', async () => {
      const sample = await Sample.init();
      const bundle = await FileMap.toMap(dir);

      bundle['.gitignore'] = 'xx💀xx'; // NB: simulate a corruption to the file-content.

      const res = await FileMap.write(sample.target, bundle);
      expect(res.error?.message).to.include('Failed while writing FileMap');
      expect(res.error?.message).to.include('/.gitignore');
      expect(res.error?.cause?.message).to.include('Input not a "data:" URI');
    });
  });
});
