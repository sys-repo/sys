import { describe, expect, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.pick', () => {
  type T = { a: number; b: number; c: number };
  const Sample = {
    create(): T {
      return { a: 1, b: 2, c: 3 };
    },
  } as const;

  it('no fields', () => {
    const obj = Sample.create();
    const res = Obj.pick(obj);
    expect(res).to.eql({});
  });

  it('subset of fields', () => {
    type P = Pick<T, 'a' | 'c'>;
    const obj = Sample.create();
    const res = Obj.pick<P>(obj, 'a', 'c');
    expect(res).to.eql({ a: 1, c: 3 });
  });

  it('all fields (difference instance)', () => {
    const obj = Sample.create();
    const res = Obj.pick<T>(obj, 'a', 'b', 'c');
    expect(res).to.eql(obj);
    expect(res).to.not.equal(obj);
  });

  it('takes a wider scoped object as input', () => {
    type W = T & { msg: string };
    const obj: W = { a: 1, b: 2, c: 3, msg: 'hello' };

    type P = Pick<T, 'b' | 'c'>;
    const res = Obj.pick<P>(obj, 'b', 'c');
    expect(res).to.eql({ b: 2, c: 3 });
  });
});
