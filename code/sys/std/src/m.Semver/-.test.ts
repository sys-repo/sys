import { describe, expect, it } from '../-test.ts';
import { Semver } from './mod.ts';
import * as Std from '@std/semver';

describe('Semver', () => {
  it('API', () => {
    expect(Semver.toString).to.equal(Std.format);
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
});
