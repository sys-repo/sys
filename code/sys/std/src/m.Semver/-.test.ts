import { describe, expect, it } from '../-test.ts';
import { Semver } from './mod.ts';

describe('Semver', () => {
  describe('toString', () => {
    it('toString( {object} ) → string', () => {
      const ver = Semver.parse('1.2.0');
      expect(Semver.toString(ver)).to.eql('1.2.0');
    });
    it('toString( "string" ) → string', () => {
      expect(Semver.toString('1.2.0')).to.eql('1.2.0');
    });
  });

  describe('Semver.parse', () => {
    it('simple', () => {
      const a = Semver.parse('1.2.0');
      const b = Semver.parse('1.2.1');
      expect(Semver.Is.greaterThan(b, a)).to.eql(true);
    });

    it('with modifier prefixes', () => {
      const test = (input: string, expected: string) => {
        const ver = Semver.parse(input);
        expect(Semver.toString(ver)).to.eql(expected);
      };
      test('~0.1.2', '0.1.2');
      test('^0.1.2', '0.1.2');
      test('>=0.1.2', '0.1.2');
      test('<=0.1.2', '0.1.2');
    });

    it('empty → 0.0.0', () => {
      const test = (input: any) => {
        const ver = Semver.parse(input);
        expect(Semver.toString(ver)).to.eql('0.0.0');
      };
      test('');
      test('  ');
    });

    it('non-string → 0.0.0', () => {
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => {
        const ver = Semver.parse(value);
        expect(Semver.toString(ver)).to.eql('0.0.0');
      });
    });

    describe('error', () => {
      it('throw: wildcards', () => {
        // NB: The official SemVer 2.0.0 spec does not accept wildcards values.
        const test = (input: string) => {
          const fn = () => Semver.parse(input);
          expect(fn).to.throw();
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

  describe('Semver.sort', () => {
    const versions: string[] = ['v1.2.3', '2.0.0', '1.10.1', '1.2.10', 'v0.9.5'];
    const semvers = versions.map((v) => Semver.parse(v));
    const SORTED = {
      a: ['2.0.0', '1.10.1', '1.2.10', 'v1.2.3', 'v0.9.5'],
      b: ['2.0.0', '1.10.1', '1.2.10', '1.2.3', '0.9.5'],
    };

    it('returns differnt instance', () => {
      expect(Semver.sort(versions)).to.not.equal(versions);
      expect(Semver.sort(semvers)).to.not.equal(semvers);
    });

    it('order: descending (default)', () => {
      const a = Semver.sort(versions);
      const b = Semver.sort(semvers, {});
      expect(a).to.eql(SORTED.a);
      expect(b.map((v) => Semver.toString(v))).to.eql(SORTED.b);
    });

    it('order: ascending', () => {
      const a = Semver.sort(versions, { order: 'asc' });
      const b = Semver.sort(semvers, 'asc');
      expect(a).to.eql([...SORTED.a].reverse());
      expect(b.map((v) => Semver.toString(v))).to.eql([...SORTED.b].reverse());
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

  describe('Semver.Is', () => {
    it('Is.semver', () => {
      const ver = Semver.parse('0.0.0');

      expect(Semver.Is.valid('1.2.3')).to.eql(true);
      expect(Semver.Is.valid('1.2.3-alpha.1')).to.eql(true);
      expect(Semver.Is.valid(ver)).to.eql(true);
      expect(Semver.Is.valid('foobar')).to.eql(false);
      expect(Semver.Is.valid(undefined)).to.eql(false);

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => {
        expect(Semver.Is.valid(value)).to.eql(false);
      });
    });

    it('Is.eql', () => {
      const a = Semver.parse('0.1.2');
      const b = Semver.parse('0.1.3');
      expect(Semver.Is.eql(a, a)).to.eql(true);
      expect(Semver.Is.eql(a, b)).to.eql(false);
    });
  });

  describe('Semver.stripPrefix', () => {
    it('strips the prefix', () => {
      const test = (input: string, expected: string) => {
        expect(Semver.stripPrefix(input)).to.eql(expected);
        expect(Semver.stripPrefix(` ${input}  `)).to.eql(expected);
      };
      test('~0.1.2', '0.1.2');
      test('^0.1.2', '0.1.2');
      test('>=0.1.2', '0.1.2');
      test('<=0.1.2', '0.1.2');
    });

    it('invalid values', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => expect(Semver.stripPrefix(v)).to.eql(''));
    });
  });

  describe('Semver.prefix', () => {
    /**
     * TODO 🐷
     */
  });
});
