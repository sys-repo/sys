import { describe, expect, it } from '../../../-test.ts';
import { BulletList } from '../mod.ts';

describe('BulletList.toggle', () => {
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
