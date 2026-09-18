import { describe, expect, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.clone', () => {
  it('return different instance', () => {
    const obj = { foo: 123, bar: { msg: 'hello' } };
    const res = Obj.clone(obj);
    expect(res).to.eql(obj);
    expect(res).to.not.equal(obj);
    expect(res.bar).to.not.equal(obj.bar);
  });

  it('circular-reference safe', () => {
    type Cycle = { self?: Cycle; msg: string; list: (number | Cycle)[] };

    const obj: Cycle = { msg: '👋', list: [1] };
    obj.self = obj;
    obj.list.push(obj);
    obj.list.push(2);
    obj.list.push(obj.list[1]);

    const res = Obj.clone(obj);
    expect(res).to.eql(obj);
    expect(res).to.not.equal(obj);
    expect(res.list).to.not.equal(obj.list);
    expect(res.list[1]).to.not.equal(obj.list[1]);
  });

  it('should return the same value for primitives', () => {
    expect(Obj.clone(null)).to.equal(null);
    expect(Obj.clone(undefined)).to.equal(undefined);
    expect(Obj.clone(42)).to.equal(42);
    expect(Obj.clone('hello')).to.equal('hello');
    expect(Obj.clone(true)).to.equal(true);
  });

  it('should clone arrays properly', () => {
    const arr = [1, 2, { a: 3 }];
    const clonedArr = Obj.clone(arr);
    expect(clonedArr).to.eql(arr);
    expect(clonedArr).to.not.equal(arr);
    expect(clonedArr[2]).to.not.equal(arr[2]);
  });

  it('should clone plain objects deeply', () => {
    const obj = { a: 1, b: { c: 2 } };
    const clonedObj = Obj.clone(obj);
    expect(clonedObj).to.eql(obj);
    expect(clonedObj).to.not.equal(obj);
    expect(clonedObj.b).to.not.equal(obj.b);
  });

  it('should clone objects with symbol keys', () => {
    const sym = Symbol('key');
    const obj = { foo: 'bar', [sym]: 'baz' };
    const clonedObj = Obj.clone(obj);
    expect(clonedObj).to.eql(obj);
    expect(clonedObj).to.not.equal(obj);
  });

  it('should clone objects with non-enumerable properties', () => {
    const obj: any = { visible: 'yes' };
    Object.defineProperty(obj, 'hidden', {
      value: 'secret',
      enumerable: false,
      configurable: true,
      writable: true,
    });
    const clonedObj = Obj.clone(obj);
    expect(clonedObj.visible).to.equal('yes');
    const desc = Object.getOwnPropertyDescriptor(clonedObj, 'hidden');
    expect(desc).to.exist;
    expect(desc!.value).to.equal('secret');
  });

  it('should preserve custom prototypes', () => {
    class Custom {
      prop: number;
      constructor(prop: number) {
        this.prop = prop;
      }
    }
    const obj = new Custom(10);
    (obj as any).extra = 'test';
    const clonedObj = Obj.clone(obj);
    expect(clonedObj).to.eql(obj);
    expect(clonedObj).to.not.equal(obj);
    expect(Object.getPrototypeOf(clonedObj)).to.equal(Custom.prototype);
  });

  it('should not clone functions, but preserve the same function reference', () => {
    const fn = function () {
      return 'test';
    };
    const obj = { fn };
    const clonedObj = Obj.clone(obj);
    expect(clonedObj.fn).to.equal(fn);
  });

  it('should handle circular references in objects', () => {
    type Cycle = { self?: Cycle; msg: string; list: (number | Cycle)[] };
    const obj: Cycle = { msg: '👋', list: [1] };
    obj.self = obj;
    obj.list.push(obj);
    obj.list.push(2);
    obj.list.push(obj.list[1]);

    const cloned = Obj.clone(obj);
    expect(cloned).to.eql(obj);
    expect(cloned).to.not.equal(obj);
    expect(cloned.list).to.not.equal(obj.list);
    expect(cloned.self).to.equal(cloned);
    expect(cloned.list[1]).to.equal(cloned);
  });

  it('should handle circular references in arrays', () => {
    const arr: any[] = [1, 2];
    arr.push(arr);
    const clonedArr = Obj.clone(arr);
    expect(clonedArr).to.eql(arr);
    expect(clonedArr).to.not.equal(arr);
    expect(clonedArr[2]).to.equal(clonedArr);
  });

  it('should clone nested objects and arrays', () => {
    const obj = {
      a: { b: [1, { c: 'hello' }] },
      d: 'world',
    };
    const clonedObj = Obj.clone(obj);
    expect(clonedObj).to.eql(obj);
    expect(clonedObj.a).to.not.equal(obj.a);
    expect(clonedObj.a.b).to.not.equal(obj.a.b);
    expect(clonedObj.a.b[1]).to.not.equal(obj.a.b[1]);
  });

  it('should clone Date objects (note: date value may not be preserved)', () => {
    const date = new Date();
    (date as any).extra = 'data';
    const clonedDate = Obj.clone(date);
    expect(clonedDate).to.be.an.instanceof(Date);
    expect((clonedDate as any).extra).to.equal('data');
    expect(clonedDate.getTime()).to.equal(date.getTime());
  });

  it('should clone RegExp objects (note: pattern and flags may not be preserved)', () => {
    const regex = /abc/gi;
    (regex as any).extra = 'data';
    const clonedRegex = Obj.clone(regex);
    expect(clonedRegex).to.be.an.instanceof(RegExp);
    expect(clonedRegex.source).to.equal(regex.source);
    expect(clonedRegex.flags).to.equal(regex.flags);
    expect((clonedRegex as any).extra).to.equal('data');
  });

  it('should preserve dynamic properties', () => {
    let _value = 0;
    const obj = {
      get count() {
        return _value;
      },
      set count(v) {
        _value = v;
      },
      child: { count: 0 },
    };
    obj.child = obj;

    expect(obj.count).to.eql(0);

    _value = 123;
    expect(obj.count).to.eql(123);
    obj.count = 456;
    expect(obj.count).to.eql(456);

    const res = Obj.clone(obj);
    expect(res.count).to.eql(456);
    expect(res).to.not.equal(obj);
    expect(res.child).to.not.equal(obj.child);

    _value = 888;
    expect(res.count).to.eql(888);
    res.count = 0;
    expect(_value).to.eql(0);

    expect(res.child.count).to.eql(0);
    _value = 123;
    expect(res.child.count).to.eql(123);
  });
});
