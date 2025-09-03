import { type t, describe, expect, it } from '../../-test.ts';

import { FileMap } from '../mod.ts';
import { Sample } from './-u.ts';

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
      // NB: image content-types filtered out:
      expect(res['images/vector.svg']).to.eql(undefined);
      expect(res['images/wax.png']).to.eql(undefined);
    });
  });

  describe('filter', () => {
    const dir = Sample.source.dir;

    it('returns new map (non-mutating) and filters by extension', async () => {
      const map = await FileMap.toMap(dir);
      const onlyTs = FileMap.filter(map, (e) => e.filename.endsWith('.ts'));

      // New object identity:
      expect(onlyTs).to.not.equal(map);

      // Expected paths:
      const expected = Object.keys(map)
        .filter((p) => p.endsWith('.ts'))
        .sort();
      expect(Object.keys(onlyTs).sort()).to.eql(expected);

      // Original unmodified:
      expect(map['images/vector.svg']).to.exist;
      expect(map['images/pixels.png']).to.exist;
    });

    it('filters by path prefix (exclude images/)', async () => {
      const map = await FileMap.toMap(dir);
      const noImages = FileMap.filter(map, ({ path }) => !path.startsWith('images/'));

      // Image entries removed:
      expect(noImages['images/vector.svg']).to.eql(undefined);
      expect(noImages['images/pixels.png']).to.eql(undefined);

      // Keep at least one non-image entry (if present in fixture):
      const someNonImage = Object.keys(map).find((p) => !p.startsWith('images/'));
      if (someNonImage) expect(noImages[someNonImage]).to.exist;
    });

    it('predicate can drop everything', async () => {
      const map = await FileMap.toMap(dir);
      const none = FileMap.filter(map, () => false);
      expect(Object.keys(none)).to.eql([]);
    });

    it('predicate meta-data', async () => {
      const map = await FileMap.toMap(dir);
      const fired: t.FileMapFilterArgs[] = [];

      FileMap.filter(map, (m) => {
        fired.push(m);
        return true;
      });

      const json = fired.find((m) => m.filename === 'deno.json')!;
      const ts = fired.find((m) => m.filename === 'mod.ts')!;
      const md = fired.find((m) => m.filename === 'index.md')!;
      const svg = fired.find((m) => m.filename === 'vector.svg')!;
      const png = fired.find((m) => m.filename === 'pixels.png')!;

      expect(json.contentType).to.eql('application/json');
      expect(ts.contentType).to.eql('application/typescript');
      expect(md.contentType).to.eql('text/markdown');
      expect(svg.contentType).to.eql('image/svg+xml');
      expect(png.contentType).to.eql('image/png');

      expect(json.ext).to.eql('.json');
      expect(ts.ext).to.eql('.ts');
      expect(md.ext).to.eql('.md');
      expect(svg.ext).to.eql('.svg');
      expect(png.ext).to.eql('.png');
    });
  });
});
