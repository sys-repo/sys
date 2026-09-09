import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Pkg } from '../mod.ts';

const parse = Pkg.Subpath.parse;

describe('Pkg.Subpath', () => {
  it('API', () => {
    expectTypeOf(Pkg.Subpath).toEqualTypeOf<t.Pkg.Subpath.Lib>();
    expectTypeOf(parse('ui')).toEqualTypeOf<t.Pkg.Subpath.ParseResult>();
  });

  describe('.parse', () => {
    it('returns shared frozen absence for omitted and empty values', () => {
      const absent = parse();

      expect(absent).to.equal(parse(undefined));
      expect(absent).to.equal(parse('   '));
      expect(absent).to.equal(parse(' /// '));
      expect(absent).to.eql({ kind: 'absent' });
      expect(Object.isFrozen(absent)).to.eql(true);
    });

    it('normalizes slash segments idempotently without inferring path authority', () => {
      const parsed = parse(' //ui///admin/settings// ');

      expect(parsed).to.eql({ kind: 'valid', value: 'ui/admin/settings' });
      expect(Object.isFrozen(parsed)).to.eql(true);
      if (parsed.kind !== 'valid') throw new Error('Expected a valid package subpath.');
      expect(parse(parsed.value)).to.eql(parsed);
      expect(parse('./ui/../admin')).to.eql({ kind: 'valid', value: './ui/../admin' });
      expect(parse('ui\\admin')).to.eql({ kind: 'valid', value: 'ui\\admin' });
      expect(parse('界面/设置')).to.eql({ kind: 'valid', value: '界面/设置' });
    });

    it('returns shared frozen invalidity for non-string values without coercion', () => {
      const invalid = parse(null);
      const hostile = Object.defineProperty({}, 'toString', {
        get() {
          throw new Error('must not read');
        },
      });

      expect(invalid).to.equal(parse(false));
      expect(invalid).to.equal(parse(123));
      expect(invalid).to.equal(parse(hostile));
      expect(invalid).to.eql({ kind: 'invalid' });
      expect(Object.isFrozen(invalid)).to.eql(true);
    });

    it('rejects terminal control, line, format, and invalid Unicode hazards', () => {
      const hazards = [
        '\x1b[31mui\x1b[39m',
        'ui\nadmin',
        'ui\tadmin',
        'ui\u009badmin',
        'ui\u2028admin',
        'ui\u2029admin',
        'ui\u202eadmin',
        'ui\u2066admin',
        'ui\u200badmin',
        'ui\ud800admin',
      ];

      for (const input of hazards) expect(parse(input)).to.eql({ kind: 'invalid' });
    });
  });
});
