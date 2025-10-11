import { type t, describe, expect, it } from '../../-test.ts';
import { Yaml } from '../mod.ts';

describe('Yaml.Sourcemap', () => {
  describe('Sourcemap.locate', () => {
    const makeMap = (lookup: t.YamlSourceMapLike['lookup']): t.YamlSourceMapLike => ({ lookup });

    it('returns value position when available', () => {
      const map = makeMap(() => ({
        value: {
          pos: [1, 2],
          linePos: [
            { line: 1, col: 1 },
            { line: 1, col: 2 },
          ],
        },
      }));
      const res = Yaml.Sourcemap.locate(map, ['foo']);
      expect(res?.pos).to.eql([1, 2]);
    });

    it('falls back to key position when value missing', () => {
      const map = makeMap(() => ({
        key: {
          pos: [3, 4],
          linePos: [
            { line: 2, col: 3 },
            { line: 2, col: 4 },
          ],
        },
      }));
      const res = Yaml.Sourcemap.locate(map, ['bar']);
      expect(res?.pos).to.eql([3, 4]);
    });

    it('returns undefined when lookup yields undefined', () => {
      const map = makeMap(() => undefined);
      const res = Yaml.Sourcemap.locate(map, ['missing']);
      expect(res).to.eql(undefined);
    });

    it('returns undefined when both key and value are absent', () => {
      const map = makeMap(() => ({}) as any);
      const res = Yaml.Sourcemap.locate(map, ['empty']);
      expect(res).to.eql(undefined);
    });
  });
});
