import { describe, expect, it, Pkg } from '../../-test.ts';
import { CompositeHash } from '../mod.ts';

describe('CompositeHash.size', () => {
  it('sized parts → sums declared bytes', () => {
    const builder = CompositeHash.builder()
      .add('a.ts', new Uint8Array([1, 2, 3]))
      .add('b.ts', new Uint8Array([1, 2]))
      .add('c.ts', new Uint8Array([1]));
    const hash = CompositeHash.toComposite(builder);
    const result = CompositeHash.size(hash.parts);
    expect(result).to.eql(6);
  });

  it('filtered parts → sums only selected bytes', () => {
    const builder = CompositeHash.builder()
      .add('pkg/a.ts', new Uint8Array([1, 2, 3]))
      .add('pkg/b.ts', new Uint8Array([1, 2]))
      .add('foo.ts', new Uint8Array([999]));
    const hash = CompositeHash.toComposite(builder);
    const result = CompositeHash.size(hash.parts, (e) => Pkg.Dist.Is.codePath(e.path));
    expect(result).to.eql(5);
  });

  it('parts without byte lengths → size is unknown', () => {
    const builder = CompositeHash.builder()
      .add('pkg/a.ts', 'string')
      .add('pkg/b.ts', 'not-file-no-size');

    const hash = CompositeHash.toComposite(builder);
    const result = CompositeHash.size(hash.parts);
    expect(result).to.eql(undefined);
  });
});
