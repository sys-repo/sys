import { describe, expect, it } from '../../-test.ts';
import { Compare } from '../m.Compare.ts';
import { Str } from '../mod.ts';

describe('Str.Compare', () => {
  it('API', () => {
    expect(Str.Compare).to.equal(Compare);
  });

  describe('Compare.natural', () => {
    it('sorts numeric segments', () => {
      const compare = Str.Compare.natural();
      const list = ['shard.1', 'shard.11', 'shard.2'];
      const sorted = list.toSorted(compare);
      expect(sorted).to.eql(['shard.1', 'shard.2', 'shard.11']);
    });

    it('honors options', () => {
      const compare = Str.Compare.natural({ locale: 'en', sensitivity: 'variant' });
      const list = ['a2', 'a10', 'a1'];
      const sorted = list.toSorted(compare);
      expect(sorted).to.eql(['a1', 'a2', 'a10']);
    });
  });

  describe('Compare.codeUnit', () => {
    it('sorts by UTF-16 code-unit order without locale collation', () => {
      const compare = Str.Compare.codeUnit();
      const list = ['a2', 'a10', 'A', 'a1'];
      const sorted = list.toSorted(compare);
      expect(sorted).to.eql(['A', 'a1', 'a10', 'a2']);
    });

    it('returns 0 for equal strings', () => {
      const compare = Str.Compare.codeUnit();
      expect(compare('same', 'same')).to.eql(0);
    });
  });
});
