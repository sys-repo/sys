import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Path } from '../common.ts';
import { Fs } from '../mod.ts';

describe('Fs: directory', () => {
  describe('Fs.makeTempDir', () => {
    it('returns an FsDir handle and creates the directory', async () => {
      const dir = await Fs.makeTempDir({ prefix: 'fs-temp-a-' });
      expectTypeOf(dir).toEqualTypeOf<t.FsDir>();
      expect(typeof dir.absolute).to.eql('string');

      const exists = await Fs.exists(dir.absolute);
      expect(exists).to.eql(true);

      await Fs.remove(dir.absolute);
      const existsAfter = await Fs.exists(dir.absolute);
      expect(existsAfter).to.eql(false);
    });

    it('applies prefix/suffix to directory name', async () => {
      const prefix = 'fs-temp-b-';
      const suffix = '-zed';
      const dir = await Fs.makeTempDir({ prefix, suffix });
      const name = Path.basename(dir.absolute);

      expect(name.startsWith(prefix)).to.eql(true);
      expect(name.endsWith(suffix)).to.eql(true);

      await Fs.remove(dir.absolute);
    });

    it('creates the temp dir under a specified parent "dir"', async () => {
      const parent = await Fs.makeTempDir({ prefix: 'fs-temp-parent-' });
      const child = await Fs.makeTempDir({ dir: parent.absolute, prefix: 'child-' });

      const parentOfChild = Path.dirname(child.absolute);
      expect(parentOfChild).to.eql(parent.absolute);

      await Fs.remove(child.absolute);
      await Fs.remove(parent.absolute);
    });

    it('produces unique directories on repeated calls', async () => {
      const a = await Fs.makeTempDir({ prefix: 'fs-temp-c-' });
      const b = await Fs.makeTempDir({ prefix: 'fs-temp-c-' });

      expect(a.absolute).to.not.eql(b.absolute);

      await Fs.remove(a.absolute);
      await Fs.remove(b.absolute);
    });
  });
});
