import { describe, expect, it } from '../-test.ts';
import { Immutable } from './mod.ts';
import { Patch } from './m.Patch.ts';

describe('Immutable.Patch (RFC-6902 JSON patch)', () => {
  it('API', () => {
    expect(Immutable.Patch).to.equal(Patch);
  });

  describe('toObjectPath', () => {
    /**
     * Baseline:
     */
    it('root pointer "" → []', () => {
      expect(Patch.toObjectPath('')).to.eql([]);
    });

    it('lone slash "/" → [""]', () => {
      expect(Patch.toObjectPath('/')).to.eql(['']);
    });

    it('basic nesting', () => {
      expect(Patch.toObjectPath('/foo/bar')).to.eql(['foo', 'bar']);
    });

    /**
     * Numeric coercion:
     */
    it('strict integer tokens become numbers', () => {
      const res = Patch.toObjectPath('/foo/0/bar/42');
      expect(res).to.eql(['foo', 0, 'bar', 42]);
      expect(typeof res[1]).to.eql('number');
      expect(typeof res[3]).to.eql('number');
    });

    it('leading-zero integer is *not* coerced', () => {
      expect(Patch.toObjectPath('/foo/01')).to.eql(['foo', '01']);
    });

    it('negative or decimal tokens stay strings', () => {
      expect(Patch.toObjectPath('/-3')).to.eql(['-3']);
      expect(Patch.toObjectPath('/3.14')).to.eql(['3.14']);
    });

    /**
     * Escape handling:
     */
    it('decodes "~0" and "~1"', () => {
      expect(Patch.toObjectPath('/~0/~1')).to.eql(['~', '/']);
      expect(Patch.toObjectPath('/a~1b')).to.eql(['a/b']);
      expect(Patch.toObjectPath('/c~0d')).to.eql(['c~d']);
    });

    it('leaves non-escape tildes intact', () => {
      expect(Patch.toObjectPath('/foo/~01')).to.eql(['foo', '~1']);
    });

    it('throws on invalid escape sequences', () => {
      expect(() => Patch.toObjectPath('/bad~2escape')).to.throw();
    });

    /**
     * Dash sentinel and empty tokens:
     */
    it('keeps array-append "-" only in terminal position', () => {
      expect(Patch.toObjectPath('/items/-')).to.eql(['items', '-']); // Terminal.
      expect(Patch.toObjectPath('-')).to.eql(['-']); // Single segment.
      expect(Patch.toObjectPath('/-/foo')).to.eql(['-', 'foo']); // Non-terminal dash.
    });

    it('preserves empty reference tokens', () => {
      expect(Patch.toObjectPath('/foo//bar')).to.eql(['foo', '', 'bar']);
    });

    /**
     * Lenient pointers (no leading slash):
     */
    it('tolerates missing leading slash', () => {
      expect(Patch.toObjectPath('foo/bar')).to.eql(['foo', 'bar']);
    });
  });
});
