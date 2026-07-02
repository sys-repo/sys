import { describe, expect, it } from '../../-test.ts';
import { deep, unique, uniqueBy } from '../../m.Eql/m.Eql.ts';
import { R } from '../libs.R.ts';

describe('legacy R facade', () => {
  it('routes equality helpers through Eql', () => {
    expect(R.equals).to.equal(deep);
    expect(R.uniq).to.equal(unique);
    expect(R.uniqBy).to.equal(uniqueBy);
  });

  it('R.equals uses structural equality', () => {
    expect(R.equals({ a: 1, b: [2] }, { a: 1, b: [2] })).to.eql(true);
    expect(R.equals({ a: 1, b: [2] }, { a: 1, b: [3] })).to.eql(false);
  });

  it('R.uniq dedupes by structural equality', () => {
    const a = { id: 1 };
    const b = { id: 1 };
    const c = { id: 2 };

    expect(R.uniq([a, b, c])).to.eql([a, c]);
  });

  it('R.uniqBy dedupes structural keys', () => {
    const a = { key: { id: 1 }, value: 'a' };
    const b = { key: { id: 1 }, value: 'b' };
    const c = { key: { id: 2 }, value: 'c' };

    expect(R.uniqBy((item) => item.key, [a, b, c])).to.eql([a, c]);
  });
});
