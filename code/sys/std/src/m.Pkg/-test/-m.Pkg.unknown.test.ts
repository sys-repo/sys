import { describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import { Pkg } from '../mod.ts';

describe('Pkg.unknown', () => {
  it('returns a fresh unknown package value', () => {
    const a = Pkg.unknown();
    const b = Pkg.unknown();

    expect(a).to.eql(D.unknown());
    expect(a).to.eql(b);
    expect(a).to.not.equal(b);
  });
});
