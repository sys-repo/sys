import { describe, expect, it } from '../-test.ts';
import { toObject } from './u.ts';

describe('Util', () => {
  it('toObject', () => {
    const obj = { foo: [{ count: 1 }] };
    const res = toObject(obj);
    expect(res).to.eql(obj);
    expect(res).to.not.equal(obj);
  });

  it('toObject ← array', () => {
    const array = [1, [2, 3, { count: 4 }]];
    const res = toObject(array);
    expect(res).to.eql(array);
    expect(res).to.not.equal(array);
    expect(Array.isArray(res)).to.eql(true);
  });

  it('toObject ← non {} param', () => {
    [undefined, null, 123, ''].forEach((value) => {
      expect(toObject(value)).to.eql({}, `${value}`);
    });
  });
});
