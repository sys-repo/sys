import { describe, expect, it } from '../../-test.ts';
import { Filter } from '../mod.ts';

describe('Filter.match (fuzzy)', () => {
  it('matches simple subsequence', () => {
    const r = Filter.match('fb', 'foobar', { mode: 'fuzzy' });
    expect(r.match).to.eql(true);
    expect(r.score).to.be.greaterThan(0);
    expect(r.ranges).to.eql([{ start: 0, end: 6 }]);
  });

  it('fails when characters are out of order', () => {
    const r = Filter.match('bf', 'foobar', { mode: 'fuzzy' });
    expect(r.match).to.eql(false);
  });

  it('is case-insensitive by default', () => {
    const r = Filter.match('FB', 'FooBar', { mode: 'fuzzy' });
    expect(r.match).to.eql(true);
  });

  it('respects caseSensitive option', () => {
    const r = Filter.match('fb', 'FooBar', {
      mode: 'fuzzy',
      caseSensitive: true,
    });
    expect(r.match).to.eql(false);
  });

  it('matches multiple tokens in order', () => {
    const q = Filter.parse('fb ba');
    const r = Filter.match(q, 'foo bar baz', { mode: 'fuzzy' });

    expect(r.match).to.eql(true);
    expect(r.ranges?.length).to.eql(2);
  });

  it('fails if any token does not match', () => {
    const q = Filter.parse('fb zz');
    const r = Filter.match(q, 'foo bar baz', { mode: 'fuzzy' });
    expect(r.match).to.eql(false);
  });

  it('scores tighter matches higher than loose matches', () => {
    const tight = Filter.match('fb', 'foobar', { mode: 'fuzzy' });
    const loose = Filter.match('fb', 'f---o---o---b---a---r', { mode: 'fuzzy' });

    expect(tight.score).to.be.greaterThan(loose.score);
  });

  it('returns match=true for empty query', () => {
    const r = Filter.match('', 'anything', { mode: 'fuzzy' });
    expect(r.match).to.eql(true);
  });
});
