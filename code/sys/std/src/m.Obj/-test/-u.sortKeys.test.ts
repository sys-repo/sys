import { describe, expect, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.sortKeys', () => {
  it('empty', () => {
    const obj = {};
    const res = Obj.sortKeys(obj);
    expect(res).to.not.equal(obj);
  });

  it('sorts keys', () => {
    const obj = { foo: 456, zoo: 'hello', apple: 123 };
    const res = Obj.sortKeys(obj);
    expect(Object.keys(res)).to.not.eql(Object.keys(obj));
    expect(Object.keys(res).sort()).to.eql(Object.keys(obj).sort());
  });
});
