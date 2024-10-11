import { describe, expect, it } from '../../-test.ts';
import { Lens, Registry } from '../Doc.Lens/mod.ts';
import { Namespace } from '../Doc.Namespace/mod.ts';
import { Doc } from './mod.ts';

describe('Doc API (index)', () => {
  it('lens', () => {
    expect(Doc.Lens).to.equal(Lens);
    expect(Doc.lens).to.eql(Lens.create);
    expect(Doc.Lens.Registry).to.equal(Registry);
  });

  it('ns ("namespace")', () => {
    expect(Doc.Namespace).to.equal(Namespace);
    expect(Doc.ns).to.equal(Namespace.create);
  });
});
