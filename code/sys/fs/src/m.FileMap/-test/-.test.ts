import { describe, expect, it } from '../../-test.ts';

import { Sample } from '../-u.ts';
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
});
