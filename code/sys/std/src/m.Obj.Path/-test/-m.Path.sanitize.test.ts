import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Path } from '../mod.ts';

describe('Path.sanitize', () => {
  it('returns same string and no fixes when already clean (pointer, absolute)', () => {
    const res = Path.sanitize('/foo/bar');
    expect(res.text).to.equal('/foo/bar');
    expect(res.fixes).to.eql([]);
  });

  it('trims leading/trailing whitespace only', () => {
    const res = Path.sanitize('   /a/b   ');
    expect(res.text).to.equal('/a/b');
    expect(res.fixes).to.eql(['trimmed']);
  });

  it('ensures leading slash for non-empty pointer strings', () => {
    const res = Path.sanitize('foo/bar');
    expect(res.text).to.equal('/foo/bar');
    expect(res.fixes).to.eql(['ensured-leading-slash']);
  });

  it('collapses multiple consecutive slashes (not root)', () => {
    const res = Path.sanitize('/foo//bar///baz');
    expect(res.text).to.equal('/foo/bar/baz');
    expect(res.fixes).to.eql(['collapsed-multiple-slashes']);
  });

  it('removes trailing slash (but not the sole root "/")', () => {
    const res1 = Path.sanitize('/foo/bar/');
    expect(res1.text).to.equal('/foo/bar');
    expect(res1.fixes).to.eql(['removed-trailing-slash']);

    const res2 = Path.sanitize('/');
    expect(res2.text).to.equal('/');
    expect(res2.fixes).to.eql([]);
  });

  it('empty string stays empty; no fixes', () => {
    const res = Path.sanitize('');
    expect(res.text).to.equal('');
    expect(res.fixes).to.eql([]);
  });

  it('dot codec: does not force leading slash or slash collapsing', () => {
    const res = Path.sanitize('foo.bar[0]', { codec: 'dot' });
    expect(res.text).to.equal('foo.bar[0]');
    expect(res.fixes).to.eql([]);
  });

  it('composition and ordered fixes: trim → ensure-leading-slash → collapse → remove-trailing', () => {
    const res = Path.sanitize('  foo//bar/  ');
    expect(res.text).to.equal('/foo/bar');
    expect(res.fixes).to.eql([
      'trimmed',
      'ensured-leading-slash',
      'collapsed-multiple-slashes',
      'removed-trailing-slash',
    ]);
  });

  it('idempotent after first repair pass (running twice yields no new fixes)', () => {
    const once = Path.sanitize('foo//bar/');
    expect(once.text).to.equal('/foo/bar');
    expect(once.fixes).to.eql([
      'ensured-leading-slash',
      'collapsed-multiple-slashes',
      'removed-trailing-slash',
    ]);
    const twice = Path.sanitize(once.text);
    expect(twice.text).to.equal('/foo/bar');
    expect(twice.fixes).to.eql([]);
  });

  it('accepts a codec instance object (pointer-kind)', () => {
    const customPointer: t.ObjPathCodec = {
      kind: 'pointer',
      encode: (p) => Path.Codec.pointer.encode(p),
      decode: (s) => Path.Codec.pointer.decode(s),
    };
    const res = Path.sanitize('foo', { codec: customPointer });
    expect(res.text).to.equal('/foo');
    expect(res.fixes).to.eql(['ensured-leading-slash']);
  });

  it('type surface: returns { text: string; fixes: readonly ObjPathFix[] }', () => {
    const out = Path.sanitize('/ok');
    expectTypeOf(out.text).toEqualTypeOf<string>();
    expectTypeOf(out.fixes).toEqualTypeOf<t.ObjPathFix[]>();
  });
});
