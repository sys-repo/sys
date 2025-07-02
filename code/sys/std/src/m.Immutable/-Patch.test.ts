import { describe, expect, it } from '../-test.ts';
import { Immutable } from './mod.ts';

describe('Immutable.Patch (RFC-6902 JSON patch)', () => {
  const Patch = Immutable.Patch;

  describe('toPath', () => {
    /**
     * Baseline:
     */
    it('root pointer "" → []', () => {
      expect(Patch.toPath('')).to.eql([]);
      expect(Patch.toPath({ path: '' })).to.eql([]);
    });

    it('lone slash "/" → [""]', () => {
      expect(Patch.toPath('/')).to.eql(['']);
    });

    it('basic nesting', () => {
      expect(Patch.toPath('/foo/bar')).to.eql(['foo', 'bar']);
    });

    it('operation object vs raw string', () => {
      expect(Patch.toPath({ path: '/hello/world' })).to.eql(['hello', 'world']);
    });

    /**
     * Numeric coercion:
     */
    it('strict integer tokens become numbers', () => {
      const res = Patch.toPath('/foo/0/bar/42');
      expect(res).to.eql(['foo', 0, 'bar', 42]);
      expect(typeof res[1]).to.eql('number');
      expect(typeof res[3]).to.eql('number');
    });

    it('leading-zero integer is *not* coerced', () => {
      expect(Patch.toPath('/foo/01')).to.eql(['foo', '01']);
    });

    it('negative or decimal tokens stay strings', () => {
      expect(Patch.toPath('/-3')).to.eql(['-3']);
      expect(Patch.toPath('/3.14')).to.eql(['3.14']);
    });

    /**
     * Escape handling:
     */
    it('decodes "~0" and "~1"', () => {
      expect(Patch.toPath('/~0/~1')).to.eql(['~', '/']);
      expect(Patch.toPath('/a~1b')).to.eql(['a/b']);
      expect(Patch.toPath('/c~0d')).to.eql(['c~d']);
    });

    it('leaves non-escape tildes intact', () => {
      expect(Patch.toPath('/foo/~01')).to.eql(['foo', '~1']);
    });

    it('throws on invalid escape sequences', () => {
      expect(() => Patch.toPath('/bad~2escape')).to.throw();
    });

    /**
     * Dash sentinel and empty tokens:
     */
    it('keeps array-append "-" only in terminal position', () => {
      expect(Patch.toPath('/items/-')).to.eql(['items', '-']); // Terminal.
      expect(Patch.toPath('-')).to.eql(['-']); // Single segment.
      expect(Patch.toPath('/-/foo')).to.eql(['-', 'foo']); // Non-terminal dash.
    });

    it('preserves empty reference tokens', () => {
      expect(Patch.toPath('/foo//bar')).to.eql(['foo', '', 'bar']);
    });

    /**
     * Lenient pointers (no leading slash):
     */
    it('tolerates missing leading slash', () => {
      expect(Patch.toPath('foo/bar')).to.eql(['foo', 'bar']);
    });
  });
});
