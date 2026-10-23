import { describe, expect, it } from '../../-test.ts';
import { Hash } from '../../m.Hash/mod.ts';
import { CompositeHash, FileHashUri } from '../mod.ts';

describe('CompositeHash public surface', () => {
  it('Uri.File → shares the named FileHashUri export', () => {
    expect(CompositeHash.Uri.File).to.equal(FileHashUri);
  });

  it('toComposite → converts builders, accepts snapshots and supplies an empty value', () => {
    const builder = CompositeHash.builder().add('foo', '1234');
    const a = CompositeHash.toComposite(builder);
    const b = CompositeHash.toComposite(builder.toObject());
    const c = CompositeHash.toComposite();

    expect(a).to.eql(builder.toObject());
    expect(b).to.eql(a);
    expect(c).to.eql({ digest: '', parts: {} });
    expect(Hash.Is.composite(a)).to.eql(true);
    expect(Hash.Is.composite(b)).to.eql(true);
    expect(Hash.Is.composite(c)).to.eql(true);

    expect(Hash.Is.compositeBuilder(a)).to.eql(false);
    expect(Hash.Is.compositeBuilder(b)).to.eql(false);
    expect(Hash.Is.compositeBuilder(c)).to.eql(false);

    expect(Hash.Is.empty(a)).to.eql(false);
    expect(Hash.Is.empty(b)).to.eql(false);
    expect(Hash.Is.empty(c)).to.eql(true);
  });
});
