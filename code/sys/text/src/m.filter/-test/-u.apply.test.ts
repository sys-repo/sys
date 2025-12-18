import { describe, expect, it } from '../../-test.ts';
import { Filter } from '../mod.ts';

describe('Filter.apply', () => {
  it('returns all candidates for empty query (stable order)', () => {
    const candidates = [
      { text: 'foo', value: 1 },
      { text: 'bar', value: 2 },
    ] as const;

    const res = Filter.apply('', candidates);

    expect(res.map((r) => r.value)).to.eql([1, 2]);
    expect(res.every((r) => r.match)).to.equal(true);
    expect(res.every((r) => r.score === 0)).to.equal(true);
  });

  it('filters out non-matches', () => {
    const candidates = [
      { text: 'foo', value: 1 },
      { text: 'bar', value: 2 },
      { text: 'baz', value: 3 },
    ] as const;

    const res = Filter.apply('ba', candidates, { mode: 'contains' });
    expect(res.map((r) => r.value)).to.eql([2, 3]);
    expect(res.every((r) => r.match)).to.equal(true);
  });

  it('sorts by score desc and preserves original order on ties', () => {
    const candidates = [
      { text: 'a1', value: 1 }, // tie
      { text: 'a2', value: 2 }, // tie
      { text: 'xxxa', value: 3 }, // lower score (later start)
    ] as const;

    const res = Filter.apply('a', candidates, { mode: 'contains' });
    expect(res.map((r) => r.value)).to.eql([1, 2, 3]);
  });

  it('orders tighter fuzzy matches above looser matches', () => {
    const candidates = [
      { text: 'f---o---o---b---a---r', value: 'loose' },
      { text: 'foobar', value: 'tight' },
    ] as const;

    const res = Filter.apply('fb', candidates, { mode: 'fuzzy' });
    expect(res.map((r) => r.value)).to.eql(['tight', 'loose']);
    expect(res[0].score).to.be.greaterThan(res[1].score);
  });

  it('respects options.limit', () => {
    const candidates = [
      { text: 'foobar', value: 1 },
      { text: 'foo', value: 2 },
      { text: 'bar', value: 3 },
    ] as const;

    const res = Filter.apply('f', candidates, { mode: 'contains', limit: 1 });
    expect(res.length).to.equal(1);
  });
});
