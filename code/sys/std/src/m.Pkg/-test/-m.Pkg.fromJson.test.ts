import { describe, expect, it } from '../../-test.ts';
import { Pkg } from '../mod.ts';

describe('Pkg.fromJson', () => {
  it('INVALID input', () => {
    const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((v: any) => {
      const res = Pkg.fromJson(v);
      expect(Pkg.Is.unknown(res)).to.eql(true);
    });
  });

  it('from import', () => {
    const res = Pkg.fromJson({ name: 'foo', version: '1.2.0' });
    expect(res.name).to.eql('foo');
    expect(res.version).to.eql('1.2.0');
  });

  it('defaultName', () => {
    const res1 = Pkg.fromJson({ name: 'foo', version: '1.2.0' }, 'my-name');
    const res2 = Pkg.fromJson({ version: '1.2.0' }, 'my-name');
    expect(res1.name).to.eql('foo'); // NB: the provided name in JSON is used - param value ignored.
    expect(res2.name).to.eql('my-name');
  });

  it('defaultVersion', () => {
    const res1 = Pkg.fromJson({ name: 'foo', version: '1.2.0' }, 'my-name', '9.0.0');
    const res2 = Pkg.fromJson({ name: 'foo' }, 'my-name', '9.0.0');
    expect(res1.version).to.eql('1.2.0'); // NB: the provided version in JSON is used - param value ignored.
    expect(res2.version).to.eql('9.0.0');
  });
});
