import { describe, expect, it } from '../../-test.ts';
import { Filter } from '../mod.ts';
import { matchContains } from '../u.match.contains.ts';

describe(`Filter.match (contains)`, () => {
  it('empty query matches everything', () => {
    const res = matchContains('', 'abc');
    expect(res.match).to.eql(true);
    expect(res.score).to.eql(0);
    expect(res.ranges).to.eql(undefined);
  });

  it('matches single token (case-insensitive by default)', () => {
    const res = matchContains('Foo', 'xx foo yy');
    expect(res.match).to.eql(true);
    expect(res.score).to.be.greaterThan(0);
    expect(res.ranges).to.eql([{ start: 3, end: 6 }]);
  });

  it('respects caseSensitive:true', () => {
    const res = matchContains('Foo', 'xx foo yy', { caseSensitive: true });
    expect(res.match).to.eql(false);
    expect(res.score).to.eql(0);
  });

  it('requires all tokens to match (AND semantics)', () => {
    const ok = matchContains('foo bar', 'xx foo yy bar zz');
    expect(ok.match).to.eql(true);
    expect(ok.ranges).to.eql([
      { start: 3, end: 6 },
      { start: 10, end: 13 },
    ]);

    const nope = matchContains('foo bar', 'xx foo yy baz zz');
    expect(nope.match).to.eql(false);
    expect(nope.score).to.eql(0);
  });

  it('wire shape: Filter.match will call into contains later', () => {
    // Placeholder “shape” assertion for now (keeps the test file honest about intent).
    // We wire Filter.match in the next commit when m.Filter.ts exposes it.
    expect(Filter.parse).to.be.a('function');
  });
});
