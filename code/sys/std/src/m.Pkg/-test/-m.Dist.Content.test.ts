import { describe, expect, it } from '../../-test.ts';
import { Json } from '../../m.Json/mod.ts';
import { Pkg } from '../mod.ts';

const { Content } = Pkg.Dist;
const hashA = 'sha256-559aead08264d5795d3909718cdd05abd49572e84fe55590eef31a88a08fdffd';
const part = `${hashA}:size=1`;

describe('Pkg.Dist.Content', () => {
  it('literal payload tuple → compact JSON without trailing newline or metadata', () => {
    const actual = Content.encode({ 'a.txt': part });
    // Byte-level vector. SHA-256 of these 103 UTF-8 bytes is independently fixed in FS tests.
    expect(actual).to.eql(
      '["sys.dist/v2",[["a.txt","sha256-559aead08264d5795d3909718cdd05abd49572e84fe55590eef31a88a08fdffd",1]]]',
    );
    expect(new TextEncoder().encode(actual).length).to.eql(103);
    expect(Content.scheme).to.eql('sys.dist/v2');
  });

  it('sorts exact paths by code units, not numeric, locale, or normalized Unicode order', () => {
    const names = ['\ue000', '😀', 'é', 'e\u0301', '__proto__', '2', '10'];
    const parts = Object.fromEntries(names.map((name) => [name, part]));
    const actual = Content.encode(parts);
    const expected = ['10', '2', '__proto__', 'e\u0301', 'é', '😀', '\ue000'];
    const parsed = Json.parse<[string, [string, string, number][]]>(actual);
    if (!parsed) throw new Error('Expected encoded content.');
    expect(parsed[1].map(([name]) => name)).to.eql(expected);
    expect(Content.encode(Object.fromEntries(Object.entries(parts).reverse()))).to.eql(actual);
    expect(Content.encode({ é: part })).not.to.eql(Content.encode({ 'e\u0301': part }));
    expect(Content.encode({ A: part })).not.to.eql(Content.encode({ a: part }));
  });

  it('native string escaping is fixed; escaping is not filesystem-path admission', () => {
    expect(Content.encode({ 'a"\\\n\u0000': part })).to.eql(
      '["sys.dist/v2",[["a\\"\\\\\\n\\u0000","sha256-559aead08264d5795d3909718cdd05abd49572e84fe55590eef31a88a08fdffd",1]]]',
    );
    expect(Content.encode({ a: `${hashA}:size=9007199254740991` })).to.eql(
      '["sys.dist/v2",[["a","sha256-559aead08264d5795d3909718cdd05abd49572e84fe55590eef31a88a08fdffd",9007199254740991]]]',
    );
  });

  it('commits path, checksum, and size rather than a sorted sequence of hashes', () => {
    const original = Content.encode({ a: part });
    expect(Content.encode({ b: part })).not.to.eql(original);
    expect(Content.encode({ a: `${hashA}:size=2` })).not.to.eql(original);
    expect(Content.encode({ a: `sha256-${'0'.repeat(64)}:size=1` })).not.to.eql(original);
    expect(Content.encode({ a: part, b: part })).not.to.eql(Content.encode({ b: part, c: part }));
  });

  it('rejects empty inventories, missing sizes, noncanonical numbers, and malformed scalars', () => {
    expect(() => Content.encode({})).to.throw(TypeError);
    for (const path of ['', '\ud800', '\udfff', 'a\ud800b']) {
      expect(() => Content.encode({ [path]: part })).to.throw(TypeError);
    }
    for (const value of [hashA, `${hashA}:size=01`, `${hashA}:size=1e3`, `${hashA}:size=-0`]) {
      expect(() => Content.encode({ a: value })).to.throw(TypeError);
    }
  });

  it('refuses accessors without invoking them', () => {
    let calls = 0;
    const parts = Object.defineProperty({}, 'a', {
      enumerable: true,
      get() {
        calls++;
        return part;
      },
    });
    expect(() => Content.encode(parts)).to.throw(TypeError);
    expect(calls).to.eql(0);
  });

  it('enforces finite entry and string ceilings before serialization', () => {
    expect(Object.isFrozen(Content.limits)).to.eql(true);
    expect(() => Content.encode({ ['a'.repeat(Content.limits.pathLength)]: part })).not.to.throw();
    expect(() => Content.encode({ ['a'.repeat(Content.limits.pathLength + 1)]: part }))
      .to.throw(RangeError);
    const parts = Object.fromEntries(
      Array.from({ length: Content.limits.entries + 1 }, (_, i) => [`file-${i}`, part]),
    );
    expect(() => Content.encode(parts)).to.throw(RangeError);
    const long = Object.fromEntries(Array.from({ length: 1025 }, (_, i) => [
      `${i}`.padEnd(Content.limits.pathLength, 'a'),
      part,
    ]));
    expect(() => Content.encode(long)).to.throw(RangeError);
  });
});
