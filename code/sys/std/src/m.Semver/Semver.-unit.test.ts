import { describe, expect, it } from '../-test.ts';
import { Semver } from './mod.ts';

describe('Semver', () => {
  it('Semver.parse', () => {
    const a = Semver.parse('1.2.0');
    const b = Semver.parse('1.2.1');
    expect(Semver.Is.greaterThan(b, a)).to.eql(true);
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
      const a = Semver.Is.valid('1.2.3');
      const b = Semver.Is.valid(ver);
      const c = Semver.Is.valid('foobar');

      expect(a).to.eql(true);
      expect(b).to.eql(true);
      expect(c).to.eql(false);

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => {
        expect(Semver.Is.valid(value)).to.eql(false);
      });
    });
  });
});
