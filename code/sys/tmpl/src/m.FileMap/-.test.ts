import { describe, expect, it, Fs, Path } from '../-test.ts';
import { FileMap } from './mod.ts';
import { Sample } from './-u.ts';

describe('FileMap', () => {
  const getPaths = async (dir = Sample.source.dir) => {
    const glob = Fs.glob(dir, { includeDirs: false });
    const paths = await glob.find('**');
    return paths.map((m) => Path.trimCwd(m.path)).map((path) => path.slice(dir.length + 1));
  };

  describe('bundle', () => {
    const dir = Sample.source.dir;

    it('bundle ← all paths', async () => {
      const res = await FileMap.bundle(dir);
      expect(Object.keys(res)).to.eql(await getPaths());
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

    it('writes to target directory', async () => {
      const sample = await Sample.init({ slug: false });
      const bundle = await FileMap.bundle(dir);
      const res = await FileMap.write(sample.target, bundle);
      expect(res.err).to.eql(undefined);

      // Very files against source.
      for (const key of Object.keys(bundle)) {
        const path = {
          source: Fs.resolve(Sample.source.dir, key),
          target: Fs.resolve(sample.target, key),
        };
        const file = {
          source: await Deno.readFile(path.source),
          target: await Deno.readFile(path.target),
        };
        expect(file.target).to.eql(file.source);
      }
    });

    it.skip('additive by default', async () => {});
    // it.skip('replace: clear before write (option)', async () => {});

    });
  });
});
