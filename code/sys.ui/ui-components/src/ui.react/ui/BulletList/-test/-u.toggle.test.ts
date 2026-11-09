import { describe, expect, it } from '../../../-test.ts';
import { BulletList } from '../mod.ts';

describe('BulletList.toggle', () => {
  it('empty-string selection → remove or preserve the ID rather than treating it as absent', () => {
    expect(BulletList.toggle('', '')).to.eql([]);
    expect(BulletList.toggle('', 'other')).to.eql(['', 'other']);
    expect(BulletList.toggle(['', 'other'], '')).to.eql(['other']);
  });

  it('mutable and frozen input → preserve caller state and return readonly membership', () => {
    for (const selected of [['a'], Object.freeze(['a'])]) {
      expect(BulletList.toggle(selected, 'b')).to.eql(['a', 'b']);
      expect(BulletList.toggle(selected, 'a')).to.eql([]);
      expect(selected).to.eql(['a']);
    }
  });

  it('adds id when selected is undefined', () => {
    const res = BulletList.toggle(undefined, 'foo');
    expect(res).to.eql(['foo']);
  });

  it('removes id when selected is same single string', () => {
    const res = BulletList.toggle('foo', 'foo');
    expect(res).to.eql([]);
  });

  it('adds id when selected is different single string', () => {
    const res = BulletList.toggle('foo', 'bar');
    expect(res).to.eql(['foo', 'bar']);
  });

  it('adds id when selected array does not include it', () => {
    const res = BulletList.toggle(['foo', 'bar'], 'baz');
    expect(res).to.eql(['foo', 'bar', 'baz']);
  });

  it('removes id when selected array includes it', () => {
    const res = BulletList.toggle(['foo', 'bar', 'baz'], 'bar');
    expect(res).to.eql(['foo', 'baz']);
  });
});
