import { describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import { Pkg } from '../mod.ts';

describe('Pkg.toPkg', () => {
  it('invalid → <unknown>', () => {
    const NON = [
      '',
      123,
      true,
      null,
      undefined,
      BigInt(0),
      Symbol('foo'),
      {},
      [],
      { name: 123, version: '0.0.0' },
      { name: 'foo', version: 123 },
    ];
    NON.forEach((value: any) => {
      const res = Pkg.toPkg(value);
      expect(res).to.eql(D.unknown());
    });
  });

  it('strips wider object to yield clean {pkg}', () => {
    const source = { name: 'foo', version: '0.0.0', tasks: {} };
    const a = Pkg.toPkg(source);
    const b = Pkg.toPkg(source);

    expect(a).to.eql(b);
    expect(a).to.not.equal(b);

    expect(Object.keys(a)).to.eql(['name', 'version']);
    expect(a.name).to.eql('foo');
    expect(a.version).to.eql('0.0.0');
  });

  describe('parsing from string', () => {
    it('valid', () => {
      const res = Pkg.toPkg('  @scope/pkg@0.0.0  ');
      expect(res.name).to.eql('@scope/pkg');
      expect(res.version).to.eql('0.0.0');
    });

    it('invalid: → returns {UNKNOWN} version of {pkg}', () => {
      const test = (input: string) => {
        const res = Pkg.toPkg(input);
        expect(res).to.eql(Pkg.unknown());
      };

      test('');
      test('  ');
      test('foobar');
      test('🐷');

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => test(value));
    });
  });
});
