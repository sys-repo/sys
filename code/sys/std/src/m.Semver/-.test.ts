import { describe, expect, it } from '../-test.ts';
import { Is } from './m.Is.ts';
import { Prefix } from './m.Prefix.ts';
import { Semver } from './mod.ts';

import * as Std from '@std/semver';

describe('Semver', () => {
  it('API', () => {
    expect(Semver.Is).to.equal(Is);
    expect(Semver.Prefix).to.equal(Prefix);
  });

  describe('toString', () => {
    it('toString( {object} ) → string', () => {
      const { version } = Semver.parse('1.2.0');
      expect(Semver.toString(version)).to.eql('1.2.0');
    });
    it('toString( "string" ) → string', () => {
      expect(Semver.toString('1.2.0')).to.eql('1.2.0');
    });
  });

  describe('Semver.parse', () => {
    it('simple', () => {
      const a = Semver.parse('1.2.0').version;
      const b = Semver.parse('1.2.1').version;
      expect(Semver.Is.greaterThan(b, a)).to.eql(true);
    });

    it('with modifier prefixes', () => {
      const test = (input: string, expected: string) => {
        const { version } = Semver.parse(input);
        expect(Semver.toString(version)).to.eql(expected);
      };
      test('~0.1.2', '0.1.2');
      test('^0.1.2', '0.1.2');
      test('>=0.1.2', '0.1.2');
      test('<=0.1.2', '0.1.2');
    });

    it('empty → 0.0.0', () => {
      const test = (input: any) => {
        const { version } = Semver.parse(input);
        expect(Semver.toString(version)).to.eql('0.0.0');
      };
      test('');
      test('  ');
    });

    it('non-string → 0.0.0', () => {
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => {
        const { version, error } = Semver.parse(value);
        expect(Semver.toString(version)).to.eql('0.0.0');
        expect(error?.message).to.include('Failed to parse semver');
      });
    });

    describe('error', () => {
      it('invalid: "foobar"', () => {
        const ver = Semver.parse('foobar');
        expect(Semver.toString(ver.version)).to.eql('0.0.0');
        expect(ver.error?.message).to.include('Failed to parse semver: "foobar"');
        expect(ver.error?.cause?.message).to.include('Cannot parse version: foobar');
        expect(ver.error?.cause?.name).to.include('TypeError');
      });

      it('wildcards (*, x)', () => {
        // NB: The official Semver 2.0.0 spec does not accept wildcards values.
        const test = (input: string) => {
          const res = Semver.parse(input);
          expect(res.error?.message).to.include('Failed to parse semver');
        };
        test('1.x');
        test('1.2.x');
        test('1.2.*');
        test('x');
        test('*');
      });
    });
  });

  describe('Semver.coerce', () => {
    it('empty', () => {
      const test = (input: string) => {
        const res = Semver.coerce(input);
        expect(res.version).to.eql('');
        expect(res.error?.message).to.include('Specified version is empty');
      };
      test('');
      test('  ');
    });

    it('invalid: input type', () => {
      const test = (input: string) => {
        const res = Semver.coerce(input);
        expect(res.version).to.eql('');
        expect(res.error?.message).to.include('Specified version is invalid type');
      };
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((input: any) => test(input));
    });

    it('invalid: input', () => {
      const test = (input: string, error: string) => {
        const res = Semver.coerce(input);
        expect(res.version).to.eql('');
        expect(res.error?.message).to.include(error);
      };

      test('abc', `Specified version is invalid type ("abc")`);
      test('1.a', `Invalid extra semver characters: ".a" in version "1.a"`);
      test('-1.2.3', `Specified version is invalid type ("-1.2.3")`);
      test('1..2', `Invalid extra semver characters: "..2" in version "1..2"`);
    });

    it('partial semver cases', () => {
      const test = (input: string, expected: string) => {
        const res = Semver.coerce(input);
        expect(res.version).to.eql(expected, input);
      };

      test('7', '7.0.0');
      test('6.5', '6.5.0');
      test('3.4.2', '3.4.2');
      test(' 2 ', '2.0.0');
      test(' 10.20.30', '10.20.30');

      // Cases with pre-release metadata.
      test('1-alpha', '1.0.0-alpha');
      test('2.3-beta.1', '2.3.0-beta.1');
      test('4.5.6-rc.2', '4.5.6-rc.2');

      // Cases with build metadata.
      test('1+build.1', '1.0.0+build.1');
      test('2.3+exp.sha.5114f85', '2.3.0+exp.sha.5114f85');
      test('4.5.6+20130313144700', '4.5.6+20130313144700');

      // Cases with both pre-release and build metadata.
      test('1-alpha+001', '1.0.0-alpha+001');
      test('2.3-beta.1+exp.sha.5114f85', '2.3.0-beta.1+exp.sha.5114f85');
      test('4.5.6-rc.2+build.123', '4.5.6-rc.2+build.123');

      // Edge cases: extra spaces, or already full semver with extra dots.
      test('  7.8  ', '7.8.0');
      test('0.0', '0.0.0');

      // "v" (version) prefix.
      test('v7', '7.0.0');
      test(' v3.2 ', '3.2.0');
      test(' v1.2.3-alpha.5 ', '1.2.3-alpha.5');

      // Modifier Prefix.
      test('~7', '~7.0.0');
      test('^6.5', '^6.5.0');
      test('>=3.2', '>=3.2.0');
    });

    it('prefixes', () => {
      const test = (input: string, expected: string) => {
        expect(Semver.coerce(input).version).to.eql(expected, input);
      };

      // With operator prefixes.
      test('^7', '^7.0.0');
      test('~6.5', '~6.5.0');
      test('>=3.4.2', '>=3.4.2');
      test('<1-alpha', '<1.0.0-alpha');
      test('>2.3+build.2', '>2.3.0+build.2');

      // Edge cases: extra spaces.
      test('<= 4.5.6-rc.2', '<=4.5.6-rc.2');
      test('  ^  7.8  ', '^7.8.0');
      test('  <= 0.0', '<=0.0.0');
    });
  });

  describe('Semver.range', () => {
    it('empty', () => {
      const test = (input: string) => {
        const res = Semver.range(input);
        expect(res.range.length).to.eql(1);
        expect(res.error?.message).to.include('Range value not given');
      };
      test('');
      test('  ');
    });

    it('single', () => {
      const res = Semver.range('>=1');
      expect(res.error).to.eql(undefined);
      expect(res.range.length).to.eql(1);
      expect(res.range[0].length).to.eql(1);
      expect(res.range[0][0].operator).to.eql('>=');
      expect(res.range[0][0].major).to.eql(1);
      expect(res.range[0][0].minor).to.eql(0);
      expect(res.range[0][0].patch).to.eql(0);
    });

    it('multiple', () => {
      const res = Semver.range('<2.0.0 || >=3.0.0');
      expect(res.error).to.eql(undefined);
      expect(res.range.length).to.eql(2);
      expect(res.range[0].length).to.eql(1);
      expect(res.range[1].length).to.eql(1);
    });

    it('wildcard (*)', () => {
      const res = Semver.range('*');
      expect(res.range.length).to.eql(1);
      expect(res.range[0].length).to.eql(1);

      expect(res.range[0][0].operator).to.eql(undefined);
      expect(res.range[0][0].major).to.eql(NaN);
      expect(res.range[0][0].minor).to.eql(NaN);
      expect(res.range[0][0].patch).to.eql(NaN);
      expect(res.range[0][0].prerelease).to.eql([]);
      expect(res.range[0][0].build).to.eql([]);
    });

    describe('errors', () => {
      it('invalid: string ("<=foobar")', () => {
        const res = Semver.range('<=foobar');
        expect(res.range.length).to.eql(1);
        expect(res.error?.message).to.include(`Failed while parsing range: "<=foobar"`);
        expect(Semver.Is.wildcardRange(res.range)).to.eql(true); // NB: defaults to wildcard ("*").
      });

      it('invalid: input type', () => {
        const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((value: any) => {
          const res = Semver.range(value);
          expect(res.error?.message).to.include('Range input invalid');
          expect(Semver.Is.wildcardRange(res.range)).to.eql(true); // NB: defaults to wildcard ("*").
        });
      });
    });
  });

  describe('Semver.sort', () => {
    const versions: string[] = ['v1.2.3', '2.0.0', '1.10.1', '1.2.10', 'v0.9.5'];
    const semvers = versions.map((v) => Semver.parse(v).version);
    const SORTED = {
      a: ['2.0.0', '1.10.1', '1.2.10', 'v1.2.3', 'v0.9.5'],
      b: ['2.0.0', '1.10.1', '1.2.10', '1.2.3', '0.9.5'],
    };

    it('returns different instance', () => {
      expect(Semver.sort(versions)).to.not.equal(versions);
      expect(Semver.sort(semvers)).to.not.equal(semvers);
    });

    it('does not strip prefixes', () => {
      const versions: string[] = ['<1.2.3', '>=2.0.0', '~1.10.1', 'v0.9.5', '^1.2.10'];
      const a = Semver.sort(versions);
      const b = Semver.sort(versions, 'desc');

      expect(a).to.not.eql(versions);
      expect(b).to.not.eql(versions);

      expect(a).to.eql(['>=2.0.0', '~1.10.1', '^1.2.10', '<1.2.3', 'v0.9.5']);
      expect(b).to.eql(['>=2.0.0', '~1.10.1', '^1.2.10', '<1.2.3', 'v0.9.5']);
    });

    describe('option: sort order', () => {
      it('descending (default)', () => {
        const a = Semver.sort(versions);
        const b = Semver.sort(semvers, {});
        expect(a).to.eql(SORTED.a);
        expect(b.map((v) => Semver.toString(v))).to.eql(SORTED.b);
      });

      it('ascending', () => {
        const a = Semver.sort(versions, { order: 'asc' });
        const b = Semver.sort(semvers, 'asc');
        expect(a).to.eql([...SORTED.a].reverse());
        expect(b.map((v) => Semver.toString(v))).to.eql([...SORTED.b].reverse());
      });
    });
  });

  describe('Semver.Release', () => {
    it('Release.types', () => {
      expect(Semver.Release.types).to.eql([
        'pre',
        'major',
        'premajor',
        'minor',
        'preminor',
        'patch',
        'prepatch',
        'prerelease',
      ]);
    });
  });

  describe('Semver.Is (compare)', () => {
    it('Is.valid', () => {
      const ver = Semver.parse('0.0.0').version;

      expect(Semver.Is.valid('1.2.3')).to.eql(true);
      expect(Semver.Is.valid('1.2.3-alpha.1')).to.eql(true);
      expect(Semver.Is.valid('1.2.3+alpha.1')).to.eql(true);
      expect(Semver.Is.valid('^1.2.3')).to.eql(true);
      expect(Semver.Is.valid(ver)).to.eql(true);
      expect(Semver.Is.valid('foobar')).to.eql(false);
      expect(Semver.Is.valid(undefined)).to.eql(false);

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => {
        expect(Semver.Is.valid(value)).to.eql(false, value);
      });
    });

    it('Is.eql', () => {
      const a = Semver.parse('0.1.2').version;
      const b = '0.1.3';
      const c = '0.1';
      const d = '0.1.0';
      expect(Semver.Is.eql(a, a)).to.eql(true);
      expect(Semver.Is.eql(a, b)).to.eql(false);
      expect(Semver.Is.eql(c, c)).to.eql(true);
      expect(Semver.Is.eql(b, c)).to.eql(false);
      expect(Semver.Is.eql(c, d)).to.eql(true);
      expect(Semver.Is.eql(c, '0.1.0-alpha.1')).to.eql(false);
    });

    it('Is.greaterThan', () => {
      const a = '1';
      const b = Semver.parse('1.0.1').version;
      expect(Semver.Is.greaterThan(a, a)).to.eql(false);
      expect(Semver.Is.greaterThan(a, b)).to.eql(false);
      expect(Semver.Is.greaterThan(b, a)).to.eql(true);

      expect(Semver.Is.greaterThan('1.2.4', '0')).to.eql(true);
      expect(Semver.Is.greaterThan('1.2.4', '')).to.eql(true);
      expect(Semver.Is.greaterThan('', '1.2.4')).to.eql(false);
    });

    it('Is.greaterOrEqual', () => {
      const a = '1';
      const b = Semver.parse('1.0.1').version;
      expect(Semver.Is.greaterOrEqual(a, a)).to.eql(true);
      expect(Semver.Is.greaterOrEqual(a, b)).to.eql(false);
      expect(Semver.Is.greaterOrEqual(b, a)).to.eql(true);
      expect(Semver.Is.greaterThan('1.2', '')).to.eql(true);
      expect(Semver.Is.greaterThan('', '1.2')).to.eql(false);
    });

    it('Is.greaterThanRange', () => {
      const a = '1';
      const b = Semver.parse('2.1').version;
      expect(Semver.Is.greaterThanRange(a, '<0.5')).to.eql(true);
      expect(Semver.Is.greaterThanRange(a, '>0.5')).to.eql(false);
      expect(Semver.Is.greaterThanRange(b, '>=1.0.0 && <2.0.0')).to.eql(false);
      expect(Semver.Is.greaterThanRange(b, '>=foobar')).to.eql(false);
    });

    it('Is.lessThan', () => {
      const a = '1';
      const b = Semver.parse('1.0.1').version;
      expect(Semver.Is.lessThan(a, a)).to.eql(false);
      expect(Semver.Is.lessThan(a, b)).to.eql(true);
      expect(Semver.Is.lessThan(b, a)).to.eql(false);
      expect(Semver.Is.lessThan('', '1.5')).to.eql(true);
    });

    it('Is.lessOrEqual', () => {
      const a = '1';
      const b = Semver.parse('1.0.1').version;
      expect(Semver.Is.lessOrEqual(a, a)).to.eql(true);
      expect(Semver.Is.lessOrEqual(a, b)).to.eql(true);
      expect(Semver.Is.lessOrEqual(b, a)).to.eql(false);
    });

    it('Is.lessThanRange', () => {
      const a = '1';
      const b = Semver.parse('2.1').version;
      expect(Semver.Is.lessThanRange(a, '>=2')).to.eql(true);
      expect(Semver.Is.lessThanRange(b, '>2')).to.eql(true);
      expect(Semver.Is.lessThanRange(b, '>=1.0.0 && <2.0.0')).to.eql(false);
      expect(Semver.Is.lessThanRange(b, '>foobar')).to.eql(false);
    });

    it('Is.wildcardRange', () => {
      const test = (input: string, expected: boolean) => {
        const { range } = Semver.range(input);
        const res = Semver.Is.wildcardRange(range);
        expect(res).to.eql(expected, input);
      };

      test('', true);
      test(' ', true);
      test('*', true);
      test('>1.0', false);

      const NON = [true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => test(v, true)); // NB: invalid input is more clear as a "wildcard" than an empty array.
    });
  });

  describe('Semver.Prefix', () => {
    describe('Prefix.get', () => {
      const test = (input: string, expected: string) => {
        expect(Prefix.get(input)).to.eql(expected);
        expect(Prefix.get(` ${input}  `)).to.eql(expected); // NB: white-space padding.
      };

      it('extracts the prefix', () => {
        test('~0.1.2', '~');
        test('^0.1.2', '^');
        test('>=0.1.2', '>=');
        test('<=0.1.2', '<=');
        test('<0.1.2', '<');
        test('>0.1.2', '>');
      });

      it('no prefix', () => {
        test('0.1.2', '');
        test('1.2', '');
        test('1', '');
        test('', '');
        test(' ', '');
        test('foo', '');
      });

      it('invalid input', () => {
        const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((v: any) => expect(Semver.Prefix.get(v)).to.eql(''));
      });
    });

    describe('Prefix.strip', () => {
      it('strips the prefix', () => {
        const test = (input: string, expected: string) => {
          expect(Prefix.strip(input)).to.eql(expected);
          expect(Prefix.strip(` ${input}  `)).to.eql(expected); // NB: white-space padding.
        };
        test('~0.1.2', '0.1.2');
        test('^0.1.2', '0.1.2');
        test('>=0.1.2', '0.1.2');
        test('<=0.1.2', '0.1.2');
        test('<0.1.2', '0.1.2');
        test('>0.1.2', '0.1.2');
        test('0.1.2', '0.1.2');
      });

      it('invalid input', () => {
        const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((v: any) => expect(Semver.Prefix.strip(v)).to.eql(''));
      });
    });
  });
});
