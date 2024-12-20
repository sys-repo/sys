import { describe, expect, it, Fs, Path } from '../-test.ts';
import { FileMap } from './mod.ts';

describe('FileMap', () => {
  const SAMPLE_DIR = 'src/m.FileMap/-sample';

  describe('FileMap.bundle', () => {
    const getPaths = async (dir = SAMPLE_DIR) => {
      const glob = Fs.glob(dir);
      const paths = await glob.find('**', { includeDirs: false });
      return paths.map((m) => Path.trimCwd(m.path)).map((path) => path.slice(dir.length + 1));
    };

    it('bundle ← all paths', async () => {
      const dir = SAMPLE_DIR;
      const res = await FileMap.bundle(dir);
      expect(Object.keys(res)).to.eql(await getPaths());
      expect(res['images/vector.svg']).to.exist;
      expect(res['images/wax.png']).to.exist;
    });

    it('bundle: filtered', async () => {
      const dir = SAMPLE_DIR;
      const res = await FileMap.bundle(dir, (e) => !e.contentType.startsWith('image/'));

      // NB: image content-types filtered out.
      expect(res['images/vector.svg']).to.eql(undefined);
      expect(res['images/wax.png']).to.eql(undefined);

    });
  });
});
