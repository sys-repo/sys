import { describe, expect, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.eql', () => {
  it('returns true for primitives that are strictly equal', () => {
    expect(Obj.eql(123, 123)).to.be.true;
    expect(Obj.eql('foo', 'foo')).to.be.true;
    expect(Obj.eql(true, true)).to.be.true;
    expect(Obj.eql(null, null)).to.be.true;
    expect(Obj.eql(undefined, undefined)).to.be.true;
  });

  it('returns false for primitives that differ', () => {
    expect(Obj.eql(123, 456)).to.be.false;
    expect(Obj.eql('foo', 'bar')).to.be.false;
    expect(Obj.eql(true, false)).to.be.false;
    expect(Obj.eql(null, undefined)).to.be.false;
  });

  it('performs deep equality on objects', () => {
    const obj1 = { a: 1, b: { c: [1, 2, 3] } };
    const obj2 = { a: 1, b: { c: [1, 2, 3] } };
    const obj3 = { a: 1, b: { c: [1, 2] } };

    expect(Obj.eql(obj1, obj2)).to.be.true;
    expect(Obj.eql(obj1, obj3)).to.be.false;
  });

  it('performs deep equality on arrays', () => {
    const arr1 = [1, { foo: 'bar' }, [3]];
    const arr2 = [1, { foo: 'bar' }, [3]];
    const arr3 = [1, { foo: 'baz' }, [3]];

    expect(Obj.eql(arr1, arr2)).to.be.true;
    expect(Obj.eql(arr1, arr3)).to.be.false;
  });
});
