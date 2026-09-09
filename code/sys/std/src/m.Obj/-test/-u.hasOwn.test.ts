import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.hasOwn', () => {
  it('detects own string and numeric keys', () => {
    const obj = { foo: 123, 0: 'zero' };

    expect(Obj.hasOwn(obj, 'foo')).to.eql(true);
    expect(Obj.hasOwn(obj, 0)).to.eql(true);
    expect(Obj.hasOwn(obj, 'missing')).to.eql(false);
  });

  it('excludes inherited keys and includes non-enumerable keys', () => {
    const parent = { inherited: true };
    const obj = Object.create(parent) as Record<string, unknown>;
    Object.defineProperty(obj, 'hidden', {
      value: 'secret',
      enumerable: false,
    });

    expect(Obj.hasOwn(obj, 'inherited')).to.eql(false);
    expect(Obj.hasOwn(obj, 'hidden')).to.eql(true);
  });

  it('supports symbol keys and narrows unknown inputs', () => {
    const token = Symbol('token');
    const input: unknown = { [token]: 42 };

    expect(Obj.hasOwn(input, token)).to.eql(true);
    if (Obj.hasOwn(input, token)) {
      expectTypeOf(input[token]).toEqualTypeOf<unknown>();
      expect(input[token]).to.eql(42);
    }
  });

  it('supports function objects', () => {
    const fn = () => undefined;
    Object.assign(fn, { own: true });

    expect(Obj.hasOwn(fn, 'own')).to.eql(true);
    expect(Obj.hasOwn(fn, 'missing')).to.eql(false);
  });

  it('returns false for non-objects', () => {
    const values: readonly unknown[] = [undefined, null, '', 123, true, Symbol('x')];
    values.forEach((value) => expect(Obj.hasOwn(value, 'foo')).to.eql(false));
  });
});
