import { describe, it, expect, type t } from '../-test.ts';
import { Tmpl } from './u.ts';

describe('CSS Teamplates', () => {
  it('empty', () => {
    expect(Tmpl.transform()).to.eql({});
    expect(Tmpl.transform(undefined)).to.eql({});
    expect(Tmpl.transform(null as any)).to.eql({});
    expect(Tmpl.transform()).to.eql({});
  });

  it('no change', () => {
    expect(Tmpl.transform({})).to.eql({});
    expect(Tmpl.transform({ fontSize: 16 })).to.eql({ fontSize: 16 });
  });

  describe('Absolute', () => {
    /**
     * TODO 🐷
     */
  });
});
