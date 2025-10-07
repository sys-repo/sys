import { describe, expect, it } from '../../-test.ts';

import { Path } from '../mod.ts';

describe('Obj.Path.Rel', () => {
  const R = Path.Rel;

  describe('relate', () => {
    it('equal', () => {
      expect(R.relate(['a', 'b'], ['a', 'b'])).to.eql('equal');
    });

    it('ancestor / descendant', () => {
      expect(R.relate(['a'], ['a', 'b'])).to.eql('ancestor');
      expect(R.relate(['a', 'b'], ['a'])).to.eql('descendant');
    });

    it('disjoint (different roots or diverging segment)', () => {
      expect(R.relate(['a'], ['b'])).to.eql('disjoint');
      expect(R.relate(['a', 'x'], ['a', 'y'])).to.eql('disjoint');
    });

    it('undefined is treated as empty path', () => {
      expect(R.relate(undefined, undefined)).to.eql('equal'); //    ← [] vs []
      expect(R.relate(undefined, ['x'])).to.eql('ancestor'); //     ← [] ⊑ ['x']
      expect(R.relate(['x'], undefined)).to.eql('descendant'); //   ← ['x'] ⊒ []
    });
  });

  describe('overlaps', () => {
    it('true for equal / ancestor / descendant', () => {
      expect(R.overlaps(['a', 'b'], ['a', 'b'])).to.eql(true); //   ← equal
      expect(R.overlaps(['a'], ['a', 'b'])).to.eql(true); //        ← ancestor
      expect(R.overlaps(['a', 'b'], ['a'])).to.eql(true); //        ← descendant
      expect(R.overlaps(undefined, ['a'])).to.eql(true); //         ← [] ⊑ ['a']
    });

    it('false for disjoint', () => {
      expect(R.overlaps(['a'], ['b'])).to.eql(false);
      expect(R.overlaps(['a', 'x'], ['a', 'y'])).to.eql(false);
    });
  });
});
