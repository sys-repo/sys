import { describe, expect, it, pkg } from '../../-test.ts';
import { Pkg } from '../mod.ts';

describe('Pkg.toString', () => {
  it('INVALID', () => {
    const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((v: any) => {
      expect(Pkg.toString(v)).to.eql('<unknown>@0.0.0', v);
    });
  });

  it('<undefined> → "" (empty)', () => {
    expect(Pkg.toString()).to.eql('<unknown>@0.0.0');
  });

  it('{pkg} → "<name>@<version>"', () => {
    const res = Pkg.toString(pkg);
    expect(res).to.eql(`${pkg.name}@${pkg.version}`);
  });

  it('suffix param', () => {
    const base = Pkg.toString(pkg);
    const a = Pkg.toString(pkg, 'FooBar');
    const b = Pkg.toString(pkg, '  ::: ns.foo.bar  ');
    expect(a).to.eql(`${base}:FooBar`);
    expect(b).to.eql(`${base}:ns.foo.bar`);
  });

  it('no version', () => {
    const a = Pkg.toString(pkg, 'FooBar', { version: false });
    const b = Pkg.toString(pkg, 'FooBar', false);
    const c = Pkg.toString(pkg, undefined, false);
    expect(a).to.eql('@sys/std:FooBar');
    expect(b).to.eql('@sys/std:FooBar');
    expect(c).to.eql('@sys/std');
  });
});
