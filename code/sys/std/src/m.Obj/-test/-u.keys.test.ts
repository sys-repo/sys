import { describe, expect, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.keys', () => {
  it('returns own enumerable keys of the object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = Obj.keys(obj);
    expect(result).to.eql(['a', 'b', 'c']);
  });

  it('excludes inherited keys', () => {
    const parent = { inherited: true };
    const obj = Object.create(parent);
    obj.own = false;
    const result = Obj.keys(obj);
    expect(result).to.eql(['own']);
  });

  it('handles numeric-like keys', () => {
    const obj = { 1: 'one', two: '2' } as Record<string, string>;
    const result = Obj.keys(obj);
    expect(result).to.eql(['1', 'two']);
  });

  it('returns empty array for empty object', () => {
    expect(Obj.keys({})).to.eql([]);
  });

  it('returns empty array for invalid input types', () => {
    const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((value: any) => expect(Obj.keys(value)).to.eql([]));
  });

  it('union string type', () => {
    type S = 'One' | 'Two';
    type T = Record<S, number>;
    const obj: T = { One: 0, Two: 2 };
    const res = Obj.keys(obj);
    expect(res).to.eql(['One', 'Two']);
  });
});
